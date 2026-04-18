# Test Coverage Audit

## Scope & Method
- Audit mode: static inspection only (no test execution, no build, no container run).
- Project type declaration: `fullstack` found at top of `repo/README.md` (line 1).
- Endpoint source of truth: backend route files mounted in `repo/backend/src/app.ts`.

## Backend Endpoint Inventory
- Total resolved backend endpoints: **150** (METHOD + fully resolved PATH).
- Source files: `repo/backend/src/modules/*/*.routes.ts`, `repo/backend/src/modules/health/health.router.ts`, `repo/backend/src/app.ts`.

| Method | Path | Route Source |
|---|---|---|
| GET | /api/health/live | backend/src/modules/health/health.router.ts |
| GET | /api/health/ready | backend/src/modules/health/health.router.ts |
| GET | /api/health | backend/src/modules/health/health.router.ts |
| GET | /api/v1/analytics/definitions/:id | backend/src/modules/analytics/analytics.routes.ts |
| PATCH | /api/v1/analytics/definitions/:id | backend/src/modules/analytics/analytics.routes.ts |
| PUT | /api/v1/analytics/definitions/:id | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/definitions | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/definitions | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/exports/:id/download | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/operational/attendance | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/operational/event-popularity | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/operational/hour-distribution | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/operational/participation | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/operational/rankings | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/operational/retention | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/operational/staffing-gaps | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/pivot | backend/src/modules/analytics/analytics.routes.ts |
| PATCH | /api/v1/analytics/reports/:id/archive | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/reports/:id/export | backend/src/modules/analytics/analytics.routes.ts |
| DELETE | /api/v1/analytics/reports/:id/share/:userId | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/reports/:id/share | backend/src/modules/analytics/analytics.routes.ts |
| DELETE | /api/v1/analytics/reports/:id/shares/:shareId | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/reports/:id/shares | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/reports/:id/shares | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/reports/:id | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/reports/generate | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/reports | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/reports | backend/src/modules/analytics/analytics.routes.ts |
| DELETE | /api/v1/analytics/saved-views/:id | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/saved-views/:id | backend/src/modules/analytics/analytics.routes.ts |
| PUT | /api/v1/analytics/saved-views/:id | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/saved-views | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/saved-views | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/schedule-executions | backend/src/modules/analytics/analytics.routes.ts |
| DELETE | /api/v1/analytics/schedules/:id | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/schedules/:id | backend/src/modules/analytics/analytics.routes.ts |
| PATCH | /api/v1/analytics/schedules/:id | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/analytics/schedules | backend/src/modules/analytics/analytics.routes.ts |
| POST | /api/v1/analytics/schedules | backend/src/modules/analytics/analytics.routes.ts |
| GET | /api/v1/audit/:id | backend/src/modules/audit/audit.routes.ts |
| GET | /api/v1/audit | backend/src/modules/audit/audit.routes.ts |
| POST | /api/v1/auth/login | backend/src/modules/auth/auth.routes.ts |
| POST | /api/v1/auth/logout | backend/src/modules/auth/auth.routes.ts |
| GET | /api/v1/auth/me | backend/src/modules/auth/auth.routes.ts |
| POST | /api/v1/auth/touch | backend/src/modules/auth/auth.routes.ts |
| DELETE | /api/v1/communities/communities/:id | backend/src/modules/communities/communities.routes.ts |
| GET | /api/v1/communities/communities/:id | backend/src/modules/communities/communities.routes.ts |
| PUT | /api/v1/communities/communities/:id | backend/src/modules/communities/communities.routes.ts |
| GET | /api/v1/communities/communities | backend/src/modules/communities/communities.routes.ts |
| POST | /api/v1/communities/communities | backend/src/modules/communities/communities.routes.ts |
| GET | /api/v1/communities/properties/:id | backend/src/modules/communities/communities.routes.ts |
| PUT | /api/v1/communities/properties/:id | backend/src/modules/communities/communities.routes.ts |
| GET | /api/v1/communities/properties | backend/src/modules/communities/communities.routes.ts |
| POST | /api/v1/communities/properties | backend/src/modules/communities/communities.routes.ts |
| DELETE | /api/v1/communities/regions/:id | backend/src/modules/communities/communities.routes.ts |
| GET | /api/v1/communities/regions/:id | backend/src/modules/communities/communities.routes.ts |
| PUT | /api/v1/communities/regions/:id | backend/src/modules/communities/communities.routes.ts |
| GET | /api/v1/communities/regions | backend/src/modules/communities/communities.routes.ts |
| POST | /api/v1/communities/regions | backend/src/modules/communities/communities.routes.ts |
| GET | /api/v1/listings/:id | backend/src/modules/listings/listings.routes.ts |
| PUT | /api/v1/listings/:id | backend/src/modules/listings/listings.routes.ts |
| GET | /api/v1/listings/stats | backend/src/modules/listings/listings.routes.ts |
| GET | /api/v1/listings | backend/src/modules/listings/listings.routes.ts |
| POST | /api/v1/listings | backend/src/modules/listings/listings.routes.ts |
| PATCH | /api/v1/messaging/:id/delivery | backend/src/modules/messaging/messaging.routes.ts |
| GET | /api/v1/messaging/:id/package | backend/src/modules/messaging/messaging.routes.ts |
| GET | /api/v1/messaging/:id | backend/src/modules/messaging/messaging.routes.ts |
| DELETE | /api/v1/messaging/blacklist/:id | backend/src/modules/messaging/messaging.routes.ts |
| GET | /api/v1/messaging/blacklist | backend/src/modules/messaging/messaging.routes.ts |
| POST | /api/v1/messaging/blacklist | backend/src/modules/messaging/messaging.routes.ts |
| POST | /api/v1/messaging/enqueue | backend/src/modules/messaging/messaging.routes.ts |
| GET | /api/v1/messaging/failures | backend/src/modules/messaging/messaging.routes.ts |
| PATCH | /api/v1/messaging/messages/:id/delivery | backend/src/modules/messaging/messaging.routes.ts |
| GET | /api/v1/messaging/messages/:id | backend/src/modules/messaging/messaging.routes.ts |
| GET | /api/v1/messaging/messages | backend/src/modules/messaging/messaging.routes.ts |
| POST | /api/v1/messaging/messages | backend/src/modules/messaging/messaging.routes.ts |
| GET | /api/v1/messaging/quiet-hours | backend/src/modules/messaging/messaging.routes.ts |
| PUT | /api/v1/messaging/quiet-hours | backend/src/modules/messaging/messaging.routes.ts |
| GET | /api/v1/messaging | backend/src/modules/messaging/messaging.routes.ts |
| POST | /api/v1/metrics/definitions/:id/versions | backend/src/modules/metrics/metrics.routes.ts |
| GET | /api/v1/metrics/definitions/:id | backend/src/modules/metrics/metrics.routes.ts |
| GET | /api/v1/metrics/definitions | backend/src/modules/metrics/metrics.routes.ts |
| POST | /api/v1/metrics/definitions | backend/src/modules/metrics/metrics.routes.ts |
| GET | /api/v1/metrics/jobs | backend/src/modules/metrics/metrics.routes.ts |
| POST | /api/v1/metrics/recalculate | backend/src/modules/metrics/metrics.routes.ts |
| GET | /api/v1/metrics/values | backend/src/modules/metrics/metrics.routes.ts |
| PATCH | /api/v1/notifications/:id/dismiss | backend/src/modules/notifications/notifications.routes.ts |
| PATCH | /api/v1/notifications/:id/read | backend/src/modules/notifications/notifications.routes.ts |
| PATCH | /api/v1/notifications/:id/snooze | backend/src/modules/notifications/notifications.routes.ts |
| PATCH | /api/v1/notifications/read-all | backend/src/modules/notifications/notifications.routes.ts |
| DELETE | /api/v1/notifications/templates/:id | backend/src/modules/notifications/notifications.routes.ts |
| GET | /api/v1/notifications/templates/:id | backend/src/modules/notifications/notifications.routes.ts |
| PATCH | /api/v1/notifications/templates/:id | backend/src/modules/notifications/notifications.routes.ts |
| PUT | /api/v1/notifications/templates/:id | backend/src/modules/notifications/notifications.routes.ts |
| POST | /api/v1/notifications/templates/preview | backend/src/modules/notifications/notifications.routes.ts |
| GET | /api/v1/notifications/templates | backend/src/modules/notifications/notifications.routes.ts |
| POST | /api/v1/notifications/templates | backend/src/modules/notifications/notifications.routes.ts |
| GET | /api/v1/notifications/unread-count | backend/src/modules/notifications/notifications.routes.ts |
| GET | /api/v1/notifications | backend/src/modules/notifications/notifications.routes.ts |
| DELETE | /api/v1/test-center/equipment/:id | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/equipment/:id | backend/src/modules/test-center/test-center.routes.ts |
| PATCH | /api/v1/test-center/equipment/:id | backend/src/modules/test-center/test-center.routes.ts |
| PUT | /api/v1/test-center/equipment/:id | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/equipment | backend/src/modules/test-center/test-center.routes.ts |
| POST | /api/v1/test-center/equipment | backend/src/modules/test-center/test-center.routes.ts |
| DELETE | /api/v1/test-center/rooms/:id | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/rooms/:id | backend/src/modules/test-center/test-center.routes.ts |
| PUT | /api/v1/test-center/rooms/:id | backend/src/modules/test-center/test-center.routes.ts |
| DELETE | /api/v1/test-center/rooms/:roomId/seats/:seatId | backend/src/modules/test-center/test-center.routes.ts |
| PATCH | /api/v1/test-center/rooms/:roomId/seats/:seatId | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/rooms/:roomId/seats | backend/src/modules/test-center/test-center.routes.ts |
| POST | /api/v1/test-center/rooms/:roomId/seats | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/rooms | backend/src/modules/test-center/test-center.routes.ts |
| POST | /api/v1/test-center/rooms | backend/src/modules/test-center/test-center.routes.ts |
| DELETE | /api/v1/test-center/seats/:id | backend/src/modules/test-center/test-center.routes.ts |
| PATCH | /api/v1/test-center/seats/:id | backend/src/modules/test-center/test-center.routes.ts |
| PUT | /api/v1/test-center/seats/:id | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/seats | backend/src/modules/test-center/test-center.routes.ts |
| POST | /api/v1/test-center/seats | backend/src/modules/test-center/test-center.routes.ts |
| PATCH | /api/v1/test-center/sessions/:id/cancel | backend/src/modules/test-center/test-center.routes.ts |
| DELETE | /api/v1/test-center/sessions/:id/register | backend/src/modules/test-center/test-center.routes.ts |
| POST | /api/v1/test-center/sessions/:id/register | backend/src/modules/test-center/test-center.routes.ts |
| DELETE | /api/v1/test-center/sessions/:id | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/sessions/:id | backend/src/modules/test-center/test-center.routes.ts |
| PATCH | /api/v1/test-center/sessions/:id | backend/src/modules/test-center/test-center.routes.ts |
| DELETE | /api/v1/test-center/sessions/:sessionId/registrations/:registrationId | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/sessions | backend/src/modules/test-center/test-center.routes.ts |
| POST | /api/v1/test-center/sessions | backend/src/modules/test-center/test-center.routes.ts |
| DELETE | /api/v1/test-center/sites/:id | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/sites/:id | backend/src/modules/test-center/test-center.routes.ts |
| PATCH | /api/v1/test-center/sites/:id | backend/src/modules/test-center/test-center.routes.ts |
| PUT | /api/v1/test-center/sites/:id | backend/src/modules/test-center/test-center.routes.ts |
| DELETE | /api/v1/test-center/sites/:siteId/rooms/:roomId | backend/src/modules/test-center/test-center.routes.ts |
| PATCH | /api/v1/test-center/sites/:siteId/rooms/:roomId | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/sites/:siteId/rooms | backend/src/modules/test-center/test-center.routes.ts |
| POST | /api/v1/test-center/sites/:siteId/rooms | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/sites | backend/src/modules/test-center/test-center.routes.ts |
| POST | /api/v1/test-center/sites | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/utilization/rooms/:roomId | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/utilization/sites/:siteId | backend/src/modules/test-center/test-center.routes.ts |
| GET | /api/v1/test-center/utilization | backend/src/modules/test-center/test-center.routes.ts |
| PATCH | /api/v1/users/:id/deactivate | backend/src/modules/users/users.routes.ts |
| DELETE | /api/v1/users/:id/roles/:roleName | backend/src/modules/users/users.routes.ts |
| POST | /api/v1/users/:id/roles | backend/src/modules/users/users.routes.ts |
| GET | /api/v1/users/:id | backend/src/modules/users/users.routes.ts |
| PUT | /api/v1/users/:id | backend/src/modules/users/users.routes.ts |
| GET | /api/v1/users/me/preferences | backend/src/modules/users/users.routes.ts |
| PUT | /api/v1/users/me/preferences | backend/src/modules/users/users.routes.ts |
| GET | /api/v1/users | backend/src/modules/users/users.routes.ts |
| POST | /api/v1/users | backend/src/modules/users/users.routes.ts |

