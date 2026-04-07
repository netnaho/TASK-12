import { DeliveryStatus } from '@prisma/client';

const RETRY_INTERVALS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];

const STATUS_TRANSITIONS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  QUEUED: DeliveryStatus.RETRY_1,
  RETRY_1: DeliveryStatus.RETRY_2,
  RETRY_2: DeliveryStatus.RETRY_3,
};

/**
 * Returns the delay in milliseconds for the given retry attempt.
 * retryCount 0 -> 5 min, 1 -> 15 min, 2 -> 60 min, 3+ -> null (max retries).
 */
export function getNextRetryDelay(retryCount: number): number | null {
  if (retryCount < 0 || retryCount >= RETRY_INTERVALS.length) {
    return null;
  }
  return RETRY_INTERVALS[retryCount];
}

/**
 * Returns the next delivery status after the current one, or null if max retries reached.
 */
export function getNextStatus(currentStatus: DeliveryStatus): DeliveryStatus | null {
  return STATUS_TRANSITIONS[currentStatus] ?? null;
}

/**
 * Whether the message status allows retrying.
 */
export function isRetryable(status: DeliveryStatus): boolean {
  return status in STATUS_TRANSITIONS;
}

export { RETRY_INTERVALS };
