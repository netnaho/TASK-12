Project Type: fullstack

# LeaseOps Insight & Assessment

A production-grade, full-stack property management analytics and assessment platform with offline-first leasing analytics, controlled reporting, and on-site assessment logistics. Runs from a single command — no manual setup required.

---

## Quick Start

```bash
docker-compose up
```

(The hyphenated `docker-compose up` and space form `docker compose up` are both supported by Docker Compose v1 and v2 respectively.)

All three services start automatically. Prisma migrations and seed data run on first boot.

| Service      | URL                        | Notes                       |
|--------------|----------------------------|-----------------------------|
| Frontend     | http://localhost:8080      | Vue 3 SPA served by nginx   |
| Backend API  | http://localhost:3000      | Express + Prisma REST API   |
| MySQL        | localhost:**3307**         | user: `leaseops_user` (host port; container uses 3306 internally) |

---

## Default Login Credentials

All seeded accounts use the password `Password123!`. The login field is `username`, not email.

| Role                  | Username  | Password     |
|-----------------------|-----------|--------------|
| System Admin          | admin     | Password123! |
| Leasing Ops Manager   | manager   | Password123! |
| Test Proctor          | proctor   | Password123! |
| Analyst               | analyst   | Password123! |
| Standard User (Agent) | agent     | Password123! |

Login via `POST /api/v1/auth/login` with `{ "username": "admin", "password": "Password123!" }` or through the frontend at http://localhost:8080.

---

## Architecture

```
┌────────────────────────────────────────────────┐
│                Docker network                   │
│                                                 │
│  ┌────────────────┐      ┌──────────────────┐  │
│  │  nginx :80     │─/api/│  node :3000      │  │
│  │  (frontend)    │─────▶│  (backend)       │──┼──▶ MySQL :3306 (container) / :3307 (host)
│  │  Vue 3 SPA     │      │  Express+Prisma  │  │    (db container, host port 3307)
│  └────────────────┘      └──────────────────┘  │
└────────────────────────────────────────────────┘
```

- The frontend is a static Vue 3 bundle served by nginx on port 80 (host: 8080).
- Nginx proxies all `/api/` requests to the backend container internally — no CORS issues.
- The backend runs Express + TypeScript + Prisma ORM against MySQL 8.0.
- `VITE_API_BASE_URL` is left empty at build time; the Axios client falls back to `/api` (relative), which nginx resolves.

---

## Tech Stack

| Layer     | Technology                                                                 |
|-----------|----------------------------------------------------------------------------|
| Frontend  | Vue 3 · TypeScript · Vite · Vue Router · Pinia · Tailwind CSS · shadcn-vue · Apache ECharts |
| Backend   | Node.js 20 · Express · TypeScript · Prisma ORM · Zod · pino · node-cron  |
| Database  | MySQL 8.0                                                                  |
| Auth      | express-session · bcrypt (12 rounds) · AES-256-CBC encryption             |
| Container | Docker Compose · multi-stage builds (node builder → node runner / nginx)  |
| Testing   | Vitest · v8 coverage · Supertest                                           |

---

## Directory Structure

