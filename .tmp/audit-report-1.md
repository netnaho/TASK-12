# LeaseOps TASK-12 — Static Delivery Acceptance + Architecture Audit

## Static-analysis boundary (explicit)

- This audit is **static only**.
- I did **not** start services, run Docker, execute tests, or modify application code.
- Conclusions are based only on repository artifacts and line-traceable evidence.
- Any runtime behavior not derivable from code/config is marked as **Cannot Confirm Statistically**.

## Overall verdict

**FAIL**

Primary reasons:

1. **Blocker-level frontend/backend API contract drift** across analytics, messaging, test-center, and notifications.
2. **High-risk object-level authorization gaps** in test-center registration/cancellation and messaging access scope.
3. **Prompt-fit mismatches** on required behaviors (analyst recalculation rights, strict ADA release rule, manual delivery status model alignment).

---

## 1) Acceptance Section: Prompt-fit and requirement conformance

### 1.1 Analyst-triggered metric recalculation

- **Conclusion:** ❌ Fails requirement fit.
- **Rationale:** Route protection allows only admin/manager roles, while analyst is explicitly denied in tests.
- **Evidence:**
  - `repo/backend/src/modules/metrics/metrics.routes.ts:18` (`adminRoles = SYSTEM_ADMIN, LEASING_OPS_MANAGER`)
  - `repo/backend/src/modules/metrics/metrics.routes.ts:70` (`/recalculate` guarded by `requireRole(...adminRoles)`)
  - `repo/backend/tests/api/metrics.test.ts:134-135` (expects `403` for `ANALYST`)

### 1.2 Accessibility seat policy strictness

- **Conclusion:** ⚠️ Partial (implementation not strict to prompt wording).
- **Rationale:** Allocator intentionally falls back to accessible seats when regular seats are exhausted, even without a release signal.
- **Evidence:**
  - `repo/backend/tests/unit/allocator.test.ts:83` (`falls back to accessible seats when all regular seats are taken`)
  - `repo/backend/tests/unit/allocator.test.ts:70` (documents reservation only when alternatives exist)

### 1.3 Manual delivery status consistency

- **Conclusion:** ❌ Fails requirement/model consistency.
- **Rationale:** Validation accepts `MANUALLY_SENT`, but Prisma enum omits it.
- **Evidence:**
  - `repo/backend/src/modules/messaging/messaging.schemas.ts:22` (`MANUALLY_SENT` allowed)
  - `repo/backend/prisma/schema.prisma:66-73` (`DeliveryStatus` enum does not include `MANUALLY_SENT`)

### 1.4 Scheduled operations alignment

- **Conclusion:** ✅ Pass (static schedule intent aligns).
- **Rationale:** Nightly recalculation and retry cadence are explicitly scheduled.
- **Evidence:**
  - `repo/backend/src/jobs/scheduler.ts:29` (`0 2 * * *`)
  - `repo/backend/src/jobs/scheduler.ts:59` (`*/5 * * * *` message retry)

---

## 2) Acceptance Section: API contract and end-to-end integration readiness

### 2.1 Analytics API contract

- **Conclusion:** ❌ Blocker.
- **Rationale:** Frontend paths/methods differ from backend route contract.
- **Evidence:**
  - Frontend create report uses `/v1/analytics/reports`: `repo/frontend/src/api/endpoints/analytics.api.ts:21`
  - Backend expects `/reports/generate`: `repo/backend/src/modules/analytics/analytics.routes.ts:76`
  - Frontend share uses `/reports/{id}/shares`: `repo/frontend/src/api/endpoints/analytics.api.ts:31`
  - Backend share path is singular `/reports/:id/share`: `repo/backend/src/modules/analytics/analytics.routes.ts:100`
  - Frontend updates definition via `PATCH`: `repo/frontend/src/api/endpoints/analytics.api.ts:14`
  - Backend defines `PUT /definitions/:id`: `repo/backend/src/modules/analytics/analytics.routes.ts:61`
  - Frontend schedules endpoint `/analytics/schedules`: `repo/frontend/src/api/endpoints/analytics.api.ts:52`
  - Backend exposes `/schedule-executions` (admin-only): `repo/backend/src/modules/analytics/analytics.routes.ts:252`

