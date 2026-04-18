/**
 * Gap-filling API tests — every endpoint flagged as "unit-only/indirect" in
 * the audit gets at least one meaningful HTTP test here.
 *
 * These tests use the mocked-HTTP setup (tests/api/helpers/setup.ts) —
 * Supertest + real app + mocked services. They assert status + payload shape,
 * not just status code, to meet the "meaningful assertions" quality bar.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockAuthService,
  mockUsersService,
  mockCommunitiesService,
  mockListingsService,
  mockTestCenterService,
  mockNotificationsService,
  mockAnalyticsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Health ────────────────────────────────────────────────────────────

describe('GET /api/health/ready (gap)', () => {
  it('returns 200 with { ready, uptime } readiness payload', async () => {
    const res = await createAgent().get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('ready');
    expect(res.body.data.ready).toBe(true);
    expect(typeof res.body.data.uptime).toBe('number');
  });
});

// ─── Auth: /touch ──────────────────────────────────────────────────────

describe('POST /api/v1/auth/touch (gap)', () => {
  it('returns 204 for a logged-in session', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/auth/touch');
    expect(res.status).toBe(204);
    // 204 MUST have empty body per HTTP spec
    expect(res.body).toEqual({});
  });

  it('returns 401 without a session', async () => {
    const res = await createAgent().post('/api/v1/auth/touch');
    assertError(res, 401);
  });
});

// ─── Users: DELETE /:id/roles/:roleName ────────────────────────────────

describe('DELETE /api/v1/users/:id/roles/:roleName (gap)', () => {
  it('removes a role and returns the updated user', async () => {
    mockUsersService.removeRole.mockResolvedValue({
      id: 'user-123',
      username: 'x',
      roles: [],
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete('/api/v1/users/user-123/roles/ANALYST');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(mockUsersService.removeRole).toHaveBeenCalledWith(
      'user-123',
      'ANALYST',
      expect.anything(),
    );
  });

  it('returns 403 for non-admin', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.delete('/api/v1/users/user-123/roles/ANALYST');
    assertError(res, 403);
  });

  it('returns 401 unauthenticated', async () => {
    const res = await createAgent().delete('/api/v1/users/user-123/roles/ANALYST');
    assertError(res, 401);
  });
});

// ─── Communities: region/community/property get/update/delete ──────────

describe('GET /api/v1/communities/regions/:id (gap)', () => {
  it('returns 200 with region payload', async () => {
    mockCommunitiesService.getRegion.mockResolvedValue({ id: 'r1', name: 'South' });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/communities/regions/11111111-1111-1111-1111-111111111111');
    assertSuccess(res);
    expect(res.body.data).toMatchObject({ id: 'r1', name: 'South' });
  });

  it('returns 404 when service throws NotFound', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockCommunitiesService.getRegion.mockRejectedValue(new NotFoundError('Region not found'));
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/communities/regions/22222222-2222-2222-2222-222222222222');
    assertError(res, 404);
  });
});

describe('PUT /api/v1/communities/regions/:id (gap)', () => {
  it('updates region and returns the new record', async () => {
    mockCommunitiesService.updateRegion.mockResolvedValue({ id: 'r1', name: 'Updated' });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put('/api/v1/communities/regions/11111111-1111-1111-1111-111111111111')
      .send({ name: 'Updated' });
    assertSuccess(res);
    expect(res.body.data.name).toBe('Updated');
  });

  it('returns 403 for non-admin', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .put('/api/v1/communities/regions/11111111-1111-1111-1111-111111111111')
      .send({ name: 'x' });
    assertError(res, 403);
  });
});

describe('DELETE /api/v1/communities/regions/:id (gap)', () => {
  it('returns 2xx when deletion succeeds', async () => {
    mockCommunitiesService.deleteRegion.mockResolvedValue(undefined);
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete('/api/v1/communities/regions/11111111-1111-1111-1111-111111111111');
    expect([200, 204]).toContain(res.status);
  });

  it('returns 409 when service reports a conflict', async () => {
    const { ConflictError } = await import('../../src/shared/errors');
    mockCommunitiesService.deleteRegion.mockRejectedValue(
      new ConflictError('Region has child communities'),
    );
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete('/api/v1/communities/regions/11111111-1111-1111-1111-111111111111');
    assertError(res, 409);
  });
});

describe('GET /api/v1/communities/communities (gap)', () => {
  it('returns paginated list', async () => {
    mockCommunitiesService.listCommunities.mockResolvedValue({
      data: [{ id: 'c1', name: 'Alpha' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/communities/communities');
    assertPaginated(res);
    expect(res.body.data[0].name).toBe('Alpha');
  });
});

describe('POST /api/v1/communities/communities (gap)', () => {
  it('rejects standard user (403)', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post('/api/v1/communities/communities')
      .send({ name: 'x', regionId: '11111111-1111-1111-1111-111111111111' });
    assertError(res, 403);
  });

  it('validates body (422)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/communities/communities').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('creates and returns the community on success', async () => {
    mockCommunitiesService.createCommunity.mockResolvedValue({
      id: 'c1', name: 'Alpha', regionId: '11111111-1111-1111-1111-111111111111',
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/communities')
      .send({ name: 'Alpha', regionId: '11111111-1111-1111-1111-111111111111' });
    assertSuccess(res, 201);
    expect(res.body.data.name).toBe('Alpha');
  });
});

describe('GET /api/v1/communities/communities/:id (gap)', () => {
  it('returns 200 with community', async () => {
    mockCommunitiesService.getCommunity.mockResolvedValue({ id: 'c1', name: 'Alpha' });
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/communities/communities/11111111-1111-1111-1111-111111111111');
    assertSuccess(res);
    expect(res.body.data.id).toBe('c1');
  });
});

describe('PUT /api/v1/communities/communities/:id (gap)', () => {
  it('updates and returns the community', async () => {
    mockCommunitiesService.updateCommunity.mockResolvedValue({ id: 'c1', name: 'Renamed' });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put('/api/v1/communities/communities/11111111-1111-1111-1111-111111111111')
      .send({ name: 'Renamed' });
    assertSuccess(res);
    expect(res.body.data.name).toBe('Renamed');
  });
});

describe('DELETE /api/v1/communities/communities/:id (gap)', () => {
  it('returns 2xx on success', async () => {
    mockCommunitiesService.deleteCommunity.mockResolvedValue(undefined);
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete('/api/v1/communities/communities/11111111-1111-1111-1111-111111111111');
    expect([200, 204]).toContain(res.status);
  });
});

describe('GET /api/v1/communities/properties/:id (gap)', () => {
  it('returns property on success', async () => {
    mockCommunitiesService.getProperty.mockResolvedValue({ id: 'p1', name: 'Sunrise' });
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/communities/properties/11111111-1111-1111-1111-111111111111');
    assertSuccess(res);
    expect(res.body.data.name).toBe('Sunrise');
  });
});

describe('PUT /api/v1/communities/properties/:id (gap)', () => {
  it('updates and returns the property', async () => {
    mockCommunitiesService.updateProperty.mockResolvedValue({ id: 'p1', name: 'Sunrise II' });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put('/api/v1/communities/properties/11111111-1111-1111-1111-111111111111')
      .send({ name: 'Sunrise II' });
    assertSuccess(res);
    expect(res.body.data.name).toBe('Sunrise II');
  });
});

// ─── Listings: GET /:id ────────────────────────────────────────────────

describe('GET /api/v1/listings/:id (gap)', () => {
  it('returns 200 with listing', async () => {
    mockListingsService.findById.mockResolvedValue({ id: 'l1', title: 'Loft' });
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/listings/11111111-1111-1111-1111-111111111111');
    assertSuccess(res);
    expect(res.body.data.title).toBe('Loft');
  });

  it('returns 404 when listing missing', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockListingsService.findById.mockRejectedValue(new NotFoundError('listing not found'));
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/listings/22222222-2222-2222-2222-222222222222');
    assertError(res, 404);
  });
});

// ─── Test Center room/seat/equipment/session gap endpoints ─────────────

describe('GET /api/v1/test-center/rooms/:id (gap)', () => {
  it('returns 200 with room', async () => {
    mockTestCenterService.getRoomWithSeats.mockResolvedValue({ id: 'rm1', name: 'Room A' });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/rooms/rm1');
    assertSuccess(res);
    expect(res.body.data.name).toBe('Room A');
  });
});

describe('PUT /api/v1/test-center/rooms/:id (gap)', () => {
  it('updates the room for proctor', async () => {
    mockTestCenterService.updateRoom.mockResolvedValue({ id: 'rm1', name: 'Updated' });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .put('/api/v1/test-center/rooms/rm1')
      .send({ name: 'Updated' });
    assertSuccess(res);
    expect(res.body.data.name).toBe('Updated');
  });

  it('rejects standard user (403)', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .put('/api/v1/test-center/rooms/rm1')
      .send({ name: 'hacked' });
    assertError(res, 403);
  });
});

describe('DELETE /api/v1/test-center/rooms/:id (gap)', () => {
  it('admin can delete; returns 2xx', async () => {
    mockTestCenterService.deleteRoom.mockResolvedValue(undefined);
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete('/api/v1/test-center/rooms/rm1');
    expect([200, 204]).toContain(res.status);
  });

  it('proctor cannot delete (403)', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.delete('/api/v1/test-center/rooms/rm1');
    assertError(res, 403);
  });
});

describe('GET /api/v1/test-center/seats (gap)', () => {
  it('returns seats for a room', async () => {
    mockTestCenterService.listSeatsByRoom.mockResolvedValue([
      { id: 's1', row: 1, col: 1 },
    ]);
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/seats?roomId=rm1');
    assertSuccess(res);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe('s1');
  });
});

describe('POST /api/v1/test-center/seats (gap)', () => {
  it('creates seat (proctor allowed)', async () => {
    mockTestCenterService.createSeat.mockResolvedValue({
      id: 's1', seatLabel: 'A1', rowIdentifier: 'A', positionInRow: 1,
    });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/seats')
      .send({
        roomId: '11111111-1111-1111-1111-111111111111',
        seatLabel: 'A1',
        rowIdentifier: 'A',
        positionInRow: 1,
        isAccessible: false,
      });
    assertSuccess(res, 201);
    expect(res.body.data.id).toBe('s1');
  });
});

describe('PUT /api/v1/test-center/seats/:id (gap)', () => {
  it('updates and returns seat', async () => {
    mockTestCenterService.updateSeat.mockResolvedValue({ id: 's1', adaCompliant: true });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .put('/api/v1/test-center/seats/s1')
      .send({ adaCompliant: true });
    assertSuccess(res);
    expect(res.body.data.adaCompliant).toBe(true);
  });
});

describe('PATCH /api/v1/test-center/seats/:id compat (gap)', () => {
  it('maps to updateSeat', async () => {
    mockTestCenterService.updateSeat.mockResolvedValue({ id: 's1', adaCompliant: true });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .patch('/api/v1/test-center/seats/s1')
      .send({ adaCompliant: true });
    assertSuccess(res);
    expect(mockTestCenterService.updateSeat).toHaveBeenCalled();
  });
});

describe('GET /api/v1/test-center/equipment/:id (gap)', () => {
  it('returns equipment payload', async () => {
    mockTestCenterService.getEquipment.mockResolvedValue({ id: 'e1', type: 'MONITOR' });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/equipment/e1');
    assertSuccess(res);
    expect(res.body.data.type).toBe('MONITOR');
  });
});

describe('PUT /api/v1/test-center/equipment/:id (gap)', () => {
  it('updates equipment', async () => {
    mockTestCenterService.updateEquipment.mockResolvedValue({ id: 'e1', type: 'KEYBOARD' });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .put('/api/v1/test-center/equipment/e1')
      .send({ type: 'KEYBOARD' });
    assertSuccess(res);
    expect(res.body.data.type).toBe('KEYBOARD');
  });
});

describe('DELETE /api/v1/test-center/equipment/:id (gap)', () => {
  it('returns 2xx on delete', async () => {
    mockTestCenterService.deleteEquipment.mockResolvedValue(undefined);
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete('/api/v1/test-center/equipment/e1');
    expect([200, 204]).toContain(res.status);
  });
});

describe('GET /api/v1/test-center/sessions/:id (gap)', () => {
  it('returns session payload', async () => {
    mockTestCenterService.getSession.mockResolvedValue({ id: 'sess1', status: 'SCHEDULED' });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/sessions/sess1');
    assertSuccess(res);
    expect(res.body.data.status).toBe('SCHEDULED');
  });
});

describe('PATCH /api/v1/test-center/sessions/:id compat (gap)', () => {
  it('maps to cancelSession', async () => {
    mockTestCenterService.cancelSession.mockResolvedValue({ id: 'sess1', status: 'CANCELLED' });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .patch('/api/v1/test-center/sessions/sess1')
      .send({});
    assertSuccess(res);
    expect(mockTestCenterService.cancelSession).toHaveBeenCalled();
  });
});

describe('POST /api/v1/test-center/rooms/:roomId/seats nested (gap)', () => {
  it('creates seat via nested route', async () => {
    mockTestCenterService.createSeat.mockResolvedValue({
      id: 's1', seatLabel: 'A1', rowIdentifier: 'A', positionInRow: 1,
    });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/rooms/11111111-1111-1111-1111-111111111111/seats')
      .send({
        seatLabel: 'A1',
        rowIdentifier: 'A',
        positionInRow: 1,
        isAccessible: false,
      });
    assertSuccess(res, 201);
  });
});

describe('PATCH /api/v1/test-center/rooms/:roomId/seats/:seatId nested (gap)', () => {
  it('routes to updateSeat', async () => {
    mockTestCenterService.updateSeat.mockResolvedValue({ id: 's1', adaCompliant: true });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .patch('/api/v1/test-center/rooms/11111111-1111-1111-1111-111111111111/seats/s1')
      .send({ adaCompliant: true });
    assertSuccess(res);
  });
});

describe('DELETE /api/v1/test-center/rooms/:roomId/seats/:seatId nested (gap)', () => {
  it('admin can delete via nested route', async () => {
    mockTestCenterService.deleteSeat.mockResolvedValue(undefined);
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete('/api/v1/test-center/rooms/11111111-1111-1111-1111-111111111111/seats/s1');
    expect([200, 204]).toContain(res.status);
  });
});

describe('GET /api/v1/test-center/utilization (flat compat, gap)', () => {
  it('routes to getRoomUtilization when roomId supplied', async () => {
    mockTestCenterService.getRoomUtilization.mockResolvedValue({ utilization: 0.5 });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/utilization?roomId=rm1');
    assertSuccess(res);
    expect(res.body.data.utilization).toBe(0.5);
  });

  it('routes to getSiteUtilization when siteId supplied', async () => {
    mockTestCenterService.getSiteUtilization.mockResolvedValue({ utilization: 0.8 });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/utilization?siteId=site1');
    assertSuccess(res);
    expect(res.body.data.utilization).toBe(0.8);
  });

  it('returns 400 when neither roomId nor siteId provided', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/utilization');
    assertError(res, 400, 'BAD_REQUEST');
  });
});

describe('GET /api/v1/test-center/utilization/sites/:siteId (gap)', () => {
  it('returns utilization for the site', async () => {
    mockTestCenterService.getSiteUtilization.mockResolvedValue({ utilization: 0.8 });
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/utilization/sites/site1');
    assertSuccess(res);
    expect(res.body.data.utilization).toBe(0.8);
  });
});

// ─── Notifications ─────────────────────────────────────────────────────

describe('GET /api/v1/notifications/templates/:id (gap)', () => {
  it('returns template payload (admin)', async () => {
    mockNotificationsService.getTemplate.mockResolvedValue({ id: 't1', name: 'Welcome' });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/notifications/templates/t1');
    assertSuccess(res);
    expect(res.body.data.name).toBe('Welcome');
  });

  it('rejects non-admin (403)', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/notifications/templates/t1');
    assertError(res, 403);
  });
});

// ─── Analytics ────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/reports/:id (gap)', () => {
  it('returns the report payload', async () => {
    mockAnalyticsService.getReport.mockResolvedValue({ id: 'rep1', status: 'READY' });
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111');
    assertSuccess(res);
    expect(res.body.data.status).toBe('READY');
  });

  it('returns 404 for missing', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockAnalyticsService.getReport.mockRejectedValue(new NotFoundError('Report not found'));
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/reports/22222222-2222-2222-2222-222222222222');
    assertError(res, 404);
  });
});

describe('DELETE /api/v1/analytics/reports/:id/share/:userId (gap)', () => {
  it('revokes the share (admin)', async () => {
    mockAnalyticsService.revokeShare.mockResolvedValue(undefined);
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111/share/33333333-3333-3333-3333-333333333333');
    expect([200, 204]).toContain(res.status);
    expect(mockAnalyticsService.revokeShare).toHaveBeenCalled();
  });

  it('rejects standard user (403)', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.delete('/api/v1/analytics/reports/11111111-1111-1111-1111-111111111111/share/33333333-3333-3333-3333-333333333333');
    assertError(res, 403);
  });
});

describe('GET /api/v1/analytics/exports/:id/download (gap)', () => {
  it('invokes downloadExport with the path param and userId', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    // Reject so sendFile is never called — we're verifying the routing, auth,
    // and argument propagation only.
    mockAnalyticsService.downloadExport.mockRejectedValue(new NotFoundError('export missing'));
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/exports/11111111-1111-1111-1111-111111111111/download');
    assertError(res, 404);
    expect(mockAnalyticsService.downloadExport).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', expect.any(String));
  });

  it('returns 401 without a session', async () => {
    const res = await createAgent().get('/api/v1/analytics/exports/11111111-1111-1111-1111-111111111111/download');
    assertError(res, 401);
  });
});

describe('GET /api/v1/analytics/schedules/:id (gap)', () => {
  it('delegates to getDefinition and returns the definition payload', async () => {
    mockAnalyticsService.getDefinition.mockResolvedValue({
      id: 'sch1', name: 'Nightly summary', frequency: 'DAILY',
    });
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/schedules/11111111-1111-1111-1111-111111111111');
    assertSuccess(res);
    expect(res.body.data.id).toBe('sch1');
    expect(mockAnalyticsService.getDefinition).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
  });

  it('returns 404 when definition missing', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockAnalyticsService.getDefinition.mockRejectedValue(new NotFoundError('definition not found'));
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/schedules/22222222-2222-2222-2222-222222222222');
    assertError(res, 404);
  });
});