```
repo/
├── docker-compose.yml          # Single-command startup
├── .env.example                # Template with safe placeholders — copy to .env before first run
├── run_tests.sh                # Runs unit + API tests and prints coverage
├── README.md
├── self_test_report.md
│
├── backend/
│   ├── Dockerfile              # Multi-stage: builder (tsc + prisma generate) → runner
│   ├── startup.sh              # Waits for DB → migrate → seed → start
│   ├── prisma/
│   │   ├── schema.prisma       # Full data model (25+ entities)
│   │   └── seed.ts             # Idempotent: roles, permissions, users, sample data
│   └── src/
│       ├── app.ts              # Express assembly + route mounting
│       ├── index.ts            # HTTP server bootstrap
│       ├── config/             # env validation, db client, logger, encryption, session
│       ├── middleware/         # helmet, cors, rate-limit, session, auth, rbac, validate, errors
│       ├── shared/             # errors/, types/, utils/, constants/
│       ├── modules/
│       │   ├── auth/           # login · logout · /me
│       │   ├── users/          # CRUD · role assignment · deactivation
│       │   ├── communities/    # regions · communities · properties
│       │   ├── listings/       # lease listings · stats
│       │   ├── metrics/        # definitions · versions · values · recalc engine
│       │   ├── test-center/    # sites · rooms · seats · equipment · sessions · allocation
│       │   ├── notifications/  # inbox · snooze · templates · preview
│       │   ├── messaging/      # outbound queue · retry · blacklist · quiet hours
│       │   ├── analytics/      # reports · sharing · exports · pivot
│       │   └── audit/          # immutable append-only log
│       └── jobs/               # scheduler · nightly recalc · report gen · session cleanup · retry
│
├── frontend/
│   ├── Dockerfile              # Multi-stage: Vite build → nginx serve
│   ├── docker/nginx.conf       # SPA routing + /api/ reverse proxy
│   └── src/
│       ├── api/                # Axios client + per-module endpoint wrappers
│       ├── components/         # ui/ · shared/ · forms/ · charts/
│       ├── composables/        # useAuth · usePermissions · useApiQuery · usePagination …
│       ├── layouts/            # AppLayout · AuthLayout · AppSidebar · AppTopbar
│       ├── router/             # routes · navigation guards · role-gated paths
│       ├── stores/             # Pinia: auth · ui · notifications · dashboard …
│       └── views/              # auth/ · dashboard/ · listings/ · test-center/ · analytics/ …
│
├── unit_tests/                 # Symlinks → backend/tests/unit/
└── API_tests/                  # Symlinks → backend/tests/api/
```

---

## Docker Startup Flow

```
docker compose up
    │
    ├─ [db] MySQL 8.0 starts
    │       healthcheck: mysqladmin ping -h 127.0.0.1
    │       (retries every 10 s, up to 12 times)
    │
    ├─ [backend] waits for db: service_healthy
    │       startup.sh step 1: Prisma SELECT 1 readiness loop (max 40 × 3 s)
    │       startup.sh step 2: prisma migrate deploy   (idempotent)
    │       startup.sh step 3: prisma db seed          (idempotent upserts)
    │       node dist/index.js
    │       healthcheck: GET /api/health/live (start_period 120 s)
    │
    └─ [frontend] waits for backend: service_healthy
            nginx serves /usr/share/nginx/html (pre-built Vite bundle)
            nginx proxies /api/ → http://backend:3000/api/
```

The double DB readiness check (`mysqladmin ping` + Prisma `SELECT 1`) is intentional: MySQL's TCP stack is ready before InnoDB DDL connections are fully accepted, so a second application-level probe is necessary before running migrations.

---

## Verification

After `docker compose up` completes:

```bash
# Backend health
curl http://localhost:3000/api/health

# Login (returns a session cookie)
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Password123!"}'

# Authenticated request
curl -b cookies.txt http://localhost:3000/api/v1/users
```

The frontend is accessible at http://localhost:8080 in any browser.

---

## API Reference

All authenticated endpoints require a valid session cookie from `POST /api/v1/auth/login`.

### Health

| Method | Path               | Auth | Description              |
|--------|--------------------|------|--------------------------|
| GET    | `/api/health`      | No   | Liveness + readiness     |
| GET    | `/api/health/live` | No   | Liveness only (no DB)    |
| GET    | `/api/health/ready`| No   | Readiness only           |

### Auth — `/api/v1/auth`

| Method | Path      | Auth | Description                       |
|--------|-----------|------|-----------------------------------|
| POST   | `/login`  | No   | Login; rate-limited 10 req/15 min |
| GET    | `/me`     | Yes  | Current session user + roles      |
| POST   | `/logout` | Yes  | Destroy session                   |
| POST   | `/touch`  | Yes  | Session keep-alive ping (204)     |

### Users — `/api/v1/users` (System Admin only, except self-service preferences)

| Method | Path                    | Auth          | Description             |
|--------|-------------------------|---------------|-------------------------|
| GET    | `/me/preferences`       | Any authed    | Current user preferences|
| PUT    | `/me/preferences`       | Any authed    | Update own preferences  |
| GET    | `/`                     | Admin         | List users (filterable) |
| POST   | `/`                     | Admin         | Create user             |
| GET    | `/:id`                  | Admin         | Get user                |
| PUT    | `/:id`                  | Admin         | Update user             |
| POST   | `/:id/roles`            | Admin         | Assign role             |
| DELETE | `/:id/roles/:roleName`  | Admin         | Remove role             |
| PATCH  | `/:id/deactivate`       | Admin         | Deactivate user         |

