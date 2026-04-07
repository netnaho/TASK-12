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

const sampleSession = {
  id: 'sess-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  roomId: 'room-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Math Exam',
  scheduledStart: '2024-06-01T09:00:00.000Z',
  scheduledEnd: '2024-06-01T12:00:00.000Z',
  maxCapacity: 30,
  status: 'SCHEDULED',
  createdAt: new Date().toISOString(),
};

const sampleRegistration = {
  id: 'reg-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  sessionId: sampleSession.id,
  userId: 'user-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  registeredAt: new Date().toISOString(),
};

// ─── Sessions ───────────────────────────────────────────────────────────

describe('POST /api/v1/test-center/sessions', () => {
  const validPayload = {
    roomId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    name: 'Math Exam',
    scheduledStart: '2024-06-01T09:00:00.000Z',
    scheduledEnd: '2024-06-01T12:00:00.000Z',
    maxCapacity: 30,
  };

  it('should return 201 for proctor with valid data', async () => {
    mockTestCenterService.createSession.mockResolvedValue(sampleSession);

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/sessions')
      .send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('name', 'Math Exam');
  });

  it('should return 201 for admin', async () => {
    mockTestCenterService.createSession.mockResolvedValue(sampleSession);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/test-center/sessions')
      .send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post('/api/v1/test-center/sessions')
      .send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 409 when overlapping session (buffer violation)', async () => {
    const { ConflictError } = await import('../../src/shared/errors');
    mockTestCenterService.createSession.mockRejectedValue(
      new ConflictError('Session overlaps with existing session including buffer time'),
    );

    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/sessions')
      .send(validPayload);

    assertError(res, 409, 'CONFLICT');
  });

  it('should return 422 for invalid roomId', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/sessions')
      .send({ ...validPayload, roomId: 'bad-id' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid scheduledStart', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/sessions')
      .send({ ...validPayload, scheduledStart: 'not-a-date' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for negative maxCapacity', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/sessions')
      .send({ ...validPayload, maxCapacity: -5 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when missing required fields', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post('/api/v1/test-center/sessions')
      .send({ name: 'Math Exam' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── Registration ───────────────────────────────────────────────────────

describe('POST /api/v1/test-center/sessions/:id/register', () => {
  const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const userId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

  it('should return 201 for authenticated user', async () => {
    mockTestCenterService.registerForSession.mockResolvedValue(sampleRegistration);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/test-center/sessions/${sessionId}/register`)
      .send({ userId });

    assertSuccess(res, 201);
  });

  it('should return 409 when session is full (capacity reached)', async () => {
    const { ConflictError } = await import('../../src/shared/errors');
    mockTestCenterService.registerForSession.mockRejectedValue(
      new ConflictError('Session has reached maximum capacity'),
    );

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/test-center/sessions/${sessionId}/register`)
      .send({ userId });

    assertError(res, 409, 'CONFLICT');
  });

  it('should return 422 for invalid userId', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/test-center/sessions/${sessionId}/register`)
      .send({ userId: 'not-a-uuid' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post(`/api/v1/test-center/sessions/${sessionId}/register`)
      .send({ userId });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Utilization ────────────────────────────────────────────────────────

describe('GET /api/v1/test-center/utilization/rooms/:roomId', () => {
  const roomId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 with utilization data', async () => {
    const utilization = {
      roomId,
      totalSlots: 100,
      usedSlots: 65,
      utilizationRate: 0.65,
    };
    mockTestCenterService.getRoomUtilization.mockResolvedValue(utilization);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .get(`/api/v1/test-center/utilization/rooms/${roomId}`)
      .query({ startDate: '2024-01-01T00:00:00.000Z', endDate: '2024-12-31T23:59:59.000Z' });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('utilizationRate', 0.65);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .get(`/api/v1/test-center/utilization/rooms/${roomId}`)
      .query({ startDate: '2024-01-01T00:00:00.000Z', endDate: '2024-12-31T23:59:59.000Z' });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Sessions listing ───────────────────────────────────────────────────

describe('GET /api/v1/test-center/sessions', () => {
  it('should return 200 with paginated sessions', async () => {
    mockTestCenterService.listSessions.mockResolvedValue({
      data: [sampleSession],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/test-center/sessions');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/test-center/sessions');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Registration Authorization ─────────────────────────────────────────────

describe('Registration Authorization', () => {
  const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  // UUIDs that match the session user IDs set up by loginAs helper:
  // loginAs uses username 'agent' → userId 'user-agent-id' (STANDARD_USER)
  // loginAs uses username 'proctor' → userId 'user-proctor-id' (TEST_PROCTOR)
  const arbitraryUserId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

  it('non-privileged user can register by sending any valid UUID in body', async () => {
    // Validation requires a UUID in the body, but controller replaces it with req.userId
    mockTestCenterService.registerForSession.mockResolvedValueOnce(sampleRegistration);
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/test-center/sessions/${sessionId}/register`)
      .send({ userId: arbitraryUserId });  // valid UUID passes Zod; controller overrides it
    assertSuccess(res, 201);
    // Controller must call service with session userId, not the body userId
    expect(mockTestCenterService.registerForSession).toHaveBeenCalledWith(
      sessionId,
      'user-agent-id',
    );
  });

  it('non-privileged user supplying a different userId is forced to register as themselves', async () => {
    mockTestCenterService.registerForSession.mockResolvedValueOnce(sampleRegistration);
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/test-center/sessions/${sessionId}/register`)
      .send({ userId: arbitraryUserId });
    assertSuccess(res, 201);
    // Despite sending arbitraryUserId, service should be called with session userId
    expect(mockTestCenterService.registerForSession).toHaveBeenCalledWith(
      sessionId,
      'user-agent-id',
    );
  });

  it('privileged user (TEST_PROCTOR) can register an arbitrary userId', async () => {
    mockTestCenterService.registerForSession.mockResolvedValueOnce(sampleRegistration);
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent
      .post(`/api/v1/test-center/sessions/${sessionId}/register`)
      .send({ userId: arbitraryUserId });
    assertSuccess(res, 201);
    expect(mockTestCenterService.registerForSession).toHaveBeenCalledWith(
      sessionId,
      arbitraryUserId,
    );
  });

  it('non-privileged user can cancel their own registration by session', async () => {
    mockTestCenterService.cancelRegistration.mockResolvedValueOnce(undefined);
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .delete(`/api/v1/test-center/sessions/${sessionId}/register`);
    expect(res.status).toBe(204);
    expect(mockTestCenterService.cancelRegistration).toHaveBeenCalledWith(
      sessionId,
      'user-agent-id',
      'user-agent-id',
    );
  });

  it('non-privileged user cannot cancel another user registration via ?userId= query', async () => {
    mockTestCenterService.cancelRegistration.mockResolvedValueOnce(undefined);
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .delete(`/api/v1/test-center/sessions/${sessionId}/register?userId=${arbitraryUserId}`);
    expect(res.status).toBe(204);
    // Query param override must be ignored — session userId used instead
    expect(mockTestCenterService.cancelRegistration).toHaveBeenCalledWith(
      sessionId,
      'user-agent-id',
      'user-agent-id',
    );
  });

  it('non-privileged user gets 403 cancelling another user registration by ID', async () => {
    const { ForbiddenError } = await import('../../src/shared/errors');
    mockTestCenterService.cancelRegistrationById.mockRejectedValueOnce(
      new ForbiddenError('You can only cancel your own registration'),
    );
    const agent = await loginAs('STANDARD_USER');
    const registrationId = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
    const res = await agent
      .delete(`/api/v1/test-center/sessions/${sessionId}/registrations/${registrationId}`);
    assertError(res, 403, 'FORBIDDEN');
    expect(mockTestCenterService.cancelRegistrationById).toHaveBeenCalledWith(
      registrationId,
      'user-agent-id',
      false,
    );
  });

  it('privileged user (TEST_PROCTOR) can cancel any registration by ID', async () => {
    mockTestCenterService.cancelRegistrationById.mockResolvedValueOnce(undefined);
    const agent = await loginAs('TEST_PROCTOR');
    const registrationId = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
    const res = await agent
      .delete(`/api/v1/test-center/sessions/${sessionId}/registrations/${registrationId}`);
    expect(res.status).toBe(204);
    expect(mockTestCenterService.cancelRegistrationById).toHaveBeenCalledWith(
      registrationId,
      'user-proctor-id',
      true,
    );
  });
});
