#!/usr/bin/env bash
# check_error.sh: Comprehensive lint + type + build checks for AGENT-Studio (Next.js).

set -uo pipefail

RUN_DEV_SMOKE=0
DEV_SMOKE_TIMEOUT=25
DEV_SMOKE_PORT=3315

for arg in "$@"; do
    case "$arg" in
        --dev-smoke)
            RUN_DEV_SMOKE=1
            ;;
        --dev-timeout=*)
            DEV_SMOKE_TIMEOUT="${arg#*=}"
            ;;
        --dev-port=*)
            DEV_SMOKE_PORT="${arg#*=}"
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--dev-smoke] [--dev-timeout=SECONDS] [--dev-port=PORT]"
            exit 2
            ;;
    esac
done

ROOT_FROM_GIT=""
if command -v git >/dev/null 2>&1; then
    ROOT_FROM_GIT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi

REPO_ROOT="${ROOT_FROM_GIT:-$(cd "$(dirname "$0")" && pwd)}"

echo "=== Starting Error Check (AGENT-Studio) ==="
echo "Repo root: $REPO_ROOT"

cd "$REPO_ROOT"

FAIL_COUNT=0

dev_smoke_check() {
    local using_existing=0
    local dev_pid=""
    local base_url=""
    local log_file=""
    local cleanup_needed=0
    local routes=("/" "/playground" "/playground/tetris" "/playground/snake" "/playground/sokoban")
    local started_at
    local deadline
    local existing_line

    existing_line="$(ps -ef | grep "next dev" | grep "$REPO_ROOT" | grep -v grep | head -n 1 || true)"

    if [ -n "$existing_line" ]; then
        using_existing=1
        if echo "$existing_line" | grep -q -- "-p "; then
            base_url="http://localhost:$(echo "$existing_line" | sed -n 's/.*-p \([0-9][0-9]*\).*/\1/p')"
        elif echo "$existing_line" | grep -q -- "--port "; then
            base_url="http://localhost:$(echo "$existing_line" | sed -n 's/.*--port \([0-9][0-9]*\).*/\1/p')"
        else
            base_url="http://localhost:3000"
        fi
        echo "Using existing dev server: $base_url"
    else
        log_file="$(mktemp)"
        cleanup_needed=1
        npm run dev -- --port "$DEV_SMOKE_PORT" >"$log_file" 2>&1 &
        dev_pid="$!"
        base_url="http://localhost:${DEV_SMOKE_PORT}"

        started_at="$(date +%s)"
        deadline=$((started_at + DEV_SMOKE_TIMEOUT))

        while [ "$(date +%s)" -lt "$deadline" ]; do
            if ! kill -0 "$dev_pid" >/dev/null 2>&1; then
                echo "Dev server exited unexpectedly."
                if [ -f "$log_file" ]; then
                    sed -n '1,200p' "$log_file"
                fi
                return 1
            fi

            if grep -q "Ready" "$log_file"; then
                break
            fi

            sleep 1
        done

        if ! grep -q "Ready" "$log_file"; then
            echo "Dev server did not become ready within ${DEV_SMOKE_TIMEOUT}s."
            sed -n '1,200p' "$log_file"
            return 1
        fi
        echo "Started temp dev server: $base_url"
    fi

    for route in "${routes[@]}"; do
        local code
        code="$(curl -sS -o /tmp/agent_studio_dev_smoke_body.txt -w '%{http_code}' "${base_url}${route}" || true)"
        if [ -z "$code" ] || [ "$code" -ge 500 ]; then
            echo "Runtime request failed: ${route} (HTTP ${code:-N/A})"
            sed -n '1,120p' /tmp/agent_studio_dev_smoke_body.txt
            if [ "$cleanup_needed" -eq 1 ] && [ -n "$dev_pid" ]; then
                kill "$dev_pid" >/dev/null 2>&1 || true
                wait "$dev_pid" >/dev/null 2>&1 || true
            fi
            return 1
        fi
    done

    if [ "$cleanup_needed" -eq 1 ]; then
        if grep -E "⨯|Error:|Unhandled|ReferenceError|TypeError|SyntaxError|Module not found|Can't resolve" "$log_file" >/dev/null 2>&1; then
            echo "Runtime errors detected in dev log:"
            grep -E "⨯|Error:|Unhandled|ReferenceError|TypeError|SyntaxError|Module not found|Can't resolve" "$log_file" | sed -n '1,50p'
            kill "$dev_pid" >/dev/null 2>&1 || true
            wait "$dev_pid" >/dev/null 2>&1 || true
            return 1
        fi
        kill "$dev_pid" >/dev/null 2>&1 || true
        wait "$dev_pid" >/dev/null 2>&1 || true
        rm -f "$log_file"
    fi

    echo "Dev smoke check passed."
    return 0
}

store_selector_stability_check() {
    local list_file
    list_file="$(mktemp)"

    rg -n "use[A-Za-z0-9_]*Store\\(\\(.*\\) => .*\\?\\? \\[\\]" src >"$list_file" || true
    rg -n "use[A-Za-z0-9_]*Store\\(\\(.*\\) => .*\\?\\? \\{\\}" src >>"$list_file" || true

    if [ -s "$list_file" ]; then
        echo "Potential unstable store selector fallback detected:"
        cat "$list_file"
        echo "Hint: avoid '?? []' / '?? {}' directly inside store selectors; use stable constants."
        rm -f "$list_file"
        return 1
    fi

    rm -f "$list_file"
    echo "Store selector stability check passed."
    return 0
}

run_check() {
    local step="$1"
    local cmd="$2"
    local ok_msg="$3"
    local fail_msg="$4"

    echo "$step"
    if bash -lc "$cmd"; then
        echo "✓ $ok_msg"
    else
        echo "✗ $fail_msg"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo
}

run_check "[1/3] Running ESLint..." \
    "npm run lint" \
    "Lint check passed." \
    "Lint check failed."

run_check "[2/3] Running Type Check (tsc --noEmit)..." \
    "npx tsc -p tsconfig.json --noEmit" \
    "Type check passed." \
    "Type check failed."

run_check "[3/3] Running Production Build (next build)..." \
    "npm run build" \
    "Build check passed." \
    "Build check failed."

echo "[4/4] Running Store Selector Stability Check..."
if store_selector_stability_check; then
    echo "✓ Store selector stability check passed."
else
    echo "✗ Store selector stability check failed."
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo

if [ "$RUN_DEV_SMOKE" -eq 1 ]; then
    echo "[5/5] Running Dev Runtime Smoke Check..."
    if dev_smoke_check; then
        echo "✓ Dev smoke check passed."
    else
        echo "✗ Dev smoke check failed."
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo
fi

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "=== All checks passed! Code is clean. ==="
else
    echo "=== Checks completed with $FAIL_COUNT failed step(s). ==="
    exit 1
fi
