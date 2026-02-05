#!/usr/bin/env bash
# check_error.sh: Comprehensive lint + type + build checks for AGENT-Studio (Next.js).

set -euo pipefail

ROOT_FROM_GIT=""
if command -v git >/dev/null 2>&1; then
    ROOT_FROM_GIT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi

REPO_ROOT="${ROOT_FROM_GIT:-$(cd "$(dirname "$0")" && pwd)}"

echo "=== Starting Error Check (AGENT-Studio) ==="
echo "Repo root: $REPO_ROOT"

cd "$REPO_ROOT"

echo "[1/3] Running ESLint..."
npm run lint
echo "✓ Lint check passed."

echo "[2/3] Running Type Check (tsc --noEmit)..."
npx tsc -p tsconfig.json --noEmit
echo "✓ Type check passed."

echo "[3/3] Running Production Build (next build)..."
npm run build
echo "✓ Build check passed."

echo "=== All checks passed! Code is clean. ==="
