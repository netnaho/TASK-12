/**
 * Additional Notification Inbox API tests covering:
 * - Snooze with body validation
 * - Dismiss endpoint
 * - Category-based filtering (approval, overdue, missing_material)
 * - Task reminder filtering
 * - Template CRUD + preview (admin-only)
 */
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

const notifId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const makeNotif = (overrides = {}) => ({
  id: notifId,
  userId: 'user-admin-id',
  title: 'Approval Required',
  body: 'Lease approval is pending review.',
  category: 'approval',
  status: 'UNREAD',
  isTaskReminder: true,
  snoozedUntil: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// ─── Snooze ─────────────────────────────────────────────────────────────────

describe('PATCH /api/v1/notifications/:id/snooze', () => {
  const snoozedUntil = new Date(Date.now() + 3600 * 1000).toISOString();

  it('should return 200 when snoozing a notification', async () => {
    mockNotificationsService.snooze.mockResolvedValue(
      makeNotif({ status: 'SNOOZED', snoozedUntil }),
    );

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ snoozedUntil });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'SNOOZED');
  });

  it('should return 422 when snoozedUntil is missing', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({});

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when snoozedUntil is not a valid datetime', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ snoozedUntil: 'not-a-date' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .patch(`/api/v1/notifications/${notifId}/snooze`)
      .send({ snoozedUntil });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Dismiss ─────────────────────────────────────────────────────────────────

describe('PATCH /api/v1/notifications/:id/dismiss', () => {
  it('should return 200 when dismissing a notification', async () => {
    mockNotificationsService.dismiss.mockResolvedValue(
      makeNotif({ status: 'DISMISSED' }),
    );

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.patch(`/api/v1/notifications/${notifId}/dismiss`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'DISMISSED');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().patch(`/api/v1/notifications/${notifId}/dismiss`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Category filtering (unified inbox) ─────────────────────────────────────

describe('GET /api/v1/notifications — category filtering', () => {
  it('should filter by category=approval', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      data: [makeNotif({ category: 'approval' })],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/notifications?category=approval');

    assertPaginated(res, 200);
    expect(res.body.data[0]).toHaveProperty('category', 'approval');
    expect(mockNotificationsService.listForUser).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ category: 'approval' }),
    );
  });

  it('should filter by category=overdue', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      data: [makeNotif({ category: 'overdue', title: 'Lease overdue' })],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.get('/api/v1/notifications?category=overdue');

    assertPaginated(res, 200);
    expect(mockNotificationsService.listForUser).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ category: 'overdue' }),
    );
  });

  it('should filter by category=missing_material', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      data: [makeNotif({ category: 'missing_material' })],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/notifications?category=missing_material');

    assertPaginated(res, 200);
    expect(mockNotificationsService.listForUser).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ category: 'missing_material' }),
    );
  });

  it('should filter task reminders (isTaskReminder=true)', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      data: [makeNotif({ isTaskReminder: true })],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/notifications?isTaskReminder=true');

    assertPaginated(res, 200);
    expect(mockNotificationsService.listForUser).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ isTaskReminder: true }),
    );
  });

  it('should filter by status=UNREAD', async () => {
    mockNotificationsService.listForUser.mockResolvedValue({
      data: [makeNotif()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/notifications?status=UNREAD');

    assertPaginated(res, 200);
    expect(mockNotificationsService.listForUser).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ status: 'UNREAD' }),
    );
  });
});

// ─── Template management (admin) ─────────────────────────────────────────────

describe('POST /api/v1/notifications/templates', () => {
  const validTemplate = {
    slug: 'approval-request',
    name: 'Approval Request',
    subjectTpl: 'Action needed: {{itemType}} approval',
    bodyTpl: 'Hi {{name}}, please approve {{itemType}} by {{deadline}}.',
    channel: 'EMAIL',
  };

  it('should return 201 for admin', async () => {
    mockNotificationsService.createTemplate.mockResolvedValue({
      id: 'tpl-new',
      ...validTemplate,
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/notifications/templates')
      .send(validTemplate);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('slug', 'approval-request');
  });

  it('should return 403 for non-admin', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .post('/api/v1/notifications/templates')
      .send(validTemplate);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 when slug is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/notifications/templates')
      .send({ ...validTemplate, slug: undefined });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should support ENTERPRISE_IM channel for templates', async () => {
    mockNotificationsService.createTemplate.mockResolvedValue({
      id: 'tpl-im',
      slug: 'im-alert',
      name: 'IM Alert',
      subjectTpl: 'Alert: {{subject}}',
      bodyTpl: '{{body}}',
      channel: 'ENTERPRISE_IM',
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/notifications/templates')
      .send({
        slug: 'im-alert',
        name: 'IM Alert',
        subjectTpl: 'Alert: {{subject}}',
        bodyTpl: '{{body}}',
        channel: 'ENTERPRISE_IM',
      });

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('channel', 'ENTERPRISE_IM');
  });
});

describe('POST /api/v1/notifications/templates/preview', () => {
  it('should return 200 with rendered preview', async () => {
    mockNotificationsService.previewTemplate.mockResolvedValue({
      templateId: 'tpl-1',
      slug: 'approval-request',
      channel: 'EMAIL',
      renderedSubject: 'Action needed: lease approval',
      renderedBody: 'Hi Alice, please approve lease by 2024-12-31.',
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/notifications/templates/preview')
      .send({
        templateId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        variables: { name: 'Alice', itemType: 'lease', deadline: '2024-12-31' },
      });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('renderedSubject');
    expect(res.body.data).toHaveProperty('renderedBody');
  });

  it('should return 422 when templateId is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/notifications/templates/preview')
      .send({ variables: {} });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 403 for non-admin', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post('/api/v1/notifications/templates/preview')
      .send({
        templateId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        variables: {},
      });

    assertError(res, 403, 'FORBIDDEN');
  });
});
