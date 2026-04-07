# LeaseOps API Specification (Implementation-Based)

## 1) API Overview

- **Backend base URL (local default):** `http://localhost:3000`
- **API prefix:** `/api`
- **Versioned business APIs:** `/api/v1/*`
- **Primary auth model:** session cookie (`leaseops.sid`) issued by login
- **Content-Type:** `application/json` (except file downloads)

This document reflects the current backend implementation under `repo/backend/src/modules/**`.

---

## 2) Authentication & Authorization

### 2.1 Session auth

- Login endpoint creates server-side session and sets cookie `leaseops.sid`.
- Protected endpoints require valid session (via auth middleware).
- Session inactivity policy is enforced server-side.
- `POST /api/v1/auth/touch` is a keep-alive endpoint.

### 2.2 Roles

Role constants:

- `SYSTEM_ADMIN`
- `LEASING_OPS_MANAGER`
- `TEST_PROCTOR`
- `ANALYST`
- `STANDARD_USER`

### 2.3 Auth requirement labels used below

- **Public**: no session required
- **Any Authenticated User**: any valid session
- **Admin**: `SYSTEM_ADMIN`
- **Manager**: `LEASING_OPS_MANAGER`
- **Proctor**: `TEST_PROCTOR`
- **Analyst**: `ANALYST`

---

## 3) Standard Response Format

### 3.1 Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 125,
    "totalPages": 7
  }
}
```

- `meta` appears on paginated list endpoints.

### 3.2 Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": []
  },
  "requestId": "..."
}
```

### 3.3 Common HTTP codes

- `200` OK
- `201` Created
- `204` No Content
- `400` Validation/Bad Request
- `401` Unauthenticated
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `429` Rate Limited
- `500` Internal Error

---

## 4) Health Endpoints

Base: `/api`

| Method | Path            | Auth   | Description                     |
| ------ | --------------- | ------ | ------------------------------- |
| GET    | `/health`       | Public | Full health check (includes DB) |
| GET    | `/health/live`  | Public | Liveness probe                  |
| GET    | `/health/ready` | Public | Readiness probe                 |

---

## 5) Auth APIs

Base: `/api/v1/auth`

| Method | Path      | Auth                   | Description                        |
| ------ | --------- | ---------------------- | ---------------------------------- |
| POST   | `/login`  | Public                 | Login with `username` + `password` |
| GET    | `/me`     | Any Authenticated User | Current user profile               |
| POST   | `/logout` | Any Authenticated User | Logout + session destroy           |
| POST   | `/touch`  | Any Authenticated User | Session keep-alive (`204`)         |

### `POST /login` request

```json
{
  "username": "admin",
  "password": "Password123!"
}
```

---

## 6) Users APIs

Base: `/api/v1/users`

### 6.1 User preferences (self-service)

| Method | Path              | Auth                   | Description                |
| ------ | ----------------- | ---------------------- | -------------------------- |
| GET    | `/me/preferences` | Any Authenticated User | Get delivery preference    |
| PUT    | `/me/preferences` | Any Authenticated User | Update delivery preference |

`PUT /me/preferences` body:

```json
{
  "deliveryMode": "IN_APP_ONLY"
}
```

Allowed `deliveryMode`: `IN_APP_ONLY`, `ALSO_PACKAGE`.

### 6.2 Admin user management

| Method | Path                   | Auth  | Description     |
| ------ | ---------------------- | ----- | --------------- |
| GET    | `/`                    | Admin | List users      |
| POST   | `/`                    | Admin | Create user     |
| GET    | `/:id`                 | Admin | Get user by id  |
| PUT    | `/:id`                 | Admin | Update user     |
| POST   | `/:id/roles`           | Admin | Assign role     |
| DELETE | `/:id/roles/:roleName` | Admin | Remove role     |
| PATCH  | `/:id/deactivate`      | Admin | Deactivate user |

Create user body:

```json
{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "password": "Password123!",
  "displayName": "John Doe",
  "employeeId": "EMP-1001",
  "roleName": "STANDARD_USER"
}
```

---

## 7) Communities & Properties APIs

Base: `/api/v1/communities`

Write roles: **Admin, Manager**

### 7.1 Regions

