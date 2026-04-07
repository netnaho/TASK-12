#!/bin/bash
# LeaseOps Test Runner
# Runs unit tests, API tests, and coverage. Exits non-zero if any suite fails.

set -o pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$REPO_ROOT/backend"

echo "=========================================="
echo "  LeaseOps Test Suite"
echo "=========================================="
echo ""

cd "$BACKEND"

# Ensure dependencies and Prisma client are ready
npm ci --silent
npx prisma generate --silent 2>/dev/null

UNIT_PASS=0
UNIT_FAIL=0
API_PASS=0
API_FAIL=0
COVERAGE_OK=0

# ─── Unit Tests ───────────────────────────────────────────────────────────────
echo "--- Running Unit Tests ---"
echo ""

UNIT_OUTPUT=$(npx vitest run --dir tests/unit --reporter=verbose 2>&1)
UNIT_EXIT=$?

echo "$UNIT_OUTPUT"

if [ $UNIT_EXIT -eq 0 ]; then
  UNIT_PASS=$(echo "$UNIT_OUTPUT" | grep -oP '\d+(?= passed)' | tail -1)
  UNIT_FAIL=0
  echo ""
  echo "[UNIT] PASSED ($UNIT_PASS tests)"
else
  UNIT_PASS=$(echo "$UNIT_OUTPUT" | grep -oP '\d+(?= passed)' | tail -1)
  UNIT_FAIL=$(echo "$UNIT_OUTPUT" | grep -oP '\d+(?= failed)' | tail -1)
  UNIT_PASS=${UNIT_PASS:-0}
  UNIT_FAIL=${UNIT_FAIL:-0}
  echo ""
  echo "[UNIT] FAILED ($UNIT_FAIL failed, $UNIT_PASS passed)"
fi

# ─── API Tests ────────────────────────────────────────────────────────────────
echo ""
echo "--- Running API Tests ---"
echo ""

API_OUTPUT=$(npx vitest run --dir tests/api --reporter=verbose 2>&1)
API_EXIT=$?

echo "$API_OUTPUT"

if [ $API_EXIT -eq 0 ]; then
  API_PASS=$(echo "$API_OUTPUT" | grep -oP '\d+(?= passed)' | tail -1)
  API_FAIL=0
  echo ""
  echo "[API]  PASSED ($API_PASS tests)"
else
  API_PASS=$(echo "$API_OUTPUT" | grep -oP '\d+(?= passed)' | tail -1)
  API_FAIL=$(echo "$API_OUTPUT" | grep -oP '\d+(?= failed)' | tail -1)
  API_PASS=${API_PASS:-0}
  API_FAIL=${API_FAIL:-0}
  echo ""
  echo "[API]  FAILED ($API_FAIL failed, $API_PASS passed)"
fi

# ─── Coverage Report ──────────────────────────────────────────────────────────
echo ""
echo "--- Coverage Report ---"
echo ""

COVERAGE_OUTPUT=$(npx vitest run --coverage 2>&1)
COVERAGE_EXIT=$?

# Print just the summary table
echo "$COVERAGE_OUTPUT" | grep -A 6 "Coverage summary"

if [ $COVERAGE_EXIT -eq 0 ]; then
  COVERAGE_OK=1
  echo ""
  echo "[COV]  PASSED (all thresholds met)"
else
  COVERAGE_OK=0
  echo ""
  echo "[COV]  FAILED (one or more coverage thresholds not met)"
fi

# ─── Final Summary ────────────────────────────────────────────────────────────
TOTAL_PASS=$((UNIT_PASS + API_PASS))
TOTAL_FAIL=$((UNIT_FAIL + API_FAIL))

echo ""
echo "=========================================="
echo "  Test Suite Summary"
echo "=========================================="
echo "  Unit tests :  $UNIT_PASS passed, $UNIT_FAIL failed"
echo "  API tests  :  $API_PASS passed, $API_FAIL failed"
echo "  Total      :  $TOTAL_PASS passed, $TOTAL_FAIL failed"
echo ""

if [ $COVERAGE_OK -eq 1 ]; then
  echo "  Coverage   :  PASS (>=90% all metrics)"
else
  echo "  Coverage   :  FAIL (<90% threshold)"
fi

echo "=========================================="

if [ $UNIT_EXIT -ne 0 ] || [ $API_EXIT -ne 0 ] || [ $COVERAGE_EXIT -ne 0 ]; then
  echo ""
  echo "RESULT: FAILED"
  exit 1
fi

echo ""
echo "RESULT: ALL TESTS PASSED"
exit 0