## API Test Mapping Table
| Endpoint | Covered | Test Type | Test Files | Evidence |
|---|---|---|---|---|
| GET /api/health/live | yes | true no-mock HTTP | backend/tests/integration/health.nomock.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/health.nomock.test.ts:12<br><code>const res = await createAgent().get('/api/health/live');</code> |
| GET /api/health/ready | yes | true no-mock HTTP | backend/tests/integration/health.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/health.nomock.test.ts:21<br><code>const res = await createAgent().get('/api/health/ready');</code> |
| GET /api/health | yes | true no-mock HTTP | backend/tests/integration/health.nomock.test.ts<br>backend/tests/api/health.test.ts | backend/tests/integration/health.nomock.test.ts:32<br><code>const res = await createAgent().get('/api/health');</code> |
| GET /api/v1/analytics/definitions/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/report-definitions.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:541<br><code>const res = await analyst.get('/api/v1/analytics/definitions/not-a-uuid');</code> |
| PATCH /api/v1/analytics/definitions/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:575<br><code>.patch(`/api/v1/analytics/definitions/${id}`)</code> |
| PUT /api/v1/analytics/definitions/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/report-definitions.test.ts<br>backend/tests/api/role-docs-drift.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:564<br><code>.put(`/api/v1/analytics/definitions/${id}`)</code> |
| GET /api/v1/analytics/definitions | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/report-definitions.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/analytics.nomock.test.ts:36<br><code>const res = await createAgent().get('/api/v1/analytics/definitions');</code> |
| POST /api/v1/analytics/definitions | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/report-definitions.test.ts<br>backend/tests/api/role-docs-drift.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:553<br><code>.post('/api/v1/analytics/definitions')</code> |
| GET /api/v1/analytics/exports/:id/download | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:554<br><code>const res = await agent.get('/api/v1/analytics/exports/11111111-1111-1111-1111-111111111111/download');</code> |
| GET /api/v1/analytics/operational/attendance | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/role-docs-drift.test.ts<br>backend/tests/api/operational-analytics.test.ts | backend/tests/integration/analytics.nomock.test.ts:232<br><code>const res = await standard.get('/api/v1/analytics/operational/attendance');</code> |
| GET /api/v1/analytics/operational/event-popularity | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/operational-analytics.test.ts | backend/tests/integration/analytics.nomock.test.ts:253<br><code>const res = await analyst.get('/api/v1/analytics/operational/event-popularity');</code> |
| GET /api/v1/analytics/operational/hour-distribution | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/operational-analytics.test.ts | backend/tests/integration/analytics.nomock.test.ts:237<br><code>const res = await analyst.get('/api/v1/analytics/operational/hour-distribution');</code> |
| GET /api/v1/analytics/operational/participation | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/operational-analytics.test.ts | backend/tests/integration/analytics.nomock.test.ts:225<br><code>const res = await analyst.get('/api/v1/analytics/operational/participation');</code> |
| GET /api/v1/analytics/operational/rankings | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/operational-analytics.test.ts | backend/tests/integration/analytics.nomock.test.ts:258<br><code>const res = await analyst.get('/api/v1/analytics/operational/rankings');</code> |
| GET /api/v1/analytics/operational/retention | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/operational-analytics.test.ts | backend/tests/integration/analytics.nomock.test.ts:243<br><code>const res = await analyst.get('/api/v1/analytics/operational/retention');</code> |
| GET /api/v1/analytics/operational/staffing-gaps | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/operational-analytics.test.ts | backend/tests/integration/analytics.nomock.test.ts:248<br><code>const res = await analyst.get('/api/v1/analytics/operational/staffing-gaps');</code> |
| POST /api/v1/analytics/pivot | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/role-docs-drift.test.ts | backend/tests/integration/analytics.nomock.test.ts:200<br><code>.post('/api/v1/analytics/pivot')</code> |
| PATCH /api/v1/analytics/reports/:id/archive | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/analytics.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:744<br><code>['PATCH', `/api/v1/analytics/reports/${BOGUS_UUID}/archive`],</code> |
| POST /api/v1/analytics/reports/:id/export | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/export-authorization.test.ts | backend/tests/integration/analytics.nomock.test.ts:177<br><code>.post('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/export')</code> |
| DELETE /api/v1/analytics/reports/:id/share/:userId | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:535<br><code>const res = await agent.delete('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111/share/333333...</code> |
| POST /api/v1/analytics/reports/:id/share | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/role-docs-drift.test.ts<br>backend/tests/api/export-authorization.test.ts | backend/tests/integration/analytics.nomock.test.ts:154<br><code>.post('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/share')</code> |
| DELETE /api/v1/analytics/reports/:id/shares/:shareId | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:740<br><code>['DELETE', `/api/v1/analytics/reports/${BOGUS_UUID}/shares/${BOGUS_UUID}`],</code> |
| GET /api/v1/analytics/reports/:id/shares | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/analytics.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:738<br><code>['GET', `/api/v1/analytics/reports/${BOGUS_UUID}/shares`],</code> |
| POST /api/v1/analytics/reports/:id/shares | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:595<br><code>.post(`/api/v1/analytics/reports/${BOGUS_UUID}/shares`)</code> |
| GET /api/v1/analytics/reports/:id | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:517<br><code>const res = await agent.get('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111');</code> |
| POST /api/v1/analytics/reports/generate | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/analytics.nomock.test.ts:115<br><code>const res = await analyst.post('/api/v1/analytics/reports/generate').send({});</code> |
| GET /api/v1/analytics/reports | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/export-authorization.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/analytics.nomock.test.ts:103<br><code>const res = await analyst.get('/api/v1/analytics/reports');</code> |
| POST /api/v1/analytics/reports | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/analytics.nomock.test.ts:120<br><code>const res = await analyst.post('/api/v1/analytics/reports').send({});</code> |
| DELETE /api/v1/analytics/saved-views/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/saved-views.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:638<br><code>const del = await analyst.delete(`/api/v1/analytics/saved-views/${id}`);</code> |
| GET /api/v1/analytics/saved-views/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/saved-views.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:628<br><code>const get = await analyst.get(`/api/v1/analytics/saved-views/${id}`);</code> |
| PUT /api/v1/analytics/saved-views/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/saved-views.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:633<br><code>.put(`/api/v1/analytics/saved-views/${id}`)</code> |
| GET /api/v1/analytics/saved-views | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/saved-views.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/analytics.nomock.test.ts:265<br><code>const res = await analyst.get('/api/v1/analytics/saved-views');</code> |
| POST /api/v1/analytics/saved-views | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/role-docs-drift.test.ts<br>backend/tests/api/saved-views.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:614<br><code>const created = await analyst.post('/api/v1/analytics/saved-views').send({</code> |
| GET /api/v1/analytics/schedule-executions | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/role-docs-drift.test.ts<br>backend/tests/api/schedule-executions.test.ts | backend/tests/integration/analytics.nomock.test.ts:345<br><code>const res = await analyst.get('/api/v1/analytics/schedule-executions');</code> |
| DELETE /api/v1/analytics/schedules/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/role-docs-drift.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:746<br><code>['DELETE', `/api/v1/analytics/schedules/${BOGUS_UUID}`],</code> |
| GET /api/v1/analytics/schedules/:id | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:571<br><code>const res = await agent.get('/api/v1/analytics/schedules/11111111-1111-1111-1111-111111111111');</code> |
| PATCH /api/v1/analytics/schedules/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/role-docs-drift.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:677<br><code>.patch(`/api/v1/analytics/schedules/${BOGUS_UUID}`)</code> |
| GET /api/v1/analytics/schedules | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/role-docs-drift.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/analytics.nomock.test.ts:307<br><code>const res = await analyst.get('/api/v1/analytics/schedules');</code> |
| POST /api/v1/analytics/schedules | yes | true no-mock HTTP | backend/tests/integration/analytics.nomock.test.ts<br>backend/tests/api/analytics.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/analytics.nomock.test.ts:317<br><code>const res = await analyst.post('/api/v1/analytics/schedules').send({});</code> |
| GET /api/v1/audit/:id | yes | true no-mock HTTP | backend/tests/integration/audit.nomock.test.ts<br>backend/tests/api/audit.test.ts | backend/tests/integration/audit.nomock.test.ts:32<br><code>const res = await admin.get('/api/v1/audit/9999999999');</code> |
| GET /api/v1/audit | yes | true no-mock HTTP | backend/tests/integration/audit.nomock.test.ts<br>backend/tests/api/assertion-strength.test.ts<br>backend/tests/api/audit.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/audit.nomock.test.ts:21<br><code>const res = await standard.get('/api/v1/audit');</code> |
| POST /api/v1/auth/login | yes | true no-mock HTTP | backend/tests/integration/auth.nomock.test.ts<br>backend/tests/api/auth.test.ts<br>backend/tests/api/assertion-strength.test.ts | backend/tests/integration/auth.nomock.test.ts:23<br><code>.post('/api/v1/auth/login')</code> |
| POST /api/v1/auth/logout | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/auth.nomock.test.ts<br>backend/tests/api/auth.test.ts | backend/tests/integration/boundary.nomock.test.ts:65<br><code>const logout = await agent.post('/api/v1/auth/logout');</code> |
| GET /api/v1/auth/me | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/auth.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/auth.test.ts<br>backend/tests/api/assertion-strength.test.ts | backend/tests/integration/boundary.nomock.test.ts:69<br><code>const meAfter = await agent.get('/api/v1/auth/me');</code> |
| POST /api/v1/auth/touch | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/auth.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/boundary.nomock.test.ts:62<br><code>const touch = await agent.post('/api/v1/auth/touch');</code> |
| DELETE /api/v1/communities/communities/:id | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:217<br><code>const res = await agent.delete('/api/v1/communities/communities/11111111-1111-1111-1111-111111111111');</code> |
| GET /api/v1/communities/communities/:id | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:195<br><code>const res = await agent.get('/api/v1/communities/communities/11111111-1111-1111-1111-111111111111');</code> |
| PUT /api/v1/communities/communities/:id | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/communities.nomock.test.ts:202<br><code>.put(`/api/v1/communities/communities/${communityId}`)</code> |
| GET /api/v1/communities/communities | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/communities.nomock.test.ts:74<br><code>const res = await adminAgent.get('/api/v1/communities/communities');</code> |
| POST /api/v1/communities/communities | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/communities.nomock.test.ts:90<br><code>.post('/api/v1/communities/communities')</code> |
| GET /api/v1/communities/properties/:id | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/communities.nomock.test.ts:188<br><code>const propGet = await adminAgent.get(`/api/v1/communities/properties/${propertyId}`);</code> |
| PUT /api/v1/communities/properties/:id | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/communities.nomock.test.ts:138<br><code>.put('/api/v1/communities/properties/00000000-0000-0000-0000-000000000000')</code> |
| GET /api/v1/communities/properties | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/communities.test.ts | backend/tests/integration/communities.nomock.test.ts:103<br><code>const res = await adminAgent.get('/api/v1/communities/properties');</code> |
| POST /api/v1/communities/properties | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/communities.test.ts | backend/tests/integration/communities.nomock.test.ts:109<br><code>.post('/api/v1/communities/properties')</code> |
| DELETE /api/v1/communities/regions/:id | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:135<br><code>const res = await agent.delete('/api/v1/communities/regions/11111111-1111-1111-1111-111111111111');</code> |
| GET /api/v1/communities/regions/:id | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/communities.nomock.test.ts:67<br><code>const res = await adminAgent.get('/api/v1/communities/regions/not-a-uuid');</code> |
| PUT /api/v1/communities/regions/:id | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/communities.nomock.test.ts:223<br><code>.put(`/api/v1/communities/regions/${regionId}`)</code> |
| GET /api/v1/communities/regions | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/communities.test.ts | backend/tests/integration/communities.nomock.test.ts:34<br><code>const res = await createAgent().get('/api/v1/communities/regions');</code> |
| POST /api/v1/communities/regions | yes | true no-mock HTTP | backend/tests/integration/communities.nomock.test.ts<br>backend/tests/api/communities.test.ts | backend/tests/integration/communities.nomock.test.ts:46<br><code>.post('/api/v1/communities/regions')</code> |
| GET /api/v1/listings/:id | yes | true no-mock HTTP | backend/tests/integration/listings.nomock.test.ts<br>backend/tests/api/listings.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/listings.nomock.test.ts:49<br><code>const res = await standardAgent.get('/api/v1/listings/stats');</code> |
| PUT /api/v1/listings/:id | yes | true no-mock HTTP | backend/tests/integration/listings.nomock.test.ts<br>backend/tests/api/listings.test.ts<br>backend/tests/api/assertion-strength.test.ts | backend/tests/integration/listings.nomock.test.ts:99<br><code>.put('/api/v1/listings/00000000-0000-0000-0000-000000000000')</code> |
| GET /api/v1/listings/stats | yes | true no-mock HTTP | backend/tests/integration/listings.nomock.test.ts<br>backend/tests/api/listings.test.ts | backend/tests/integration/listings.nomock.test.ts:49<br><code>const res = await standardAgent.get('/api/v1/listings/stats');</code> |
| GET /api/v1/listings | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/listings.nomock.test.ts<br>backend/tests/api/listings.test.ts | backend/tests/integration/boundary.nomock.test.ts:148<br><code>const res = await standard.get('/api/v1/listings?minRent=abc');</code> |
| POST /api/v1/listings | yes | true no-mock HTTP | backend/tests/integration/listings.nomock.test.ts<br>backend/tests/api/listings.test.ts | backend/tests/integration/listings.nomock.test.ts:55<br><code>const res = await standardAgent.post('/api/v1/listings').send({</code> |
| PATCH /api/v1/messaging/:id/delivery | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:531<br><code>.patch(`/api/v1/messaging/${msgId}/delivery`)</code> |
| GET /api/v1/messaging/:id/package | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:523<br><code>const res = await admin.get(`/api/v1/messaging/${msgId}/package`);</code> |
| GET /api/v1/messaging/:id | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/messaging.nomock.test.ts:35<br><code>const res = await standard.get('/api/v1/messaging/messages');</code> |
| DELETE /api/v1/messaging/blacklist/:id | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/messaging.nomock.test.ts:172<br><code>const del = await admin.delete(`/api/v1/messaging/blacklist/${id}`);</code> |
| GET /api/v1/messaging/blacklist | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/messaging.nomock.test.ts:152<br><code>const res = await standard.get('/api/v1/messaging/blacklist');</code> |
| POST /api/v1/messaging/blacklist | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/messaging.nomock.test.ts:140<br><code>const res = await admin.post('/api/v1/messaging/blacklist').send({});</code> |
| POST /api/v1/messaging/enqueue | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:489<br><code>const enqueue = await admin.post('/api/v1/messaging/enqueue').send({</code> |
| GET /api/v1/messaging/failures | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/messaging.nomock.test.ts:93<br><code>const res = await standard.get('/api/v1/messaging/failures');</code> |
| PATCH /api/v1/messaging/messages/:id/delivery | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:507<br><code>.patch(`/api/v1/messaging/messages/${msgId}/delivery`)</code> |
| GET /api/v1/messaging/messages/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:500<br><code>const res = await admin.get(`/api/v1/messaging/messages/${msgId}`);</code> |
| GET /api/v1/messaging/messages | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/messaging.nomock.test.ts:35<br><code>const res = await standard.get('/api/v1/messaging/messages');</code> |
| POST /api/v1/messaging/messages | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/messaging.nomock.test.ts:45<br><code>const res = await standard.post('/api/v1/messaging/messages').send({});</code> |
| GET /api/v1/messaging/quiet-hours | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/messaging.nomock.test.ts:106<br><code>const res = await standard.get('/api/v1/messaging/quiet-hours');</code> |
| PUT /api/v1/messaging/quiet-hours | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/messaging.nomock.test.ts:113<br><code>.put('/api/v1/messaging/quiet-hours')</code> |
| GET /api/v1/messaging | yes | true no-mock HTTP | backend/tests/integration/messaging.nomock.test.ts<br>backend/tests/api/messaging-extended.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/messaging.test.ts | backend/tests/integration/messaging.nomock.test.ts:25<br><code>const res = await createAgent().get('/api/v1/messaging');</code> |
| POST /api/v1/metrics/definitions/:id/versions | yes | true no-mock HTTP | backend/tests/integration/metrics.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/metrics-versions.test.ts | backend/tests/integration/metrics.nomock.test.ts:83<br><code>.post('/api/v1/metrics/definitions/00000000-0000-0000-0000-000000000000/versions')</code> |
| GET /api/v1/metrics/definitions/:id | yes | true no-mock HTTP | backend/tests/integration/metrics.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/metrics-versions.test.ts | backend/tests/integration/metrics.nomock.test.ts:46<br><code>const res = await admin.get('/api/v1/metrics/definitions/not-a-uuid');</code> |
| GET /api/v1/metrics/definitions | yes | true no-mock HTTP | backend/tests/integration/metrics.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/privilege-freshness.test.ts<br>backend/tests/api/metrics.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/metrics.nomock.test.ts:27<br><code>const res = await createAgent().get('/api/v1/metrics/definitions');</code> |
| POST /api/v1/metrics/definitions | yes | true no-mock HTTP | backend/tests/integration/metrics.nomock.test.ts<br>backend/tests/api/metrics.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/metrics.nomock.test.ts:51<br><code>const res = await admin.post('/api/v1/metrics/definitions').send({});</code> |
| GET /api/v1/metrics/jobs | yes | true no-mock HTTP | backend/tests/integration/metrics.nomock.test.ts<br>backend/tests/api/security-contracts.test.ts<br>backend/tests/api/metrics-versions.test.ts | backend/tests/integration/metrics.nomock.test.ts:114<br><code>const res = await admin.get('/api/v1/metrics/jobs');</code> |
| POST /api/v1/metrics/recalculate | yes | true no-mock HTTP | backend/tests/integration/metrics.nomock.test.ts<br>backend/tests/api/privilege-freshness.test.ts<br>backend/tests/api/metrics.test.ts<br>backend/tests/api/assertion-strength.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/metrics.nomock.test.ts:120<br><code>.post('/api/v1/metrics/recalculate')</code> |
| GET /api/v1/metrics/values | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/metrics.nomock.test.ts<br>backend/tests/api/metrics.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/boundary.nomock.test.ts:153<br><code>const res = await admin.get('/api/v1/metrics/values?propertyId=not-a-uuid');</code> |
| PATCH /api/v1/notifications/:id/dismiss | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/notification-inbox.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:79<br><code>const res = await standard.patch('/api/v1/notifications/missing-zzz/dismiss');</code> |
| PATCH /api/v1/notifications/:id/read | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/api/notifications.test.ts | backend/tests/integration/notifications.nomock.test.ts:58<br><code>const res = await standard.patch('/api/v1/notifications/missing-zzz/read');</code> |
| PATCH /api/v1/notifications/:id/snooze | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/notification-inbox.test.ts<br>backend/tests/api/notifications.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:64<br><code>.patch('/api/v1/notifications/missing-zzz/snooze')</code> |
| PATCH /api/v1/notifications/read-all | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/api/notifications.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:52<br><code>const res = await standard.patch('/api/v1/notifications/read-all');</code> |
| DELETE /api/v1/notifications/templates/:id | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/notifications.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:157<br><code>const del = await admin.delete(`/api/v1/notifications/templates/${id}`);</code> |
| GET /api/v1/notifications/templates/:id | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/notifications.nomock.test.ts:130<br><code>const get = await admin.get(`/api/v1/notifications/templates/${id}`);</code> |
| PATCH /api/v1/notifications/templates/:id | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/api/notifications.test.ts<br>backend/tests/api/assertion-strength.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:141<br><code>.patch(`/api/v1/notifications/templates/${id}`)</code> |
| PUT /api/v1/notifications/templates/:id | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/api/assertion-strength.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:135<br><code>.put(`/api/v1/notifications/templates/${id}`)</code> |
| POST /api/v1/notifications/templates/preview | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/api/notification-inbox.test.ts | backend/tests/integration/notifications.nomock.test.ts:148<br><code>.post('/api/v1/notifications/templates/preview')</code> |
| GET /api/v1/notifications/templates | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/api/notifications.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:86<br><code>const res = await standard.get('/api/v1/notifications/templates');</code> |
| POST /api/v1/notifications/templates | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/notification-inbox.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:97<br><code>const res = await admin.post('/api/v1/notifications/templates').send({});</code> |
| GET /api/v1/notifications/unread-count | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/api/notifications.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:44<br><code>const res = await standard.get('/api/v1/notifications/unread-count');</code> |
| GET /api/v1/notifications | yes | true no-mock HTTP | backend/tests/integration/notifications.nomock.test.ts<br>backend/tests/api/notification-inbox.test.ts<br>backend/tests/api/notifications.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/notifications.nomock.test.ts:27<br><code>const res = await createAgent().get('/api/v1/notifications');</code> |
| DELETE /api/v1/test-center/equipment/:id | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:394<br><code>const res = await agent.delete('/api/v1/test-center/equipment/e1');</code> |
| GET /api/v1/test-center/equipment/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:167<br><code>const equipGet = await proctor.get(`/api/v1/test-center/equipment/${equipId}`);</code> |
| PATCH /api/v1/test-center/equipment/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:180<br><code>.patch(`/api/v1/test-center/equipment/${equipId}`)</code> |
| PUT /api/v1/test-center/equipment/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:173<br><code>.put(`/api/v1/test-center/equipment/${equipId}`)</code> |
| GET /api/v1/test-center/equipment | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts | backend/tests/integration/test-center.nomock.test.ts:330<br><code>const res = await proctor.get('/api/v1/test-center/equipment');</code> |
| POST /api/v1/test-center/equipment | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts | backend/tests/integration/test-center.nomock.test.ts:161<br><code>.post('/api/v1/test-center/equipment')</code> |
| DELETE /api/v1/test-center/rooms/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:248<br><code>const delRoom = await admin.delete(`/api/v1/test-center/rooms/${roomId}`);</code> |
| GET /api/v1/test-center/rooms/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:90<br><code>const roomGet = await proctor.get(`/api/v1/test-center/rooms/${roomId}`);</code> |
| PUT /api/v1/test-center/rooms/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:96<br><code>.put(`/api/v1/test-center/rooms/${roomId}`)</code> |
| DELETE /api/v1/test-center/rooms/:roomId/seats/:seatId | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:454<br><code>const res = await agent.delete('/api/v1/test-center/rooms/11111111-1111-1111-1111-111111111111/seats/s1');</code> |
| PATCH /api/v1/test-center/rooms/:roomId/seats/:seatId | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:155<br><code>.patch(`/api/v1/test-center/rooms/${roomId}/seats/${seatId2}`)</code> |
| GET /api/v1/test-center/rooms/:roomId/seats | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:257<br><code>const res = await proctor.get(`/api/v1/test-center/rooms/${roomId}/seats`);</code> |
| POST /api/v1/test-center/rooms/:roomId/seats | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:143<br><code>.post(`/api/v1/test-center/rooms/${roomId}/seats`)</code> |
| GET /api/v1/test-center/rooms | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:308<br><code>const res = await proctor.get('/api/v1/test-center/rooms');</code> |
| POST /api/v1/test-center/rooms | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:83<br><code>.post('/api/v1/test-center/rooms')</code> |
| DELETE /api/v1/test-center/seats/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:236<br><code>const delSeat = await admin.delete(`/api/v1/test-center/seats/${seatId2}`);</code> |
| PATCH /api/v1/test-center/seats/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:130<br><code>.patch(`/api/v1/test-center/seats/${seatId}`)</code> |
| PUT /api/v1/test-center/seats/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:123<br><code>.put(`/api/v1/test-center/seats/${seatId}`)</code> |
| GET /api/v1/test-center/seats | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:319<br><code>const res = await proctor.get('/api/v1/test-center/seats');</code> |
| POST /api/v1/test-center/seats | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:110<br><code>.post('/api/v1/test-center/seats')</code> |
| PATCH /api/v1/test-center/sessions/:id/cancel | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:717<br><code>['PATCH', `/api/v1/test-center/sessions/${BOGUS_UUID}/cancel`],</code> |
| DELETE /api/v1/test-center/sessions/:id/register | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:720<br><code>['DELETE', `/api/v1/test-center/sessions/${BOGUS_UUID}/register`],</code> |
| POST /api/v1/test-center/sessions/:id/register | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:355<br><code>.post(`/api/v1/test-center/sessions/${sessionId}/register`)</code> |
| DELETE /api/v1/test-center/sessions/:id | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:415<br><code>const res = await proctor.delete(`/api/v1/test-center/sessions/${sessionId}`);</code> |
| GET /api/v1/test-center/sessions/:id | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:403<br><code>const res = await agent.get('/api/v1/test-center/sessions/sess1');</code> |
| PATCH /api/v1/test-center/sessions/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/test-center.nomock.test.ts:344<br><code>.patch('/api/v1/test-center/sessions/00000000-0000-0000-0000-000000000000')</code> |
| DELETE /api/v1/test-center/sessions/:sessionId/registrations/:registrationId | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:721<br><code>['DELETE', `/api/v1/test-center/sessions/${BOGUS_UUID}/registrations/${BOGUS_UUID}`],</code> |
| GET /api/v1/test-center/sessions | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/test-center.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/boundary.nomock.test.ts:54<br><code>const res = await admin.get('/api/v1/test-center/sessions?pageSize=9999');</code> |
| POST /api/v1/test-center/sessions | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center.test.ts | backend/tests/integration/test-center.nomock.test.ts:274<br><code>const res = await proctor.post('/api/v1/test-center/sessions').send({});</code> |
| DELETE /api/v1/test-center/sites/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:257<br><code>const delSite = await admin.delete(`/api/v1/test-center/sites/${siteId}`);</code> |
| GET /api/v1/test-center/sites/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:63<br><code>const siteGet = await proctor.get(`/api/v1/test-center/sites/${siteId}`);</code> |
| PATCH /api/v1/test-center/sites/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/assertion-strength.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:76<br><code>.patch(`/api/v1/test-center/sites/${siteId}`)</code> |
| PUT /api/v1/test-center/sites/:id | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/assertion-strength.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:69<br><code>.put(`/api/v1/test-center/sites/${siteId}`)</code> |
| DELETE /api/v1/test-center/sites/:siteId/rooms/:roomId | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:725<br><code>['DELETE', `/api/v1/test-center/sites/${BOGUS_UUID}/rooms/${BOGUS_UUID}`],</code> |
| PATCH /api/v1/test-center/sites/:siteId/rooms/:roomId | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:103<br><code>.patch(`/api/v1/test-center/sites/${siteId}/rooms/${roomId}`)</code> |
| GET /api/v1/test-center/sites/:siteId/rooms | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:227<br><code>const res = await proctor.get(`/api/v1/test-center/sites/${siteId}/rooms`);</code> |
| POST /api/v1/test-center/sites/:siteId/rooms | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:240<br><code>.post(`/api/v1/test-center/sites/${siteId}/rooms`)</code> |
| GET /api/v1/test-center/sites | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:29<br><code>const res = await createAgent().get('/api/v1/test-center/sites');</code> |
| POST /api/v1/test-center/sites | yes | true no-mock HTTP | backend/tests/integration/test-center.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center-sites.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/test-center.nomock.test.ts:41<br><code>.post('/api/v1/test-center/sites')</code> |
| GET /api/v1/test-center/utilization/rooms/:roomId | yes | true no-mock HTTP | backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/test-center.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts | backend/tests/integration/gap-closure.nomock.test.ts:727<br><code>['GET', `/api/v1/test-center/utilization/rooms/${BOGUS_UUID}`],</code> |
| GET /api/v1/test-center/utilization/sites/:siteId | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:487<br><code>const res = await agent.get('/api/v1/test-center/utilization/sites/site1');</code> |
| GET /api/v1/test-center/utilization | yes | HTTP with mocking | backend/tests/api/gap-coverage.test.ts | backend/tests/api/gap-coverage.test.ts:463<br><code>const res = await agent.get('/api/v1/test-center/utilization?roomId=rm1');</code> |
| PATCH /api/v1/users/:id/deactivate | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/users.nomock.test.ts<br>backend/tests/api/users.test.ts<br>backend/tests/api/users-extended.test.ts | backend/tests/integration/boundary.nomock.test.ts:117<br><code>await admin.patch(`/api/v1/users/${uid}/deactivate`);</code> |
| DELETE /api/v1/users/:id/roles/:roleName | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/users.nomock.test.ts<br>backend/tests/api/gap-coverage.test.ts | backend/tests/integration/boundary.nomock.test.ts:109<br><code>const removed = await admin.delete(`/api/v1/users/${uid}/roles/ANALYST`);</code> |
| POST /api/v1/users/:id/roles | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/users.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/users-extended.test.ts | backend/tests/integration/boundary.nomock.test.ts:105<br><code>.post(`/api/v1/users/${uid}/roles`)</code> |
| GET /api/v1/users/:id | yes | true no-mock HTTP | backend/tests/integration/users.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/users.test.ts<br>backend/tests/api/users-extended.test.ts | backend/tests/integration/users.nomock.test.ts:97<br><code>const get = await adminAgent.get(`/api/v1/users/${id}`);</code> |
| PUT /api/v1/users/:id | yes | true no-mock HTTP | backend/tests/integration/users.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/gap-closure-contracts.test.ts<br>backend/tests/api/users-extended.test.ts | backend/tests/integration/users.nomock.test.ts:103<br><code>.put(`/api/v1/users/${id}`)</code> |
| GET /api/v1/users/me/preferences | yes | true no-mock HTTP | backend/tests/integration/users.nomock.test.ts<br>backend/tests/api/user-preferences.test.ts | backend/tests/integration/users.nomock.test.ts:155<br><code>const res = await agentAgent.get('/api/v1/users/me/preferences');</code> |
| PUT /api/v1/users/me/preferences | yes | true no-mock HTTP | backend/tests/integration/users.nomock.test.ts<br>backend/tests/api/user-preferences.test.ts | backend/tests/integration/users.nomock.test.ts:164<br><code>.put('/api/v1/users/me/preferences')</code> |
| GET /api/v1/users | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/users.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/users.test.ts<br>backend/tests/api/users-extended.test.ts<br>backend/tests/api/security-contracts.test.ts | backend/tests/integration/boundary.nomock.test.ts:33<br><code>const res = await admin.get('/api/v1/users?page=9999&pageSize=20');</code> |
| POST /api/v1/users | yes | true no-mock HTTP | backend/tests/integration/boundary.nomock.test.ts<br>backend/tests/integration/users.nomock.test.ts<br>backend/tests/integration/gap-closure.nomock.test.ts<br>backend/tests/api/users.test.ts<br>backend/tests/api/users-extended.test.ts | backend/tests/integration/boundary.nomock.test.ts:93<br><code>const created = await admin.post('/api/v1/users').send({</code> |

## API Test Classification
1. True No-Mock HTTP: 13 files in 'repo/backend/tests/integration/' + 1 file in 'repo/backend/tests/e2e/'.
   - backend/tests/integration/analytics.nomock.test.ts
   - backend/tests/integration/audit.nomock.test.ts
   - backend/tests/integration/auth.nomock.test.ts
   - backend/tests/integration/boundary.nomock.test.ts
   - backend/tests/integration/communities.nomock.test.ts
   - backend/tests/integration/gap-closure.nomock.test.ts
   - backend/tests/integration/health.nomock.test.ts
   - backend/tests/integration/listings.nomock.test.ts
   - backend/tests/integration/messaging.nomock.test.ts
   - backend/tests/integration/metrics.nomock.test.ts
   - backend/tests/integration/notifications.nomock.test.ts
   - backend/tests/integration/test-center.nomock.test.ts
   - backend/tests/integration/users.nomock.test.ts
   - backend/tests/e2e/smoke.e2e.test.ts
2. HTTP with Mocking: 28 files in 'repo/backend/tests/api/' (uses mocked setup from 'backend/tests/api/helpers/setup.ts').
   - backend/tests/api/analytics.test.ts
   - backend/tests/api/assertion-strength.test.ts
   - backend/tests/api/audit.test.ts
   - backend/tests/api/auth.test.ts
   - backend/tests/api/communities.test.ts
   - backend/tests/api/export-authorization.test.ts
   - backend/tests/api/gap-closure-contracts.test.ts
   - backend/tests/api/gap-coverage.test.ts
   - backend/tests/api/health.test.ts
   - backend/tests/api/listings.test.ts
   - backend/tests/api/messaging-extended.test.ts
   - backend/tests/api/messaging.test.ts
   - backend/tests/api/metrics-versions.test.ts
   - backend/tests/api/metrics.test.ts
   - backend/tests/api/notification-inbox.test.ts
   - backend/tests/api/notifications.test.ts
   - backend/tests/api/operational-analytics.test.ts
   - backend/tests/api/privilege-freshness.test.ts
   - backend/tests/api/report-definitions.test.ts
   - backend/tests/api/role-docs-drift.test.ts
   - backend/tests/api/saved-views.test.ts
   - backend/tests/api/schedule-executions.test.ts
   - backend/tests/api/security-contracts.test.ts
   - backend/tests/api/test-center-sites.test.ts
   - backend/tests/api/test-center.test.ts
   - backend/tests/api/user-preferences.test.ts
   - backend/tests/api/users-extended.test.ts
   - backend/tests/api/users.test.ts
3. Non-HTTP (unit/integration without HTTP): 47 backend unit files in 'backend/tests/unit/'.
   - backend/tests/unit/allocator.test.ts
   - backend/tests/unit/calculators/price-change-pct.test.ts
   - backend/tests/unit/calculators/supply-demand-ratio.test.ts
   - backend/tests/unit/calculators/unit-rent.test.ts
   - backend/tests/unit/calculators/vacancy-duration.test.ts
   - backend/tests/unit/calculators/volatility.test.ts
   - backend/tests/unit/encryption.test.ts
   - backend/tests/unit/errors.test.ts
   - backend/tests/unit/errors/http-errors.test.ts
   - backend/tests/unit/file-generator.test.ts
   - backend/tests/unit/jobs/report-generation.test.ts
   - backend/tests/unit/metrics/metric-engine.test.ts
   - backend/tests/unit/middleware/auth.test.ts
   - backend/tests/unit/middleware/authorize.test.ts
   - backend/tests/unit/middleware/error-handler.test.ts
   - backend/tests/unit/middleware/rbac.test.ts
   - backend/tests/unit/middleware/validate.test.ts
   - backend/tests/unit/pagination.test.ts
   - backend/tests/unit/quiet-hours.test.ts
   - backend/tests/unit/retry-policy.test.ts
   - backend/tests/unit/scripts/run-tests-shape.test.ts
   - backend/tests/unit/security/password.test.ts
   - backend/tests/unit/services/analytics-reports.test.ts
   - backend/tests/unit/services/analytics-sharing.test.ts
   - backend/tests/unit/services/audit.immutability.test.ts
   - backend/tests/unit/services/audit.service.test.ts
   - backend/tests/unit/services/auth.service.test.ts
   - backend/tests/unit/services/communities.service.test.ts
   - backend/tests/unit/services/inactivity-timeout.test.ts
   - backend/tests/unit/services/listings.service.test.ts
   - backend/tests/unit/services/message-queue.test.ts
   - backend/tests/unit/services/messaging.service.test.ts
   - backend/tests/unit/services/metrics-extended.service.test.ts
   - backend/tests/unit/services/metrics.service.test.ts
   - backend/tests/unit/services/notifications.service.test.ts
   - backend/tests/unit/services/operational-analytics.test.ts
   - backend/tests/unit/services/saved-views.test.ts
   - backend/tests/unit/services/schedule-executions.test.ts
   - backend/tests/unit/services/security-hardening.test.ts
   - backend/tests/unit/services/test-center-extended.service.test.ts
   - backend/tests/unit/services/test-center.service.test.ts
   - backend/tests/unit/services/user-preferences.service.test.ts
   - backend/tests/unit/services/users.service.test.ts
   - backend/tests/unit/utils/date.test.ts
   - backend/tests/unit/utils/pagination.test.ts
   - backend/tests/unit/utils/sanitize.test.ts
   - backend/tests/unit/utils/watermark.test.ts

## Mock Detection
- Mock bootstrap for API suite: `backend/tests/api/helpers/setup.ts`
  - `vi.mock('../../../src/config/database')` (line 96)
  - `vi.mock('../../../src/security/session')` (line 100)
  - `vi.mock('../../../src/modules/*/*.service')` for auth/users/communities/listings/test-center/notifications/metrics/analytics/messaging/audit/user-preferences (lines 307-369).
- Integration no-mock guard: `backend/tests/integration/helpers/setup.ts` explicitly states no `vi.mock` and imports real `createApp` + real Prisma (`lines 4-31, 33-44`).
- Endpoints currently covered only by HTTP-with-mocking (no true no-mock hit):
  - GET /api/v1/analytics/exports/:id/download (evidence: backend/tests/api/gap-coverage.test.ts:554)
  - DELETE /api/v1/analytics/reports/:id/share/:userId (evidence: backend/tests/api/gap-coverage.test.ts:535)
  - GET /api/v1/analytics/reports/:id (evidence: backend/tests/api/gap-coverage.test.ts:517)
  - GET /api/v1/analytics/schedules/:id (evidence: backend/tests/api/gap-coverage.test.ts:571)
  - DELETE /api/v1/communities/communities/:id (evidence: backend/tests/api/gap-coverage.test.ts:217)
  - GET /api/v1/communities/communities/:id (evidence: backend/tests/api/gap-coverage.test.ts:195)
  - DELETE /api/v1/communities/regions/:id (evidence: backend/tests/api/gap-coverage.test.ts:135)
  - DELETE /api/v1/test-center/equipment/:id (evidence: backend/tests/api/gap-coverage.test.ts:394)
  - DELETE /api/v1/test-center/rooms/:roomId/seats/:seatId (evidence: backend/tests/api/gap-coverage.test.ts:454)
  - GET /api/v1/test-center/sessions/:id (evidence: backend/tests/api/gap-coverage.test.ts:403)
  - GET /api/v1/test-center/utilization/sites/:siteId (evidence: backend/tests/api/gap-coverage.test.ts:487)
  - GET /api/v1/test-center/utilization (evidence: backend/tests/api/gap-coverage.test.ts:463)

## Coverage Summary
- Total endpoints: **150**
- Endpoints with HTTP tests: **150**
- Endpoints with TRUE no-mock tests: **138**
- HTTP coverage: **100%**
- True API coverage: **92%**

## Unit Test Summary
### Backend Unit Tests
- Backend unit test files detected: **47** under 'backend/tests/unit/'.
- Modules covered (evidence examples):
  - middleware: `backend/tests/unit/middleware/auth.test.ts`, `.../rbac.test.ts`, `.../validate.test.ts`, `.../authorize.test.ts`, `.../error-handler.test.ts`
  - services: `backend/tests/unit/services/*.test.ts` including auth/users/listings/communities/metrics/analytics/messaging/notifications/test-center/audit/saved-views/schedule-executions
  - jobs: `backend/tests/unit/jobs/report-generation.test.ts`
  - utils/security/calculators: `backend/tests/unit/utils/*.test.ts`, `backend/tests/unit/security/password.test.ts`, `backend/tests/unit/calculators/*.test.ts`
- Important backend modules not unit-tested (file-level evidence not found in `backend/tests/unit`):
  - controllers (e.g., `backend/src/modules/*/*.controller.ts`)
  - route modules directly (`backend/src/modules/*/*.routes.ts`)
  - repositories (`backend/src/repositories/*.ts`)
  - scheduler orchestration (`backend/src/jobs/scheduler.ts`)

### Frontend Unit Tests
**Frontend unit tests: PRESENT**

- Frontend test files detected: **25** under 'frontend/tests/unit/'.
- Framework/tool evidence:
  - Vitest: `frontend/package.json` (`"test": "vitest run"`)
  - Vue Test Utils: `frontend/package.json` (`@vue/test-utils`) and component mounts in `frontend/tests/unit/components/LoadingSpinner.test.ts`
  - jsdom: `frontend/vitest.config.ts` (`environment: "jsdom"`)
- Frontend components/modules covered (examples):
  - components: DataTable, ConfirmDialog, EmptyState, ErrorState, LoadingSpinner, PageHeader, StatusChip
  - views: LoginView, NotFoundView
  - layouts: AppSidebar, AuthLayout
  - router: routes + guards
  - stores: auth/ui/notifications
  - composables: useAuth/useApiQuery
  - api client/endpoints: auth/users/listings/notifications/analytics/messaging
- Important frontend modules not unit-tested (detected in `frontend/src` but no matching test evidence):
  - major views: `views/dashboard/DashboardView.vue`, `views/listings/ListingsView.vue`, `views/analytics/AnalyticsView.vue`, `views/notifications/NotificationsView.vue`, `views/users/UserManagementView.vue`, `views/settings/SettingsView.vue`, most `views/test-center/*`
  - layout: `layouts/AppTopbar.vue`
  - composables: `usePagination.ts`, `useToast.ts`
  - API endpoints without direct unit tests: `api/endpoints/audit.api.ts`, `metrics.api.ts`, `communities.api.ts`, `test-center.api.ts` (only export-shape checked in aggregate endpoint tests)

### Cross-Layer Observation
- Testing is comparatively balanced: strong backend API coverage plus present frontend unit tests.
- Remaining imbalance: many frontend feature views are untested relative to backend route surface area.

## API Observability Check
- Strong: most tests state explicit method+path and send visible inputs with response envelope assertions (e.g., `backend/tests/integration/users.nomock.test.ts`, `backend/tests/integration/analytics.nomock.test.ts`).
- Weak areas flagged:
  - broad status acceptance masks behavior: `backend/tests/integration/gap-closure.nomock.test.ts:184` allows `[404,409,422,500]`.
  - role drift tests are gate-only (`not 403`) and do not validate response body semantics: `backend/tests/api/role-docs-drift.test.ts` (allowed-role cases).
  - some assertions are minimal (`toBeTruthy` / presence-only) rather than domain-field checks.

## Test Quality & Sufficiency
- Success paths: present across auth/users/listings/metrics/test-center/notifications/messaging/analytics in no-mock integration suites.
- Failure paths: strong auth/RBAC/validation checks present in both mocked and no-mock suites.
- Edge cases: present for compat aliases, role drift, session freshness, and payload validation.
- Integration boundaries: explicitly covered by no-mock integration setup (`backend/tests/integration/helpers/setup.ts`) and FE↔BE smoke (`backend/tests/e2e/smoke.e2e.test.ts`).
- Over-mocking risk: contained but real in API suite because all services + DB are mocked in `backend/tests/api/helpers/setup.ts`.
- `run_tests.sh` check: Docker-based execution only; no local package-manager install dependency required.

## End-to-End Expectations
- Fullstack expectation (real FE↔BE) is met by `backend/tests/e2e/smoke.e2e.test.ts` and documented in `run_tests.sh` (`e2e` stage).
- E2E depth is smoke-level only (single workflow), not full regression depth.

## Tests Check
- `run_tests.sh`: PASS for Docker-contained policy (static check only).
- True no-mock HTTP layer exists and is isolated from mocked API layer: PASS.
- Endpoint inventory fully mapped to tests: PASS.

## Test Coverage Score (0–100)
- **90/100**

## Score Rationale
- + High endpoint coverage (100% HTTP; 92% true no-mock).
- + Broad backend + frontend unit test presence and Dockerized test workflow.
- - 12 endpoints rely only on mocked HTTP coverage (no true no-mock evidence).
- - Several API tests remain assertion-light or status-only.
- - Frontend unit depth is uneven (many core views untested).

## Key Gaps
1. 12 backend endpoints are only covered in mocked HTTP tests (listed above under Mock Detection).
2. Backend unit coverage omits controller and repository layers.
3. Frontend view-layer test coverage is sparse outside login/not-found and a few layout/shared components.
4. Some integration assertions permit overly broad status bands, weakening defect detection precision.

## Confidence & Assumptions
- Confidence: high for endpoint inventory and test classification; medium for per-test semantic depth due static-only review.
- Assumption: route definitions use string-literal paths in inspected route files and no hidden dynamic runtime registration outside inspected files.
- Assumption: `tests/api/helpers/setup.ts` is imported by backend API tests in `backend/tests/api/` (confirmed by static imports).

---

# README Audit

## README Location Check
- Required file `repo/README.md`: **FOUND**.

## Hard Gate Validation
- Formatting/readability: PASS (structured headings, tables, command blocks).
- Startup instructions (backend/fullstack require `docker-compose up`): PASS (`repo/README.md` Quick Start block includes exact command).
- Access method (URL + port): PASS (`http://localhost:8080`, `http://localhost:3000`, MySQL host port `3307`).
- Verification method: PASS (`curl` health/login/authenticated request examples).
- Environment rules (no runtime installs/manual DB setup): PASS (test and startup flows Docker-contained; no `npm install`/`pip install`/`apt-get` steps).
- Demo credentials (auth detected): PASS (username+password for all roles listed).

## Engineering Quality Review
- Tech stack clarity: strong (explicit FE/BE/DB/auth/testing stack table).
- Architecture explanation: strong (network diagram + startup flow + module map).
- Testing instructions: strong (suite matrix and Docker-only execution model).
- Security/roles: strong (security control table + role-based credentials).
- Workflow/presentation: strong; includes troubleshooting and environment variable guidance.

## High Priority Issues
- None.

## Medium Priority Issues
- No explicit warning that local `.env` secret generation commands (`openssl`) require host tooling; this is operationally minor but can confuse strictly container-only environments.
- API reference is extensive but may drift from source over time; no automated doc-sync mechanism is documented.

## Low Priority Issues
- README references additional reports (`self_test_report.md`, `.tmp/remediation_implementation_report.md`) without quick summaries inline.
- Some compat-route details are dense and may reduce scanability for new contributors.

## Hard Gate Failures
- None.

## README Verdict
- **PASS**

## Final Verdicts
- Test Coverage Audit Verdict: **PASS WITH GAPS** (high coverage; 12 mocked-only endpoints; uneven frontend and controller/repository unit depth).
- README Audit Verdict: **PASS** (all hard gates satisfied).