| Method | Path           | Auth                   |
| ------ | -------------- | ---------------------- |
| GET    | `/regions`     | Any Authenticated User |
| POST   | `/regions`     | Admin, Manager         |
| GET    | `/regions/:id` | Any Authenticated User |
| PUT    | `/regions/:id` | Admin, Manager         |
| DELETE | `/regions/:id` | Admin, Manager         |

### 7.2 Communities

| Method | Path               | Auth                   |
| ------ | ------------------ | ---------------------- |
| GET    | `/communities`     | Any Authenticated User |
| POST   | `/communities`     | Admin, Manager         |
| GET    | `/communities/:id` | Any Authenticated User |
| PUT    | `/communities/:id` | Admin, Manager         |
| DELETE | `/communities/:id` | Admin, Manager         |

### 7.3 Properties

| Method | Path              | Auth                   |
| ------ | ----------------- | ---------------------- |
| GET    | `/properties`     | Any Authenticated User |
| POST   | `/properties`     | Admin, Manager         |
| GET    | `/properties/:id` | Any Authenticated User |
| PUT    | `/properties/:id` | Admin, Manager         |

Create property body includes geo coordinates:

```json
{
  "name": "Riverview Apartments",
  "communityId": "<uuid>",
  "addressLine1": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "postalCode": "78701",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "totalUnits": 120
}
```

---

## 8) Listings APIs

Base: `/api/v1/listings`

Write roles: **Admin, Manager**

| Method | Path     | Auth                   | Description              |
| ------ | -------- | ---------------------- | ------------------------ |
| GET    | `/`      | Any Authenticated User | List listings            |
| GET    | `/stats` | Any Authenticated User | Listing stats/aggregates |
| POST   | `/`      | Admin, Manager         | Create listing           |
| GET    | `/:id`   | Any Authenticated User | Get listing              |
| PUT    | `/:id`   | Admin, Manager         | Update listing           |

Create listing body:

```json
{
  "propertyId": "<uuid>",
  "unitNumber": "B-204",
  "bedrooms": 2,
  "bathrooms": 1.5,
  "sqft": 980,
  "rentPrice": 1895,
  "listedAt": "2026-04-07T10:00:00.000Z"
}
```

---

## 9) Metrics APIs

Base: `/api/v1/metrics`

- Definition write roles: **Admin, Manager**
- Recalc trigger roles: **Admin, Manager** (+ `ANALYST` when feature flag enables it)

| Method | Path                        | Auth                        | Description               |
| ------ | --------------------------- | --------------------------- | ------------------------- |
| GET    | `/definitions`              | Any Authenticated User      | List metric definitions   |
| GET    | `/definitions/:id`          | Any Authenticated User      | Get definition            |
| POST   | `/definitions`              | Admin, Manager              | Create definition         |
| POST   | `/definitions/:id/versions` | Admin, Manager              | Create definition version |
| GET    | `/values`                   | Any Authenticated User      | List metric values        |
| POST   | `/recalculate`              | Admin, Manager, (Analyst\*) | Trigger recalculation     |
| GET    | `/jobs`                     | Any Authenticated User      | List recalculation jobs   |

Metric type enum:

- `UNIT_RENT`
- `PRICE_CHANGE_PCT`
- `VOLATILITY_30D`
- `VACANCY_DAYS_ON_MARKET`
- `LISTING_DURATION_DOM`
- `SUPPLY_DEMAND_RATIO`

Create metric definition body:

```json
{
  "metricType": "UNIT_RENT",
  "name": "Average Unit Rent",
  "description": "Average rent per property"
}
```

Create version body:

```json
{
  "formulaJson": { "type": "avg", "field": "rentPrice" },
  "effectiveFrom": "2026-04-01T00:00:00.000Z"
}
```

---

## 10) Test Center APIs

Base: `/api/v1/test-center`

- Site/room/seat/equipment/session write roles: mostly **Admin, Proctor** (delete varies; see table)
- Registration endpoints: any authenticated user

### 10.1 Sites