### Communities — `/api/v1/communities`

| Method | Path                 | Write roles           | Description            |
|--------|----------------------|-----------------------|------------------------|
| GET    | `/regions`           | —                     | List regions           |
| POST   | `/regions`           | Admin · Manager       | Create region          |
| PUT    | `/regions/:id`       | Admin · Manager       | Update region          |
| DELETE | `/regions/:id`       | Admin · Manager       | Delete region          |
| GET    | `/communities`       | —                     | List communities       |
| POST   | `/communities`       | Admin · Manager       | Create community       |
| PUT    | `/communities/:id`   | Admin · Manager       | Update community       |
| GET    | `/properties`        | —                     | List properties        |
| POST   | `/properties`        | Admin · Manager       | Create property        |
| PUT    | `/properties/:id`    | Admin · Manager       | Update property        |

### Listings — `/api/v1/listings`

| Method | Path       | Write roles           | Description      |
|--------|------------|-----------------------|------------------|
| GET    | `/`        | —                     | List listings    |
| GET    | `/stats`   | —                     | Aggregate stats  |
| POST   | `/`        | Admin · Manager       | Create listing   |
| GET    | `/:id`     | —                     | Get listing      |
| PUT    | `/:id`     | Admin · Manager       | Update listing   |

### Metrics — `/api/v1/metrics`

| Method | Path                          | Write roles                     | Description             |
|--------|-------------------------------|---------------------------------|-------------------------|
| GET    | `/definitions`                | —                               | List definitions        |
| POST   | `/definitions`                | Admin · Manager                 | Create definition       |
| GET    | `/definitions/:id`            | —                               | Get definition          |
| POST   | `/definitions/:id/versions`   | Admin · Manager                 | Add version             |
| GET    | `/values`                     | —                               | List metric values      |
| POST   | `/recalculate`                | Admin · Manager · Analyst       | Trigger recalculation   |
| GET    | `/jobs`                       | —                               | List recalc jobs        |

### Test Center — `/api/v1/test-center`

| Method | Path                              | Write roles       | Description              |
|--------|-----------------------------------|-------------------|--------------------------|
| GET    | `/sites`                          | —                 | List sites               |
| POST   | `/sites`                          | Admin · Proctor   | Create site              |
| PUT    | `/sites/:id`                      | Admin · Proctor   | Update site              |
| DELETE | `/sites/:id`                      | Admin             | Delete site              |
| GET    | `/rooms`                          | —                 | List rooms               |
| POST   | `/rooms`                          | Admin · Proctor   | Create room              |
| PUT    | `/rooms/:id`                      | Admin · Proctor   | Update room              |
| DELETE | `/rooms/:id`                      | Admin             | Delete room              |
| GET    | `/seats`                          | —                 | List seats               |
| POST   | `/seats`                          | Admin · Proctor   | Create seat              |
| PUT    | `/seats/:id`                      | Admin · Proctor   | Update seat              |
| GET    | `/equipment`                      | —                 | List equipment ledger    |
| POST   | `/equipment`                      | Admin · Proctor   | Add equipment entry      |
| PUT    | `/equipment/:id`                  | Admin · Proctor   | Update equipment         |
| DELETE | `/equipment/:id`                  | Admin · Proctor   | Remove equipment         |
| GET    | `/sessions`                       | —                 | List sessions            |
| POST   | `/sessions`                       | Admin · Proctor   | Create session           |
| GET    | `/sessions/:id`                   | —                 | Get session              |
| PATCH  | `/sessions/:id/cancel`            | Admin · Proctor   | Cancel session           |
| POST   | `/sessions/:id/register`          | Any               | Register for session     |
| DELETE | `/sessions/:id/register`          | Any               | Cancel own registration  |
| DELETE | `/sessions/:sessionId/registrations/:registrationId` | Any | Cancel specific registration |
| PATCH  | `/sessions/:id` *(compat)*        | Admin · Proctor   | Compat alias → cancelSession |
| DELETE | `/sessions/:id` *(compat)*        | Admin · Proctor   | Compat alias → cancelSession |
| PATCH  | `/sites/:id` *(compat)*           | Admin · Proctor   | Compat alias for PUT     |
| PATCH  | `/seats/:id` *(compat)*           | Admin · Proctor   | Compat alias for PUT     |
| PATCH  | `/equipment/:id` *(compat)*       | Admin · Proctor   | Compat alias for PUT     |
| GET    | `/sites/:siteId/rooms`            | —                 | Nested list (compat)     |
| POST   | `/sites/:siteId/rooms`            | Admin · Proctor   | Nested create (compat)   |
| PATCH  | `/sites/:siteId/rooms/:roomId`    | Admin · Proctor   | Nested update (compat)   |
| DELETE | `/sites/:siteId/rooms/:roomId`    | Admin             | Nested delete (compat)   |
| GET    | `/rooms/:roomId/seats`            | —                 | Nested list (compat)     |
| POST   | `/rooms/:roomId/seats`            | Admin · Proctor   | Nested create (compat)   |
| PATCH  | `/rooms/:roomId/seats/:seatId`    | Admin · Proctor   | Nested update (compat)   |
| DELETE | `/rooms/:roomId/seats/:seatId`    | Admin             | Nested delete (compat)   |
| GET    | `/utilization`                    | —                 | Flat utilization (compat; ?roomId= or ?siteId=) |
| GET    | `/utilization/rooms/:roomId`      | —                 | Room utilization stats   |
| GET    | `/utilization/sites/:siteId`      | —                 | Site utilization stats   |

