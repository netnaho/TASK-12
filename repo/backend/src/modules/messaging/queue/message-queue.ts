import { prisma } from '../../../config/database';
import { logger } from '../../../logging/logger';
import { DeliveryStatus } from '@prisma/client';
import { getNextRetryDelay, getNextStatus, isRetryable } from './retry-policy';
import { fileGenerator } from '../delivery/file-generator';
import { isWithinQuietHours } from '../../../shared/utils/quiet-hours.util';
import type { QuietHoursConfig } from '../../../shared/utils/quiet-hours.util';

/** Channels for which a downloadable package file is generated */
const PACKAGABLE_CHANNELS = new Set(['EMAIL', 'SMS', 'ENTERPRISE_IM']);

export interface RetryResult {
  processed: number;
  succeeded: number;
  failed: number;
  exhausted: number;
}

export interface EnqueueInput {
  templateId?: string | null;
  recipientAddr: string;
  recipientUserId?: string | null;
  channel: string;
  subject?: string | null;
  renderedBody: string;
  /** Override the initial nextRetryAt (used for quiet-hours deferral). Defaults to now. */
  nextRetryAt?: Date;
}

export class MessageQueue {
  /**
   * Enqueue a new outbound message for delivery.
   */
  async enqueue(input: EnqueueInput) {
    const message = await prisma.outboundMessage.create({
      data: {
        templateId: input.templateId ?? null,
        recipientAddr: input.recipientAddr,
        recipientUserId: input.recipientUserId ?? null,
        channel: input.channel as any,
        subject: input.subject ?? null,
        renderedBody: input.renderedBody,
        status: DeliveryStatus.QUEUED,
        nextRetryAt: input.nextRetryAt ?? new Date(),
      },
    });

    return message;
  }

  /**
   * Process all outbound messages that are eligible for retry.
   *
   * For the offline-first environment, "delivery" means generating a
   * downloadable message package file. The first successful file generation
   * marks the message DELIVERED; the operator then delivers it manually and
   * can update the status to MANUALLY_SENT via the API.
   *
   * @param quietConfig  Optional quiet-hours configuration. If supplied and the
   *                     current time is within quiet hours the batch is skipped.
   */
  async processRetries(quietConfig?: QuietHoursConfig | null): Promise<RetryResult> {
    const now = new Date();

    // If we are currently inside the quiet window, defer the entire batch.
    if (quietConfig && isWithinQuietHours(quietConfig, now)) {
      logger.info({ quietConfig }, 'Skipping message retry batch — within quiet hours');
      return { processed: 0, succeeded: 0, failed: 0, exhausted: 0 };
    }

    const messages = await prisma.outboundMessage.findMany({
      where: {
        nextRetryAt: { lte: now },
        status: {
          in: [
            DeliveryStatus.QUEUED,
            DeliveryStatus.RETRY_1,
            DeliveryStatus.RETRY_2,
            DeliveryStatus.RETRY_3,
          ],
        },
      },
      take: 100,
      orderBy: { nextRetryAt: 'asc' },
    });

    const result: RetryResult = {
      processed: messages.length,
      succeeded: 0,
      failed: 0,
      exhausted: 0,
    };

    for (const msg of messages) {
      try {
        if (!isRetryable(msg.status)) {
          // Max retries exhausted — mark permanently failed and raise an in-app alert.
          await prisma.outboundMessage.update({
            where: { id: msg.id },
            data: {
              status: DeliveryStatus.FAILED,
              failedAt: now,
              failureReason: 'Max retries exhausted',
              isFailureAlert: true,
            },
          });
          result.exhausted++;
          continue;
        }

        // Attempt delivery (offline-first: generate a downloadable package file)
        const deliveryResult = await this.attemptDelivery(msg);

        if (deliveryResult.success) {
          await prisma.outboundMessage.update({
            where: { id: msg.id },
            data: {
              status: DeliveryStatus.DELIVERED,
              deliveredAt: now,
              fileOutputPath: deliveryResult.filePath ?? null,
            },
          });
          result.succeeded++;
        } else {
          const nextStatus = getNextStatus(msg.status);
          const nextDelay = getNextRetryDelay(msg.retryCount + 1);

          if (!nextStatus || nextDelay === null) {
            await prisma.outboundMessage.update({
              where: { id: msg.id },
              data: {
                status: DeliveryStatus.FAILED,
                failedAt: now,
                failureReason: 'Max retries exhausted',
                retryCount: msg.retryCount + 1,
                isFailureAlert: true,
              },
            });
            result.exhausted++;
          } else {
            await prisma.outboundMessage.update({
              where: { id: msg.id },
              data: {
                status: nextStatus,
                retryCount: msg.retryCount + 1,
                nextRetryAt: new Date(now.getTime() + nextDelay),
              },
            });
            result.failed++;
          }
        }
      } catch (error) {
        logger.error({ messageId: msg.id, error }, 'Failed to process message retry');
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Attempt to "deliver" a message.
   *
   * In the offline-first model, delivery means generating a downloadable
   * package file appropriate for the channel. The operator downloads the file
   * and sends it manually via email/SMS/IM, then updates the status to
   * MANUALLY_SENT via the API.
   *
   * Returns { success: true, filePath } on successful file generation, or
   * { success: false } when the channel is not packagable or generation fails.
   */
  async attemptDelivery(
    msg: { id: string; channel: string; recipientAddr: string; subject?: string | null; renderedBody: string },
  ): Promise<{ success: boolean; filePath?: string }> {
    if (!PACKAGABLE_CHANNELS.has(msg.channel)) {
      logger.warn(
        { messageId: msg.id, channel: msg.channel },
        'Channel does not support package generation — message will retry until exhausted',
      );
      return { success: false };
    }

    try {
      const filePath = await fileGenerator.generateMessageFile({
        id: msg.id,
        recipientAddr: msg.recipientAddr,
        channel: msg.channel,
        subject: msg.subject,
        renderedBody: msg.renderedBody,
      });
      return { success: true, filePath };
    } catch (err) {
      logger.error({ messageId: msg.id, err }, 'Package file generation failed');
      return { success: false };
    }
  }
}

export const messageQueue = new MessageQueue();
