# LeaseOps TASK-12 — Issue Revalidation Results (Latest Static Pass)

## Scope

This is a **static revalidation** of the previously reported issues (`I-01` … `I-08`) against the current repository state.
No runtime execution, Docker startup, or automated test runs were performed in this pass.

## Summary

- **Fixed:** 7
- **Partially fixed:** 1
- **Not fixed:** 0

---

## Per-issue status

### I-01 — Frontend/backend API contract drift

**Status:** ⚠️ **Partially fixed**

**Confirmed fixed areas**

- Analytics compatibility aliases are present:
  - `PATCH /definitions/:id` alias: `repo/backend/src/modules/analytics/analytics.routes.ts:72`
  - `POST /reports` alias: `repo/backend/src/modules/analytics/analytics.routes.ts:95`
  - `/shares` compatibility handlers: `repo/backend/src/modules/analytics/analytics.routes.ts:143-159`
  - `/schedules*` compatibility set: `repo/backend/src/modules/analytics/analytics.routes.ts:309-346`
- Messaging `/messages*` compatibility aliases are present:
  - `repo/backend/src/modules/messaging/messaging.routes.ts:76-99`
- Test-center nested route compatibility aliases are present:
  - `/sites/:siteId/rooms*`: `repo/backend/src/modules/test-center/test-center.routes.ts:225-263`
  - `/rooms/:roomId/seats*`: `repo/backend/src/modules/test-center/test-center.routes.ts:267-305`
  - `/sessions/:sessionId/registrations/:registrationId`: `repo/backend/src/modules/test-center/test-center.routes.ts:222`

**Remaining mismatch**

- Frontend still calls: `GET /v1/test-center/utilization` (`repo/frontend/src/api/endpoints/test-center.api.ts:83`)
- Backend still exposes only:
  - `GET /utilization/rooms/:roomId` (`repo/backend/src/modules/test-center/test-center.routes.ts:329`)
  - `GET /utilization/sites/:siteId` (`repo/backend/src/modules/test-center/test-center.routes.ts:331`)
- No flat `/utilization` compatibility route detected.

---

### I-02 — Object-level auth gap in test-center registration/cancel

**Status:** ✅ **Fixed**

**Evidence**

- Self-only enforcement for non-privileged registration:
  - `repo/backend/src/modules/test-center/test-center.controller.ts:166-168`
- Self-only enforcement for non-privileged cancellation:
  - `repo/backend/src/modules/test-center/test-center.controller.ts:176-178`
- Privileged override remains role-gated:
  - `repo/backend/src/modules/test-center/test-center.controller.ts:163-176`

---

### I-03 — Messaging data-scope overexposure and ownership checks

**Status:** ✅ **Fixed**

**Evidence**

- Non-admin list now hard-scoped to owner:
  - `repo/backend/src/modules/messaging/messaging.service.ts:149-151`
- Message ownership-aware fetch method:
  - `repo/backend/src/modules/messaging/messaging.service.ts:181`
- Controller passes user/admin context for secure checks:
  - `repo/backend/src/modules/messaging/messaging.controller.ts:33-41`
  - `repo/backend/src/modules/messaging/messaging.controller.ts:62-69`

---

### I-04 — `MANUALLY_SENT` schema/model mismatch

**Status:** ✅ **Fixed**

**Evidence**

- Prisma enum includes `MANUALLY_SENT`:
  - `repo/backend/prisma/schema.prisma:74`
- Validation schema includes `MANUALLY_SENT`:
  - `repo/backend/src/modules/messaging/messaging.schemas.ts:22`
- Migration exists for enum update:
  - `repo/backend/prisma/migrations/20240401000000_add_manually_sent_status/migration.sql:1,22`

---

### I-05 — Committed secrets/default credentials in `.env`

**Status:** ✅ **Fixed**

**Evidence**

- `.env` currently contains placeholders (non-secret template values):
  - `repo/.env:5` (`MYSQL_ROOT_PASSWORD=CHANGE_ME_...`)
  - `repo/.env:12` (`SESSION_SECRET=CHANGE_ME_...`)
- `.env.example` is present with template guidance:
  - `repo/.env.example:1-34`
- `.env` remains ignored in gitignore:
  - `repo/.gitignore:4`

**Note**

- Secret rotation is still recommended in operational environments if earlier real values were ever exposed externally.

---

### I-06 — Analyst recalculation requirement mismatch

**Status:** ✅ **Fixed**

**Evidence**

- Recalc roles controlled through `ANALYST_CAN_TRIGGER_RECALC`:
  - `repo/backend/src/modules/metrics/metrics.routes.ts:22-24`
  - Route uses `recalcRoles`: `repo/backend/src/modules/metrics/metrics.routes.ts:76`
- Default is now aligned to requirement (`true`):
  - `repo/backend/src/config/env.ts:39-45`
- API test expects analyst allowed for recalc by default:
  - `repo/backend/tests/api/metrics.test.ts:134-145`

---

### I-07 — Notifications payload mismatch (`until` vs `snoozedUntil`)

**Status:** ✅ **Fixed**

**Evidence**

- Backend accepts both payload keys and normalizes:
  - `repo/backend/src/modules/notifications/notifications.schemas.ts:33-43`
- Frontend still sending `{ until }` remains compatible:
  - `repo/frontend/src/api/endpoints/notifications.api.ts:15`

---

### I-08 — README/Compose port inconsistency/ambiguity

**Status:** ✅ **Fixed**

**Evidence**

- README host mapping states `localhost:3307`:
  - `repo/README.md:19`
- README architecture line now disambiguates container vs host:
  - `repo/README.md:47` (`MySQL :3306 (container) / :3307 (host)`)
- Compose mapping remains consistent:
  - `repo/docker-compose.yml:38` (`3307:3306`)

---

## Final conclusion

Current status is **substantially improved** with only one remaining partial item:

- Add backend compatibility route for `GET /api/v1/test-center/utilization` (or update frontend endpoint usage).

Everything else from the prior revalidation list now appears fixed in static code inspection.