### Notifications — `/api/v1/notifications`

| Method | Path                  | Write roles   | Description              |
|--------|-----------------------|---------------|--------------------------|
| GET    | `/`                   | —             | List notifications       |
| GET    | `/unread-count`       | —             | Unread count             |
| PATCH  | `/read-all`           | —             | Mark all read            |
| PATCH  | `/:id/read`           | —             | Mark one read            |
| PATCH  | `/:id/snooze`         | —             | Snooze (with until date) |
| PATCH  | `/:id/dismiss`        | —             | Dismiss                  |
| GET    | `/templates`          | Admin only    | List templates           |
| POST   | `/templates`          | Admin only    | Create template          |
| GET    | `/templates/:id`      | Admin only    | Get template             |
| PUT    | `/templates/:id`      | Admin only    | Update template          |
| PATCH  | `/templates/:id` *(compat)*     | Admin only    | Compat alias for PUT     |
| DELETE | `/templates/:id`      | Admin only    | Delete template          |
| POST   | `/templates/preview`  | Admin only    | Render template preview  |

### Messaging — `/api/v1/messaging`

| Method | Path               | Write roles   | Description               |
|--------|--------------------|---------------|---------------------------|
| POST   | `/enqueue`         | Any           | Enqueue outbound message  |
| POST   | `/messages` *(compat)* | Any           | Compat alias for enqueue  |
| GET    | `/messages` *(compat)* | Any           | Compat alias (list)       |
| GET    | `/messages/:id` *(compat)* | Any   | Compat alias (status)     |
| PATCH  | `/messages/:id/delivery` *(compat)* | Any | Compat alias              |
| GET    | `/`                | Any           | List messages             |
| GET    | `/failures`        | Admin         | Failure alerts            |
| GET    | `/:id`             | Any           | Message status            |
| GET    | `/:id/package`     | Any           | Outbound-file delivery package |
| PATCH  | `/:id/delivery`    | Any           | Update delivery status    |
| POST   | `/blacklist`       | Admin         | Add address to blacklist  |
| GET    | `/blacklist`       | Admin         | List blacklist            |
| DELETE | `/blacklist/:id`   | Admin         | Remove from blacklist     |
| GET    | `/quiet-hours`     | Any           | Get quiet hours config    |
| PUT    | `/quiet-hours`     | Admin         | Update quiet hours config |

### Analytics — `/api/v1/analytics`

Role legend for this section (matches enforcement in `analytics.routes.ts`):
- **—** = any authenticated user
- **Analytics roles** = `SYSTEM_ADMIN · LEASING_OPS_MANAGER · ANALYST`
- **Manager roles**   = `SYSTEM_ADMIN · LEASING_OPS_MANAGER`
- **Admin only**      = `SYSTEM_ADMIN`

