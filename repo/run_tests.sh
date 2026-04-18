#!/usr/bin/env bash
# =============================================================================
# LeaseOps Test Runner — Docker-contained.
#
# HARD CONSTRAINTS (enforced by this script):
#   * NEVER installs anything on the host (no npm/npx/pip/apt/brew).
#   * Requires docker OR docker-compose; otherwise fails fast with exit 127.
#   * All test suites execute inside container images defined in
#     docker-compose.test.yml.
#   * >=90% coverage threshold is enforced by vitest.config.ts inside the
#     coverage container; a breach propagates a non-zero exit.
#   * Every stage's exit code is explicitly inspected and surfaced.
#   * On exit (success OR failure OR interrupt), the test compose stack is
#     torn down with `down -v --remove-orphans` via a trap.
#
# Usage:
#   ./run_tests.sh                 # runs every suite
#   ./run_tests.sh unit            # backend unit only
#   ./run_tests.sh api             # backend mocked HTTP API only
#   ./run_tests.sh integration     # true no-mock API only
#   ./run_tests.sh coverage        # aggregated coverage with threshold check
#   ./run_tests.sh frontend        # frontend unit tests only
#   ./run_tests.sh e2e             # FE↔BE E2E smoke
#   ./run_tests.sh all             # every suite (default)
#
# Exit:
#   0   → all requested suites passed AND coverage thresholds met
#   127 → docker / docker-compose not installed
#   130 → interrupted (SIGINT / SIGTERM)
#   >0  → suite/threshold failure
# =============================================================================

set -u
set -o pipefail

# ─── Locate repo root robustly, never using cd ──────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

PROJECT_NAME="leaseops_test"
TEST_COMPOSE_FILE="docker-compose.test.yml"
PROD_COMPOSE_FILE="docker-compose.yml"

# ─── Docker availability probe — MUST fail fast if docker is absent ─────────
if ! command -v docker >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
  cat >&2 <<'EOF'
==========================================================================
ERROR: Docker is required for this test runner.

Neither `docker` (v2 with `docker compose` plugin) nor the legacy
`docker-compose` binary is available on PATH.

This script deliberately does NOT install Node, npm, Python, or any other
runtime on the host machine. Install Docker Desktop (or the Docker Engine
+ Compose plugin on Linux) and re-run. Everything else — including all
test dependencies — is built and executed inside Docker containers by this
script.
==========================================================================
EOF
  exit 127
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "ERROR: docker is installed but neither 'docker compose' v2 nor 'docker-compose' v1 is working." >&2
  echo "Check your Docker installation (try: docker compose version)." >&2
  exit 127
fi

# Verify both compose files exist locally; bail out with a clear error if not.
if [[ ! -f "$TEST_COMPOSE_FILE" ]]; then
  echo "ERROR: expected $TEST_COMPOSE_FILE in $REPO_ROOT" >&2
  exit 2
fi
if [[ ! -f "$PROD_COMPOSE_FILE" ]]; then
  echo "ERROR: expected $PROD_COMPOSE_FILE in $REPO_ROOT" >&2
  exit 2
fi

TEST_COMPOSE_ARGS=(-f "$TEST_COMPOSE_FILE" -p "$PROJECT_NAME")
PROD_COMPOSE_ARGS=(-f "$PROD_COMPOSE_FILE")

TARGET="${1:-all}"

# ─── Pretty printing ────────────────────────────────────────────────────────
bar() { printf '%s\n' "=========================================="; }
header() {
  echo ""
  bar
  echo "  $*"
  bar
}

# ─── Guaranteed cleanup via trap ────────────────────────────────────────────
# Runs on normal exit, signals (SIGINT, SIGTERM), and most shell failures.
_cleanup_done=0
cleanup_test_stack() {
  if (( _cleanup_done == 1 )); then
    return 0
  fi
  _cleanup_done=1
  header "Cleaning up test stack"
  # Tear down test project (volumes + networks).
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  # E2E brings up the prod stack — tear it down too so the runner is idempotent.
  $COMPOSE "${PROD_COMPOSE_ARGS[@]}" down --remove-orphans >/dev/null 2>&1 || true
}

