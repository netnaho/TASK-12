# API Tests

The API (integration) tests for LeaseOps are located in the backend project:

```
backend/tests/api/
```

## Running

From the repository root:

```bash
./run_tests.sh
```

Or run API tests directly:

```bash
cd backend
npx vitest run --dir tests/api --reporter=verbose
```

## What is tested

- Auth: login, logout, session validation
- Users: CRUD, role assignment, deactivation
- Communities: regions, communities, properties CRUD
- Listings: CRUD and stats endpoints
- Test Center: sites, rooms, seats, equipment, sessions, registration, utilization
- Notifications: list, read, snooze, dismiss, templates
- Metrics: definitions, versions, values, recalculation
- Analytics: reports, sharing, exports, pivot queries
- Messaging: enqueue, blacklist, quiet hours, delivery status
- Audit: list/get logs, admin-only access enforcement
- Health: endpoint returns 200