### 2.2 Messaging API contract

- **Conclusion:** ❌ Blocker.
- **Rationale:** Frontend uses `/messaging/messages*` resource model; backend uses `/enqueue`, root listing, `/:id`, `/:id/delivery`, etc.
- **Evidence:**
  - Frontend enqueue: `repo/frontend/src/api/endpoints/messaging.api.ts:5`
  - Backend enqueue: `repo/backend/src/modules/messaging/messaging.routes.ts:21`
  - Frontend list: `repo/frontend/src/api/endpoints/messaging.api.ts:8`
  - Backend list is `GET /` under mounted router: `repo/backend/src/modules/messaging/messaging.routes.ts:27`

### 2.3 Test-center API contract

- **Conclusion:** ❌ Blocker.
- **Rationale:** Frontend expects nested `sites/{id}/rooms` and `rooms/{id}/seats`; backend uses flat `/rooms` and `/seats` with query/body linkage.
- **Evidence:**
  - Frontend nested rooms: `repo/frontend/src/api/endpoints/test-center.api.ts:21`
  - Backend rooms list: `repo/backend/src/modules/test-center/test-center.routes.ts:54`
  - Frontend nested seats: `repo/frontend/src/api/endpoints/test-center.api.ts:34`
  - Backend seats list: `repo/backend/src/modules/test-center/test-center.routes.ts:83`
  - Frontend cancel registration uses `/registrations/{id}`: `repo/frontend/src/api/endpoints/test-center.api.ts:79`
  - Backend cancel registration is `DELETE /sessions/:id/register`: `repo/backend/src/modules/test-center/test-center.routes.ts:150`
  - Frontend utilization endpoint `/utilization`: `repo/frontend/src/api/endpoints/test-center.api.ts:83`
  - Backend utilization is `/utilization/rooms/:roomId` or `/utilization/sites/:siteId`: `repo/backend/src/modules/test-center/test-center.routes.ts:173`

### 2.4 Notifications payload contract

- **Conclusion:** ❌ High.
- **Rationale:** Frontend snooze sends `{ until }`; backend validates `snoozedUntil`.
- **Evidence:**
  - Frontend: `repo/frontend/src/api/endpoints/notifications.api.ts:15-16`
  - Backend schema: `repo/backend/src/modules/notifications/notifications.schemas.ts:34`

---

## 3) Acceptance Section: Security review summary (required dimensions)

| Dimension                             | Conclusion                                       | Evidence                                                                                                                                        | Notes                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication (AuthN)                | ✅ Present                                       | `repo/backend/src/security/session.ts:58-61`, `repo/backend/src/app.ts:65`, `repo/backend/tests/api/auth.test.ts:151`                           | Session cookie hardening exists; unauthenticated `/me` denied in tests.                                                                         |
| Route authorization (RBAC)            | ✅ Present but inconsistent with requirement fit | `repo/backend/src/modules/metrics/metrics.routes.ts:70`, `repo/backend/src/modules/analytics/analytics.routes.ts:100`                           | RBAC guards are broadly present.                                                                                                                |
| Object-level authorization            | ❌ High risk gaps                                | `repo/backend/src/modules/test-center/test-center.controller.ts:155-162`, `repo/backend/src/modules/test-center/test-center.service.ts:340-399` | Registration/cancel flows trust caller-supplied user IDs.                                                                                       |
| Function-level authorization          | ⚠️ Partial                                       | `repo/backend/src/modules/messaging/messaging.routes.ts:101`, `repo/backend/src/modules/messaging/messaging.controller.ts:40`                   | Delivery update is authenticated but lacks role constraint; intended operator/admin policy not enforced at route level.                         |
| Data isolation / tenant-style scoping | ❌ High risk                                     | `repo/backend/src/modules/messaging/messaging.service.ts:149-151`, `:183`                                                                       | Non-admin message list OR-clause includes `{ isFailureAlert: false }`, broadening visibility; single-message fetch has no user ownership check. |
| Admin/debug protection                | ✅ Mostly present                                | `repo/backend/src/modules/messaging/messaging.routes.ts:36-55`                                                                                  | Blacklist/failures locked to SYSTEM_ADMIN. No obvious debug endpoints found.                                                                    |

