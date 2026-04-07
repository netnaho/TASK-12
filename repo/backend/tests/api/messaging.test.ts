import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockMessagingService,
} from './helpers/setup';
import { NotFoundError } from '../../src/shared/errors';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleMessage = {
  id: 'msg-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  recipientAddr: 'user@example.com',
  channel: 'EMAIL',
  status: 'QUEUED',
  createdAt: new Date().toISOString(),
};

const sampleBlacklistEntry = {
  id: 'bl-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  address: 'blocked@example.com',
  channel: 'EMAIL',
  reason: 'Bounced',
  createdAt: new Date().toISOString(),
};

const sampleQuietHours = {
  id: 'qh-aaaa',
  timezone: 'America/New_York',
  quietStartHr: 22,
  quietEndHr: 7,
  isGlobal: true,
};

// ─── Enqueue Message ────────────────────────────────────────────────────

describe('POST /api/v1/messaging/enqueue', () => {
  const validPayload = {
    recipientAddr: 'user@example.com',
    channel: 'EMAIL',
    subject: 'Test Subject',
  };

  it('should return 201 for authenticated user', async () => {
    mockMessagingService.enqueueMessage.mockResolvedValue(sampleMessage);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/messaging/enqueue').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('channel', 'EMAIL');
  });

  it('should return 201 for admin', async () => {
    mockMessagingService.enqueueMessage.mockResolvedValue(sampleMessage);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/messaging/enqueue').send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 422 when recipientAddr is missing', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/messaging/enqueue').send({
      channel: 'EMAIL',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when channel is invalid', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/messaging/enqueue').send({
      recipientAddr: 'user@example.com',
      channel: 'PIGEON',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post('/api/v1/messaging/enqueue')
      .send(validPayload);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Failure Alerts ─────────────────────────────────────────────────────

describe('GET /api/v1/messaging/failures', () => {
  it('should return 200 for admin', async () => {
    mockMessagingService.getFailureAlerts.mockResolvedValue([
      { id: 'alert-1', failureCount: 5, lastFailure: new Date().toISOString() },
    ]);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/messaging/failures');

    assertSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/messaging/failures');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/messaging/failures');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.get('/api/v1/messaging/failures');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/messaging/failures');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Blacklist ──────────────────────────────────────────────────────────

describe('POST /api/v1/messaging/blacklist', () => {
  const validPayload = {
    address: 'blocked@example.com',
    channel: 'EMAIL',
    reason: 'Hard bounce',
  };

  it('should return 201 for admin', async () => {
    mockMessagingService.addToBlacklist.mockResolvedValue(sampleBlacklistEntry);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/messaging/blacklist').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('address', 'blocked@example.com');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/messaging/blacklist').send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 when address is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/messaging/blacklist').send({
      channel: 'EMAIL',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid channel (IN_APP not valid for blacklist)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/messaging/blacklist').send({
      address: 'blocked@example.com',
      channel: 'IN_APP',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post('/api/v1/messaging/blacklist')
      .send(validPayload);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Quiet Hours ────────────────────────────────────────────────────────

describe('GET /api/v1/messaging/quiet-hours', () => {
  it('should return 200 for any authenticated user', async () => {
    mockMessagingService.getQuietHoursConfig.mockResolvedValue(sampleQuietHours);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/messaging/quiet-hours');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('quietStartHr', 22);
    expect(res.body.data).toHaveProperty('quietEndHr', 7);
  });

  it('should return 200 for admin', async () => {
    mockMessagingService.getQuietHoursConfig.mockResolvedValue(sampleQuietHours);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/messaging/quiet-hours');

    assertSuccess(res, 200);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/messaging/quiet-hours');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Enqueue with ENTERPRISE_IM ─────────────────────────────────────────────

describe('POST /api/v1/messaging/enqueue — ENTERPRISE_IM channel', () => {
  it('should return 201 for ENTERPRISE_IM channel', async () => {
    mockMessagingService.enqueueMessage.mockResolvedValue({
      id: 'msg-im',
      channel: 'ENTERPRISE_IM',
      status: 'QUEUED',
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/messaging/enqueue').send({
      recipientAddr: 'team-channel@corp.example.com',
      channel: 'ENTERPRISE_IM',
      subject: 'Approval Required',
      variables: { body: 'Please review the pending approval.' },
    });

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('channel', 'ENTERPRISE_IM');
  });

  it('should return 422 for FILE channel (not supported for outbound)', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/messaging/enqueue').send({
      recipientAddr: 'user@example.com',
      channel: 'FILE',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── Package download ────────────────────────────────────────────────────────

describe('GET /api/v1/messaging/:id/package', () => {
  const msgId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 404 when message does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockMessagingService.getMessageStatus.mockRejectedValue(
      new NotFoundError('Message not found'),
    );

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/messaging/${msgId}/package`);

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get(`/api/v1/messaging/${msgId}/package`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Delivery status update ──────────────────────────────────────────────────

describe('PATCH /api/v1/messaging/:id/delivery', () => {
  const msgId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 when marking as MANUALLY_SENT', async () => {
    mockMessagingService.updateDeliveryStatus.mockResolvedValue({
      id: msgId,
      status: 'MANUALLY_SENT',
      deliveredAt: new Date().toISOString(),
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/messaging/${msgId}/delivery`)
      .send({ status: 'MANUALLY_SENT' });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'MANUALLY_SENT');
  });

  it('should return 200 when marking as DELIVERED', async () => {
    mockMessagingService.updateDeliveryStatus.mockResolvedValue({
      id: msgId,
      status: 'DELIVERED',
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/messaging/${msgId}/delivery`)
      .send({ status: 'DELIVERED' });

    assertSuccess(res, 200);
  });

  it('should return 422 for invalid delivery status', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/messaging/${msgId}/delivery`)
      .send({ status: 'UNKNOWN_STATUS' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .patch(`/api/v1/messaging/${msgId}/delivery`)
      .send({ status: 'DELIVERED' });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: /messages/* prefix aliases ────────────────────────────────────

describe('POST /api/v1/messaging/messages (compat alias for /enqueue)', () => {
  const validPayload = {
    recipientAddr: 'user@example.com',
    channel: 'EMAIL',
    subject: 'Test Subject',
  };

  it('should return 201 for authenticated user', async () => {
    mockMessagingService.enqueueMessage.mockResolvedValue(sampleMessage);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/messaging/messages').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('channel', 'EMAIL');
  });

  it('should return 422 for missing recipientAddr', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post('/api/v1/messaging/messages')
      .send({ channel: 'EMAIL' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().post('/api/v1/messaging/messages').send(validPayload);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('GET /api/v1/messaging/messages (compat alias for GET /)', () => {
  it('should return 200 with paginated messages', async () => {
    mockMessagingService.listMessages.mockResolvedValue({
      data: [sampleMessage],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/messaging/messages');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/messaging/messages');

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('GET /api/v1/messaging/messages/:id (compat alias for GET /:id)', () => {
  const msgId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for authenticated user', async () => {
    mockMessagingService.getMessageStatus.mockResolvedValue(sampleMessage);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/messaging/messages/${msgId}`);

    assertSuccess(res, 200);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get(`/api/v1/messaging/messages/${msgId}`);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('PATCH /api/v1/messaging/messages/:id/delivery (compat alias)', () => {
  const msgId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 when updating delivery status', async () => {
    mockMessagingService.updateDeliveryStatus.mockResolvedValue({
      ...sampleMessage,
      status: 'DELIVERED',
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/messaging/messages/${msgId}/delivery`)
      .send({ status: 'DELIVERED' });

    assertSuccess(res, 200);
  });

  it('should return 422 for invalid status', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/messaging/messages/${msgId}/delivery`)
      .send({ status: 'UNKNOWN' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .patch(`/api/v1/messaging/messages/${msgId}/delivery`)
      .send({ status: 'DELIVERED' });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Authorization (BOLA/IDOR prevention) ───────────────────────────────────

describe('Authorization', () => {
  const msgId = 'msg-auth-test-id';

  const ownedMessage = {
    id: msgId,
    recipientUserId: 'user-agent-id',  // matches STANDARD_USER session (loginAs uses 'agent')
    recipientAddr: 'agent@test.com',
    channel: 'EMAIL',
    status: 'QUEUED',
    fileOutputPath: null,
    createdAt: new Date().toISOString(),
  };

  const otherUserMessage = {
    ...ownedMessage,
    id: 'msg-other-user-id',
    recipientUserId: 'user-manager-id',  // belongs to LEASING_OPS_MANAGER
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /messaging/:id ───────────────────────────────────────────

  it('non-admin gets 404 when accessing another user message by ID', async () => {
    mockMessagingService.getMessageStatus.mockRejectedValueOnce(new NotFoundError('Message not found'));
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/messaging/${otherUserMessage.id}`);
    assertError(res, 404);
  });

  it('admin gets 200 when accessing any message by ID', async () => {
    mockMessagingService.getMessageStatus.mockResolvedValueOnce(otherUserMessage);
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get(`/api/v1/messaging/${otherUserMessage.id}`);
    assertSuccess(res, 200);
  });

  it('non-admin gets own message by ID (200)', async () => {
    mockMessagingService.getMessageStatus.mockResolvedValueOnce(ownedMessage);
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/messaging/${msgId}`);
    assertSuccess(res, 200);
  });

  // ── PATCH /messaging/:id/delivery ────────────────────────────────

  it('non-admin gets 404 when updating delivery of another user message', async () => {
    mockMessagingService.updateDeliveryStatus.mockRejectedValueOnce(new NotFoundError('Message not found'));
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/messaging/${otherUserMessage.id}/delivery`)
      .send({ status: 'DELIVERED' });
    assertError(res, 404);
  });

  it('admin can update delivery status of any message', async () => {
    mockMessagingService.updateDeliveryStatus.mockResolvedValueOnce({
      ...otherUserMessage, status: 'DELIVERED',
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/messaging/${otherUserMessage.id}/delivery`)
      .send({ status: 'DELIVERED' });
    assertSuccess(res, 200);
  });

  // ── GET /messaging/:id/package ───────────────────────────────────

  it('non-admin gets 404 when downloading package for another user message', async () => {
    mockMessagingService.getMessageStatus.mockRejectedValueOnce(new NotFoundError('Message not found'));
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/messaging/${otherUserMessage.id}/package`);
    assertError(res, 404);
  });

  // ── GET /messaging (list) ─────────────────────────────────────────

  it('non-admin list only returns own messages', async () => {
    mockMessagingService.listMessages.mockResolvedValueOnce({
      data: [ownedMessage],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/messaging/');
    assertPaginated(res, 200);
    // Verify service was called (controller will pass isAdmin=false for STANDARD_USER)
    expect(mockMessagingService.listMessages).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      false,
    );
  });

  it('admin list passes isAdmin=true to service', async () => {
    mockMessagingService.listMessages.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/messaging/');
    expect(mockMessagingService.listMessages).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      true,
    );
  });
});
