import { logger } from '../logging/logger';
import { messageQueue } from '../modules/messaging/queue/message-queue';

/**
 * Message retry job. Runs every 5 minutes.
 * Processes outbound messages that are eligible for retry.
 */
export async function messageRetry(): Promise<void> {
  logger.info('Message retry processing started');

  try {
    const result = await messageQueue.processRetries();

    logger.info(
      {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        exhausted: result.exhausted,
      },
      'Message retry processing completed',
    );
  } catch (error) {
    logger.error({ error }, 'Message retry processing failed');
    throw error;
  }
}
