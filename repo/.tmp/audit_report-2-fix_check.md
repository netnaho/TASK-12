# Audit Report 2 — "Partially Fixed" Closure Summary

## Closing finding

> API tests over-mock service logic for high-risk flows; coverage signal
> excludes important runtime paths.

## Status: **Closed**

A "critical-path" tier of tests has been added that exercises the real
service / middleware / allocator code with only the prisma client and
logger mocked. The four risk areas now have explicit, named protection:

| # | Risk area | Test(s) | What is proven |
|---|---|---|---|
| 1 | Analytics report-share object-level access | `tests/unit/services/security-hardening.test.ts` → `analyticsService.listShares — object-level authorization` (5 tests) | Creator allowed; active sharee allowed; SYSTEM_ADMIN bypass; unrelated user → 404 (anti-enumeration); missing report → 404. **Real `analyticsService.listShares` is exercised**, only prisma is mocked. |
| 2 | Metric version lock immutability | Same file → `metricsService.createVersion — locked predecessor immutability` (3 tests) | Locked-and-open predecessor → BadRequestError, **no prisma update is called against the locked row**; unlocked predecessor → success; first version → success. Real `metricsService.createVersion` is exercised. |
| 3 | ADA strict-default allocation | Same file → `SeatAllocator under default ADA_STRICT_MODE=true` (2 tests) + `env.ADA_STRICT_MODE default schema value` (1 test) | Real `SeatAllocator` driven against mocked prisma. Unreleased ADA seat → returns null, `seatAllocation.create` never called. Regular seat still allocated normally. Zod schema default is `true`. |
| 4 | Audit retention non-destructive enforcement | Same file → `audit retention policy` (4 tests) | 7-year (2555-day) constant; floor calculation correct; `auditRetentionCheck` job uses only `count`; **static source-grep test** fails if `audit-retention.policy.ts` or `audit-retention-check.job.ts` ever gain `auditLog.(delete\|deleteMany\|update\|updateMany\|upsert)`. |
| Cross-cutting | Privilege freshness | `tests/api/privilege-freshness.test.ts` (2 tests) | End-to-end: deactivated user → 401 on next request; role downgrade → 403 on next request. Drives the real DB-refreshed `requireAuth` middleware. |

## Files Changed

| File | Change | Why |
|---|---|---|
| `backend/tests/unit/services/security-hardening.test.ts` | Replaced shallow ADA zod-default test with a real-allocator integration test (2 new tests). Added a static source-grep retention test. | Removes the tier-1 over-mock for ADA; adds defence-in-depth against future destructive retention regressions. |
| `backend/package.json` | Added `npm run test:critical` script | Lets developers run the four critical-path areas in <1s during iteration. Still part of the default `npm test` for CI. |
| `backend/vitest.config.ts` | Narrowed the `src/jobs/**` coverage exclusion: every other job is still excluded, but `audit-retention-check.job.ts` is now included in coverage measurement. | The retention job is part of the compliance proof — its coverage signal is now meaningful instead of being silently dropped by the wildcard exclusion. |
| `backend/docs/testing-strategy.md` (new) | Documents the three test tiers, when to run each, and why tier 2 (critical-path) exists. | Closes the documentation half of the audit finding. |
| `.tmp/audit_report-2-fix_check.md` (this file) | Closure record | Required by Definition of Done. |

## What was implemented (concrete deltas)

1. **Real allocator integration test under default ADA_STRICT_MODE=true.**
   The previous test only checked the zod schema default. The new test
   instantiates a real `SeatAllocator`, mocks only prisma, sets the env
   to the production default, and asserts that an unreleased ADA seat
   is never assigned (`seatAllocation.create` is never called) — and
   that a regular seat IS still allocated when one exists.

2. **Static source-grep retention immutability test.** A new test reads
   `src/modules/audit/audit-retention.policy.ts` and
   `src/jobs/audit-retention-check.job.ts` from disk and asserts that
   neither contains `auditLog.delete`, `deleteMany`, `update`,
   `updateMany`, or `upsert`. This is defence-in-depth: the SQL trigger
   in `prisma/migrations/20240101000000_init/migration.sql` already
   blocks these at the database level, but failing this test makes the
   intent regression visible at PR-review time before any DB roundtrip.

3. **`test:critical` npm script.** Three files run in <1 second:
   `tests/unit/services/security-hardening.test.ts`,
   `tests/api/privilege-freshness.test.ts`, and
   `tests/unit/middleware/auth.test.ts`. CI still runs the full suite via
   the default `npm test`.

4. **Coverage exclusion narrowed.** `src/jobs/**` was a wildcard
   exclusion. It is now an explicit list of jobs (base, scheduler,
   nightly-metric-recalc, report-generation, session-cleanup,
   message-retry). `audit-retention-check.job.ts` is intentionally
   absent from the exclude list so its lines are measured.

5. **Testing strategy doc.** `backend/docs/testing-strategy.md` describes
   the three tiers, the four risk areas tier 2 protects, the failure
   triage table, and the coverage policy.

## Test results

```
$ npm run test:critical
 ✓ tests/unit/middleware/auth.test.ts                         (7 tests)
 ✓ tests/unit/services/security-hardening.test.ts            (15 tests)
 ✓ tests/api/privilege-freshness.test.ts                      (2 tests)
 Test Files  3 passed (3)
      Tests  24 passed (24)

$ npx vitest run
 Test Files  70 passed (70)
      Tests  1157 passed (1157)
```

No regressions; full suite still passes. The critical-path suite grew from
12 → 15 tests in `security-hardening.test.ts` (the three new tests are the
real-allocator-strict, real-allocator-regular, and static source grep).

## Risk-area protection — explicit assertion mapping

Each risk area has at least one assertion whose failure mode is unambiguous:

- **listShares ACL** → `expect(...).rejects.toMatchObject({ statusCode: 404 })`
  for the unrelated user, and `expect(mockPrisma.reportShare.findMany).not.toHaveBeenCalled()`
  to prove no share data was loaded for the rejected caller.
- **Metric lock immutability** → `expect(mockPrisma.metricDefinitionVersion.update).not.toHaveBeenCalled()`
  on the locked-predecessor path. The locked row is provably never touched.
- **ADA strict default** → `expect(result).toBeNull()` AND
  `expect((mockPrisma).seatAllocation.create).not.toHaveBeenCalled()`
  on the unreleased-ADA path. Cannot pass if the strict guard is removed.
- **Retention non-destruction** → `expect(src).not.toMatch(/\bauditLog\.(delete|deleteMany|update|updateMany|upsert)\b/)`.
  Static check that fires before the job ever runs.

## Deferred follow-ups

| Item | Reason for deferral |
|---|---|
| Real-database integration tests against a docker-compose MySQL | Out of scope for this finding. The four risk areas are fully protected by tier-2 minimal-mock tests. A docker-compose tier would catch a different class of bug (e.g. SQL trigger drift) and warrants its own scoping discussion. |
| Coverage threshold raise above 90% | The audit asked specifically not to game coverage. The narrowed exclusion already improves the *quality* of the 90% number for the retention path; raising the threshold without a behavior reason would invite low-value test churn. |
| Migrating remaining `tests/api/*.test.ts` files off the global service mock helper | Most of those API tests genuinely are contract tests — replacing them wholesale with integration tests would slow the suite without protecting the four flagged risks better than the targeted tier-2 file already does. |
