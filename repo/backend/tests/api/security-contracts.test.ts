/**
 * Security contract tests.
 *
 * These tests assert three complementary contract layers without depending on
 * business-logic mocks:
 *
 *   1. Auth contract   – every protected route returns 401 for unauthenticated callers.
 *   2. RBAC contract   – every role-gated route returns 403 for under-privileged callers.
 *   3. Envelope shape  – success, error, and paginated responses all carry the
 *                        expected JSON envelope fields.
 *   4. Compat parity   – compat alias routes return the same status code as their
 *                        canonical counterparts.
 *   5. Snooze payload  – dual-shape compatibility and edge-case validation.
 *
 * Tests 1 and 2 never reach the service layer (auth/RBAC middleware short-circuits),
 * so no service mock setup is required for them.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertError,
  assertSuccess,
  assertPaginated,
  mockMessagingService,
  mockNotificationsService,
  mockMetricsService,
  mockAnalyticsService,
  mockUsersService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── 1. Auth Contract ────────────────────────────────────────────────────────
// All routes under /api/v1/* (except /health) are protected.
// Unauthenticated requests must receive 401 UNAUTHORIZED.

describe('Auth Contract: unauthenticated → 401', () => {
  const unauthCases: [string, string][] = [
    // Users
    ['GET',    '/api/v1/users'],
    // Messaging — canonical paths
    ['GET',    '/api/v1/messaging/'],
    ['POST',   '/api/v1/messaging/enqueue'],
    ['GET',    '/api/v1/messaging/failures'],
    ['GET',    '/api/v1/messaging/blacklist'],
    ['POST',   '/api/v1/messaging/blacklist'],
    ['GET',    '/api/v1/messaging/quiet-hours'],
    ['PUT',    '/api/v1/messaging/quiet-hours'],
    // Messaging — compat aliases
    ['GET',    '/api/v1/messaging/messages'],
    ['POST',   '/api/v1/messaging/messages'],
    // Notifications
    ['GET',    '/api/v1/notifications/'],
    ['GET',    '/api/v1/notifications/unread-count'],
    ['PATCH',  '/api/v1/notifications/read-all'],
    ['GET',    '/api/v1/notifications/templates'],
    // Metrics
    ['GET',    '/api/v1/metrics/definitions'],
    ['GET',    '/api/v1/metrics/values'],
    ['POST',   '/api/v1/metrics/recalculate'],
    ['GET',    '/api/v1/metrics/jobs'],
    // Test center
    ['GET',    '/api/v1/test-center/sites'],
    ['POST',   '/api/v1/test-center/sites'],
    ['GET',    '/api/v1/test-center/rooms'],
    ['GET',    '/api/v1/test-center/sessions'],
    // Analytics
    ['GET',    '/api/v1/analytics/definitions'],
    ['GET',    '/api/v1/analytics/reports'],
    ['GET',    '/api/v1/analytics/schedules'],
    ['GET',    '/api/v1/analytics/saved-views'],
    // Audit
    ['GET',    '/api/v1/audit'],
  ];

  it.each(unauthCases)('%s %s → 401 UNAUTHORIZED', async (method, path) => {
    const agent = createAgent();
    const res = await (agent as any)[method.toLowerCase()](path);
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('GET /api/health/live is publicly accessible (no auth required)', async () => {
    const res = await createAgent().get('/api/health/live');
    // Health endpoint returns 200 without session
    expect(res.status).toBe(200);
  });
});

// ─── 2. RBAC Contract ────────────────────────────────────────────────────────
// Role-gated routes must return 403 FORBIDDEN for callers with insufficient
// privilege. We test STANDARD_USER (lowest privilege) against admin-only routes.

describe('RBAC Contract: STANDARD_USER → 403 on admin-only routes', () => {
  const rbacCases: [string, string][] = [
    // Messaging admin routes
    ['GET',    '/api/v1/messaging/failures'],
    ['POST',   '/api/v1/messaging/blacklist'],
    ['GET',    '/api/v1/messaging/blacklist'],
    ['PUT',    '/api/v1/messaging/quiet-hours'],
    // Metrics admin routes
    ['POST',   '/api/v1/metrics/recalculate'],
    ['POST',   '/api/v1/metrics/definitions'],
    // Notification template admin routes
    ['GET',    '/api/v1/notifications/templates'],
    ['POST',   '/api/v1/notifications/templates'],
    // Test center admin routes (create/delete require elevated role)
    ['POST',   '/api/v1/test-center/sites'],
    ['POST',   '/api/v1/test-center/rooms'],
    // Analytics creator routes
    ['POST',   '/api/v1/analytics/schedules'],
  ];

  it.each(rbacCases)('%s %s → 403 for STANDARD_USER', async (method, path) => {
    const agent = await loginAs('STANDARD_USER');
    const res = await (agent as any)[method.toLowerCase()](path);
    assertError(res, 403, 'FORBIDDEN');
  });
});

describe('RBAC Contract: STANDARD_USER → 403 on blacklist DELETE', () => {
  it('DELETE /api/v1/messaging/blacklist/:id → 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.delete('/api/v1/messaging/blacklist/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── 3. Response Envelope Shape Contract ────────────────────────────────────
// Verify that the JSON envelope produced by response helpers matches what
// clients rely on: { success, data } / { success, error } / paginated meta.

describe('Response Envelope Shape', () => {
  it('success response carries { success: true, data }', async () => {
    mockMessagingService.getQuietHoursConfig.mockResolvedValueOnce({
      id: 'qh-1',
      quietStartHr: 22,
      quietEndHr: 7,
      timezone: 'UTC',
      isGlobal: true,
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/messaging/quiet-hours');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: expect.any(Object),
    });
    expect(res.body).not.toHaveProperty('error');
  });

  it('error response carries { success: false, error: { code, message } }', async () => {
    // Unauthenticated request → structured 401 error
    const res = await createAgent().get('/api/v1/messaging/');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: expect.any(String),
      },
    });
    expect(res.body).not.toHaveProperty('data');
  });

  it('validation error carries error.details array (Zod issues)', async () => {
    // Send a body with wrong type to trigger Zod validation failure
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/messaging/blacklist')
      .send({ address: '', channel: 'INVALID_CHANNEL' });

    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: expect.any(Array),
      },
    });
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('paginated response carries { success, data: Array, meta: { page, pageSize, total, totalPages } }', async () => {
    mockMessagingService.listMessages.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/messaging/');

    assertPaginated(res, 200);
    expect(res.body.meta).toMatchObject({
      page: expect.any(Number),
      pageSize: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });
});

// ─── 4. Compat Route Parity ──────────────────────────────────────────────────
// Compat aliases must respond with the same HTTP status as their canonical
// counterparts. This catches regressions where an alias is registered but
// wired to the wrong handler or missing auth middleware.

describe('Compat Route Parity: messaging /messages/* aliases', () => {
  it('POST /messages (compat) ↔ POST /enqueue (canonical): same 401 when unauth', async () => {
    const canonRes = await createAgent().post('/api/v1/messaging/enqueue').send({});
    const compatRes = await createAgent().post('/api/v1/messaging/messages').send({});
    expect(compatRes.status).toBe(canonRes.status);
    expect(compatRes.body.error?.code).toBe(canonRes.body.error?.code);
  });

  it('GET /messages (compat) ↔ GET / (canonical): same 401 when unauth', async () => {
    const canonRes = await createAgent().get('/api/v1/messaging/');
    const compatRes = await createAgent().get('/api/v1/messaging/messages');
    expect(compatRes.status).toBe(canonRes.status);
  });

  it('GET /messages/:id (compat) ↔ GET /:id (canonical): same 401 when unauth', async () => {
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const canonRes = await createAgent().get(`/api/v1/messaging/${id}`);
    const compatRes = await createAgent().get(`/api/v1/messaging/messages/${id}`);
    expect(compatRes.status).toBe(canonRes.status);
  });

  it('PATCH /messages/:id/delivery (compat) ↔ PATCH /:id/delivery (canonical): same 401 when unauth', async () => {
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const canonRes = await createAgent()
      .patch(`/api/v1/messaging/${id}/delivery`)
      .send({ status: 'DELIVERED' });
    const compatRes = await createAgent()
      .patch(`/api/v1/messaging/messages/${id}/delivery`)
      .send({ status: 'DELIVERED' });
    expect(compatRes.status).toBe(canonRes.status);
  });
});

describe('Compat Route Parity: analytics /schedules/* aliases', () => {
  it('GET /schedules (compat) → 401 when unauth', async () => {
    const res = await createAgent().get('/api/v1/analytics/schedules');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('POST /schedules (compat) → 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/analytics/schedules').send({});
    assertError(res, 403, 'FORBIDDEN');
  });
});

describe('Compat Route Parity: analytics PATCH /definitions/:id', () => {
  it('PATCH /definitions/:id (compat) → 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const res = await agent.patch(`/api/v1/analytics/definitions/${id}`).send({});
    assertError(res, 403, 'FORBIDDEN');
  });

  it('PATCH /definitions/:id ↔ PUT /definitions/:id: same 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const putRes  = await agent.put(`/api/v1/analytics/definitions/${id}`).send({});
    const patchRes = await agent.patch(`/api/v1/analytics/definitions/${id}`).send({});
    expect(patchRes.status).toBe(putRes.status);
  });
});

describe('Compat Route Parity: analytics POST /reports', () => {
  it('POST /reports (compat) ↔ POST /reports/generate (canonical): same 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const canonRes  = await agent.post('/api/v1/analytics/reports/generate').send({});
    const compatRes = await agent.post('/api/v1/analytics/reports').send({});
    expect(compatRes.status).toBe(canonRes.status);
  });
});

describe('Compat Route Parity: notifications PATCH /templates/:id', () => {
  it('PATCH /templates/:id (compat) → 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.patch('/api/v1/notifications/templates/some-id').send({});
    assertError(res, 403, 'FORBIDDEN');
  });

  it('PATCH /templates/:id ↔ PUT /templates/:id: same 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const putRes   = await agent.put('/api/v1/notifications/templates/some-id').send({});
    const patchRes = await agent.patch('/api/v1/notifications/templates/some-id').send({});
    expect(patchRes.status).toBe(putRes.status);
  });
});

// ─── 5. Snooze Dual-Shape Edge Cases ─────────────────────────────────────────
// Supplements the basic compat tests in notifications.test.ts with additional
// edge cases that were identified during the contract review.

describe('Snooze payload edge cases', () => {
  const notifId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const futureDate = '2030-01-01T00:00:00.000Z';

  it('when both snoozedUntil and until are provided, snoozedUntil takes precedence', async () => {
    // The Zod schema uses .transform to normalise to snoozedUntil.
    // Both fields valid → schema should pass → service called with snoozedUntil value.
    mockNotificationsService.snooze.mockResolvedValueOnce({
      id: notifId,
      status: 'SNOOZED',
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ snoozedUntil: futureDate, until: '2031-06-01T00:00:00.000Z' });

    assertSuccess(res, 200);
    // Verify the service receives the snoozedUntil value (not until)
    // service.snooze(id, userId, snoozedUntil) — snoozedUntil value must come from snoozedUntil field
    expect(mockNotificationsService.snooze).toHaveBeenCalledWith(
      notifId,
      expect.any(String),  // userId from session
      futureDate,          // snoozedUntil value
    );
  });

  it('empty string for until is rejected with 422', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ until: '' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('empty string for snoozedUntil is rejected with 422', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ snoozedUntil: '' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('null body is rejected with 422', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({});

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('snoozedUntil with correct value calls service with normalised field', async () => {
    mockNotificationsService.snooze.mockResolvedValueOnce({
      id: notifId,
      status: 'SNOOZED',
    });

    const agent = await loginAs('STANDARD_USER');
    await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ snoozedUntil: futureDate });

    // Service must receive the normalised field name regardless of which
    // input field (snoozedUntil or until) the client sent.
    // service.snooze(id, userId, snoozedUntil)
    expect(mockNotificationsService.snooze).toHaveBeenCalledWith(
      notifId,
      expect.any(String),  // userId from session
      futureDate,
    );
  });

  it('until with correct value calls service with normalised snoozedUntil field', async () => {
    mockNotificationsService.snooze.mockResolvedValueOnce({
      id: notifId,
      status: 'SNOOZED',
    });

    const agent = await loginAs('STANDARD_USER');
    await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ until: futureDate });

    // Transform must have normalised `until` → `snoozedUntil` before calling service
    // service.snooze(id, userId, snoozedUntil)
    expect(mockNotificationsService.snooze).toHaveBeenCalledWith(
      notifId,
      expect.any(String),  // userId from session
      futureDate,
    );
  });
});
