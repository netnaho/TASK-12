# LeaseOps Insight & Assessment — System Design (Implementation-Based)

## 1. Purpose and Scope

This document describes the **implemented design** of the LeaseOps Insight & Assessment platform as present in the `repo/` codebase.

The system supports offline-first property-management operations with:

- role-based workspace access,
- listing and lease metrics modeling,
- test center logistics and seat allocation,
- notification inbox and outbound messaging queue,
- analytics/reporting with controlled sharing and exports,
- immutable auditing and scheduled background jobs.

This is an implementation-derived design, not a future-state proposal.

---

## 2. High-Level Architecture

### 2.1 Runtime topology

- **Frontend**: Vue 3 SPA served by Nginx (`frontend/`)
- **Backend**: Express + TypeScript API (`backend/`)
- **Database**: MySQL 8 with Prisma ORM (`backend/prisma/`)

Primary deployment model is local/single-network via Docker Compose.

### 2.2 Request flow

1. Browser loads SPA from Nginx.
2. SPA calls relative `/api/...` endpoints.
3. Nginx proxies `/api` to backend service.
4. Express applies middleware chain (request ID, security, session, logging, auth/RBAC).
5. Controllers call services/repositories via Prisma.
6. Responses return in consistent API envelope.

### 2.3 Backend middleware order (implemented)

From `backend/src/app.ts`:

1. request ID
2. security headers (helmet)
3. CORS
4. compression
5. global rate limiter
6. body parsing
7. session middleware
8. request logger
9. route mounting
10. not-found handler
11. global error handler

This order preserves traceability and security posture across all routes.

---

## 3. Frontend Design (Vue)

### 3.1 Routing and auth gating

Implemented in `frontend/src/router/index.ts` and `frontend/src/router/routes.ts`.

- Public route: `/login`
- Authenticated layout: `AppLayout`
- Route guard checks:
  - authenticated session presence
  - required roles in route metadata

### 3.2 Role-aware navigation footprint

Implemented role-targeted areas include:

- `dashboard`, `notifications` for all roles
- `test-center` for Admin/Manager/Proctor
- `listings` for Admin/Manager/User
- `lease-metrics`, `analytics` for Admin/Manager/Analyst
- `users`, `settings`, `audit-log` for Admin only

This aligns UI accessibility with backend authorization boundaries.

---

## 4. Backend Domain Modules

Mounted API domains in `backend/src/app.ts`:

- `/api/health`
- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/communities`
- `/api/v1/listings`
- `/api/v1/metrics`
- `/api/v1/test-center`
- `/api/v1/notifications`
- `/api/v1/messaging`
- `/api/v1/analytics`
- `/api/v1/audit`

Design style is layered:

- router/controller for transport,
- service layer for business rules,
- Prisma persistence for data access.

---

## 5. Data Design (Prisma + MySQL)

Schema source: `backend/prisma/schema.prisma`.

### 5.1 Identity, auth, RBAC

Core models:

- `User`, `Role`, `Permission`, `UserRole`, `RolePermission`
- `AppSession` (session metadata)
- `UserPreference` (delivery mode preferences)

Key behavior:

- login by **username + password hash**
- global username uniqueness
- role-permission join model for access checks

### 5.2 Property and listing domain

Core models:

- `Region`, `Community`, `Property`, `Listing`

Important constraints:

- `Property.latitude` / `Property.longitude` stored as `DECIMAL(10,7)`
- listing uniqueness: one active listing per unit (`propertyId + unitNumber + isActive`)

### 5.3 Metric modeling and versioning

Core models:

- `MetricDefinition`
- `MetricDefinitionVersion`
- `MetricValue`
- `MetricCalcJob`, `MetricCalcJobVersion`

Implemented design rules:

- effective-dated version records
- lock flag `isLocked` on versions
- version lock triggered when referenced by published reporting snapshot flow
- recalculation jobs tracked with statuses (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`)

### 5.4 Test center and resource logistics

Core models:

- `TestSite`, `TestRoom`, `TestSeat`
- `EquipmentLedgerEntry`
- `TestSession`, `TestRegistration`, `SeatAllocation`
- `AdaSeatRelease`

Implemented business constraints:

- room/session scheduling with setup buffer (`setupBufferMin`, default 10)
- capacity tracking (`maxCapacity`, `currentEnrolled`)
- no seat double-booking (`@@unique([sessionId, seatId])`)
- contiguous seating optimization by row/position
- accessibility seats reserved by default unless explicitly released for a session

### 5.5 Notifications and outbound messaging

Core models:

- `NotificationTemplate`
- `Notification`
- `OutboundMessage`
- `MessageBlacklist`
- `QuietHoursConfig`

Implemented states:

- inbox status: `UNREAD`, `READ`, `SNOOZED`, `DISMISSED`
- delivery lifecycle: `QUEUED`, `RETRY_1`, `RETRY_2`, `RETRY_3`, `DELIVERED`, `FAILED`, `SUPPRESSED`, `MANUALLY_SENT`

Implemented controls:

- blacklist suppression before delivery
- quiet-hours deferral policy by timezone config

