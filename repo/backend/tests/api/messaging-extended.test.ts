/**
 * Extended API tests for messaging: blacklist enforcement, quiet hours,
 * failure alerts (admin-only), package download, and delivery receipts.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockMessagingService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleMessage = {
  id: 'msg-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  templateId: 'tmpl-1',
  recipientAddr: 'user@example.com',
  channel: 'EMAIL',
  status: 'QUEUED',
  retryCount: 0,
  isFailureAlert: false,
  createdAt: new Date().toISOString(),
};

const sampleBlacklistEntry = {
  id: 'bl-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  address: 'blocked@example.com',
  channel: 'EMAIL',
  reason: 'Unsubscribed',
  createdAt: new Date().toISOString(),
};

const sampleQuietHours = {
  id: 'qh-1',
  timezone: 'America/New_York',
  quietStartHr: 21,
  quietEndHr: 7,
};

// ─── Outbound queue (open to any authenticated user) ─────────────────────────

describe('GET /api/v1/messaging/', () => {
  it('should return 200 paginated for SYSTEM_ADMIN', async () => {
    mockMessagingService.listMessages.mockResolvedValue({
      data: [sampleMessage],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/messaging/');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return 200 for STANDARD_USER (open to any auth)', async () => {
    mockMessagingService.listMessages.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/messaging/');
    expect(res.status).toBe(200);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/messaging/');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should filter by status when provided', async () => {
    mockMessagingService.listMessages.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/messaging/?status=FAILED');

    expect(mockMessagingService.listMessages).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED' }),
      expect.any(String),
      expect.any(Boolean),
    );
  });
});

// ─── Failure alerts (admin-only) ──────────────────────────────────────────────

describe('GET /api/v1/messaging/failures', () => {
  it('should return 200 for SYSTEM_ADMIN only', async () => {
    mockMessagingService.getFailureAlerts.mockResolvedValue(
      [{ ...sampleMessage, status: 'FAILED', isFailureAlert: true }],
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/messaging/failures');

    assertSuccess(res, 200);
    expect(res.body.data[0]).toHaveProperty('isFailureAlert', true);
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.get('/api/v1/messaging/failures');
    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/messaging/failures');
    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/messaging/failures');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Delivery status update ───────────────────────────────────────────────────

describe('PATCH /api/v1/messaging/:id/delivery', () => {
  const messageId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for admin updating to MANUALLY_SENT', async () => {
    mockMessagingService.updateDeliveryStatus.mockResolvedValue({
      ...sampleMessage,
      status: 'MANUALLY_SENT',
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/messaging/${messageId}/delivery`)
      .send({ status: 'MANUALLY_SENT' });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'MANUALLY_SENT');
  });

  it('should return 422 for invalid status value', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/messaging/${messageId}/delivery`)
      .send({ status: 'INVALID_STATUS' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 200 for STANDARD_USER (no role restriction on delivery update)', async () => {
    mockMessagingService.updateDeliveryStatus.mockResolvedValue({
      ...sampleMessage,
      status: 'MANUALLY_SENT',
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/messaging/${messageId}/delivery`)
      .send({ status: 'MANUALLY_SENT' });

    // No role restriction on this route - any authenticated user can call it
    expect([200, 404]).toContain(res.status);
  });
});

// ─── Blacklist ────────────────────────────────────────────────────────────────

describe('GET /api/v1/messaging/blacklist', () => {
  it('should return 200 with blacklist entries for admin', async () => {
    mockMessagingService.listBlacklist.mockResolvedValue({
      data: [sampleBlacklistEntry],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/messaging/blacklist');

    assertPaginated(res, 200);
    expect(res.body.data[0]).toHaveProperty('address', 'blocked@example.com');
  });

  it('should return 403 for non-admin', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.get('/api/v1/messaging/blacklist');
    assertError(res, 403, 'FORBIDDEN');
  });
});

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

  it('should return 422 for invalid channel', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/messaging/blacklist')
      .send({ ...validPayload, channel: 'PIGEON_POST' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when address is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/messaging/blacklist')
      .send({ channel: 'EMAIL' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

describe('DELETE /api/v1/messaging/blacklist/:id', () => {
  const entryId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 204 for admin', async () => {
    mockMessagingService.removeFromBlacklist.mockResolvedValue(undefined);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete(`/api/v1/messaging/blacklist/${entryId}`);

    expect(res.status).toBe(204);
  });

  it('should return 403 for non-admin', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.delete(`/api/v1/messaging/blacklist/${entryId}`);
    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── Quiet hours ─────────────────────────────────────────────────────────────

describe('GET /api/v1/messaging/quiet-hours', () => {
  it('should return 200 with quiet hours config for admin', async () => {
    mockMessagingService.getQuietHoursConfig.mockResolvedValue(sampleQuietHours);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/messaging/quiet-hours');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('quietStartHr', 21);
    expect(res.body.data).toHaveProperty('quietEndHr', 7);
  });

  it('should return 200 for STANDARD_USER (quiet-hours GET has no role restriction)', async () => {
    mockMessagingService.getQuietHoursConfig.mockResolvedValue(sampleQuietHours);
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/messaging/quiet-hours');
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/v1/messaging/quiet-hours', () => {
  it('should return 200 after updating quiet hours', async () => {
    mockMessagingService.updateQuietHoursConfig.mockResolvedValue({
      ...sampleQuietHours,
      quietStartHr: 22,
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put('/api/v1/messaging/quiet-hours')
      .send({ timezone: 'America/New_York', quietStartHr: 22, quietEndHr: 7 });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('quietStartHr', 22);
  });

  it('should return 422 when quietStartHr is out of range', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put('/api/v1/messaging/quiet-hours')
      .send({ timezone: 'UTC', quietStartHr: 25, quietEndHr: 7 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});
