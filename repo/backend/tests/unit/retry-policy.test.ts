import { describe, it, expect } from 'vitest';

// We need to mock @prisma/client to provide the DeliveryStatus enum
vi.mock('@prisma/client', () => ({
  DeliveryStatus: {
    QUEUED: 'QUEUED',
    RETRY_1: 'RETRY_1',
    RETRY_2: 'RETRY_2',
    RETRY_3: 'RETRY_3',
    DELIVERED: 'DELIVERED',
    FAILED: 'FAILED',
    MANUALLY_SENT: 'MANUALLY_SENT',
  },
}));

import { getNextRetryDelay, getNextStatus, isRetryable } from '../../src/modules/messaging/queue/retry-policy';

describe('Retry Policy', () => {
  describe('getNextRetryDelay', () => {
    it('returns 5 minutes (300000ms) for retry 0', () => {
      expect(getNextRetryDelay(0)).toBe(5 * 60 * 1000);
    });

    it('returns 15 minutes (900000ms) for retry 1', () => {
      expect(getNextRetryDelay(1)).toBe(15 * 60 * 1000);
    });

    it('returns 60 minutes (3600000ms) for retry 2', () => {
      expect(getNextRetryDelay(2)).toBe(60 * 60 * 1000);
    });

    it('returns null for retry 3 (max retries exceeded)', () => {
      expect(getNextRetryDelay(3)).toBeNull();
    });

    it('returns null for retry 4+', () => {
      expect(getNextRetryDelay(4)).toBeNull();
      expect(getNextRetryDelay(100)).toBeNull();
    });

    it('returns null for negative retry count', () => {
      expect(getNextRetryDelay(-1)).toBeNull();
    });
  });

  describe('getNextStatus', () => {
    it('transitions QUEUED to RETRY_1', () => {
      expect(getNextStatus('QUEUED' as any)).toBe('RETRY_1');
    });

    it('transitions RETRY_1 to RETRY_2', () => {
      expect(getNextStatus('RETRY_1' as any)).toBe('RETRY_2');
    });

    it('transitions RETRY_2 to RETRY_3', () => {
      expect(getNextStatus('RETRY_2' as any)).toBe('RETRY_3');
    });

    it('returns null for RETRY_3 (no more transitions)', () => {
      expect(getNextStatus('RETRY_3' as any)).toBeNull();
    });

    it('returns null for DELIVERED', () => {
      expect(getNextStatus('DELIVERED' as any)).toBeNull();
    });

    it('returns null for FAILED', () => {
      expect(getNextStatus('FAILED' as any)).toBeNull();
    });
  });

  describe('isRetryable', () => {
    it('returns true for QUEUED', () => {
      expect(isRetryable('QUEUED' as any)).toBe(true);
    });

    it('returns true for RETRY_1', () => {
      expect(isRetryable('RETRY_1' as any)).toBe(true);
    });

    it('returns true for RETRY_2', () => {
      expect(isRetryable('RETRY_2' as any)).toBe(true);
    });

    it('returns false for RETRY_3', () => {
      expect(isRetryable('RETRY_3' as any)).toBe(false);
    });

    it('returns false for DELIVERED', () => {
      expect(isRetryable('DELIVERED' as any)).toBe(false);
    });

    it('returns false for FAILED', () => {
      expect(isRetryable('FAILED' as any)).toBe(false);
    });
  });
});
