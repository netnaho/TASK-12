# Test Coverage Audit

## Scope and Method
- Audit mode: **STATIC INSPECTION ONLY**.
- No code/test execution, no builds, no package-manager usage.
- Inspected only: backend route declarations + API/integration/e2e/unit tests + frontend unit tests + `repo/README.md` + `repo/run_tests.sh`.

## Project Type Detection
- README top declaration: `Project Type: fullstack` (`repo/README.md:1`).
- Effective type used for audit: **fullstack**.

## Backend Endpoint Inventory
- Route mounting (prefix resolution evidence): `repo/backend/src/app.ts`.
- Route declaration sources:
  - `repo/backend/src/modules/health/health.router.ts`
  - `repo/backend/src/modules/auth/auth.routes.ts`
  - `repo/backend/src/modules/users/users.routes.ts`
  - `repo/backend/src/modules/communities/communities.routes.ts`
  - `repo/backend/src/modules/listings/listings.routes.ts`
  - `repo/backend/src/modules/metrics/metrics.routes.ts`
  - `repo/backend/src/modules/test-center/test-center.routes.ts`
  - `repo/backend/src/modules/notifications/notifications.routes.ts`
  - `repo/backend/src/modules/messaging/messaging.routes.ts`
  - `repo/backend/src/modules/analytics/analytics.routes.ts`
  - `repo/backend/src/modules/audit/audit.routes.ts`
- Total unique resolved endpoints (`METHOD + PATH`): **150**.