Security overall: **Partial / Not acceptable for production acceptance** due to object-level and data-scope flaws.

---

## 4) Acceptance Section: Data model, persistence, and audit integrity

### 4.1 Audit log immutability

- **Conclusion:** ✅ Pass.
- **Rationale:** SQL triggers explicitly block update/delete on audit logs.
- **Evidence:**
  - `repo/backend/prisma/migrations/20240101000000_init/migration.sql:652-662`

### 4.2 Model-validation consistency

- **Conclusion:** ❌ High.
- **Rationale:** Delivery status validation and DB enum diverge (`MANUALLY_SENT`).
- **Evidence:**
  - `repo/backend/src/modules/messaging/messaging.schemas.ts:22`
  - `repo/backend/prisma/schema.prisma:66-73`

### 4.3 Configuration hygiene for secrets/defaults

- **Conclusion:** ❌ High.
- **Rationale:** Committed `.env` contains real-looking secrets/default credentials and session secret.
- **Evidence:**
  - `repo/.env:5` (`MYSQL_ROOT_PASSWORD`)
  - `repo/.env:12` (`SESSION_SECRET`)

---

## 5) Acceptance Section: Static test-coverage assessment (mandatory)

### 5.1 Coverage realism (test architecture quality)

- **Conclusion:** ⚠️ Limited integration confidence.
- **Rationale:** API tests use broad service and Prisma mocking, reducing contract-level assurance.
- **Evidence:**
  - `repo/backend/tests/api/helpers/setup.ts:31` (full mock Prisma object)
  - `repo/backend/tests/api/helpers/setup.ts:302-350` (module-level service mocks)

### 5.2 Risk-to-test mapping table

| Prompt/Delivery Risk Area                      | Static Evidence of Tests                                                           | Coverage Judgment                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Auth session + unauthenticated denial          | `repo/backend/tests/api/auth.test.ts:151,169`                                      | **Sufficient** (for basic auth gate behavior)                             |
| Rate limiting behavior                         | `repo/backend/tests/api/auth.test.ts:121-126`                                      | **Insufficient** (config assertion only, not limiter behavior under load) |
| Analyst ability to recalc metrics              | `repo/backend/tests/api/metrics.test.ts:134-135`                                   | **Sufficient evidence of mismatch** (tests enforce opposite of prompt)    |
| ADA seat handling strictness                   | `repo/backend/tests/unit/allocator.test.ts:70,83`                                  | **Sufficient evidence of non-strict behavior**                            |
| Messaging object isolation                     | No explicit ownership-abuse tests found for `/:id` or list OR-scope                | **Missing**                                                               |
| Frontend↔backend API path/method compatibility | No contract/integration tests bridging frontend endpoints to backend router        | **Missing**                                                               |
| Notification snooze payload contract           | No compatibility test for `until` vs `snoozedUntil`                                | **Missing**                                                               |
| Audit immutability                             | `repo/backend/tests/unit/services/audit.immutability.test.ts` + migration triggers | **Basic coverage present**                                                |

### 5.3 Final coverage judgment

**Insufficient for delivery acceptance**, specifically on:

- end-to-end API compatibility,
- object-level authorization abuse cases,
- critical integration contracts between frontend endpoint wrappers and backend routes/schemas.

---

## 6) Acceptance Section: Architecture, operational readiness, and documentation consistency

### 6.1 Route composition and module separation

