import { DeliveryStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import {
  isWithinQuietHours,
  getQuietHoursEndTime,
} from '../../shared/utils/quiet-hours.util';
import { messageQueue } from './queue/message-queue';
import { fileGenerator } from './delivery/file-generator';
import {
  EnqueueMessageBody,
  UpdateDeliveryBody,
  AddBlacklistBody,
  ListMessagesQuery,
  ListBlacklistQuery,
  UpdateQuietHoursBody,
} from './messaging.schemas';

export class MessagingService {
  /**
   * Enqueue a message for delivery.
   *
   * Processing order:
   *  1. Render template variables (if templateId supplied)
   *  2. Check recipient blacklist — if suppressed, create as SUPPRESSED and return
   *  3. Check global quiet hours — if active, defer nextRetryAt to end of quiet window
   *  4. Create the queued message record
   *  5. If recipient user has ALSO_PACKAGE preference, generate file immediately
   */
  async enqueueMessage(data: EnqueueMessageBody) {
    // ── 1. Template rendering ────────────────────────────────────────
    let subject = data.subject ?? '';
    let renderedBody = '';

    if (data.templateId) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (!template) {
        throw new NotFoundError('Notification template not found');
      }

      subject = this.renderTemplate(template.subjectTpl, data.variables ?? {});
      renderedBody = this.renderTemplate(template.bodyTpl, data.variables ?? {});
    } else {
      renderedBody = data.variables?.body ?? '';
    }

    // ── 2. Blacklist check ───────────────────────────────────────────
    const isBlacklisted = await this.isRecipientBlacklisted(
      data.recipientAddr,
      data.channel,
    );

    if (isBlacklisted) {
      const suppressed = await prisma.outboundMessage.create({
        data: {
          templateId: data.templateId ?? null,
          recipientAddr: data.recipientAddr,
          recipientUserId: data.recipientUserId ?? null,
          channel: data.channel as any,
          subject: subject || null,
          renderedBody,
          status: DeliveryStatus.SUPPRESSED,
          nextRetryAt: null,
        },
      });

      logger.warn(
        { messageId: suppressed.id, recipientAddr: data.recipientAddr, channel: data.channel },
        'Message suppressed — recipient is blacklisted',
      );

      return suppressed;
    }

    // ── 3. Quiet hours check ─────────────────────────────────────────
    let nextRetryAt: Date = new Date();

    const quietConfig = await this.getQuietHoursConfig();
    if (quietConfig && isWithinQuietHours(quietConfig, nextRetryAt)) {
      nextRetryAt = getQuietHoursEndTime(quietConfig, nextRetryAt);
      logger.info(
        { nextRetryAt, timezone: quietConfig.timezone },
        'Message delivery deferred — within quiet hours',
      );
    }

    // ── 4. Create queued message ─────────────────────────────────────
    const message = await messageQueue.enqueue({
      templateId: data.templateId,
      recipientAddr: data.recipientAddr,
      recipientUserId: data.recipientUserId,
      channel: data.channel,
      subject: subject || null,
      renderedBody,
      nextRetryAt,
    });

    logger.info({ messageId: message.id, channel: data.channel }, 'Message enqueued');

    // ── 5. User preference: ALSO_PACKAGE → generate file now ─────────
    if (data.recipientUserId) {
      const pref = await prisma.userPreference.findUnique({
        where: { userId: data.recipientUserId },
      });

      if (pref?.deliveryMode === 'ALSO_PACKAGE') {
        try {
          const filePath = await fileGenerator.generateMessageFile({
            id: message.id,
            recipientAddr: message.recipientAddr,
            channel: message.channel,
            subject: message.subject,
            renderedBody: message.renderedBody,
          });

          await prisma.outboundMessage.update({
            where: { id: message.id },
            data: { fileOutputPath: filePath },
          });

          logger.info(
            { messageId: message.id, filePath },
            'Package file generated due to ALSO_PACKAGE preference',
          );
        } catch (err) {
          logger.error({ messageId: message.id, err }, 'Failed to generate immediate package file');
        }
      }
    }

    return message;
  }

  /**
   * List messages with pagination and filtering.
   * Non-admin users can only see their own messages.
   */
  async listMessages(filters: ListMessagesQuery, userId: string, isAdmin: boolean) {
    const { skip, take, page, pageSize } = parsePagination(filters);

    const where: Prisma.OutboundMessageWhereInput = {};

    if (!isAdmin) {
      // Security: non-admins can only see their own messages.
      // filters.recipientUserId override is disallowed to prevent BOLA.
      where.recipientUserId = userId;
    } else if (filters.recipientUserId) {
      where.recipientUserId = filters.recipientUserId;
    }

    if (filters.status) {
      where.status = filters.status as DeliveryStatus;
    }

    if (filters.channel) {
      where.channel = filters.channel as any;
    }

    const [messages, total] = await Promise.all([
      prisma.outboundMessage.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.outboundMessage.count({ where }),
    ]);

    return { data: messages, meta: buildMeta(total, page, pageSize) };
  }

  /**
   * Get a single message by ID.
   * Non-admin callers receive 404 for messages they don't own (prevents enumeration).
   */
  async getMessageStatus(id: string, userId?: string, isAdmin?: boolean) {
    const message = await prisma.outboundMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundError('Message not found');
    // Security: non-admin ownership check — return 404 to prevent enumeration
    if (userId && !isAdmin && message.recipientUserId !== userId) {
      throw new NotFoundError('Message not found');
    }
    return message;
  }

  /**
   * Manually update the delivery status of a message.
   * Used by operators to record that they have delivered (or failed) a
   * message package manually.
   */
  async updateDeliveryStatus(id: string, data: UpdateDeliveryBody, userId?: string, isAdmin?: boolean) {
    // Ownership check delegated to getMessageStatus (includes 404-on-mismatch for non-admins)
    const message = await this.getMessageStatus(id, userId, isAdmin);

    const updateData: Prisma.OutboundMessageUpdateInput = {
      status: data.status as DeliveryStatus,
    };

    if (data.status === 'DELIVERED' || data.status === 'MANUALLY_SENT') {
      updateData.deliveredAt = new Date();
      updateData.nextRetryAt = null;
    }

    if (data.status === 'FAILED') {
      updateData.failedAt = new Date();
      updateData.failureReason = data.failureReason ?? null;
      updateData.nextRetryAt = null;
    }

    const updated = await prisma.outboundMessage.update({
      where: { id },
      data: updateData,
    });

    logger.info({ messageId: id, status: data.status }, 'Message delivery status updated');

    return updated;
  }

  /**
   * Get all messages that have been permanently failed and flagged as
   * failure alerts. Only visible to SYSTEM_ADMIN role.
   */
  async getFailureAlerts() {
    return prisma.outboundMessage.findMany({
      where: {
        isFailureAlert: true,
        status: DeliveryStatus.FAILED,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Trigger (re)generation of a downloadable package file for a message.
   * Returns the absolute file path.
   */
  async generatePackage(id: string, userId?: string, isAdmin?: boolean): Promise<string> {
    const message = await this.getMessageStatus(id, userId, isAdmin);

    const filePath = await fileGenerator.generateMessageFile({
      id: message.id,
      recipientAddr: message.recipientAddr,
      channel: message.channel,
      subject: message.subject,
      renderedBody: message.renderedBody,
    });

    await prisma.outboundMessage.update({
      where: { id },
      data: { fileOutputPath: filePath },
    });

    logger.info({ messageId: id, filePath }, 'Message package (re)generated');
    return filePath;
  }

  // ─── BLACKLIST ──────────────────────────────────────────────────

  async addToBlacklist(data: AddBlacklistBody, createdBy?: string) {
    const existing = await prisma.messageBlacklist.findUnique({
      where: {
        address_channel: {
          address: data.address,
          channel: data.channel as any,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Address is already blacklisted for this channel');
    }

    // The underlying `message_blacklist.created_by` column is NOT NULL at
    // the DB layer even though the Prisma schema marks it optional. When the
    // caller provides an authenticated user id (normal HTTP flow), persist
    // it as the audit trail. If omitted (legacy direct-service callers),
    // leave it unset and let prisma/mysql surface the NOT NULL constraint
    // — preserving the pre-existing contract for those callers.
    const createData: any = {
      address: data.address,
      channel: data.channel as any,
      reason: data.reason ?? null,
      userId: data.userId ?? null,
    };
    const auditedBy = createdBy ?? data.userId;
    if (auditedBy) createData.createdBy = auditedBy;

    const entry = await prisma.messageBlacklist.create({
      data: createData,
    });

    logger.info({ address: data.address, channel: data.channel }, 'Address added to blacklist');
    return entry;
  }

  async removeFromBlacklist(id: string) {
    const entry = await prisma.messageBlacklist.findUnique({ where: { id } });
    if (!entry) throw new NotFoundError('Blacklist entry not found');

    await prisma.messageBlacklist.delete({ where: { id } });
    logger.info({ address: entry.address, channel: entry.channel }, 'Address removed from blacklist');
  }

  async listBlacklist(filters: ListBlacklistQuery) {
    const { skip, take, page, pageSize } = parsePagination(filters);

    const where: Prisma.MessageBlacklistWhereInput = {};
    if (filters.channel) where.channel = filters.channel as any;

    const [entries, total] = await Promise.all([
      prisma.messageBlacklist.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.messageBlacklist.count({ where }),
    ]);

    return { data: entries, meta: buildMeta(total, page, pageSize) };
  }

  // ─── QUIET HOURS ────────────────────────────────────────────────

  async getQuietHoursConfig() {
    return prisma.quietHoursConfig.findFirst({ where: { isGlobal: true } });
  }

  async updateQuietHoursConfig(data: UpdateQuietHoursBody) {
    const existing = await prisma.quietHoursConfig.findFirst({ where: { isGlobal: true } });

    if (existing) {
      return prisma.quietHoursConfig.update({
        where: { id: existing.id },
        data: {
          timezone: data.timezone,
          quietStartHr: data.quietStartHr,
          quietEndHr: data.quietEndHr,
          isGlobal: data.isGlobal ?? true,
        },
      });
    }

    return prisma.quietHoursConfig.create({
      data: {
        timezone: data.timezone,
        quietStartHr: data.quietStartHr,
        quietEndHr: data.quietEndHr,
        isGlobal: data.isGlobal ?? true,
      },
    });
  }

  // ─── PRIVATE ────────────────────────────────────────────────────

  private async isRecipientBlacklisted(address: string, channel: string): Promise<boolean> {
    const entry = await prisma.messageBlacklist.findUnique({
      where: {
        address_channel: { address, channel: channel as any },
      },
    });
    return entry !== null;
  }

  private renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] ?? match);
  }
}

export const messagingService = new MessagingService();
