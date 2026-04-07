/**
 * Privilege freshness API tests.
 *
 * Verifies that the legacy `requireAuth` middleware now refreshes the user
 * from the DB on every request, so role revocation / account deactivation
 * is reflected immediately rather than persisting until session expiry.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  mockPrisma,
  mockMetricsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('privilege freshness via DB-refreshed requireAuth', () => {
  it('rejects subsequent requests once the user is deactivated mid-session', async () => {
    mockMetricsService.listDefinitions.mockResolvedValue([]);

    // 1) Login: agent now has a session cookie
    const agent = await loginAs('SYSTEM_ADMIN');

    // 2) First request hits the DB-refreshed middleware which finds an
    //    active user — succeeds.
    const ok = await agent.get('/api/v1/metrics/definitions');
    assertSuccess(ok, 200);

    // 3) Simulate the operator deactivating the account between requests:
    //    the DB lookup now returns null. Override the mock to drop the user.
    mockPrisma.user.findUnique.mockImplementation(() => Promise.resolve(null));

    // 4) Next request must be rejected with 401 — privilege is fresh, not
    //    cached in the session.
    const blocked = await agent.get('/api/v1/metrics/definitions');
    assertError(blocked, 401, 'UNAUTHORIZED');
  });

  it('reflects role revocation immediately on the next request', async () => {
    mockMetricsService.triggerRecalculation.mockResolvedValue({ id: 'job-1', status: 'QUEUED' });

    const agent = await loginAs('SYSTEM_ADMIN');

    // First request: SYSTEM_ADMIN can trigger recalculation → 202
    const ok = await agent.post('/api/v1/metrics/recalculate').send({ propertyIds: [] });
    expect(ok.status).toBe(202);

    // Operator strips the SYSTEM_ADMIN role; the DB now returns the user
    // with only STANDARD_USER role. The DB-refresh middleware will pick this
    // up on the next request and downgrade req.userRoles accordingly.
    mockPrisma.user.findUnique.mockImplementation(() =>
      Promise.resolve({
        id: 'user-admin-id',
        username: 'admin',
        displayName: 'admin',
        email: 'admin@test.com',
        roles: [
          {
            role: { name: 'STANDARD_USER', permissions: [] },
          },
        ],
      }),
    );

    // Same endpoint, same session → 403 because the role lookup is fresh
    const blocked = await agent
      .post('/api/v1/metrics/recalculate')
      .send({ propertyIds: [] });
    assertError(blocked, 403, 'FORBIDDEN');
  });
});
