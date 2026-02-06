#!/usr/bin/env bash
# check_error.sh: Comprehensive lint + type + build checks for AGENT-Studio (Next.js).

set -uo pipefail

ROOT_FROM_GIT=""
if command -v git >/dev/null 2>&1; then
    ROOT_FROM_GIT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi

REPO_ROOT="${ROOT_FROM_GIT:-$(cd "$(dirname "$0")" && pwd)}"

echo "=== Starting Error Check (AGENT-Studio) ==="
echo "Repo root: $REPO_ROOT"

cd "$REPO_ROOT"

FAIL_COUNT=0

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

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "=== All checks passed! Code is clean. ==="
else
    echo "=== Checks completed with $FAIL_COUNT failed step(s). ==="
    exit 1
fi
