import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  timeAgo,
} from '@/utils/format';

describe('frontend/utils/format.ts', () => {
  describe('formatDate', () => {
    it('formats a valid ISO date string with default pattern', () => {
      expect(formatDate('2024-07-04T12:00:00Z')).toMatch(/Jul 4, 2024/);
    });

    it('honors the provided pattern', () => {
      expect(formatDate('2024-07-04T12:00:00Z', 'yyyy-MM-dd')).toBe('2024-07-04');
    });

    it('falls back to em-dash for invalid input', () => {
      expect(formatDate('not-a-date')).toBe('—');
    });

    it('accepts Date objects', () => {
      expect(formatDate(new Date('2024-01-15T00:00:00Z'), 'yyyy-MM-dd'))
        .toBe('2024-01-15');
    });
  });

  describe('formatCurrency', () => {
    it('returns a USD-formatted string with $ sign', () => {
      const out = formatCurrency(1234);
      expect(out).toMatch(/\$[\s\S]*1,234/);
    });

    it('honors a different currency code', () => {
      const out = formatCurrency(50, 'EUR');
      expect(out).toMatch(/€|EUR/);
    });
  });

  describe('formatPercent', () => {
    it('multiplies by 100 and adds a percent sign', () => {
      expect(formatPercent(0.256)).toBe('25.6%');
    });

    it('honors the decimals parameter', () => {
      expect(formatPercent(0.5, 0)).toBe('50%');
      expect(formatPercent(0.12345, 2)).toBe('12.35%');
    });
  });

  describe('formatRelativeTime / timeAgo', () => {
    it('returns em-dash for invalid dates', () => {
      expect(formatRelativeTime('not a date')).toBe('—');
      expect(timeAgo('bogus')).toBe('—');
    });

    it('returns a human-readable string for a recent date', () => {
      const recent = new Date(Date.now() - 60_000).toISOString();
      expect(formatRelativeTime(recent)).toMatch(/ago/);
    });
  });
});
