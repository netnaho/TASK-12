import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockNotificationsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleNotification = {
  id: 'notif-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  userId: 'user-admin-id',
  title: 'Test notification',
  body: 'This is a test',
  status: 'UNREAD',
  category: 'SYSTEM',
  createdAt: new Date().toISOString(),
};

const sampleTemplate = {
  id: 'tpl-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  slug: 'welcome-email',
  name: 'Welcome Email',
  subjectTpl: 'Welcome {{name}}!',
  bodyTpl: 'Hello {{name}}, welcome to LeaseOps.',
  channel: 'EMAIL',
};

// ─── User Notifications ─────────────────────────────────────────────────

describe('GET /api/v1/notifications', () => {
  it('should return 200 with paginated notifications for authenticated user', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      data: [sampleNotification],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/notifications');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('title', 'Test notification');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/notifications');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should be accessible to any authenticated role', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/notifications');
    assertPaginated(res, 200);
  });
});

describe('GET /api/v1/notifications/unread-count', () => {
  it('should return 200 with unread count', async () => {
    mockNotificationsService.getUnreadCount.mockResolvedValue({ count: 5 });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/notifications/unread-count');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('count', 5);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/notifications/unread-count');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('PATCH /api/v1/notifications/:id/read', () => {
  const notifId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 when marking notification as read', async () => {
    mockNotificationsService.markRead.mockResolvedValue({
      ...sampleNotification,
      status: 'READ',
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.patch(`/api/v1/notifications/${notifId}/read`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'READ');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().patch(`/api/v1/notifications/${notifId}/read`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('PATCH /api/v1/notifications/read-all', () => {
  it('should return 200 when marking all as read', async () => {
    mockNotificationsService.markAllRead.mockResolvedValue({ updated: 3 });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.patch('/api/v1/notifications/read-all');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('updated', 3);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().patch('/api/v1/notifications/read-all');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Templates (Admin Only) ─────────────────────────────────────────────

describe('GET /api/v1/notifications/templates', () => {
  it('should return 200 for admin', async () => {
    mockNotificationsService.listTemplates.mockResolvedValue([sampleTemplate]);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/notifications/templates');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('slug', 'welcome-email');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/notifications/templates');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.get('/api/v1/notifications/templates');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/notifications/templates');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/notifications/templates');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: Snooze with { until } key ─────────────────────────────────────

describe('PATCH /api/v1/notifications/:id/snooze (compat payload)', () => {
  const notifId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should accept canonical snoozedUntil field', async () => {
    mockNotificationsService.snooze.mockResolvedValue({
      ...sampleNotification,
      status: 'SNOOZED',
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ snoozedUntil: '2026-12-31T00:00:00.000Z' });

    assertSuccess(res, 200);
  });

  it('should accept compat until field', async () => {
    mockNotificationsService.snooze.mockResolvedValue({
      ...sampleNotification,
      status: 'SNOOZED',
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ until: '2026-12-31T00:00:00.000Z' });

    assertSuccess(res, 200);
  });

  it('should return 422 when neither snoozedUntil nor until is provided', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ foo: 'bar' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when until is not a valid datetime', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ until: 'not-a-date' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ until: '2026-12-31T00:00:00.000Z' });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: PATCH /templates/:id ──────────────────────────────────────────

describe('PATCH /api/v1/notifications/templates/:id (compat alias for PUT)', () => {
  const tplId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for admin using PATCH', async () => {
    mockNotificationsService.updateTemplate.mockResolvedValue({
      ...sampleTemplate,
      name: 'Updated',
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/notifications/templates/${tplId}`)
      .send({ name: 'Updated' });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('name', 'Updated');
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .patch(`/api/v1/notifications/templates/${tplId}`)
      .send({ name: 'Attempt' });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/templates/${tplId}`)
      .send({ name: 'Attempt' });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .patch(`/api/v1/notifications/templates/${tplId}`)
      .send({ name: 'Attempt' });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── DELETE /templates/:id ──────────────────────────────────────────────────

describe('DELETE /api/v1/notifications/templates/:id', () => {
  const tplId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 204 for admin', async () => {
    mockNotificationsService.deleteTemplate.mockResolvedValue(undefined);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete(`/api/v1/notifications/templates/${tplId}`);

    expect(res.status).toBe(204);
    expect(mockNotificationsService.deleteTemplate).toHaveBeenCalledWith(tplId);
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.delete(`/api/v1/notifications/templates/${tplId}`);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.delete(`/api/v1/notifications/templates/${tplId}`);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 404 when template does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockNotificationsService.deleteTemplate.mockRejectedValue(
      new NotFoundError('Notification template not found'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete(`/api/v1/notifications/templates/${tplId}`);

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().delete(`/api/v1/notifications/templates/${tplId}`);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});
