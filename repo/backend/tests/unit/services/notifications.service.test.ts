import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    notificationTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { NotFoundError } from '../../../src/shared/errors';
import { NOTIFICATION_CATEGORIES } from '../../../src/modules/notifications/notifications.schemas';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const baseNotif = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Test',
    body: 'Body',
    category: 'general',
    status: 'UNREAD',
    isTaskReminder: false,
    snoozedUntil: null,
    readAt: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = new NotificationsService();
  });

  // ─── listForUser ────────────────────────────────────────────────

  describe('listForUser', () => {
    it('returns paginated notifications for a user', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([baseNotif]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await service.listForUser('user-1', {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('filters by category=approval', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.listForUser('user-1', {
        category: NOTIFICATION_CATEGORIES.APPROVAL,
      });

      const whereArg = mockPrisma.notification.findMany.mock.calls[0]?.[0]?.where;
      expect(whereArg?.category).toBe('approval');
    });

    it('filters by category=overdue', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.listForUser('user-1', {
        category: NOTIFICATION_CATEGORIES.OVERDUE,
      });

      const whereArg = mockPrisma.notification.findMany.mock.calls[0]?.[0]?.where;
      expect(whereArg?.category).toBe('overdue');
    });

    it('filters by category=missing_material', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.listForUser('user-1', {
        category: NOTIFICATION_CATEGORIES.MISSING_MATERIAL,
      });

      const whereArg = mockPrisma.notification.findMany.mock.calls[0]?.[0]?.where;
      expect(whereArg?.category).toBe('missing_material');
    });

    it('filters by isTaskReminder=true', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.listForUser('user-1', { isTaskReminder: true });

      const whereArg = mockPrisma.notification.findMany.mock.calls[0]?.[0]?.where;
      expect(whereArg?.isTaskReminder).toBe(true);
    });

    it('excludes snoozed notifications still within their window', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.listForUser('user-1', {});

      const whereArg = mockPrisma.notification.findMany.mock.calls[0]?.[0]?.where;
      expect(whereArg?.NOT).toBeDefined();
      expect(whereArg.NOT.status).toBe('SNOOZED');
    });
  });

  // ─── getUnreadCount ─────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns count of UNREAD notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(7);

      const result = await service.getUnreadCount('user-1');

      expect(result.count).toBe(7);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', status: 'UNREAD' } }),
      );
    });
  });

  // ─── markRead ───────────────────────────────────────────────────

  describe('markRead', () => {
    it('marks a notification as READ and sets readAt', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(baseNotif);
      mockPrisma.notification.update.mockResolvedValue({ ...baseNotif, status: 'READ', readAt: new Date() });

      const result = await service.markRead('notif-1', 'user-1');

      expect(result.status).toBe('READ');
      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'READ', readAt: expect.any(Date) }),
        }),
      );
    });

    it('throws NotFoundError when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markRead('missing', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── markAllRead ────────────────────────────────────────────────

  describe('markAllRead', () => {
    it('updates all UNREAD notifications for the user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 4 });

      const result = await service.markAllRead('user-1');

      expect(result.updated).toBe(4);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', status: 'UNREAD' },
          data: expect.objectContaining({ status: 'READ' }),
        }),
      );
    });
  });

  // ─── snooze ─────────────────────────────────────────────────────

  describe('snooze', () => {
    it('sets status to SNOOZED with snoozedUntil', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(baseNotif);
      const snoozeTime = new Date(Date.now() + 3600 * 1000).toISOString();
      mockPrisma.notification.update.mockResolvedValue({
        ...baseNotif,
        status: 'SNOOZED',
        snoozedUntil: new Date(snoozeTime),
      });

      const result = await service.snooze('notif-1', 'user-1', snoozeTime);

      expect(result.status).toBe('SNOOZED');
      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SNOOZED',
            snoozedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('throws NotFoundError for unknown notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.snooze('bad-id', 'user-1', new Date().toISOString()),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── dismiss ────────────────────────────────────────────────────

  describe('dismiss', () => {
    it('sets status to DISMISSED', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(baseNotif);
      mockPrisma.notification.update.mockResolvedValue({ ...baseNotif, status: 'DISMISSED' });

      const result = await service.dismiss('notif-1', 'user-1');

      expect(result.status).toBe('DISMISSED');
    });

    it('throws NotFoundError for unknown notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.dismiss('bad-id', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── createTemplate ─────────────────────────────────────────────

  describe('createTemplate', () => {
    it('creates a notification template', async () => {
      const template = {
        id: 'tpl-new',
        slug: 'welcome',
        name: 'Welcome',
        channel: 'EMAIL',
        subjectTpl: 'Welcome {{name}}',
        bodyTpl: 'Hello {{name}}!',
        isActive: true,
      };
      mockPrisma.notificationTemplate.create.mockResolvedValue(template);

      const result = await service.createTemplate({
        slug: 'welcome',
        name: 'Welcome',
        channel: 'EMAIL' as any,
        subjectTpl: 'Welcome {{name}}',
        bodyTpl: 'Hello {{name}}!',
      });

      expect(result.id).toBe('tpl-new');
      expect(mockPrisma.notificationTemplate.create).toHaveBeenCalled();
    });
  });

  // ─── updateTemplate ─────────────────────────────────────────────

  describe('updateTemplate', () => {
    const template = {
      id: 'tpl-1',
      slug: 'overdue-reminder',
      name: 'Overdue Reminder',
      channel: 'EMAIL',
      subjectTpl: 'Old subject',
      bodyTpl: 'Old body',
      isActive: true,
    };

    it('updates an existing template', async () => {
      mockPrisma.notificationTemplate.findUnique.mockResolvedValue(template);
      mockPrisma.notificationTemplate.update.mockResolvedValue({
        ...template,
        subjectTpl: 'New subject',
      });

      const result = await service.updateTemplate('tpl-1', { subjectTpl: 'New subject' });

      expect(result.subjectTpl).toBe('New subject');
      expect(mockPrisma.notificationTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'tpl-1' } }),
      );
    });

    it('throws NotFoundError for missing template', async () => {
      mockPrisma.notificationTemplate.findUnique.mockResolvedValue(null);
      await expect(service.updateTemplate('missing', {})).rejects.toThrow(NotFoundError);
    });
  });

  // ─── previewTemplate ────────────────────────────────────────────

  describe('previewTemplate', () => {
    const template = {
      id: 'tpl-1',
      slug: 'overdue-reminder',
      name: 'Overdue Reminder',
      channel: 'EMAIL',
      subjectTpl: 'Action required: {{itemType}} overdue',
      bodyTpl: 'Hi {{name}}, your {{itemType}} is overdue. Please submit by {{deadline}}.',
      isActive: true,
    };

    it('renders all variables in subject and body', async () => {
      mockPrisma.notificationTemplate.findUnique.mockResolvedValue(template);

      const result = await service.previewTemplate('tpl-1', {
        name: 'Alice',
        itemType: 'approval',
        deadline: '2024-12-31',
      });

      expect(result.renderedSubject).toBe('Action required: approval overdue');
      expect(result.renderedBody).toBe(
        'Hi Alice, your approval is overdue. Please submit by 2024-12-31.',
      );
    });

    it('preserves unmatched placeholders', async () => {
      mockPrisma.notificationTemplate.findUnique.mockResolvedValue(template);

      const result = await service.previewTemplate('tpl-1', { name: 'Bob' });

      expect(result.renderedBody).toContain('{{itemType}}');
      expect(result.renderedBody).toContain('{{deadline}}');
    });

    it('throws NotFoundError for missing template', async () => {
      mockPrisma.notificationTemplate.findUnique.mockResolvedValue(null);

      await expect(service.previewTemplate('missing', {})).rejects.toThrow(NotFoundError);
    });
  });
});