| Method | Path         | Auth                   |
| ------ | ------------ | ---------------------- |
| GET    | `/sites`     | Any Authenticated User |
| POST   | `/sites`     | Admin, Proctor         |
| GET    | `/sites/:id` | Any Authenticated User |
| PUT    | `/sites/:id` | Admin, Proctor         |
| PATCH  | `/sites/:id` | Admin, Proctor         |
| DELETE | `/sites/:id` | Admin                  |

### 10.2 Rooms

| Method | Path         | Auth                   |
| ------ | ------------ | ---------------------- |
| GET    | `/rooms`     | Any Authenticated User |
| POST   | `/rooms`     | Admin, Proctor         |
| GET    | `/rooms/:id` | Any Authenticated User |
| PUT    | `/rooms/:id` | Admin, Proctor         |
| DELETE | `/rooms/:id` | Admin                  |

### 10.3 Seats

| Method | Path         | Auth                   |
| ------ | ------------ | ---------------------- |
| GET    | `/seats`     | Any Authenticated User |
| POST   | `/seats`     | Admin, Proctor         |
| PUT    | `/seats/:id` | Admin, Proctor         |
| PATCH  | `/seats/:id` | Admin, Proctor         |
| DELETE | `/seats/:id` | Admin                  |

### 10.4 Equipment

| Method | Path             | Auth                   |
| ------ | ---------------- | ---------------------- |
| GET    | `/equipment`     | Any Authenticated User |
| POST   | `/equipment`     | Admin, Proctor         |
| GET    | `/equipment/:id` | Any Authenticated User |
| PUT    | `/equipment/:id` | Admin, Proctor         |
| PATCH  | `/equipment/:id` | Admin, Proctor         |
| DELETE | `/equipment/:id` | Admin, Proctor         |

### 10.5 Sessions + registration

| Method | Path                                                 | Auth                   | Description                        |
| ------ | ---------------------------------------------------- | ---------------------- | ---------------------------------- |
| GET    | `/sessions`                                          | Any Authenticated User | List sessions                      |
| POST   | `/sessions`                                          | Admin, Proctor         | Create session                     |
| GET    | `/sessions/:id`                                      | Any Authenticated User | Get session                        |
| PATCH  | `/sessions/:id/cancel`                               | Admin, Proctor         | Cancel session                     |
| PATCH  | `/sessions/:id`                                      | Admin, Proctor         | Compatibility cancel route         |
| DELETE | `/sessions/:id`                                      | Admin, Proctor         | Compatibility cancel route         |
| POST   | `/sessions/:id/register`                             | Any Authenticated User | Register user for session          |
| DELETE | `/sessions/:id/register`                             | Any Authenticated User | Cancel own/by-session registration |
| DELETE | `/sessions/:sessionId/registrations/:registrationId` | Any Authenticated User | Compatibility registration cancel  |

### 10.6 Utilization

