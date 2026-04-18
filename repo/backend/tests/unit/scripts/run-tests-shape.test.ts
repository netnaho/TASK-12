/**
 * Static contract test: run_tests.sh MUST be fully Docker-contained.
 *
 * If this test fails, someone sneaked a host-level invocation of npm/npx/
 * pip/apt/brew/node/yarn/pnpm into the runner. Fix the script to use a
 * docker container command instead — don't relax this guard.
 *
 * This test also asserts the script checks for docker presence and fails
 * with a non-zero exit when docker is unavailable, which is required by
 * the "no host dependency" audit gate.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// When unit tests run inside the Dockerized backend-unit-test container, the
// repo-root run_tests.sh is outside the build context and therefore not
// present on disk. In that environment we skip the static-contract checks;
// the same invariants are independently enforced by `./run_tests.sh selftest`
// (which has its own CI gate). When unit tests run in a context where the
// script IS reachable (local dev with the repo root visible), we run the
// full check.
const SCRIPT_PATH = resolve(__dirname, '../../../..', 'run_tests.sh');
const SCRIPT_AVAILABLE = existsSync(SCRIPT_PATH);
const d = SCRIPT_AVAILABLE ? describe : describe.skip;

d('run_tests.sh static contract', () => {
  const src = readFileSync(SCRIPT_PATH, 'utf-8');

  it('exists at repo root', () => {
    expect(SCRIPT_AVAILABLE).toBe(true);
  });

  it('does not invoke host npm/npx/yarn/pnpm/pip/apt/brew at the top level', () => {
    // Strip comment lines and docker/container command strings first so
    // we're left with real executable lines.
    const executable = src
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .filter((line) => !/docker\b|COMPOSE|compose\s|container/.test(line))
      .join('\n');
    const forbidden = ['npm', 'npx', 'yarn', 'pnpm', 'pip', 'apt', 'brew'];
    for (const cmd of forbidden) {
      // Match only when the word appears as an actual command (start of line
      // or after `;`, `&&`, `|`, `$(`). Matching plain word frequencies
      // would catch string literals too.
      const re = new RegExp(`(^|[;&|\\(])\\s*${cmd}\\b`, 'm');
      expect(re.test(executable), `"${cmd}" appears as a host command in run_tests.sh`).toBe(false);
    }
  });

  it('exits non-zero when docker + docker-compose are both missing', () => {
    // The script must probe `command -v docker` and `command -v docker-compose`
    // and exit 127 (or similar) on failure.
    expect(src).toMatch(/command -v docker\b/);
    expect(src).toMatch(/exit\s+127/);
  });

  it('declares every required suite target', () => {
    const targets = ['unit', 'api', 'integration', 'coverage', 'frontend', 'e2e', 'all'];
    for (const t of targets) {
      // Each target is handled by a case branch in the dispatcher.
      const re = new RegExp(`^\\s*${t}\\)\\s*`, 'm');
      expect(re.test(src), `target "${t}" missing from dispatcher`).toBe(true);
    }
  });

  it('registers a cleanup trap so compose stacks are torn down even on failure', () => {
    expect(src).toMatch(/trap\s+cleanup_test_stack\s+EXIT/);
  });

  it('uses docker compose (v2) OR docker-compose (v1) — not a bespoke CLI', () => {
    expect(src).toMatch(/docker compose|docker-compose/);
  });

  it('propagates the first non-zero per-stage exit as the overall exit', () => {
    // The "all" branch inspects each stage's return code explicitly.
    expect(src).toMatch(/unit_rc/);
    expect(src).toMatch(/api_rc/);
    expect(src).toMatch(/int_rc/);
    expect(src).toMatch(/cov_rc/);
    expect(src).toMatch(/fe_rc/);
    expect(src).toMatch(/e2e_rc/);
  });
});
