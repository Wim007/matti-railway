#!/usr/bin/env bash
set -euo pipefail

fail(){ echo "[FAIL] $1"; exit 1; }
pass(){ echo "[OK] $1"; }

# 1) Source-level separation
rg -n "Hoi, ik ben Matti\." client-matti/src/pages/onboarding/Welcome.tsx >/dev/null || fail "client-matti welcome text missing"
rg -n "Hoi, ik ben Opvoedmaatje\." client-opvoedmaatje/src/pages/onboarding/Welcome.tsx >/dev/null || fail "client-opvoedmaatje welcome text missing"
pass "Source welcome pages are product-specific"

# 2) Build defaults should point to Matti
node -e 'const p=require("./package.json"); if(!p.scripts.build.includes("FRONTEND_DIR=client-matti")) process.exit(1);' || fail "default build script is not pinned to client-matti"
pass "Default build script pinned to client-matti"

# 3) Build both variants and verify output differs by product marker
pnpm run -s build:matti >/dev/null
rg -n "Hoi, ik ben Matti" dist/public/assets >/dev/null || fail "Matti marker not found in Matti build output"
pass "Matti build output contains Matti marker"

pnpm run -s build:opvoedmaatje >/dev/null
rg -n "Hoi, ik ben Opvoedmaatje" dist/public/assets >/dev/null || fail "Opvoedmaatje marker not found in Opvoedmaatje build output"
pass "Opvoedmaatje build output contains Opvoedmaatje marker"

echo "All frontend split checks passed."
