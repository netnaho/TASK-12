# LeaseOps Fix Verification Report (Static-Only)

Date: 2026-04-07
Source baseline: `.tmp/audit_report-2.md`
Method: static code inspection only (no runtime/test execution)
Verification pass: re-validated against current workspace state after subsequent edits

## Overall result

- **Resolved:** 7 / 8 prior issues
- **Partially resolved:** 1 / 8
- **Unresolved:** 0 / 8

---

## Issue-by-issue verification

### 1) High — Session-only auth/RBAC stale privilege risk

**Status: Fixed (with minor doc/comment drift)**

**Why:**

- Route modules still import `requireAuth`/`requireRole`, but `requireAuth` now aliases DB-refresh auth.
- `authenticate` re-loads active user + roles/permissions from DB on each request and repopulates `req.userRoles`.

**Evidence:**

- `repo/backend/src/middleware/auth.middleware.ts:1-29`
- `repo/backend/src/middleware/authenticate.ts:20-69`, `:87-108`
- Legacy route imports still present (now backed by refreshed auth): e.g. `repo/backend/src/modules/analytics/analytics.routes.ts:3-4`

**Note:** `rbac.middleware.ts` comments still describe session-cached behavior (`repo/backend/src/middleware/rbac.middleware.ts:3-7`), but effective data source is now DB-refreshed via `requireAuth`.

---

### 2) High — BOLA on report share listing

**Status: Fixed**

**Why:**

- `listShares` now enforces object-level access: creator OR active sharee OR admin; outsiders get 404.

**Evidence:**

- `repo/backend/src/modules/analytics/analytics.service.ts:526-546`
- Controller passes admin context: `repo/backend/src/modules/analytics/analytics.controller.ts:96-97`

---

### 3) High — ADA reservation violated by default fallback

**Status: Fixed**

**Why:**

- Default config is now strict: `ADA_STRICT_MODE=true`.
- Unreleased ADA fallback remains only when strict mode is explicitly disabled.

**Evidence:**

- Default true: `repo/backend/src/config/env.ts:58-61`
- Guarded fallback path: `repo/backend/src/modules/test-center/allocation/allocator.ts:111-115`

---

### 4) High — Metric lock immutability drift

**Status: Fixed**

**Why:**

- Creating a new version now blocks when predecessor is locked and open (`effectiveTo === null`).
- Previous-version `effectiveTo` update now runs only for unlocked predecessor.

**Evidence:**

- Immutability guard: `repo/backend/src/modules/metrics/metrics.service.ts:84-94`
- Conditional update only when unlocked: `repo/backend/src/modules/metrics/metrics.service.ts:100-104`

---

### 5) High — 7-year audit retention not statically implemented

**Status: Fixed (static implementation present)**

**Why:**

- Explicit retention policy module exists with 7-year window (`2555` days).
- Daily scheduler registers retention check job.
- Job performs count/reporting and explicitly avoids destructive deletion.

**Evidence:**

- Policy constants/docs: `repo/backend/src/modules/audit/audit-retention.policy.ts:43-56`
- Scheduler registration: `repo/backend/src/jobs/scheduler.ts:64-68`
- Job behavior/docs: `repo/backend/src/jobs/audit-retention-check.job.ts:5-11`, `:27-31`, `:50-59`

**Note:** Physical archival remains an operator/DBA process by design (documented in policy/job comments).

---

### 6) Medium — Missing audit coverage in cancellation/reassignment flows

**Status: Fixed**

**Why:**

- Cancellation path now records both registration cancellation and per-seat `SEAT_ALLOCATION_CANCELLED` events.

**Evidence:**

- Cancellation flow audit events: `repo/backend/src/modules/test-center/test-center.service.ts:451-472`

---

### 7) Medium — Test strategy over-mocking can miss severe service defects

**Status: Partially Fixed**

**Why:**

- New targeted hardening tests were added for prior high-risk areas (share ACL, lock immutability, ADA default, retention non-destructive behavior).
- However, API test harness still broadly mocks services and coverage exclusions still omit routes/jobs/session infra.

**Evidence (improvements):**

- `repo/backend/tests/unit/services/security-hardening.test.ts:1-260`
- `repo/backend/tests/unit/services/test-center-extended.service.test.ts:382-395`

**Evidence (remaining risk):**

- Service-wide API mocking persists: `repo/backend/tests/api/helpers/setup.ts:307-369`
- Coverage exclusions persist: `repo/backend/vitest.config.ts:29-58`

---

### 8) Low — `.env` documentation inconsistency

**Status: Fixed**

**Why:**

- README now aligns with `.env.example` and `.gitignore`: `.env` is not committed; copy from template.

**Evidence:**

- README aligned guidance: `repo/README.md:437-444`
- `.env.example` policy: `repo/.env.example:3-5`
- `.gitignore` includes `.env`: `repo/.gitignore:1-5`

---

## Final assessment

The previously reported High-risk functional/security defects are now statically addressed in code.
The only material remaining concern is **test realism/coverage strategy** (partial), where broad service mocking in API tests still limits confidence in end-to-end enforcement paths.