| Method | Path                          | Access                 | Description              |
|--------|-------------------------------|------------------------|--------------------------|
| GET    | `/definitions`                | —                      | List report definitions  |
| POST   | `/definitions`                | Analytics roles        | Create report definition |
| GET    | `/definitions/:id`            | —                      | Get report definition    |
| PUT    | `/definitions/:id`            | Manager roles          | Update report definition |
| PATCH  | `/definitions/:id` *(compat)* | Manager roles          | Compat alias for PUT     |
| POST   | `/reports/generate`           | Analytics roles        | Generate report          |
| POST   | `/reports` *(compat)*         | Analytics roles        | Compat alias for generate|
| GET    | `/reports`                    | —                      | List reports             |
| GET    | `/reports/:id`                | —                      | Get report               |
| PATCH  | `/reports/:id/archive`        | —                      | Archive a report (any authed; service enforces ownership/admin) |
| POST   | `/reports/:id/share`          | Manager roles          | Share with user          |
| DELETE | `/reports/:id/share/:userId`  | Manager roles          | Revoke share             |
| GET    | `/reports/:id/shares`         | —                      | List report shares (service filters by ownership/admin) |
| POST   | `/reports/:id/shares` *(compat)*| Manager roles        | Compat alias for /share  |
| DELETE | `/reports/:id/shares/:shareId` *(compat)* | Manager roles | Compat alias for revoke  |
| POST   | `/reports/:id/export`         | Analytics roles        | Request export           |
| GET    | `/exports/:id/download`       | —                      | Download export file (service filters by ownership) |
| POST   | `/pivot`                      | Analytics roles        | Ad-hoc pivot query       |
| GET    | `/operational/participation`  | Analytics roles        | Participation metrics    |
| GET    | `/operational/attendance`     | Analytics roles        | Attendance metrics       |
| GET    | `/operational/hour-distribution`| Analytics roles      | Hour distribution        |
| GET    | `/operational/retention`      | Analytics roles        | Retention metrics        |
| GET    | `/operational/staffing-gaps`  | Analytics roles        | Staffing gaps            |
| GET    | `/operational/event-popularity`| Analytics roles       | Event popularity ranks   |
| GET    | `/operational/rankings`       | Analytics roles        | Rankings                 |
| GET    | `/saved-views`                | —                      | List saved views         |
| POST   | `/saved-views`                | Analytics roles        | Create saved view        |
| GET    | `/saved-views/:id`            | —                      | Get saved view           |
| PUT    | `/saved-views/:id`            | —                      | Update saved view (service enforces ownership) |
| DELETE | `/saved-views/:id`            | —                      | Delete saved view (service enforces ownership) |
| GET    | `/schedule-executions`        | Admin only             | List schedule executions |
| GET    | `/schedules`                  | Analytics roles        | List schedules           |
| GET    | `/schedules/:id`              | —                      | Get schedule             |
| POST   | `/schedules`                  | Analytics roles        | Create schedule          |
| PATCH  | `/schedules/:id`              | Manager roles          | Update schedule          |
| DELETE | `/schedules/:id`              | Manager roles          | Delete schedule          |

### Audit — `/api/v1/audit` (System Admin only)

| Method | Path   | Description            |
|--------|--------|------------------------|
| GET    | `/`    | List audit entries     |
| GET    | `/:id` | Get single audit entry |

---

## Key Modules

### Metric Calculation Engine

Five built-in calculators invoked during nightly recalculation and on-demand:

| Calculator      | Metric                 | Description                                    |
|-----------------|------------------------|------------------------------------------------|
| UnitRent        | Average rent per unit  | Mean rent price across active listings         |
| PriceChange     | Period-over-period Δ%  | Percentage change in average rent between periods |
| Vacancy         | Vacancy rate           | Ratio of unleased to total units               |
| Volatility      | Rent volatility        | Standard deviation of rents normalized by mean |
| SupplyDemand    | Supply/demand ratio    | Available units vs. registered session demand  |

Metric definitions are versioned. Once a version is referenced in a published report, it is locked and cannot be modified.