## API Test Mapping Table
| Endpoint | Covered | Test Type | Test Files | Evidence |
|---|---|---|---|---|
| `GET /api/health` | yes | true no-mock HTTP + HTTP with mocking | tests/api/health.test.ts<br>tests/integration/health.nomock.test.ts | tests/api/health.test.ts -> .get('/api/health')<br>tests/integration/health.nomock.test.ts -> .get('/api/health') |
| `GET /api/health/live` | yes | true no-mock HTTP + HTTP with mocking | tests/api/security-contracts.test.ts<br>tests/integration/health.nomock.test.ts | tests/api/security-contracts.test.ts -> .get('/api/health/live')<br>tests/integration/health.nomock.test.ts -> .get('/api/health/live') |
| `GET /api/health/ready` | yes | true no-mock HTTP + HTTP with mocking | tests/api/gap-coverage.test.ts<br>tests/integration/health.nomock.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/health/ready')<br>tests/integration/health.nomock.test.ts -> .get('/api/health/ready') |
| `POST /api/v1/auth/login` | yes | true no-mock HTTP + HTTP with mocking | tests/api/assertion-strength.test.ts<br>tests/api/auth.test.ts<br>tests/integration/auth.nomock.test.ts | tests/api/assertion-strength.test.ts -> .post('/api/v1/auth/login')<br>tests/api/auth.test.ts -> .post('/api/v1/auth/login') |
| `GET /api/v1/auth/me` | yes | true no-mock HTTP + HTTP with mocking | tests/api/assertion-strength.test.ts<br>tests/api/auth.test.ts<br>tests/integration/auth.nomock.test.ts<br>tests/integration/boundary.nomock.test.ts<br>tests/integration/gap-closure.nomock.test.ts | tests/api/assertion-strength.test.ts -> .get('/api/v1/auth/me')<br>tests/api/auth.test.ts -> .get('/api/v1/auth/me') |
| `POST /api/v1/auth/logout` | yes | true no-mock HTTP + HTTP with mocking | tests/api/auth.test.ts<br>tests/integration/auth.nomock.test.ts<br>tests/integration/boundary.nomock.test.ts | tests/api/auth.test.ts -> .post('/api/v1/auth/logout')<br>tests/integration/auth.nomock.test.ts -> .post('/api/v1/auth/logout') |
| `POST /api/v1/auth/touch` | yes | true no-mock HTTP + HTTP with mocking | tests/api/gap-coverage.test.ts<br>tests/integration/auth.nomock.test.ts<br>tests/integration/boundary.nomock.test.ts | tests/api/gap-coverage.test.ts -> .post('/api/v1/auth/touch')<br>tests/integration/auth.nomock.test.ts -> .post('/api/v1/auth/touch') |
| `GET /api/v1/users/me/preferences` | yes | true no-mock HTTP + HTTP with mocking | tests/api/user-preferences.test.ts<br>tests/integration/users.nomock.test.ts | tests/api/user-preferences.test.ts -> .get('/api/v1/users/me/preferences')<br>tests/integration/users.nomock.test.ts -> .get('/api/v1/users/me/preferences') |
| `PUT /api/v1/users/me/preferences` | yes | true no-mock HTTP + HTTP with mocking | tests/api/user-preferences.test.ts<br>tests/integration/users.nomock.test.ts | tests/api/user-preferences.test.ts -> .put('/api/v1/users/me/preferences')<br>tests/integration/users.nomock.test.ts -> .put('/api/v1/users/me/preferences') |
| `GET /api/v1/users` | yes | true no-mock HTTP + HTTP with mocking | tests/api/users-extended.test.ts<br>tests/api/users.test.ts<br>tests/integration/boundary.nomock.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/integration/users.nomock.test.ts | tests/api/users-extended.test.ts -> .get('/api/v1/users')<br>tests/api/users.test.ts -> .get('/api/v1/users') |
| `POST /api/v1/users` | yes | true no-mock HTTP + HTTP with mocking | tests/api/users-extended.test.ts<br>tests/api/users.test.ts<br>tests/integration/boundary.nomock.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/integration/users.nomock.test.ts | tests/api/users-extended.test.ts -> .post('/api/v1/users')<br>tests/api/users.test.ts -> .post('/api/v1/users') |
| `GET /api/v1/users/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/api/users.test.ts<br>tests/integration/users.nomock.test.ts | tests/api/users.test.ts -> .get('/api/v1/users/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff')<br>tests/integration/users.nomock.test.ts -> .get('/api/v1/users/nonexistent-id-zzz') |
| `PUT /api/v1/users/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/gap-closure.nomock.test.ts<br>tests/integration/users.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/gap-closure.nomock.test.ts -> .put('/api/v1/users/any-id')<br>tests/integration/users.nomock.test.ts -> .put('/api/v1/users/any-id') |
| `POST /api/v1/users/:id/roles` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/users.nomock.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/users.nomock.test.ts -> .post('/api/v1/users/any-id/roles')<br>tests/integration/gap-closure.nomock.test.ts -> .post('/api/v1/users/any/roles') |
| `DELETE /api/v1/users/:id/roles/:roleName` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/users.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/users.nomock.test.ts -> .delete('/api/v1/users/any-id/roles/ANALYST')<br>tests/api/gap-coverage.test.ts -> .delete('/api/v1/users/user-123/roles/ANALYST') |
| `PATCH /api/v1/users/:id/deactivate` | yes | true no-mock HTTP + HTTP with mocking | tests/api/users.test.ts<br>tests/integration/users.nomock.test.ts | tests/api/users.test.ts -> .patch('/api/v1/users/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff/deactivate')<br>tests/integration/users.nomock.test.ts -> .patch('/api/v1/users/any-id/deactivate') |
| `GET /api/v1/communities/regions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/communities.test.ts<br>tests/integration/communities.nomock.test.ts | tests/api/communities.test.ts -> .get('/api/v1/communities/regions')<br>tests/integration/communities.nomock.test.ts -> .get('/api/v1/communities/regions') |
| `POST /api/v1/communities/regions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/communities.test.ts<br>tests/integration/communities.nomock.test.ts | tests/api/communities.test.ts -> .post('/api/v1/communities/regions')<br>tests/integration/communities.nomock.test.ts -> .post('/api/v1/communities/regions') |
| `GET /api/v1/communities/regions/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/communities.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/communities.nomock.test.ts -> .get('/api/v1/communities/regions/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-coverage.test.ts -> .get('/api/v1/communities/regions/missing') |
| `PUT /api/v1/communities/regions/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .put('/api/v1/communities/regions/r1') |
| `DELETE /api/v1/communities/regions/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .delete('/api/v1/communities/regions/r1') |
| `GET /api/v1/communities/communities` | yes | true no-mock HTTP + HTTP with mocking | tests/api/gap-coverage.test.ts<br>tests/integration/communities.nomock.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/v1/communities/communities')<br>tests/integration/communities.nomock.test.ts -> .get('/api/v1/communities/communities') |
| `POST /api/v1/communities/communities` | yes | true no-mock HTTP + HTTP with mocking | tests/api/gap-coverage.test.ts<br>tests/integration/communities.nomock.test.ts | tests/api/gap-coverage.test.ts -> .post('/api/v1/communities/communities')<br>tests/integration/communities.nomock.test.ts -> .post('/api/v1/communities/communities') |
| `GET /api/v1/communities/communities/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/v1/communities/communities/c1') |
| `PUT /api/v1/communities/communities/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .put('/api/v1/communities/communities/c1') |
| `DELETE /api/v1/communities/communities/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .delete('/api/v1/communities/communities/c1') |
| `GET /api/v1/communities/properties` | yes | true no-mock HTTP + HTTP with mocking | tests/api/communities.test.ts<br>tests/integration/communities.nomock.test.ts | tests/api/communities.test.ts -> .get('/api/v1/communities/properties')<br>tests/integration/communities.nomock.test.ts -> .get('/api/v1/communities/properties') |
| `POST /api/v1/communities/properties` | yes | true no-mock HTTP + HTTP with mocking | tests/api/communities.test.ts<br>tests/integration/communities.nomock.test.ts | tests/api/communities.test.ts -> .post('/api/v1/communities/properties')<br>tests/integration/communities.nomock.test.ts -> .post('/api/v1/communities/properties') |
| `GET /api/v1/communities/properties/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/communities.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/communities.nomock.test.ts -> .get('/api/v1/communities/properties/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-coverage.test.ts -> .get('/api/v1/communities/properties/p1') |
| `PUT /api/v1/communities/properties/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/communities.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/communities.nomock.test.ts -> .put('/api/v1/communities/properties/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-coverage.test.ts -> .put('/api/v1/communities/properties/p1') |
| `GET /api/v1/listings` | yes | true no-mock HTTP + HTTP with mocking | tests/api/listings.test.ts<br>tests/integration/boundary.nomock.test.ts<br>tests/integration/listings.nomock.test.ts | tests/api/listings.test.ts -> .get('/api/v1/listings')<br>tests/integration/boundary.nomock.test.ts -> .get('/api/v1/listings') |
| `GET /api/v1/listings/stats` | yes | true no-mock HTTP + HTTP with mocking | tests/api/listings.test.ts<br>tests/integration/listings.nomock.test.ts | tests/api/listings.test.ts -> .get('/api/v1/listings/stats')<br>tests/integration/listings.nomock.test.ts -> .get('/api/v1/listings/stats') |
| `POST /api/v1/listings` | yes | true no-mock HTTP + HTTP with mocking | tests/api/listings.test.ts<br>tests/integration/listings.nomock.test.ts | tests/api/listings.test.ts -> .post('/api/v1/listings')<br>tests/integration/listings.nomock.test.ts -> .post('/api/v1/listings') |
| `GET /api/v1/listings/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/listings.nomock.test.ts<br>tests/api/gap-coverage.test.ts<br>tests/api/listings.test.ts | tests/integration/listings.nomock.test.ts -> .get('/api/v1/listings/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-coverage.test.ts -> .get('/api/v1/listings/l1') |
| `PUT /api/v1/listings/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/listings.nomock.test.ts<br>tests/api/assertion-strength.test.ts<br>tests/api/listings.test.ts | tests/integration/listings.nomock.test.ts -> .put('/api/v1/listings/00000000-0000-0000-0000-000000000000')<br>tests/api/assertion-strength.test.ts -> .put('/api/v1/listings/00000000-0000-0000-0000-000000000001') |
| `GET /api/v1/metrics/definitions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/metrics.test.ts<br>tests/api/privilege-freshness.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/integration/metrics.nomock.test.ts | tests/api/metrics.test.ts -> .get('/api/v1/metrics/definitions')<br>tests/api/privilege-freshness.test.ts -> .get('/api/v1/metrics/definitions') |
| `GET /api/v1/metrics/definitions/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/metrics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts<br>tests/integration/gap-closure.nomock.test.ts | tests/integration/metrics.nomock.test.ts -> .get('/api/v1/metrics/definitions/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/metrics/definitions/11111111-1111-1111-1111-111111111111') |
| `POST /api/v1/metrics/definitions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/metrics.test.ts<br>tests/integration/metrics.nomock.test.ts | tests/api/metrics.test.ts -> .post('/api/v1/metrics/definitions')<br>tests/integration/metrics.nomock.test.ts -> .post('/api/v1/metrics/definitions') |
| `POST /api/v1/metrics/definitions/:id/versions` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/metrics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/metrics.nomock.test.ts -> .post('/api/v1/metrics/definitions/00000000-0000-0000-0000-000000000000/versions')<br>tests/api/gap-closure-contracts.test.ts -> .post('/api/v1/metrics/definitions/11111111-1111-1111-1111-111111111111/versions') |
| `GET /api/v1/metrics/values` | yes | true no-mock HTTP + HTTP with mocking | tests/api/metrics.test.ts<br>tests/integration/boundary.nomock.test.ts<br>tests/integration/metrics.nomock.test.ts | tests/api/metrics.test.ts -> .get('/api/v1/metrics/values')<br>tests/integration/boundary.nomock.test.ts -> .get('/api/v1/metrics/values') |
| `POST /api/v1/metrics/recalculate` | yes | true no-mock HTTP + HTTP with mocking | tests/api/assertion-strength.test.ts<br>tests/api/metrics.test.ts<br>tests/api/privilege-freshness.test.ts<br>tests/integration/metrics.nomock.test.ts | tests/api/assertion-strength.test.ts -> .post('/api/v1/metrics/recalculate')<br>tests/api/metrics.test.ts -> .post('/api/v1/metrics/recalculate') |
| `GET /api/v1/metrics/jobs` | yes | true no-mock HTTP + HTTP with mocking | tests/api/metrics-versions.test.ts<br>tests/integration/metrics.nomock.test.ts | tests/api/metrics-versions.test.ts -> .get('/api/v1/metrics/jobs')<br>tests/integration/metrics.nomock.test.ts -> .get('/api/v1/metrics/jobs') |
| `GET /api/v1/test-center/sites` | yes | true no-mock HTTP + HTTP with mocking | tests/api/test-center-sites.test.ts<br>tests/integration/test-center.nomock.test.ts | tests/api/test-center-sites.test.ts -> .get('/api/v1/test-center/sites')<br>tests/integration/test-center.nomock.test.ts -> .get('/api/v1/test-center/sites') |
| `POST /api/v1/test-center/sites` | yes | true no-mock HTTP + HTTP with mocking | tests/api/test-center-sites.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/integration/test-center.nomock.test.ts | tests/api/test-center-sites.test.ts -> .post('/api/v1/test-center/sites')<br>tests/integration/gap-closure.nomock.test.ts -> .post('/api/v1/test-center/sites') |
| `GET /api/v1/test-center/sites/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/test-center/sites/s1') |
| `PUT /api/v1/test-center/sites/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts<br>tests/api/assertion-strength.test.ts | tests/api/gap-closure-contracts.test.ts -> .put('/api/v1/test-center/sites/s1')<br>tests/api/assertion-strength.test.ts -> .put('/api/v1/test-center/sites/site-1') |
| `PATCH /api/v1/test-center/sites/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts<br>tests/api/assertion-strength.test.ts | tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/test-center/sites/s1')<br>tests/api/assertion-strength.test.ts -> .patch('/api/v1/test-center/sites/site-1') |
| `DELETE /api/v1/test-center/sites/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/test-center/sites/s1') |
| `GET /api/v1/test-center/rooms` | yes | HTTP with mocking | tests/api/test-center-sites.test.ts | tests/api/test-center-sites.test.ts -> .get('/api/v1/test-center/rooms') |
| `POST /api/v1/test-center/rooms` | yes | true no-mock HTTP + HTTP with mocking | tests/api/test-center-sites.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/integration/test-center.nomock.test.ts | tests/api/test-center-sites.test.ts -> .post('/api/v1/test-center/rooms')<br>tests/integration/gap-closure.nomock.test.ts -> .post('/api/v1/test-center/rooms') |
| `GET /api/v1/test-center/rooms/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/v1/test-center/rooms/rm1') |
| `PUT /api/v1/test-center/rooms/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .put('/api/v1/test-center/rooms/rm1') |
| `DELETE /api/v1/test-center/rooms/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .delete('/api/v1/test-center/rooms/rm1') |
| `GET /api/v1/test-center/seats` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/v1/test-center/seats') |
| `POST /api/v1/test-center/seats` | yes | true no-mock HTTP + HTTP with mocking | tests/api/gap-coverage.test.ts<br>tests/integration/test-center.nomock.test.ts | tests/api/gap-coverage.test.ts -> .post('/api/v1/test-center/seats')<br>tests/integration/test-center.nomock.test.ts -> .post('/api/v1/test-center/seats') |
| `PUT /api/v1/test-center/seats/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .put('/api/v1/test-center/seats/s1') |
| `PATCH /api/v1/test-center/seats/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .patch('/api/v1/test-center/seats/s1') |
| `DELETE /api/v1/test-center/seats/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/test-center/seats/seat-1') |
| `GET /api/v1/test-center/equipment` | yes | HTTP with mocking | tests/api/test-center-sites.test.ts | tests/api/test-center-sites.test.ts -> .get('/api/v1/test-center/equipment') |
| `POST /api/v1/test-center/equipment` | yes | true no-mock HTTP + HTTP with mocking | tests/api/test-center-sites.test.ts<br>tests/integration/test-center.nomock.test.ts | tests/api/test-center-sites.test.ts -> .post('/api/v1/test-center/equipment')<br>tests/integration/test-center.nomock.test.ts -> .post('/api/v1/test-center/equipment') |
| `GET /api/v1/test-center/equipment/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/v1/test-center/equipment/e1') |
| `PUT /api/v1/test-center/equipment/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .put('/api/v1/test-center/equipment/e1') |
| `PATCH /api/v1/test-center/equipment/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/test-center/equipment/e1') |
| `DELETE /api/v1/test-center/equipment/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .delete('/api/v1/test-center/equipment/e1') |
| `GET /api/v1/test-center/sessions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/test-center.test.ts<br>tests/integration/boundary.nomock.test.ts<br>tests/integration/test-center.nomock.test.ts | tests/api/test-center.test.ts -> .get('/api/v1/test-center/sessions')<br>tests/integration/boundary.nomock.test.ts -> .get('/api/v1/test-center/sessions') |
| `POST /api/v1/test-center/sessions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/test-center.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/integration/test-center.nomock.test.ts | tests/api/test-center.test.ts -> .post('/api/v1/test-center/sessions')<br>tests/integration/gap-closure.nomock.test.ts -> .post('/api/v1/test-center/sessions') |
| `GET /api/v1/test-center/sessions/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/test-center.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/test-center.nomock.test.ts -> .get('/api/v1/test-center/sessions/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-coverage.test.ts -> .get('/api/v1/test-center/sessions/sess1') |
| `PATCH /api/v1/test-center/sessions/:id/cancel` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/test-center/sessions/sess-1/cancel') |
| `PATCH /api/v1/test-center/sessions/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .patch('/api/v1/test-center/sessions/sess1') |
| `DELETE /api/v1/test-center/sessions/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/test-center.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/test-center.nomock.test.ts -> .delete('/api/v1/test-center/sessions/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/test-center/sessions/sess-1') |
| `POST /api/v1/test-center/sessions/:id/register` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .post('/api/v1/test-center/sessions/sess-1/register') |
| `DELETE /api/v1/test-center/sessions/:id/register` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/test-center/sessions/sess-1/register') |
| `DELETE /api/v1/test-center/sessions/:sessionId/registrations/:registrationId` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/test-center/sessions/sess-1/registrations/reg-1') |
| `GET /api/v1/test-center/sites/:siteId/rooms` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/test-center/sites/s1/rooms') |
| `POST /api/v1/test-center/sites/:siteId/rooms` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .post('/api/v1/test-center/sites/s1/rooms') |
| `PATCH /api/v1/test-center/sites/:siteId/rooms/:roomId` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/test-center/sites/s1/rooms/r1') |
| `DELETE /api/v1/test-center/sites/:siteId/rooms/:roomId` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/test-center/sites/s1/rooms/r1') |
| `GET /api/v1/test-center/rooms/:roomId/seats` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/test-center/rooms/r1/seats') |
| `POST /api/v1/test-center/rooms/:roomId/seats` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .post('/api/v1/test-center/rooms/rm1/seats') |
| `PATCH /api/v1/test-center/rooms/:roomId/seats/:seatId` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .patch('/api/v1/test-center/rooms/rm1/seats/s1') |
| `DELETE /api/v1/test-center/rooms/:roomId/seats/:seatId` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .delete('/api/v1/test-center/rooms/rm1/seats/s1') |
| `GET /api/v1/test-center/utilization` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/v1/test-center/utilization') |
| `GET /api/v1/test-center/utilization/rooms/:roomId` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/test-center/utilization/rooms/r1') |
| `GET /api/v1/test-center/utilization/sites/:siteId` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/v1/test-center/utilization/sites/site1') |
| `GET /api/v1/notifications` | yes | true no-mock HTTP + HTTP with mocking | tests/api/notification-inbox.test.ts<br>tests/api/notifications.test.ts<br>tests/integration/notifications.nomock.test.ts | tests/api/notification-inbox.test.ts -> .get('/api/v1/notifications')<br>tests/api/notifications.test.ts -> .get('/api/v1/notifications') |
| `GET /api/v1/notifications/unread-count` | yes | true no-mock HTTP + HTTP with mocking | tests/api/notifications.test.ts<br>tests/integration/notifications.nomock.test.ts | tests/api/notifications.test.ts -> .get('/api/v1/notifications/unread-count')<br>tests/integration/notifications.nomock.test.ts -> .get('/api/v1/notifications/unread-count') |
| `PATCH /api/v1/notifications/read-all` | yes | true no-mock HTTP + HTTP with mocking | tests/api/notifications.test.ts<br>tests/integration/notifications.nomock.test.ts | tests/api/notifications.test.ts -> .patch('/api/v1/notifications/read-all')<br>tests/integration/notifications.nomock.test.ts -> .patch('/api/v1/notifications/read-all') |
| `PATCH /api/v1/notifications/:id/read` | yes | true no-mock HTTP | tests/integration/notifications.nomock.test.ts | tests/integration/notifications.nomock.test.ts -> .patch('/api/v1/notifications/missing-zzz/read') |
| `PATCH /api/v1/notifications/:id/snooze` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/notifications.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/notifications.nomock.test.ts -> .patch('/api/v1/notifications/missing-zzz/snooze')<br>tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/notifications/n1/snooze') |
| `PATCH /api/v1/notifications/:id/dismiss` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/notifications.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/notifications.nomock.test.ts -> .patch('/api/v1/notifications/missing-zzz/dismiss')<br>tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/notifications/n1/dismiss') |
| `GET /api/v1/notifications/templates` | yes | true no-mock HTTP + HTTP with mocking | tests/api/notifications.test.ts<br>tests/integration/notifications.nomock.test.ts | tests/api/notifications.test.ts -> .get('/api/v1/notifications/templates')<br>tests/integration/notifications.nomock.test.ts -> .get('/api/v1/notifications/templates') |
| `POST /api/v1/notifications/templates` | yes | true no-mock HTTP + HTTP with mocking | tests/api/notification-inbox.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/integration/notifications.nomock.test.ts | tests/api/notification-inbox.test.ts -> .post('/api/v1/notifications/templates')<br>tests/integration/gap-closure.nomock.test.ts -> .post('/api/v1/notifications/templates') |
| `GET /api/v1/notifications/templates/:id` | yes | HTTP with mocking | tests/api/gap-coverage.test.ts | tests/api/gap-coverage.test.ts -> .get('/api/v1/notifications/templates/t1') |
| `PUT /api/v1/notifications/templates/:id` | yes | HTTP with mocking | tests/api/security-contracts.test.ts<br>tests/api/assertion-strength.test.ts | tests/api/security-contracts.test.ts -> .put('/api/v1/notifications/templates/some-id')<br>tests/api/assertion-strength.test.ts -> .put('/api/v1/notifications/templates/t-1') |
| `PATCH /api/v1/notifications/templates/:id` | yes | HTTP with mocking | tests/api/security-contracts.test.ts<br>tests/api/assertion-strength.test.ts | tests/api/security-contracts.test.ts -> .patch('/api/v1/notifications/templates/some-id')<br>tests/api/assertion-strength.test.ts -> .patch('/api/v1/notifications/templates/t-1') |
| `DELETE /api/v1/notifications/templates/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/notifications/templates/t1') |
| `POST /api/v1/notifications/templates/preview` | yes | true no-mock HTTP + HTTP with mocking | tests/api/notification-inbox.test.ts<br>tests/integration/notifications.nomock.test.ts | tests/api/notification-inbox.test.ts -> .post('/api/v1/notifications/templates/preview')<br>tests/integration/notifications.nomock.test.ts -> .post('/api/v1/notifications/templates/preview') |
| `POST /api/v1/messaging/enqueue` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/gap-closure.nomock.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging.test.ts -> .post('/api/v1/messaging/enqueue')<br>tests/api/security-contracts.test.ts -> .post('/api/v1/messaging/enqueue') |
| `GET /api/v1/messaging` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging-extended.test.ts<br>tests/api/messaging.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging-extended.test.ts -> .get('/api/v1/messaging')<br>tests/api/messaging.test.ts -> .get('/api/v1/messaging') |
| `GET /api/v1/messaging/failures` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging-extended.test.ts<br>tests/api/messaging.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging-extended.test.ts -> .get('/api/v1/messaging/failures')<br>tests/api/messaging.test.ts -> .get('/api/v1/messaging/failures') |
| `POST /api/v1/messaging/blacklist` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging-extended.test.ts<br>tests/api/messaging.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging-extended.test.ts -> .post('/api/v1/messaging/blacklist')<br>tests/api/messaging.test.ts -> .post('/api/v1/messaging/blacklist') |
| `GET /api/v1/messaging/blacklist` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging-extended.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging-extended.test.ts -> .get('/api/v1/messaging/blacklist')<br>tests/integration/messaging.nomock.test.ts -> .get('/api/v1/messaging/blacklist') |
| `DELETE /api/v1/messaging/blacklist/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/messaging.nomock.test.ts<br>tests/api/security-contracts.test.ts | tests/integration/messaging.nomock.test.ts -> .delete('/api/v1/messaging/blacklist/00000000-0000-0000-0000-000000000000')<br>tests/api/security-contracts.test.ts -> .delete('/api/v1/messaging/blacklist/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee') |
| `GET /api/v1/messaging/quiet-hours` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging-extended.test.ts<br>tests/api/messaging.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging-extended.test.ts -> .get('/api/v1/messaging/quiet-hours')<br>tests/api/messaging.test.ts -> .get('/api/v1/messaging/quiet-hours') |
| `PUT /api/v1/messaging/quiet-hours` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging-extended.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging-extended.test.ts -> .put('/api/v1/messaging/quiet-hours')<br>tests/integration/messaging.nomock.test.ts -> .put('/api/v1/messaging/quiet-hours') |
| `POST /api/v1/messaging/messages` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging.test.ts -> .post('/api/v1/messaging/messages')<br>tests/api/security-contracts.test.ts -> .post('/api/v1/messaging/messages') |
| `GET /api/v1/messaging/messages` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/messaging.nomock.test.ts | tests/api/messaging.test.ts -> .get('/api/v1/messaging/messages')<br>tests/api/security-contracts.test.ts -> .get('/api/v1/messaging/messages') |
| `GET /api/v1/messaging/messages/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/messaging/messages/m1') |
| `PATCH /api/v1/messaging/messages/:id/delivery` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/messaging/messages/m1/delivery') |
| `GET /api/v1/messaging/:id/package` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/messaging/m1/package') |
| `GET /api/v1/messaging/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/api/messaging-extended.test.ts<br>tests/integration/messaging.nomock.test.ts<br>tests/api/messaging.test.ts<br>tests/api/security-contracts.test.ts | tests/api/messaging-extended.test.ts -> .get('/api/v1/messaging/blacklist')<br>tests/integration/messaging.nomock.test.ts -> .get('/api/v1/messaging/blacklist') |
| `PATCH /api/v1/messaging/:id/delivery` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/messaging/m1/delivery') |
| `GET /api/v1/analytics/definitions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/report-definitions.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/report-definitions.test.ts -> .get('/api/v1/analytics/definitions')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/definitions') |
| `POST /api/v1/analytics/definitions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/report-definitions.test.ts<br>tests/integration/analytics.nomock.test.ts<br>tests/integration/gap-closure.nomock.test.ts | tests/api/report-definitions.test.ts -> .post('/api/v1/analytics/definitions')<br>tests/integration/analytics.nomock.test.ts -> .post('/api/v1/analytics/definitions') |
| `GET /api/v1/analytics/definitions/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/api/gap-closure-contracts.test.ts<br>tests/integration/gap-closure.nomock.test.ts | tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/analytics/definitions/11111111-1111-1111-1111-111111111111')<br>tests/integration/gap-closure.nomock.test.ts -> .get('/api/v1/analytics/definitions/not-a-uuid') |
| `PUT /api/v1/analytics/definitions/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .put('/api/v1/analytics/definitions/11111111-1111-1111-1111-111111111111') |
| `PATCH /api/v1/analytics/definitions/:id` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/analytics/definitions/11111111-1111-1111-1111-111111111111') |
| `POST /api/v1/analytics/reports/generate` | yes | true no-mock HTTP + HTTP with mocking | tests/api/analytics.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/analytics.test.ts -> .post('/api/v1/analytics/reports/generate')<br>tests/api/security-contracts.test.ts -> .post('/api/v1/analytics/reports/generate') |
| `POST /api/v1/analytics/reports` | yes | true no-mock HTTP + HTTP with mocking | tests/api/analytics.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/analytics.test.ts -> .post('/api/v1/analytics/reports')<br>tests/api/security-contracts.test.ts -> .post('/api/v1/analytics/reports') |
| `GET /api/v1/analytics/reports` | yes | true no-mock HTTP + HTTP with mocking | tests/api/analytics.test.ts<br>tests/api/export-authorization.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/analytics.test.ts -> .get('/api/v1/analytics/reports')<br>tests/api/export-authorization.test.ts -> .get('/api/v1/analytics/reports') |
| `GET /api/v1/analytics/reports/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-coverage.test.ts -> .get('/api/v1/analytics/reports/missing') |
| `POST /api/v1/analytics/reports/:id/share` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/analytics.test.ts | tests/integration/analytics.nomock.test.ts -> .post('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/share')<br>tests/api/analytics.test.ts -> .post('/api/v1/analytics/reports/not-a-uuid/share') |
| `DELETE /api/v1/analytics/reports/:id/share/:userId` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/analytics.nomock.test.ts -> .delete('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/share/11111111-1111-1111-1111-111111111111')<br>tests/api/gap-coverage.test.ts -> .delete('/api/v1/analytics/reports/rep1/share/user-123') |
| `GET /api/v1/analytics/reports/:id/shares` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/shares')<br>tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111/shares') |
| `POST /api/v1/analytics/reports/:id/shares` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .post('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111/shares') |
| `DELETE /api/v1/analytics/reports/:id/shares/:shareId` | yes | HTTP with mocking | tests/api/gap-closure-contracts.test.ts | tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111/shares/22222222-2222-2222-2222-222222222222') |
| `POST /api/v1/analytics/reports/:id/export` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/export-authorization.test.ts | tests/integration/analytics.nomock.test.ts -> .post('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/export')<br>tests/api/export-authorization.test.ts -> .post('/api/v1/analytics/reports/not-a-uuid/export') |
| `GET /api/v1/analytics/exports/:id/download` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/exports/00000000-0000-0000-0000-000000000000/download')<br>tests/api/gap-coverage.test.ts -> .get('/api/v1/analytics/exports/exp1/download') |
| `POST /api/v1/analytics/pivot` | yes | true no-mock HTTP + HTTP with mocking | tests/api/analytics.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/analytics.test.ts -> .post('/api/v1/analytics/pivot')<br>tests/integration/analytics.nomock.test.ts -> .post('/api/v1/analytics/pivot') |
| `GET /api/v1/analytics/operational/participation` | yes | true no-mock HTTP + HTTP with mocking | tests/api/operational-analytics.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/operational-analytics.test.ts -> .get('/api/v1/analytics/operational/participation')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/operational/participation') |
| `GET /api/v1/analytics/operational/attendance` | yes | true no-mock HTTP + HTTP with mocking | tests/api/operational-analytics.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/operational-analytics.test.ts -> .get('/api/v1/analytics/operational/attendance')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/operational/attendance') |
| `GET /api/v1/analytics/operational/hour-distribution` | yes | true no-mock HTTP + HTTP with mocking | tests/api/operational-analytics.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/operational-analytics.test.ts -> .get('/api/v1/analytics/operational/hour-distribution')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/operational/hour-distribution') |
| `GET /api/v1/analytics/operational/retention` | yes | true no-mock HTTP + HTTP with mocking | tests/api/operational-analytics.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/operational-analytics.test.ts -> .get('/api/v1/analytics/operational/retention')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/operational/retention') |
| `GET /api/v1/analytics/operational/staffing-gaps` | yes | true no-mock HTTP + HTTP with mocking | tests/api/operational-analytics.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/operational-analytics.test.ts -> .get('/api/v1/analytics/operational/staffing-gaps')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/operational/staffing-gaps') |
| `GET /api/v1/analytics/operational/event-popularity` | yes | true no-mock HTTP + HTTP with mocking | tests/api/operational-analytics.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/operational-analytics.test.ts -> .get('/api/v1/analytics/operational/event-popularity')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/operational/event-popularity') |
| `GET /api/v1/analytics/operational/rankings` | yes | true no-mock HTTP + HTTP with mocking | tests/api/operational-analytics.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/operational-analytics.test.ts -> .get('/api/v1/analytics/operational/rankings')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/operational/rankings') |
| `GET /api/v1/analytics/saved-views` | yes | true no-mock HTTP + HTTP with mocking | tests/api/saved-views.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/saved-views.test.ts -> .get('/api/v1/analytics/saved-views')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/saved-views') |
| `POST /api/v1/analytics/saved-views` | yes | true no-mock HTTP + HTTP with mocking | tests/api/saved-views.test.ts<br>tests/integration/analytics.nomock.test.ts<br>tests/integration/gap-closure.nomock.test.ts | tests/api/saved-views.test.ts -> .post('/api/v1/analytics/saved-views')<br>tests/integration/analytics.nomock.test.ts -> .post('/api/v1/analytics/saved-views') |
| `GET /api/v1/analytics/saved-views/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/saved-views/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-closure-contracts.test.ts -> .get('/api/v1/analytics/saved-views/11111111-1111-1111-1111-111111111111') |
| `PUT /api/v1/analytics/saved-views/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/analytics.nomock.test.ts -> .put('/api/v1/analytics/saved-views/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-closure-contracts.test.ts -> .put('/api/v1/analytics/saved-views/11111111-1111-1111-1111-111111111111') |
| `DELETE /api/v1/analytics/saved-views/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/analytics.nomock.test.ts -> .delete('/api/v1/analytics/saved-views/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/analytics/saved-views/11111111-1111-1111-1111-111111111111') |
| `GET /api/v1/analytics/schedule-executions` | yes | true no-mock HTTP + HTTP with mocking | tests/api/schedule-executions.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/schedule-executions.test.ts -> .get('/api/v1/analytics/schedule-executions')<br>tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/schedule-executions') |
| `PATCH /api/v1/analytics/reports/:id/archive` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/analytics.nomock.test.ts -> .patch('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/archive')<br>tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111/archive') |
| `GET /api/v1/analytics/schedules` | yes | true no-mock HTTP + HTTP with mocking | tests/api/analytics.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/analytics.test.ts -> .get('/api/v1/analytics/schedules')<br>tests/api/security-contracts.test.ts -> .get('/api/v1/analytics/schedules') |
| `GET /api/v1/analytics/schedules/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-coverage.test.ts | tests/integration/analytics.nomock.test.ts -> .get('/api/v1/analytics/schedules/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-coverage.test.ts -> .get('/api/v1/analytics/schedules/sch1') |
| `POST /api/v1/analytics/schedules` | yes | true no-mock HTTP + HTTP with mocking | tests/api/analytics.test.ts<br>tests/api/security-contracts.test.ts<br>tests/integration/analytics.nomock.test.ts | tests/api/analytics.test.ts -> .post('/api/v1/analytics/schedules')<br>tests/api/security-contracts.test.ts -> .post('/api/v1/analytics/schedules') |
| `PATCH /api/v1/analytics/schedules/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/analytics.nomock.test.ts -> .patch('/api/v1/analytics/schedules/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-closure-contracts.test.ts -> .patch('/api/v1/analytics/schedules/11111111-1111-1111-1111-111111111111') |
| `DELETE /api/v1/analytics/schedules/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/integration/analytics.nomock.test.ts<br>tests/api/gap-closure-contracts.test.ts | tests/integration/analytics.nomock.test.ts -> .delete('/api/v1/analytics/schedules/00000000-0000-0000-0000-000000000000')<br>tests/api/gap-closure-contracts.test.ts -> .delete('/api/v1/analytics/schedules/11111111-1111-1111-1111-111111111111') |
| `GET /api/v1/audit` | yes | true no-mock HTTP + HTTP with mocking | tests/api/assertion-strength.test.ts<br>tests/api/audit.test.ts<br>tests/integration/audit.nomock.test.ts | tests/api/assertion-strength.test.ts -> .get('/api/v1/audit')<br>tests/api/audit.test.ts -> .get('/api/v1/audit') |
| `GET /api/v1/audit/:id` | yes | true no-mock HTTP + HTTP with mocking | tests/api/audit.test.ts<br>tests/integration/audit.nomock.test.ts | tests/api/audit.test.ts -> .get('/api/v1/audit/nonexistent-id')<br>tests/integration/audit.nomock.test.ts -> .get('/api/v1/audit/unknown-audit-zzz') |
## API Test Classification
1. **True No-Mock HTTP**
- Files: 13 integration files under `repo/backend/tests/integration/*.nomock.test.ts` + `repo/backend/tests/e2e/smoke.e2e.test.ts`.
- Key evidence:
  - `repo/backend/tests/integration/helpers/setup.ts` states no `vi.mock` and imports real `createApp` + real Prisma client.
  - `repo/backend/tests/e2e/smoke.e2e.test.ts` uses real HTTP `fetch` against live frontend/backend URLs.

2. **HTTP with Mocking**
- Files: 28 files under `repo/backend/tests/api/*.test.ts`.
- Key evidence:
  - `repo/backend/tests/api/helpers/setup.ts` contains `vi.mock(...)` for DB/session/logger and service modules.

3. **Non-HTTP (unit/integration without HTTP)**
- Backend unit: 47 files in `repo/backend/tests/unit/**/*.test.ts`.
- Frontend unit: 25 files in `repo/frontend/tests/unit/**/*.test.ts`.

## Mock Detection Rules (Findings)
- Backend API harness mocking:
  - WHAT: Prisma/database client, session builder, logger, and module services (auth/users/communities/listings/test-center/notifications/metrics/analytics/messaging/audit/user-preferences).
  - WHERE: `repo/backend/tests/api/helpers/setup.ts` (`vi.mock(...)` blocks around setup and service registrations).
- Backend unit mocking:
  - WHAT: Prisma/logger/env/encryption/exporters/queue and other dependencies.
  - WHERE: multiple files under `repo/backend/tests/unit/**` (e.g., `services/*.test.ts`, `middleware/*.test.ts`, `retry-policy.test.ts`).
- Frontend unit mocking:
  - WHAT: API endpoint wrappers and API client.
  - WHERE: `repo/frontend/tests/unit/composables/useAuth.test.ts`, `repo/frontend/tests/unit/stores/auth.store.test.ts`, `repo/frontend/tests/unit/stores/notifications.store.test.ts`, `repo/frontend/tests/unit/router/guard.test.ts`, `repo/frontend/tests/unit/api/endpoints.test.ts`, `repo/frontend/tests/unit/api/analytics-api.test.ts`, `repo/frontend/tests/unit/layouts/AppSidebar.test.ts`, `repo/frontend/tests/unit/views/LoginView.test.ts`, `repo/frontend/tests/unit/workflows/login-to-role-gate.test.ts`.

## Coverage Summary
- Total endpoints: **150**
- Endpoints with HTTP tests: **150**
- Endpoints with TRUE no-mock tests: **100**
- HTTP coverage: **100.00%**
- True API coverage: **66.67%**

## Unit Test Analysis
### Backend Unit Tests
- Test files: 47 (`repo/backend/tests/unit/**/*.test.ts`).
- Modules covered:
  - Controllers: indirectly through HTTP/API tests; no dedicated controller-unit suite found.
  - Services: broad direct coverage (`repo/backend/tests/unit/services/*.test.ts`).
  - Repositories: no direct repository-unit suite found (`repo/backend/src/repositories/base.repository.ts` appears untested directly).
  - Auth/guards/middleware: covered (`repo/backend/tests/unit/middleware/auth.test.ts`, `authorize.test.ts`, `rbac.test.ts`, `validate.test.ts`, `error-handler.test.ts`).
- Important backend modules not directly unit-tested:
  - Controller files under `repo/backend/src/modules/*/*.controller.ts`.
  - Repository layer (`repo/backend/src/repositories/base.repository.ts`).

### Frontend Unit Tests (STRICT)
- Frontend test files: **PRESENT** (25 files):
  - API: `repo/frontend/tests/unit/api/{client,endpoints,analytics-api}.test.ts`
  - Components: `repo/frontend/tests/unit/components/{ConfirmDialog,DataTable,EmptyState,ErrorState,LoadingSpinner,PageHeader,StatusChip}.test.ts`
  - Composables: `repo/frontend/tests/unit/composables/{useApiQuery,useAuth}.test.ts`
  - Layouts: `repo/frontend/tests/unit/layouts/{AppSidebar,AuthLayout}.test.ts`
  - Router: `repo/frontend/tests/unit/router/{guard,routes}.test.ts`
  - Stores: `repo/frontend/tests/unit/stores/{auth.store,notifications.store,ui.store}.test.ts`
  - Views: `repo/frontend/tests/unit/views/{LoginView,NotFoundView}.test.ts`
  - Workflow: `repo/frontend/tests/unit/workflows/login-to-role-gate.test.ts`
  - Utils/types: `repo/frontend/tests/unit/utils/{cn,format}.test.ts`, `repo/frontend/tests/unit/types/roles.test.ts`
- Framework/tool evidence:
  - Vitest config: `repo/frontend/vitest.config.ts`
  - Vue Test Utils usage: component tests import `mount` from `@vue/test-utils` (e.g., `StatusChip.test.ts`).
  - jsdom environment: `repo/frontend/vitest.config.ts`.
- Components/modules covered: shared components, auth workflow, router guards/routes, stores, API wrapper modules.
- Important frontend components/modules not tested directly:
  - Most feature views under `repo/frontend/src/views/analytics/**`, `repo/frontend/src/views/test-center/**`, `repo/frontend/src/views/dashboard/**`, `repo/frontend/src/views/listings/**`, `repo/frontend/src/views/users/**`.

**Mandatory Verdict: Frontend unit tests: PRESENT**

### Cross-Layer Observation
- Backend and frontend both have meaningful unit tests.
- Balance improved versus prior backend-heavy state; however, true FE feature-view coverage remains partial.

## API Observability Check
- Endpoint/method visibility: strong (explicit request paths and verbs in API/integration tests).
- Request input visibility: strong (`.send(...)`, query params, and role-based login helpers are explicit).
- Response content visibility: strong (status + body assertions, error code assertions).
- Weaknesses: limited cases still accept broad 2xx ranges for some destructive operations.

## Test Quality & Sufficiency
- Success paths: strong.
- Failure/validation/auth/permission cases: strong across API and integration suites.
- Edge-case coverage: moderate-to-strong.
- Integration boundaries: materially improved (100 no-mock-covered endpoints).
- Over-mocking risk: still present in API suite by design, but partially compensated by no-mock integration coverage.
- `run_tests.sh` check:
  - Docker-based orchestration (`docker compose`/`docker-compose`) with no host dependency installation requirement.
  - Verdict: **OK**.

## End-to-End Expectations
- Fullstack FE↔BE e2e exists: `repo/backend/tests/e2e/smoke.e2e.test.ts`.
- E2E depth is smoke-level, but now supported by full endpoint HTTP coverage and broader no-mock integration coverage.

## Tests Check
- Structural and endpoint-level sufficiency is now high for static criteria.
- **Test Coverage Audit Verdict: PASS (strict mode)**

## Test Coverage Score (0–100)
- **93/100**

## Score Rationale
- + 100% endpoint HTTP coverage (150/150).
- + Substantial true no-mock API coverage (100/150).
- + Broad backend and frontend unit test presence with concrete file-level evidence.
- + Auth/validation/permission assertions are consistently present.
- - Remaining gap: not all endpoints are true no-mock; many still rely on mocked API harness.
- - Feature-view level frontend coverage is not broad across all major screens.

## Key Gaps
- Increase true no-mock coverage for remaining 50 endpoints.
- Add direct tests for high-impact frontend feature views (analytics/test-center/dashboard flows).
- Tighten residual broad `2xx` assertions into exact status/body contract checks where practical.

## Confidence & Assumptions
- Confidence: **high** (route inventory + request-path matching done from current codebase files).
- Assumptions:
  - Coverage mapping uses static method/path matching with normalized parameterized routes.
  - Integration no-mock classification follows explicit setup guarantees in `tests/integration/helpers/setup.ts`.

---

# README Audit

## README Location
- Required file `repo/README.md`: **FOUND**.

## Hard Gates
### Formatting
- PASS: readable markdown with sections/tables/code blocks.

### Startup Instructions (fullstack/backend gate)
- PASS: includes required command `docker-compose up` in Quick Start.

### Access Method
- PASS: explicit URLs/ports for frontend/backend and DB access details.

### Verification Method
- PASS: explicit `curl` verification for health/login/authenticated API call.

### Environment Rules (Docker-contained, no runtime installs/manual DB)
- PASS:
  - Primary startup/testing is Docker-based.
  - README explicitly states Docker-contained tests and no host runtime installs required.
  - No mandatory `npm install` / `pip install` / `apt-get` / manual DB setup in startup path.

### Demo Credentials (conditional auth gate)
- PASS:
  - Auth exists.
  - README provides username + password + all roles.

## Engineering Quality
- Tech stack clarity: strong.
- Architecture explanation: strong.
- Testing instructions: strong.
- Security/roles/workflow explanations: strong.
- Presentation quality: strong.

## High Priority Issues
- None.

## Medium Priority Issues
- API reference documentation is not fully exhaustive for all compatibility/alias endpoints present in route files.

## Low Priority Issues
- Minor portability issue: references to internal report artifacts may be environment-specific.

## Hard Gate Failures
- None.

## README Verdict
- **PASS**

---

## Final Combined Verdicts
- **Test Coverage Audit:** PASS (strict), Score **93/100**
- **README Audit:** PASS