### 5.6 Analytics, sharing, exports

Core models:

- `ReportDefinition`, `Report`
- `ReportMetricSnapshot`
- `ReportShare`
- `ExportRequest`
- `SavedView`
- `ReportScheduleExecution`

Implemented controls:

- report sharing via explicit share table
- export request lifecycle (`PENDING`, `GENERATING`, `READY`, `FAILED`)
- watermark text stored per export request
- schedule execution logs for daily/weekly/monthly runs

### 5.7 Immutable audit design

Core model:

- `AuditLog`

Implemented integrity posture:

- append-only usage at application layer
- audit action taxonomy via enum (`AuditAction`)
- time/entity/actor optimized indexes
- retention handled by reporting/check policy, not destructive mutation

---

## 6. Scheduling and Background Jobs

Scheduler source: `backend/src/jobs/scheduler.ts`.

Registered jobs:

- `0 2 * * *` → nightly metric recalculation
- `0 6 * * *` → daily report generation
- `0 7 * * 1` → weekly report generation (Monday)
- `0 8 1 * *` → monthly report generation (1st day)
- `*/15 * * * *` → session cleanup
- `*/5 * * * *` → message retry processor
- `0 3 * * *` → audit retention check (reporting/compliance check)

Operational design:

- each job wrapped with centralized error logging
- scheduler starts at API bootstrap and stops on graceful shutdown

---

## 7. Security and Compliance Design

### 7.1 Authentication and session security

Session middleware source: `backend/src/security/session.ts`.

Implemented controls:

- `httpOnly` cookie
- `sameSite: 'strict'`
- conditional `secure` cookie in production
- server-side inactivity enforcement (30-minute policy in auth/session logic)
- dedicated auth route rate limiting

### 7.2 Cryptography at rest

Encryption module routed via `backend/src/config/encryption.ts` to `security/encryption`.

Implemented protected fields:

- encrypted employee ID ciphertext + IV columns
- hash-for-lookup pattern (`employeeIdHash`) to support equality search without plaintext

### 7.3 Authorization model

Two layers:

- route-level auth requirement + role checks
- object/domain-level checks in service layer (e.g., report-sharing access patterns)

### 7.4 Audit and retention posture

- all sensitive operational changes mapped to `AuditAction`
- append-only event records with before/after payload fields
- retention compliance validated via scheduled check job

---

## 8. Reliability and Operability

### 8.1 Startup lifecycle

Backend bootstrap (`backend/src/server.ts`):

- connect DB
- start HTTP server
- start scheduler
- attach `SIGTERM`/`SIGINT` shutdown handlers

### 8.2 Graceful shutdown

On shutdown signal:

- stop scheduler tasks
- close HTTP server
- disconnect Prisma
- forced timeout fallback after 10 seconds

### 8.3 Observability

Implemented observability patterns:

- request ID propagation
- structured logging
- health endpoints (`/api/health`, `/api/health/live`)
- job-level failure logging

---

## 9. Key Domain Rule Mapping (Prompt → Implementation)

| Required capability                      | Implemented design element                                      |
| ---------------------------------------- | --------------------------------------------------------------- |
| Offline-ready role-based workspace       | Vue route/meta role guards + backend RBAC                       |
| Listings and lease metrics modeling      | Property/Listing + MetricDefinition/Version/Value models        |
| Version lock after publication use       | `MetricDefinitionVersion.isLocked` + report snapshot linkage    |
| Test center seat logistics               | Site/Room/Seat/Session/Allocation schema + allocator behavior   |
| Capacity and no overbooking              | Session capacity fields + registration checks + seat uniqueness |
| 10-minute setup buffer                   | `setupBufferMin` scheduling constraint                          |
| Accessibility seat reservation           | `isAccessible` + `AdaSeatRelease` workflow                      |
| Notification inbox with status lifecycle | `Notification` model + status enum                              |
| Outbound queue with retries              | `OutboundMessage` status + retry schedule jobs                  |
| Blacklist and quiet hours                | `MessageBlacklist` + `QuietHoursConfig`                         |
| Controlled report sharing and exports    | `ReportShare`, `ExportRequest`, ACL checks                      |
| Watermarked exports                      | `watermarkText` stored per export request                       |
| Immutable audit trail                    | `AuditLog` append-only model and action taxonomy                |

---

## 10. Known Design Boundaries

Based on current implementation and prompt interpretation, these boundaries remain policy decisions rather than purely technical constraints:

- authoritative timezone source for all scheduled jobs in multi-site environments,
- governance policy after 7-year audit retention window (archive vs legal hold),
- post-download enforcement limits for offline export forwarding (currently mitigated by ACL + watermark deterrence),
- canonical payload contract for legally defensible audit event schemas.

These are not blockers for the implemented system, but they should be finalized for enterprise production policy.

---

## 11. Document Traceability

This design was derived from:

- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/jobs/scheduler.ts`
- `backend/src/security/session.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/router/index.ts`
- `frontend/src/router/routes.ts`

It intentionally reflects **what is implemented now** in `repo/`.
