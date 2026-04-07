/**
 * Extended API tests for Test Center: sites, rooms, seats, and equipment.
 * Covers CRUD + RBAC + validation edge cases not already in test-center.test.ts.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  mockTestCenterService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleSite = {
  id: 'site-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Downtown Center',
  address: '100 Main St',
  timezone: 'America/New_York',
  rooms: [],
};

const sampleRoom = {
  id: 'room-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  siteId: sampleSite.id,
  name: 'Room A',
  capacity: 30,
  hasAda: true,
  site: sampleSite,
};

const sampleEquipment = {
  id: 'eq-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  seatId: 'seat-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  type: 'COMPUTER',
  serialNumber: 'SN-001',
  status: 'OPERATIONAL',
};

// ─── Sites CRUD ───────────────────────────────────────────────────────────────

describe('GET /api/v1/test-center/sites', () => {
  it('should return 200 with list of sites for proctor', async () => {
    mockTestCenterService.listSites.mockResolvedValue([sampleSite]);

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/sites');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('name', 'Downtown Center');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/test-center/sites');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should return 200 for STANDARD_USER (GET sites is open to any auth)', async () => {
    mockTestCenterService.listSites.mockResolvedValue([]);
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/test-center/sites');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/test-center/sites', () => {
  const validPayload = {
    name: 'Downtown Center',
    address: '100 Main St',
    timezone: 'America/New_York',
  };

  it('should return 201 for SYSTEM_ADMIN', async () => {
    mockTestCenterService.createSite.mockResolvedValue(sampleSite);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/test-center/sites').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('name', 'Downtown Center');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/test-center/sites').send(validPayload);
    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 when name is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/test-center/sites').send({ address: '100 Main' });
    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

describe('GET /api/v1/test-center/sites/:id', () => {
  const siteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 when site exists', async () => {
    mockTestCenterService.getSite.mockResolvedValue(sampleSite);

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get(`/api/v1/test-center/sites/${siteId}`);

    assertSuccess(res, 200);
  });

  it('should return 404 when site does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockTestCenterService.getSite.mockRejectedValue(new NotFoundError('Test site not found'));

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get(`/api/v1/test-center/sites/${siteId}`);

    assertError(res, 404, 'NOT_FOUND');
  });
});

describe('PUT /api/v1/test-center/sites/:id', () => {
  const siteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for admin', async () => {
    mockTestCenterService.updateSite.mockResolvedValue({ ...sampleSite, name: 'Renamed' });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put(`/api/v1/test-center/sites/${siteId}`)
      .send({ name: 'Renamed', address: '100 Main St', timezone: 'America/New_York' });

    assertSuccess(res, 200);
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .put(`/api/v1/test-center/sites/${siteId}`)
      .send({ name: 'Renamed', address: '100 Main St', timezone: 'America/New_York' });

    assertError(res, 403, 'FORBIDDEN');
  });
});

describe('DELETE /api/v1/test-center/sites/:id', () => {
  const siteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 204 for admin', async () => {
    mockTestCenterService.deleteSite.mockResolvedValue(undefined);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete(`/api/v1/test-center/sites/${siteId}`);

    expect(res.status).toBe(204);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().delete(`/api/v1/test-center/sites/${siteId}`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Rooms CRUD ───────────────────────────────────────────────────────────────

describe('POST /api/v1/test-center/rooms', () => {
  const validPayload = {
    siteId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    name: 'Room A',
    capacity: 30,
    hasAda: true,
  };

  it('should return 201 for admin', async () => {
    mockTestCenterService.createRoom.mockResolvedValue(sampleRoom);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/test-center/rooms').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('capacity', 30);
  });

  it('should return 422 for negative capacity', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/test-center/rooms')
      .send({ ...validPayload, capacity: -1 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for non-UUID siteId', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/test-center/rooms')
      .send({ ...validPayload, siteId: 'not-a-uuid' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 404 when site does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockTestCenterService.createRoom.mockRejectedValue(new NotFoundError('Test site not found'));

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/test-center/rooms').send(validPayload);

    assertError(res, 404, 'NOT_FOUND');
  });
});

describe('GET /api/v1/test-center/rooms', () => {
  it('should return 200 with list of rooms', async () => {
    mockTestCenterService.listRooms.mockResolvedValue([sampleRoom]);

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/rooms');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveLength(1);
  });
});

// ─── Equipment ────────────────────────────────────────────────────────────────

describe('POST /api/v1/test-center/equipment', () => {
  const validPayload = {
    seatId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    equipmentType: 'COMPUTER',
    serialNumber: 'SN-001',
    status: 'OPERATIONAL',
  };

  it('should return 201 for proctor', async () => {
    mockTestCenterService.createEquipment.mockResolvedValue(sampleEquipment);

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.post('/api/v1/test-center/equipment').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('serialNumber', 'SN-001');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/test-center/equipment').send(validPayload);
    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for missing equipmentType', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/equipment')
      .send({ seatId: validPayload.seatId, serialNumber: 'SN-001', status: 'OPERATIONAL' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

describe('GET /api/v1/test-center/equipment', () => {
  it('should return 200 for proctor', async () => {
    mockTestCenterService.listEquipmentBySeat.mockResolvedValue([sampleEquipment]);

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/test-center/equipment?seatId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');

    assertSuccess(res, 200);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/test-center/equipment');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Session cancel ───────────────────────────────────────────────────────────

describe('PATCH /api/v1/test-center/sessions/:id/cancel', () => {
  const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for proctor', async () => {
    mockTestCenterService.cancelSession.mockResolvedValue({ id: sessionId, status: 'CANCELLED' });

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.patch(`/api/v1/test-center/sessions/${sessionId}/cancel`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'CANCELLED');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.patch(`/api/v1/test-center/sessions/${sessionId}/cancel`);
    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: PATCH /sites/:id ──────────────────────────────────────────────

describe('PATCH /api/v1/test-center/sites/:id (compat alias for PUT)', () => {
  const siteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for admin using PATCH', async () => {
    mockTestCenterService.updateSite.mockResolvedValue({ ...sampleSite, name: 'Patched' });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/test-center/sites/${siteId}`)
      .send({ name: 'Patched' });

    assertSuccess(res, 200);
  });

  it('should return 200 for proctor using PATCH', async () => {
    mockTestCenterService.updateSite.mockResolvedValue({ ...sampleSite });

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .patch(`/api/v1/test-center/sites/${siteId}`)
      .send({ name: 'Updated' });

    assertSuccess(res, 200);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/test-center/sites/${siteId}`)
      .send({ name: 'Attempt' });

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: PATCH /equipment/:id ─────────────────────────────────────────

describe('PATCH /api/v1/test-center/equipment/:id (compat alias for PUT)', () => {
  const eqId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for proctor using PATCH', async () => {
    mockTestCenterService.updateEquipment.mockResolvedValue({
      ...sampleEquipment,
      status: 'NEEDS_REPAIR',
    });

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .patch(`/api/v1/test-center/equipment/${eqId}`)
      .send({ status: 'NEEDS_REPAIR' });

    assertSuccess(res, 200);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/test-center/equipment/${eqId}`)
      .send({ status: 'OPERATIONAL' });

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: DELETE /seats/:id ─────────────────────────────────────────────

describe('DELETE /api/v1/test-center/seats/:id', () => {
  const seatId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 204 for admin', async () => {
    mockTestCenterService.deleteSeat.mockResolvedValue(undefined);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete(`/api/v1/test-center/seats/${seatId}`);

    expect(res.status).toBe(204);
  });

  it('should return 403 for TEST_PROCTOR', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.delete(`/api/v1/test-center/seats/${seatId}`);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().delete(`/api/v1/test-center/seats/${seatId}`);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: DELETE /sessions/:id ─────────────────────────────────────────

describe('DELETE /api/v1/test-center/sessions/:id (compat → cancelSession)', () => {
  const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 and cancel session for proctor', async () => {
    mockTestCenterService.cancelSession.mockResolvedValue({
      id: sessionId,
      status: 'CANCELLED',
    });

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.delete(`/api/v1/test-center/sessions/${sessionId}`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'CANCELLED');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.delete(`/api/v1/test-center/sessions/${sessionId}`);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().delete(`/api/v1/test-center/sessions/${sessionId}`);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: GET /sites/:siteId/rooms ─────────────────────────────────────

describe('GET /api/v1/test-center/sites/:siteId/rooms (nested compat)', () => {
  const siteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 and pass siteId as query filter', async () => {
    mockTestCenterService.listRooms.mockResolvedValue([sampleRoom]);

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get(`/api/v1/test-center/sites/${siteId}/rooms`);

    assertSuccess(res, 200);
    expect(mockTestCenterService.listRooms).toHaveBeenCalledWith(siteId);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get(`/api/v1/test-center/sites/${siteId}/rooms`);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: POST /sites/:siteId/rooms ────────────────────────────────────

describe('POST /api/v1/test-center/sites/:siteId/rooms (nested compat)', () => {
  const siteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const payload = { name: 'Room B', capacity: 20, hasAda: false };

  it('should return 201 and inject siteId into body', async () => {
    mockTestCenterService.createRoom.mockResolvedValue(sampleRoom);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/test-center/sites/${siteId}/rooms`)
      .send(payload);

    assertSuccess(res, 201);
    expect(mockTestCenterService.createRoom).toHaveBeenCalledWith(
      expect.objectContaining({ siteId }),
    );
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/test-center/sites/${siteId}/rooms`)
      .send(payload);

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: PATCH /sites/:siteId/rooms/:roomId ───────────────────────────

describe('PATCH /api/v1/test-center/sites/:siteId/rooms/:roomId (nested compat)', () => {
  const siteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const roomId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

  it('should return 200 for proctor', async () => {
    mockTestCenterService.updateRoom.mockResolvedValue({ ...sampleRoom, name: 'Updated' });

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .patch(`/api/v1/test-center/sites/${siteId}/rooms/${roomId}`)
      .send({ name: 'Updated' });

    assertSuccess(res, 200);
    expect(mockTestCenterService.updateRoom).toHaveBeenCalledWith(roomId, expect.any(Object));
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/test-center/sites/${siteId}/rooms/${roomId}`)
      .send({ name: 'Attempt' });

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: DELETE /sites/:siteId/rooms/:roomId ──────────────────────────

describe('DELETE /api/v1/test-center/sites/:siteId/rooms/:roomId (nested compat)', () => {
  const siteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const roomId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

  it('should return 204 for admin', async () => {
    mockTestCenterService.deleteRoom.mockResolvedValue(undefined);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete(
      `/api/v1/test-center/sites/${siteId}/rooms/${roomId}`,
    );

    expect(res.status).toBe(204);
    expect(mockTestCenterService.deleteRoom).toHaveBeenCalledWith(roomId);
  });

  it('should return 403 for TEST_PROCTOR', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.delete(
      `/api/v1/test-center/sites/${siteId}/rooms/${roomId}`,
    );

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: GET /rooms/:roomId/seats ─────────────────────────────────────

describe('GET /api/v1/test-center/rooms/:roomId/seats (nested compat)', () => {
  const roomId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 and pass roomId as query filter', async () => {
    mockTestCenterService.listSeatsByRoom.mockResolvedValue([]);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/test-center/rooms/${roomId}/seats`);

    assertSuccess(res, 200);
    expect(mockTestCenterService.listSeatsByRoom).toHaveBeenCalledWith(roomId);
  });
});

// ─── COMPAT: DELETE /sessions/:sessionId/registrations/:registrationId ─────

describe('DELETE /api/v1/test-center/sessions/:sessionId/registrations/:registrationId', () => {
  const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const registrationId = 'cccccccc-dddd-eeee-ffff-000000000000';

  it('should return 204 for authenticated user', async () => {
    mockTestCenterService.cancelRegistrationById.mockResolvedValue(undefined);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.delete(
      `/api/v1/test-center/sessions/${sessionId}/registrations/${registrationId}`,
    );

    expect(res.status).toBe(204);
    expect(mockTestCenterService.cancelRegistrationById).toHaveBeenCalledWith(
      registrationId,
      expect.any(String),
      false,  // STANDARD_USER is not privileged
    );
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().delete(
      `/api/v1/test-center/sessions/${sessionId}/registrations/${registrationId}`,
    );

    assertError(res, 401, 'UNAUTHORIZED');
  });
});