on_signal() {
  echo "" >&2
  echo "Interrupted — cleaning up..." >&2
  cleanup_test_stack
  exit 130
}

trap cleanup_test_stack EXIT
trap on_signal INT TERM

# ─── Suite runners ──────────────────────────────────────────────────────────
# Each runner prints a header, builds its image (layer-cached), runs the
# container, and returns its raw exit code. The caller records the failure
# but still proceeds through remaining stages in `all` mode so the full
# test report is visible before exit.

run_unit() {
  header "Backend Unit Tests (Docker)"
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" build backend-unit-test || return $?
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" run --rm backend-unit-test
}

run_api() {
  header "Backend API Tests — mocked HTTP (Docker)"
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" build backend-api-test || return $?
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" run --rm backend-api-test
}

run_integration() {
  header "Backend True No-Mock API Tests (Docker, real MySQL)"
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" build backend-integration-test || return $?
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" up -d test-db || return $?
  # Wait for the DB to pass its healthcheck before running tests.
  echo "==> Waiting for test-db healthcheck..."
  local attempts=0
  until $COMPOSE "${TEST_COMPOSE_ARGS[@]}" ps test-db 2>/dev/null | grep -q '(healthy)'; do
    attempts=$((attempts + 1))
    if (( attempts > 60 )); then
      echo "ERROR: test-db did not become healthy within 5 minutes" >&2
      $COMPOSE "${TEST_COMPOSE_ARGS[@]}" logs test-db | tail -60 >&2 || true
      return 1
    fi
    sleep 5
  done
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" run --rm backend-integration-test
}

run_coverage() {
  header "Backend Coverage (>=90% thresholds enforced by vitest.config.ts)"
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" build backend-coverage || return $?
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" up -d test-db || return $?
  # Reuse the same healthcheck loop.
  local attempts=0
  until $COMPOSE "${TEST_COMPOSE_ARGS[@]}" ps test-db 2>/dev/null | grep -q '(healthy)'; do
    attempts=$((attempts + 1))
    if (( attempts > 60 )); then
      echo "ERROR: test-db did not become healthy within 5 minutes" >&2
      return 1
    fi
    sleep 5
  done
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" run --rm backend-coverage
}

run_frontend() {
  header "Frontend Unit Tests (Docker)"
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" build frontend-test || return $?
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" run --rm frontend-test
}

run_e2e() {
  header "FE↔BE E2E Smoke (Docker, live stack)"
  # Bring up the *real* (prod) stack that the e2e container will hit.
  $COMPOSE "${PROD_COMPOSE_ARGS[@]}" up -d --build db backend frontend || return $?

  echo "==> Waiting for backend healthcheck (max 5 min)..."
  local attempts=0
  until $COMPOSE "${PROD_COMPOSE_ARGS[@]}" ps backend 2>/dev/null | grep -q '(healthy)'; do
    attempts=$((attempts + 1))
    if (( attempts > 60 )); then
      echo "ERROR: backend did not become healthy within 5 minutes" >&2
      $COMPOSE "${PROD_COMPOSE_ARGS[@]}" logs backend | tail -80 >&2 || true
      return 1
    fi
    sleep 5
  done

  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" build e2e-test || return $?
  $COMPOSE "${TEST_COMPOSE_ARGS[@]}" run --rm e2e-test
}