| Method | Path                         | Auth                   |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/utilization`               | Any Authenticated User |
| GET    | `/utilization/rooms/:roomId` | Any Authenticated User |
| GET    | `/utilization/sites/:siteId` | Any Authenticated User |

### 10.7 Compatibility aliases (nested routes)

Also supported for frontend compatibility:

- `/sites/:siteId/rooms` (GET/POST)
- `/sites/:siteId/rooms/:roomId` (PATCH/DELETE)
- `/rooms/:roomId/seats` (GET/POST)
- `/rooms/:roomId/seats/:seatId` (PATCH/DELETE)

---

## 11) Notifications APIs

Base: `/api/v1/notifications`

### 11.1 User inbox

| Method | Path            | Auth                   |
| ------ | --------------- | ---------------------- |
| GET    | `/`             | Any Authenticated User |
| GET    | `/unread-count` | Any Authenticated User |
| PATCH  | `/read-all`     | Any Authenticated User |
| PATCH  | `/:id/read`     | Any Authenticated User |
| PATCH  | `/:id/snooze`   | Any Authenticated User |
| PATCH  | `/:id/dismiss`  | Any Authenticated User |

Snooze request accepts either key:

```json
{ "snoozedUntil": "2026-04-08T08:30:00.000Z" }
```

or

```json
{ "until": "2026-04-08T08:30:00.000Z" }
```

### 11.2 Templates (admin only)

| Method | Path                 | Auth           |
| ------ | -------------------- | -------------- |
| GET    | `/templates`         | Admin          |
| POST   | `/templates`         | Admin          |
| GET    | `/templates/:id`     | Admin          |
| PUT    | `/templates/:id`     | Admin          |
| PATCH  | `/templates/:id`     | Admin (compat) |
| DELETE | `/templates/:id`     | Admin          |
| POST   | `/templates/preview` | Admin          |

Template channel enum: `EMAIL`, `SMS`, `IN_APP`, `ENTERPRISE_IM`.

---

## 12) Messaging APIs

Base: `/api/v1/messaging`

### 12.1 Message queue

| Method | Path            | Auth                   | Description                                          |
| ------ | --------------- | ---------------------- | ---------------------------------------------------- |
| POST   | `/enqueue`      | Any Authenticated User | Enqueue outbound message                             |
| GET    | `/`             | Any Authenticated User | List messages                                        |
| GET    | `/failures`     | Admin                  | Failure alert feed                                   |
| GET    | `/:id`          | Any Authenticated User | Message status                                       |
| PATCH  | `/:id/delivery` | Any Authenticated User | Mark delivery (`DELIVERED`/`FAILED`/`MANUALLY_SENT`) |
| GET    | `/:id/package`  | Any Authenticated User | Download/generate manual package                     |

### 12.2 Blacklist and quiet hours

| Method | Path             | Auth                   |
| ------ | ---------------- | ---------------------- |
| POST   | `/blacklist`     | Admin                  |
| GET    | `/blacklist`     | Admin                  |
| DELETE | `/blacklist/:id` | Admin                  |
| GET    | `/quiet-hours`   | Any Authenticated User |
| PUT    | `/quiet-hours`   | Admin                  |

### 12.3 Compatibility aliases

Also supported:

- `POST /messages` (same as `/enqueue`)
- `GET /messages`
- `GET /messages/:id`
- `PATCH /messages/:id/delivery`

Enqueue request example:

```json
{
  "templateId": "<uuid>",
  "recipientAddr": "agent@example.com",
  "recipientUserId": "<uuid>",
  "channel": "EMAIL",
  "subject": "Reminder",
  "variables": {
    "firstName": "Nora"
  }
}
```

---

## 13) Analytics APIs

Base: `/api/v1/analytics`

- Analytics roles: **Admin, Manager, Analyst**
- Manager roles: **Admin, Manager**

### 13.1 Report definitions

| Method | Path               | Auth                    |
| ------ | ------------------ | ----------------------- |
| GET    | `/definitions`     | Any Authenticated User  |
| POST   | `/definitions`     | Admin, Manager, Analyst |
| GET    | `/definitions/:id` | Any Authenticated User  |
| PUT    | `/definitions/:id` | Admin, Manager          |
| PATCH  | `/definitions/:id` | Admin, Manager (compat) |

### 13.2 Reports

| Method | Path                   | Auth                    | Description                      |
| ------ | ---------------------- | ----------------------- | -------------------------------- |
| POST   | `/reports/generate`    | Admin, Manager, Analyst | Generate report                  |
| POST   | `/reports`             | Admin, Manager, Analyst | Compatibility alias for generate |
| GET    | `/reports`             | Any Authenticated User  | List reports                     |
| GET    | `/reports/:id`         | Any Authenticated User  | Get report                       |
| PATCH  | `/reports/:id/archive` | Any Authenticated User  | Archive report                   |

### 13.3 Sharing

| Method | Path                         | Auth                   |
| ------ | ---------------------------- | ---------------------- |
| POST   | `/reports/:id/share`         | Admin, Manager         |
| DELETE | `/reports/:id/share/:userId` | Admin, Manager         |
| GET    | `/reports/:id/shares`        | Any Authenticated User |

Compatibility aliases:

- `POST /reports/:id/shares`
- `DELETE /reports/:id/shares/:shareId` (mapped to `userId` internally)

### 13.4 Exports and pivot

| Method | Path                    | Auth                    |
| ------ | ----------------------- | ----------------------- |
| POST   | `/reports/:id/export`   | Admin, Manager, Analyst |
| GET    | `/exports/:id/download` | Any Authenticated User  |
| POST   | `/pivot`                | Admin, Manager, Analyst |

Export body:

```json
{ "format": "PDF" }
```

Allowed `format`: `CSV`, `EXCEL`, `PDF`.

### 13.5 Operational analytics

All endpoints below require Analytics roles (Admin/Manager/Analyst):

- `GET /operational/participation`
- `GET /operational/attendance`
- `GET /operational/hour-distribution`
- `GET /operational/retention`
- `GET /operational/staffing-gaps`
- `GET /operational/event-popularity`
- `GET /operational/rankings`

### 13.6 Saved views

| Method | Path               | Auth                    |
| ------ | ------------------ | ----------------------- |
| GET    | `/saved-views`     | Any Authenticated User  |
| POST   | `/saved-views`     | Admin, Manager, Analyst |
| GET    | `/saved-views/:id` | Any Authenticated User  |
| PUT    | `/saved-views/:id` | Any Authenticated User  |
| DELETE | `/saved-views/:id` | Any Authenticated User  |

### 13.7 Schedule executions

| Method | Path                   | Auth  |
| ------ | ---------------------- | ----- |
| GET    | `/schedule-executions` | Admin |

### 13.8 Schedules compatibility resource

Also supported as compatibility CRUD over report definitions:

- `GET /schedules`
- `GET /schedules/:id`
- `POST /schedules`
- `PATCH /schedules/:id`
- `DELETE /schedules/:id`

---

## 14) Audit APIs

Base: `/api/v1/audit`

All endpoints are **Admin only**.

| Method | Path   | Auth  |
| ------ | ------ | ----- |
| GET    | `/`    | Admin |
| GET    | `/:id` | Admin |

List query supports filtering by page/pageSize, action, entityType/entityId, actorId, date range.

---

## 15) Query Parameters & Validation Notes

Common list/query behavior across modules:

- `page` / `pageSize` (with max pageSize generally `100`)
- UUID fields validated as UUID where applicable
- Datetime inputs validated as ISO-8601 datetime strings for most modules

Representative enums used in query/body contracts:

- report frequency: `DAILY`, `WEEKLY`, `MONTHLY`, `ON_DEMAND`
- report status: `DRAFT`, `GENERATING`, `PUBLISHED`, `FAILED`, `ARCHIVED`
- export status: `PENDING`, `GENERATING`, `READY`, `FAILED`
- message delivery updates accepted by API: `DELIVERED`, `FAILED`, `MANUALLY_SENT`
- notification template channels: `EMAIL`, `SMS`, `IN_APP`, `ENTERPRISE_IM`

---

## 16) Retry, Scheduling, and Operational Timing (API-adjacent)

Implemented scheduler timings:

- Metric recalculation nightly: `0 2 * * *`
- Report generation daily: `0 6 * * *`
- Report generation weekly: `0 7 * * 1`
- Report generation monthly: `0 8 1 * *`
- Session cleanup: `*/15 * * * *`
- Message retry processor: `*/5 * * * *`

Message retry intervals (queue policy):

- Retry 1: +5 min
- Retry 2: +15 min
- Retry 3: +60 min

---

## 17) Notes for API Consumers

1. Prefer canonical endpoints in each module section; compatibility aliases remain for frontend backward compatibility.
2. Use session cookie auth; do not send bearer tokens (not implemented).
3. For paginated endpoints, always check `meta` in response.
4. For exported files and message packages, handle binary download response types.

---

## 18) Traceability (source files)

This spec is derived from:

- `backend/src/app.ts`
- `backend/src/modules/health/health.router.ts`
- `backend/src/modules/auth/auth.routes.ts`
- `backend/src/modules/users/users.routes.ts`
- `backend/src/modules/communities/communities.routes.ts`
- `backend/src/modules/listings/listings.routes.ts`
- `backend/src/modules/metrics/metrics.routes.ts`
- `backend/src/modules/test-center/test-center.routes.ts`
- `backend/src/modules/notifications/notifications.routes.ts`
- `backend/src/modules/messaging/messaging.routes.ts`
- `backend/src/modules/analytics/analytics.routes.ts`
- `backend/src/modules/audit/audit.routes.ts`
- related schema files under each module (`*.schemas.ts`)