- **Conclusion:** ✅ Pass.
- **Rationale:** Modular route wiring is clear and versioned.
- **Evidence:**
  - `repo/backend/src/app.ts:72-75`

### 6.2 Security middleware baseline

- **Conclusion:** ✅ Pass.
- **Rationale:** Helmet, CORS, and rate limiters are centrally configured.
- **Evidence:**
  - `repo/backend/src/middleware/security.ts:25-26`
  - `repo/backend/src/middleware/security.ts:50-51`
  - `repo/backend/src/middleware/security.ts:77,81`

### 6.3 Documentation/deployment consistency

- **Conclusion:** ⚠️ Partial.
- **Rationale:** README advertises MySQL on `:3306`, but compose maps host `3307:3306`.
- **Evidence:**
  - `repo/README.md:19`
  - `repo/docker-compose.yml:38`

### 6.4 Manual verification required (cannot confirm statically)

- Actual runtime success of report generation/export/download flows.
- Real retry job behavior under queue failures.
- Browser-side UX behavior after frontend endpoint mismatches are corrected.

---

## Severity-ranked issue list (impact + minimum fix)

| ID   | Severity    | Finding                                                                                                    | Impact                                                               | Minimum fix                                                                                                                                        |
| ---- | ----------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-01 | **Blocker** | Frontend/backend API contract drift (analytics, messaging, test-center)                                    | Core UI workflows likely fail at runtime (404/405/422)               | Align one canonical API contract; update frontend endpoint wrappers and/or backend routes; add contract tests per resource.                        |
| I-02 | **High**    | Object-level auth gap in test-center registration/cancel                                                   | Users can act on others’ registrations by supplying target user IDs  | Derive subject user from session (`req.userId`) for self-service endpoints; allow explicit override only for privileged roles with explicit guard. |
| I-03 | **High**    | Messaging data-scope overexposure (`OR isFailureAlert:false`) + id-only retrieval without ownership filter | Non-admin users may read messages not owned by them                  | Restrict non-admin list and single fetch/update/package to `recipientUserId = req.userId` (unless privileged role).                                |
| I-04 | **High**    | `MANUALLY_SENT` status allowed by schema but absent in DB enum                                             | Validation/runtime persistence mismatch and potential write failures | Add enum value in Prisma schema + migration, or remove status from API schema/service logic.                                                       |
| I-05 | **High**    | Committed secrets/default credentials in `.env`                                                            | Credential leakage and insecure default deployments                  | Remove secrets from VCS, add `.env.example`, rotate exposed values, enforce secret injection via environment/CI.                                   |
| I-06 | **High**    | Requirement mismatch: analyst cannot trigger recalculation                                                 | Delivered behavior contradicts prompt acceptance requirement         | Expand route policy to include `ANALYST` if required by product rules; update tests accordingly.                                                   |
| I-07 | **Medium**  | Notification snooze payload mismatch (`until` vs `snoozedUntil`)                                           | Snooze action likely fails validation                                | Normalize payload field names frontend/backend; add schema compatibility test.                                                                     |
| I-08 | **Medium**  | README/compose port inconsistency                                                                          | Setup confusion and false-negative local checks                      | Correct docs to state host port mapping `3307` (or change compose mapping to `3306`).                                                              |

---

## Requirements coverage summary

- Static-only audit boundary respected: **Done**
- Verdict with accepted values: **Done** (`FAIL`)
- Six acceptance sections with conclusion/rationale/evidence: **Done**
- Severity-rated issues + impact + minimum fixes: **Done**
- Security review summary (AuthN, route authz, object authz, function authz, isolation, admin/debug): **Done**
- Mandatory static test-coverage mapping + final coverage judgment: **Done**
- Explicit manual-verification flags where needed: **Done**

---

## Final acceptance recommendation

Do **not** accept delivery in current state. Resolve all Blocker/High findings (I-01 through I-06) and add contract/authorization abuse tests before re-audit.