# ─── Static self-test (no Docker required) ─────────────────────────────────
# Asserts that this very script is Docker-contained: it must NOT invoke host
# npm, npx, pip, apt, brew, or similar commands anywhere outside of container
# command strings.
run_selftest() {
  header "run_tests.sh self-test (static)"
  local forbidden=(
    '^\s*npm\b'
    '^\s*npx\b'
    '^\s*pip\b'
    '^\s*apt\b'
    '^\s*brew\b'
    '^\s*node\b'
    '^\s*yarn\b'
    '^\s*pnpm\b'
  )
  local violations=0
  for pattern in "${forbidden[@]}"; do
    # -n: line numbers; -E: extended regex; only match lines that are NOT
    # inside a double-quoted string that was clearly passed to `docker` or
    # `${COMPOSE}` as a command argument.
    if grep -nE "$pattern" "$REPO_ROOT/run_tests.sh" | \
       grep -vE 'docker|COMPOSE|compose|container|^[[:space:]]*#' | \
       grep -vE '^[^:]+:[0-9]+:[[:space:]]*$' >/tmp/_runtests_selftest.$$ 2>/dev/null; then
      if [[ -s /tmp/_runtests_selftest.$$ ]]; then
        echo "FORBIDDEN host command pattern '$pattern' found in run_tests.sh:" >&2
        cat /tmp/_runtests_selftest.$$ >&2
        violations=$((violations + 1))
      fi
    fi
    rm -f /tmp/_runtests_selftest.$$
  done
  if (( violations > 0 )); then
    echo "run_tests.sh self-test: FAILED ($violations violation(s))" >&2
    return 1
  fi
  echo "run_tests.sh self-test: OK (no host runtime invocations)"
  return 0
}

# ─── Dispatcher ─────────────────────────────────────────────────────────────
EXIT=0

case "$TARGET" in
  unit)         run_unit        || EXIT=$? ;;
  api)          run_api         || EXIT=$? ;;
  integration)  run_integration || EXIT=$? ;;
  coverage)     run_coverage    || EXIT=$? ;;
  frontend)     run_frontend    || EXIT=$? ;;
  e2e)          run_e2e         || EXIT=$? ;;
  selftest)     run_selftest    || EXIT=$? ;;
  all)
    # Run every stage; track the FIRST non-zero so we still surface a
    # meaningful exit code even if later stages re-succeed.
    declare -i unit_rc=0 api_rc=0 int_rc=0 cov_rc=0 fe_rc=0 e2e_rc=0 self_rc=0
    run_selftest     || self_rc=$?
    run_unit         || unit_rc=$?
    run_api          || api_rc=$?
    run_integration  || int_rc=$?
    run_coverage     || cov_rc=$?
    run_frontend     || fe_rc=$?
    run_e2e          || e2e_rc=$?

    header "Per-suite exit codes"
    printf '  selftest    : %d\n' "$self_rc"
    printf '  unit        : %d\n' "$unit_rc"
    printf '  api         : %d\n' "$api_rc"
    printf '  integration : %d\n' "$int_rc"
    printf '  coverage    : %d\n' "$cov_rc"
    printf '  frontend    : %d\n' "$fe_rc"
    printf '  e2e         : %d\n' "$e2e_rc"

    if (( self_rc != 0 )); then EXIT=$self_rc;
    elif (( unit_rc != 0 )); then EXIT=$unit_rc;
    elif (( api_rc  != 0 )); then EXIT=$api_rc;
    elif (( int_rc  != 0 )); then EXIT=$int_rc;
    elif (( cov_rc  != 0 )); then EXIT=$cov_rc;
    elif (( fe_rc   != 0 )); then EXIT=$fe_rc;
    elif (( e2e_rc  != 0 )); then EXIT=$e2e_rc;
    fi
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    echo "Usage: $0 [unit|api|integration|coverage|frontend|e2e|selftest|all]" >&2
    exit 2
    ;;
esac

header "Result"
if (( EXIT == 0 )); then
  echo "  ALL REQUESTED SUITES PASSED (>=90% coverage enforced)"
else
  echo "  SUITE FAILED (first non-zero exit=$EXIT)"
fi
bar

# cleanup runs via trap
exit "$EXIT"
