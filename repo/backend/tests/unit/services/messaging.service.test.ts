import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockEnqueue, mockGenerateFile } = vi.hoisted(() => ({
  mockPrisma: {
    notificationTemplate: { findUnique: vi.fn() },
    outboundMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    messageBlacklist: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    quietHoursConfig: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    userPreference: { findUnique: vi.fn() },
  },
  mockEnqueue: vi.fn(),
  mockGenerateFile: vi.fn(),
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/messaging/queue/message-queue', () => ({
  messageQueue: { enqueue: mockEnqueue },
}));
vi.mock('../../../src/modules/messaging/delivery/file-generator', () => ({
  fileGenerator: { generateMessageFile: mockGenerateFile },
}));

import { MessagingService } from '../../../src/modules/messaging/messaging.service';
import { NotFoundError, ConflictError } from '../../../src/shared/errors';

describe('MessagingService', () => {
  let service: MessagingService;

  const baseMessage = {
    id: 'msg-1',
    recipientAddr: 'user@example.com',
    channel: 'EMAIL',
    subject: 'Hello',
    renderedBody: 'Body',
    status: 'QUEUED',
    fileOutputPath: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default: no blacklist, no quiet hours, no user preference
    mockPrisma.messageBlacklist.findUnique.mockResolvedValue(null);
    mockPrisma.quietHoursConfig.findFirst.mockResolvedValue(null);
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);
    mockEnqueue.mockResolvedValue(baseMessage);
    service = new MessagingService();
  });

  // ─── enqueueMessage: template rendering ─────────────────────────

  describe('template rendering', () => {
    it('renders template variables into subject and body', async () => {
      mockPrisma.notificationTemplate.findUnique.mockResolvedValue({
        id: 'tpl-1',
        subjectTpl: 'Hello {{name}}',
        bodyTpl: 'Welcome to {{company}}, {{name}}!',
      });

      await service.enqueueMessage({
        templateId: 'tpl-1',
        recipientAddr: 'test@example.com',
        channel: 'EMAIL',
        variables: { name: 'Alice', company: 'LeaseOps' },
      });

      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Hello Alice',
          renderedBody: 'Welcome to LeaseOps, Alice!',
        }),
      );
    });

    it('throws NotFoundError when template not found', async () => {
      mockPrisma.notificationTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.enqueueMessage({
          templateId: 'missing',
          recipientAddr: 'test@example.com',
          channel: 'EMAIL',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('uses body variable when no templateId provided', async () => {
      await service.enqueueMessage({
        recipientAddr: 'test@example.com',
        channel: 'EMAIL',
        subject: 'Test',
        variables: { body: 'Plain text body' },
      });

      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({ renderedBody: 'Plain text body', subject: 'Test' }),
      );
    });

    it('preserves unmatched template placeholders', async () => {
      mockPrisma.notificationTemplate.findUnique.mockResolvedValue({
        id: 'tpl-1',
        subjectTpl: 'Hello {{name}}',
        bodyTpl: 'Your code is {{code}}',
      });

      await service.enqueueMessage({
        templateId: 'tpl-1',
        recipientAddr: 'test@example.com',
        channel: 'EMAIL',
        variables: { name: 'Alice' },
      });

      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({ renderedBody: 'Your code is {{code}}' }),
      );
    });
  });

  // ─── enqueueMessage: blacklist enforcement ───────────────────────

  describe('blacklist enforcement', () => {
    it('creates message with SUPPRESSED status when recipient is blacklisted', async () => {
      mockPrisma.messageBlacklist.findUnique.mockResolvedValue({
        id: 'bl-1',
        address: 'spam@example.com',
        channel: 'EMAIL',
      });
      mockPrisma.outboundMessage.create.mockResolvedValue({
        ...baseMessage,
        status: 'SUPPRESSED',
        recipientAddr: 'spam@example.com',
      });

      const result = await service.enqueueMessage({
        recipientAddr: 'spam@example.com',
        channel: 'EMAIL',
      });

      // Should NOT call messageQueue.enqueue
      expect(mockEnqueue).not.toHaveBeenCalled();
      // Should create directly with SUPPRESSED status
      expect(mockPrisma.outboundMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUPPRESSED', nextRetryAt: null }),
        }),
      );
      expect(result.status).toBe('SUPPRESSED');
    });

    it('enqueues normally when recipient is NOT blacklisted', async () => {
      mockPrisma.messageBlacklist.findUnique.mockResolvedValue(null);

      await service.enqueueMessage({
        recipientAddr: 'ok@example.com',
        channel: 'EMAIL',
      });

      expect(mockEnqueue).toHaveBeenCalled();
    });
  });

  // ─── enqueueMessage: quiet hours deferral ───────────────────────

  describe('quiet hours deferral', () => {
    it('defers nextRetryAt when within quiet hours', async () => {
      const quietConfig = {
        id: 'qh-1',
        timezone: 'UTC',
        quietStartHr: 21,
        quietEndHr: 7,
        isGlobal: true,
      };
      mockPrisma.quietHoursConfig.findFirst.mockResolvedValue(quietConfig);

      // Use fake timers at 22:00 UTC (within quiet window 21→7)
      vi.useFakeTimers();
      const now = new Date('2024-01-15T22:00:00.000Z');
      vi.setSystemTime(now);

      await service.enqueueMessage({
        recipientAddr: 'user@example.com',
        channel: 'EMAIL',
      });

      // nextRetryAt passed to enqueue should be AFTER quiet hours end (past 07:00 UTC next day)
      const enqueueCall = mockEnqueue.mock.calls[0]?.[0];
      expect(enqueueCall?.nextRetryAt).toBeDefined();
      expect(enqueueCall.nextRetryAt.getTime()).toBeGreaterThan(now.getTime());
      // Should be ~9 h later at 07:xx UTC
      expect(enqueueCall.nextRetryAt.getUTCHours()).toBe(7);

      vi.useRealTimers();
    });

    it('does NOT defer when outside quiet hours', async () => {
      const quietConfig = {
        id: 'qh-1',
        timezone: 'UTC',
        quietStartHr: 21,
        quietEndHr: 7,
        isGlobal: true,
      };
      mockPrisma.quietHoursConfig.findFirst.mockResolvedValue(quietConfig);

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z')); // noon — outside quiet

      await service.enqueueMessage({
        recipientAddr: 'user@example.com',
        channel: 'EMAIL',
      });

      const enqueueCall = mockEnqueue.mock.calls[0]?.[0];
      // nextRetryAt should be approximately now (within a few ms)
      const diff = Math.abs(enqueueCall.nextRetryAt.getTime() - Date.now());
      expect(diff).toBeLessThan(5000);

      vi.useRealTimers();
    });

    it('does NOT defer when no quiet hours config exists', async () => {
      mockPrisma.quietHoursConfig.findFirst.mockResolvedValue(null);

      await service.enqueueMessage({
        recipientAddr: 'user@example.com',
        channel: 'EMAIL',
      });

      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({ nextRetryAt: expect.any(Date) }),
      );
    });
  });

  // ─── enqueueMessage: user preference ALSO_PACKAGE ───────────────

  describe('user preference ALSO_PACKAGE', () => {
    it('generates package file immediately when user prefers ALSO_PACKAGE', async () => {
      mockPrisma.userPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        deliveryMode: 'ALSO_PACKAGE',
      });
      mockEnqueue.mockResolvedValue({ ...baseMessage, id: 'msg-new' });
      mockGenerateFile.mockResolvedValue('/tmp/leaseops-messages/msg-new-123.json');
      mockPrisma.outboundMessage.update.mockResolvedValue({});

      await service.enqueueMessage({
        recipientAddr: 'user@example.com',
        recipientUserId: 'user-1',
        channel: 'EMAIL',
      });

      expect(mockGenerateFile).toHaveBeenCalled();
      expect(mockPrisma.outboundMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-new' },
          data: expect.objectContaining({ fileOutputPath: expect.any(String) }),
        }),
      );
    });

    it('does NOT generate package when user prefers IN_APP_ONLY', async () => {
      mockPrisma.userPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        deliveryMode: 'IN_APP_ONLY',
      });

      await service.enqueueMessage({
        recipientAddr: 'user@example.com',
        recipientUserId: 'user-1',
        channel: 'EMAIL',
      });

      expect(mockGenerateFile).not.toHaveBeenCalled();
    });

    it('does NOT generate package when no recipientUserId provided', async () => {
      await service.enqueueMessage({
        recipientAddr: 'user@example.com',
        channel: 'EMAIL',
      });

      expect(mockPrisma.userPreference.findUnique).not.toHaveBeenCalled();
      expect(mockGenerateFile).not.toHaveBeenCalled();
    });
  });

  // ─── blacklist CRUD ──────────────────────────────────────────────

  describe('blacklist CRUD', () => {
    it('adds address to blacklist', async () => {
      mockPrisma.messageBlacklist.findUnique.mockResolvedValue(null);
      mockPrisma.messageBlacklist.create.mockResolvedValue({
        id: 'bl-1',
        address: 'spam@example.com',
        channel: 'EMAIL',
      });

      const result = await service.addToBlacklist({
        address: 'spam@example.com',
        channel: 'EMAIL',
      });

      expect(result.address).toBe('spam@example.com');
    });

    it('throws ConflictError when address already blacklisted', async () => {
      mockPrisma.messageBlacklist.findUnique.mockResolvedValue({
        id: 'bl-1',
        address: 'spam@example.com',
        channel: 'EMAIL',
      });

      await expect(
        service.addToBlacklist({ address: 'spam@example.com', channel: 'EMAIL' }),
      ).rejects.toThrow(ConflictError);
    });

    it('successfully removes blacklist entry', async () => {
      const entry = { id: 'bl-1', address: 'spam@example.com', channel: 'EMAIL' };
      mockPrisma.messageBlacklist.findUnique.mockResolvedValue(entry);
      mockPrisma.messageBlacklist.delete.mockResolvedValue(entry);

      await service.removeFromBlacklist('bl-1');
      expect(mockPrisma.messageBlacklist.delete).toHaveBeenCalledWith({ where: { id: 'bl-1' } });
    });

    it('throws NotFoundError when removing non-existent entry', async () => {
      mockPrisma.messageBlacklist.findUnique.mockResolvedValue(null);

      await expect(service.removeFromBlacklist('missing-id')).rejects.toThrow(NotFoundError);
    });

    it('returns paginated blacklist entries', async () => {
      const entry = { id: 'bl-1', address: 'spam@example.com', channel: 'EMAIL', createdAt: new Date() };
      mockPrisma.messageBlacklist.findMany.mockResolvedValue([entry]);
      mockPrisma.messageBlacklist.count.mockResolvedValue(1);

      const result = await service.listBlacklist({ page: 1, pageSize: 10 } as any);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('filters blacklist by channel', async () => {
      mockPrisma.messageBlacklist.findMany.mockResolvedValue([]);
      mockPrisma.messageBlacklist.count.mockResolvedValue(0);

      await service.listBlacklist({ channel: 'EMAIL' } as any);
      expect(mockPrisma.messageBlacklist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ channel: 'EMAIL' }) }),
      );
    });
  });

  // ─── quiet hours config ──────────────────────────────────────────

  describe('quiet hours config', () => {
    it('returns existing quiet hours config', async () => {
      const config = {
        id: 'qh-1',
        timezone: 'America/New_York',
        quietStartHr: 21,
        quietEndHr: 7,
        isGlobal: true,
      };
      mockPrisma.quietHoursConfig.findFirst.mockResolvedValue(config);

      const result = await service.getQuietHoursConfig();
      expect(result).toEqual(config);
    });

    it('creates new config when none exists', async () => {
      mockPrisma.quietHoursConfig.findFirst.mockResolvedValue(null);
      mockPrisma.quietHoursConfig.create.mockResolvedValue({
        id: 'qh-new',
        timezone: 'UTC',
        quietStartHr: 21,
        quietEndHr: 7,
        isGlobal: true,
      });

      const result = await service.updateQuietHoursConfig({
        timezone: 'UTC',
        quietStartHr: 21,
        quietEndHr: 7,
      });

      expect(mockPrisma.quietHoursConfig.create).toHaveBeenCalled();
      expect(result.quietStartHr).toBe(21);
    });

    it('updates existing quiet hours config', async () => {
      mockPrisma.quietHoursConfig.findFirst.mockResolvedValue({ id: 'qh-1' });
      mockPrisma.quietHoursConfig.update.mockResolvedValue({
        id: 'qh-1',
        timezone: 'America/Chicago',
        quietStartHr: 22,
        quietEndHr: 6,
        isGlobal: true,
      });

      const result = await service.updateQuietHoursConfig({
        timezone: 'America/Chicago',
        quietStartHr: 22,
        quietEndHr: 6,
      });

      expect(mockPrisma.quietHoursConfig.update).toHaveBeenCalled();
      expect(result.quietStartHr).toBe(22);
    });
  });

  // ─── updateDeliveryStatus ────────────────────────────────────────

  describe('updateDeliveryStatus', () => {
    it('marks message as MANUALLY_SENT and sets deliveredAt', async () => {
      mockPrisma.outboundMessage.findUnique.mockResolvedValue(baseMessage);
      mockPrisma.outboundMessage.update.mockResolvedValue({
        ...baseMessage,
        status: 'MANUALLY_SENT',
        deliveredAt: new Date(),
      });

      const result = await service.updateDeliveryStatus('msg-1', {
        status: 'MANUALLY_SENT',
      });

      expect(result.status).toBe('MANUALLY_SENT');
      expect(mockPrisma.outboundMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'MANUALLY_SENT',
            deliveredAt: expect.any(Date),
          }),
        }),
      );
    });

    it('marks message as FAILED and records failureReason', async () => {
      mockPrisma.outboundMessage.findUnique.mockResolvedValue(baseMessage);
      mockPrisma.outboundMessage.update.mockResolvedValue({
        ...baseMessage,
        status: 'FAILED',
        failureReason: 'No response from operator',
      });

      await service.updateDeliveryStatus('msg-1', {
        status: 'FAILED',
        failureReason: 'No response from operator',
      });

      expect(mockPrisma.outboundMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'No response from operator',
          }),
        }),
      );
    });

    it('throws NotFoundError for missing message', async () => {
      mockPrisma.outboundMessage.findUnique.mockResolvedValue(null);

      await expect(
        service.updateDeliveryStatus('missing', { status: 'DELIVERED' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── generatePackage ────────────────────────────────────────────

  describe('generatePackage', () => {
    it('generates a file and updates fileOutputPath', async () => {
      mockPrisma.outboundMessage.findUnique.mockResolvedValue(baseMessage);
      mockGenerateFile.mockResolvedValue('/tmp/leaseops-messages/msg-1-123.json');
      mockPrisma.outboundMessage.update.mockResolvedValue({});

      const filePath = await service.generatePackage('msg-1');

      expect(filePath).toBe('/tmp/leaseops-messages/msg-1-123.json');
      expect(mockPrisma.outboundMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { fileOutputPath: filePath },
        }),
      );
    });

    it('throws NotFoundError for missing message', async () => {
      mockPrisma.outboundMessage.findUnique.mockResolvedValue(null);

      await expect(service.generatePackage('missing')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── Authorization ───────────────────────────────────────────────

  describe('authorization', () => {
    const ownerId = 'user-owner-id';
    const otherId = 'user-other-id';

    const ownedMessage = { ...baseMessage, recipientUserId: ownerId };
    const otherMessage = { ...baseMessage, recipientUserId: otherId };

    // ── listMessages ─────────────────────────────────────────────

    describe('listMessages', () => {
      beforeEach(() => {
        mockPrisma.outboundMessage.findMany.mockResolvedValue([]);
        mockPrisma.outboundMessage.count.mockResolvedValue(0);
      });

      it('filters by recipientUserId for non-admin', async () => {
        await service.listMessages({}, ownerId, false);
        expect(mockPrisma.outboundMessage.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ recipientUserId: ownerId }),
          }),
        );
      });

      it('does not use OR clause for non-admin', async () => {
        await service.listMessages({}, ownerId, false);
        const call = mockPrisma.outboundMessage.findMany.mock.calls[0][0];
        expect(call.where).not.toHaveProperty('OR');
      });

      it('ignores filters.recipientUserId override for non-admin', async () => {
        await service.listMessages({ recipientUserId: otherId } as any, ownerId, false);
        const call = mockPrisma.outboundMessage.findMany.mock.calls[0][0];
        expect(call.where.recipientUserId).toBe(ownerId);
      });

      it('applies filters.recipientUserId for admin', async () => {
        await service.listMessages({ recipientUserId: otherId } as any, ownerId, true);
        const call = mockPrisma.outboundMessage.findMany.mock.calls[0][0];
        expect(call.where.recipientUserId).toBe(otherId);
      });

      it('applies no owner filter for admin without recipientUserId filter', async () => {
        await service.listMessages({}, ownerId, true);
        const call = mockPrisma.outboundMessage.findMany.mock.calls[0][0];
        expect(call.where).not.toHaveProperty('recipientUserId');
        expect(call.where).not.toHaveProperty('OR');
      });
    });

    // ── getMessageStatus ──────────────────────────────────────────

    describe('getMessageStatus', () => {
      it('returns message when non-admin accesses own message', async () => {
        mockPrisma.outboundMessage.findUnique.mockResolvedValue(ownedMessage);
        const result = await service.getMessageStatus('msg-1', ownerId, false);
        expect(result).toEqual(ownedMessage);
      });

      it('throws NotFoundError when non-admin accesses another user message', async () => {
        mockPrisma.outboundMessage.findUnique.mockResolvedValue(otherMessage);
        await expect(service.getMessageStatus('msg-1', ownerId, false)).rejects.toThrow(NotFoundError);
      });

      it('returns any message for admin', async () => {
        mockPrisma.outboundMessage.findUnique.mockResolvedValue(otherMessage);
        const result = await service.getMessageStatus('msg-1', ownerId, true);
        expect(result).toEqual(otherMessage);
      });

      it('returns message when called without userId (internal use)', async () => {
        mockPrisma.outboundMessage.findUnique.mockResolvedValue(otherMessage);
        const result = await service.getMessageStatus('msg-1');
        expect(result).toEqual(otherMessage);
      });
    });

    // ── updateDeliveryStatus ──────────────────────────────────────

    describe('updateDeliveryStatus', () => {
      it('throws NotFoundError when non-admin updates another user message', async () => {
        mockPrisma.outboundMessage.findUnique.mockResolvedValue(otherMessage);
        await expect(
          service.updateDeliveryStatus('msg-1', { status: 'DELIVERED' } as any, ownerId, false),
        ).rejects.toThrow(NotFoundError);
      });

      it('allows admin to update any message', async () => {
        mockPrisma.outboundMessage.findUnique.mockResolvedValue(otherMessage);
        mockPrisma.outboundMessage.update.mockResolvedValue({ ...otherMessage, status: 'DELIVERED' });
        const result = await service.updateDeliveryStatus(
          'msg-1', { status: 'DELIVERED' } as any, ownerId, true,
        );
        expect(result).toMatchObject({ status: 'DELIVERED' });
      });
    });

    // ── generatePackage ───────────────────────────────────────────

    describe('generatePackage', () => {
      it('throws NotFoundError when non-admin generates package for another user', async () => {
        mockPrisma.outboundMessage.findUnique.mockResolvedValue(otherMessage);
        await expect(service.generatePackage('msg-1', ownerId, false)).rejects.toThrow(NotFoundError);
      });

      it('allows admin to generate package for any message', async () => {
        mockPrisma.outboundMessage.findUnique.mockResolvedValue(otherMessage);
        mockGenerateFile.mockResolvedValue('/tmp/msg-1.json');
        mockPrisma.outboundMessage.update.mockResolvedValue({});
        const filePath = await service.generatePackage('msg-1', ownerId, true);
        expect(filePath).toBe('/tmp/msg-1.json');
      });
    });
  });
});