### Test Center Seat Allocator

Automatic seat allocation for registered test takers:
- Prefers contiguous blocks of seats within the same row
- Reserves ADA-accessible seats for registrants who require them
- Respects maximum room capacity; rejects registrations when full
- Enforces a 10-minute setup buffer between sessions in the same room

### Outbound Messaging

Messages flow through a retry queue with exponential back-off:

```
QUEUED → (delivery attempt)
  ├── success → DELIVERED
  └── fail    → RETRY_1 (retry after  5 min)
                  └── fail → RETRY_2 (retry after 15 min)
                               └── fail → RETRY_3 (retry after 60 min)
                                            └── fail → FAILED
```

Suppression rules:
- Blacklisted addresses: message is dropped immediately on enqueue
- Quiet hours (default 21:00–07:00): delivery deferred until window opens
- Offline/file-based channels: a JSON package is written to disk

### Analytics & Exports

Reports support three export formats:

| Format | Watermark        | Notes                                              |
|--------|------------------|----------------------------------------------------|
| CSV    | Header row       | `Exported by: {name} | {ISO timestamp}`            |
| XLSX   | Footer row       | Apache POI-style multi-sheet                       |
| PDF    | Diagonal overlay | Semi-transparent text across each page             |

The watermark always includes the requesting user's display name and the UTC timestamp of the export request.

---

## Scheduled Jobs

| Job                    | Schedule        | Description                                        |
|------------------------|-----------------|----------------------------------------------------|
| Nightly metric recalc  | `0 2 * * *`     | Recalculates all active metric definitions         |
| Daily report gen       | `0 6 * * *`     | Generates `DAILY` frequency reports                |
| Weekly report gen      | `0 7 * * 1`     | Generates `WEEKLY` frequency reports (Monday)      |
| Monthly report gen     | `0 8 1 * *`     | Generates `MONTHLY` frequency reports (1st of month) |
| Session cleanup        | `*/15 * * * *`  | Purges expired sessions from the session store     |
| Message retry          | `*/5 * * * *`   | Processes queued retries for failed outbound messages |

All jobs are managed by `node-cron` in the backend process and log to the structured pino logger.

---

## Security

| Control                 | Implementation                                                        |
|-------------------------|-----------------------------------------------------------------------|
| Authentication          | Session-based (express-session) with 30-minute sliding expiry        |
| Password hashing        | bcrypt, 12 salt rounds                                                |
| Field encryption        | AES-256-CBC; per-row IV; key supplied via env var (64 hex chars)     |
| Authorization           | RBAC enforced per endpoint via middleware; permissions seeded to DB   |
| Input validation        | Zod schemas on all request body, query string, and path parameters   |
| SQL injection           | Prisma ORM only; zero raw SQL string concatenation                   |
| Rate limiting           | Auth: 10 req/15 min · Global: 100 req/min                            |
| Security headers        | Helmet: CSP, X-Frame-Options, X-Content-Type-Options, HSTS           |
| CORS                    | Explicit origin whitelist via `CORS_ORIGIN` env var                  |
| Error responses         | Standardized envelope; stack traces suppressed in production         |
| Export watermark        | `{viewer display name} | {ISO timestamp}` on every exported file     |
| Audit immutability      | Append-only audit log; no UPDATE/DELETE exposed at application layer |
| Mass-assignment safety  | All Prisma queries use explicit `select` — no `findMany()` wildcards |

---

## Environment Variables

| Variable              | Description                               | Default                                                           |
|-----------------------|-------------------------------------------|-------------------------------------------------------------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password                       | `leaseops_root_2024`                                              |
| `MYSQL_DATABASE`      | Database name                             | `leaseops`                                                        |
| `MYSQL_USER`          | Database user                             | `leaseops_user`                                                   |
| `MYSQL_PASSWORD`      | Database password                         | `leaseops_pass_2024`                                              |
| `DATABASE_URL`        | Prisma connection string                  | `mysql://leaseops_user:CHANGE_ME_strong_db_password@db:3306/leaseops` |
| `SESSION_SECRET`      | express-session signing secret (≥32 chars)| `CHANGE_ME_at_least_32_chars_of_random_entropy`                   |
| `AES_ENCRYPTION_KEY`  | 64 hex-char key for AES-256-CBC (32 bytes)| `CHANGE_ME_exactly_64_hex_chars_…` (generate with `openssl rand -hex 32`) |
| `NODE_ENV`            | Node environment                          | `production`                                                      |
| `PORT`                | Backend listen port                       | `3000`                                                            |
| `CORS_ORIGIN`         | Allowed CORS origin                       | `http://localhost:8080`                                           |
| `LOG_LEVEL`           | Pino log level                            | `info`                                                            |
| `VITE_API_BASE_URL`   | Frontend API base URL (baked at build)    | `""` (empty — uses nginx proxy)                                   |

