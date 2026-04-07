# Backend Testing Strategy

LeaseOps backend tests fall into three deliberate tiers. Each tier has a
different purpose, mocking budget, and CI cadence.

## Tiers

### 1. Unit / contract tests

- Location: `tests/unit/**`, `tests/api/**` (excluding `privilege-freshness.test.ts`)
- Mocking: services and prisma are mocked at module boundaries (see
  `tests/api/helpers/setup.ts`)
- Purpose: prove the HTTP contract — routes wired correctly, validation runs,
  status codes returned, response envelope shape stable. Fast, deterministic,
  every PR.
- Run: `npm test` (the default `vitest run`)

### 2. Critical-path integration tests

- Location:
  - `tests/unit/services/security-hardening.test.ts`
  - `tests/api/privilege-freshness.test.ts`
  - `tests/unit/middleware/auth.test.ts`
- Mocking: only the prisma client and pino logger are mocked. The actual
  service / middleware / allocator code is exercised end-to-end. No service
  layer is replaced with `vi.fn()`.
- Purpose: protect the four high-risk security/regression areas where the
  generic API contract suite over-mocks too much:
  1. **Analytics report-share object-level access** — listShares ACL
     (creator / sharee / unrelated 404 / admin override / missing report)
  2. **Metric version lock immutability** — `createVersion` refuses to mutate
     a locked predecessor's `effectiveTo`; no `update` is called against the
     locked row
  3. **ADA strict-default allocation** — the real `SeatAllocator` driven
     against a mocked prisma layer; an unreleased ADA seat is never assigned
     under the production-default `ADA_STRICT_MODE=true`
  4. **Audit retention non-destructive enforcement** — the retention check
     job uses only `count`, plus a static source grep that fails if any
     contributor adds `auditLog.delete*` / `update*` / `upsert` to either the
     policy or the job module
- Also covers: privilege freshness — DB-refreshed `requireAuth` rejects a
  deactivated user / downgrades a session whose roles were revoked, on the
  next request and with no logout required.
- Run: `npm run test:critical`
- CI cadence: every PR (it is part of the default `npm test` run as well —
  `test:critical` is just a focused entry point for fast local iteration on
  these specific risk areas).

### 3. End-to-end / docker-compose tests

- Location: not currently maintained as a separate suite — the four
  critical-path areas above are protected by tier 2 instead.
- When to add: if the surface area of an external integration grows
  (e.g. real SMS provider, real export pipeline), wrap that integration in
  a tier-3 docker-compose test.

## Why tier 2 exists

Tier 1 over-mocks. The API contract suite mocks every service in
`tests/api/helpers/setup.ts`, so a contract test that calls
`POST /api/v1/metrics/recalculate` only proves the route is wired — it cannot
catch a regression in `metricsService.createVersion`'s lock guard, because
that service is replaced with `vi.fn()`.

Tier 2 fills that gap *only for the four flagged risk areas*. We do not push
all tests into tier 2 because the contract tier is faster and more stable.

## When something fails

| Failure surface | Likely cause |
|---|---|
| Tier 1 contract test | Route, controller, validation, or response shape regression |
| Tier 2 critical-path test | High-severity security or business-rule regression — block the PR |
| Both | Underlying primitive (auth, prisma client wiring) — investigate first |

## Coverage policy

- Threshold: 90% branches/functions/lines/statements (`vitest.config.ts`)
- Excluded: entry points, types, config, schemas, routes, most jobs.
  Exceptions are explicit:
  - `src/jobs/audit-retention-check.job.ts` is **not** excluded — it is part
    of the compliance proof and is covered by tier 2.
- Do **not** game coverage by adding tests purely to lift the number. New
  tests should map to a behavior the team wants to protect.