### Local-environment setup

`.env` is **not** committed to the repository (`.gitignore` excludes it). The
repository ships `.env.example` containing safe `CHANGE_ME_*` placeholders for
every required variable. Before the first `docker compose up`, copy the
template and replace the placeholder secrets with locally-generated values:

```bash
cp .env.example .env
# then edit .env and replace each CHANGE_ME_* value:
#   SESSION_SECRET     — at least 32 chars of random entropy
#                        (`openssl rand -base64 48`)
#   AES_ENCRYPTION_KEY — exactly 64 hex characters / 32 bytes
#                        (`openssl rand -hex 32`)
#   MYSQL_PASSWORD     — strong DB password (also reflected in DATABASE_URL)
#   MYSQL_ROOT_PASSWORD — strong DB root password
```

For production deployments these values must come from a secret manager (AWS
Secrets Manager, Vault, etc.) and **never** be committed to version control.
Rotate `SESSION_SECRET` and `AES_ENCRYPTION_KEY` on a regular cadence and on
any suspected compromise.

---

## Running Tests

All tests execute **inside Docker containers** — no host `npm`, `npx`, `pip`, or language-runtime installs are required.

```bash
./run_tests.sh
```

The script is a thin wrapper around `docker-compose` (and its v2 alias `docker compose`). It:

1. Builds a throwaway `test-db` MySQL container, waits for it to become healthy.
2. Builds a `backend-test` container image with dev dependencies and runs:
   - Backend unit tests (`tests/unit/`)
   - Backend mocked-HTTP API tests (`tests/api/`)
   - Backend **true no-mock API tests** (`tests/integration/`) against the real MySQL test DB
   - Overall coverage report with `>=90%` thresholds on branches, functions, lines, and statements
3. Builds a `frontend-test` container and runs frontend unit tests (Vitest + Vue Test Utils + jsdom).
4. Runs the FE↔BE E2E smoke test against the full Dockerized stack (login + a protected workflow).

The runner exits non-zero if any suite fails or coverage drops below 90%. All build artefacts and coverage reports are written to the mounted `backend/coverage/` and `frontend/coverage/` volumes on completion.

To run a single suite (still Docker-contained):

```bash
./run_tests.sh unit          # backend unit only
./run_tests.sh api           # backend mocked HTTP API only
./run_tests.sh integration   # backend no-mock API only
./run_tests.sh frontend      # frontend unit tests only
./run_tests.sh e2e           # FE↔BE end-to-end smoke flow only
```

See `self_test_report.md` and `.tmp/remediation_implementation_report.md` for detailed results.

---

## Troubleshooting

| Symptom                                 | Likely cause                                    | Fix                                                  |
|-----------------------------------------|-------------------------------------------------|------------------------------------------------------|
| Backend exits immediately on startup    | DB not ready when startup.sh runs               | The readiness loop retries for 2 min; check DB logs  |
| `AES_ENCRYPTION_KEY` validation error   | Key is not exactly 64 hex characters            | Verify `.env` has the 64-char key shown above        |
| `prisma migrate deploy` fails           | Schema out of sync                              | Run `docker compose down -v` then `docker compose up`|
| Frontend shows blank page               | Nginx can't reach backend on `/api/`            | Check backend container logs; verify health endpoint |
| Port conflict on 3307/3000/8080         | Another process occupies the port               | Stop conflicting service or change port in `.env`    |
| Session expires immediately             | `SESSION_SECRET` mismatch across restarts       | Ensure `.env` `SESSION_SECRET` is consistent         |

---

## License

Proprietary — EaglePoint AI
