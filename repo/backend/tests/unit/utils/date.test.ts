import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  addMinutes,
  addMilliseconds,
  diffInDays,
  diffInMs,
  startOfDay,
  endOfDay,
  toISOStringWithTZ,
  isWithinQuietHours,
  nextQuietHoursEnd,
} from '../../../src/utils/date';

describe('addMinutes', () => {
  it('adds positive minutes', () => {
    const base = new Date('2024-01-01T10:00:00.000Z');
    const result = addMinutes(base, 30);
    expect(result.toISOString()).toBe('2024-01-01T10:30:00.000Z');
  });

  it('subtracts minutes when negative', () => {
    const base = new Date('2024-01-01T10:00:00.000Z');
    const result = addMinutes(base, -10);
    expect(result.toISOString()).toBe('2024-01-01T09:50:00.000Z');
  });

  it('handles zero minutes', () => {
    const base = new Date('2024-01-01T10:00:00.000Z');
    expect(addMinutes(base, 0).getTime()).toBe(base.getTime());
  });

  it('does not mutate the input date', () => {
    const base = new Date('2024-01-01T10:00:00.000Z');
    const origTime = base.getTime();
    addMinutes(base, 60);
    expect(base.getTime()).toBe(origTime);
  });
});

describe('addMilliseconds', () => {
  it('adds positive milliseconds', () => {
    const base = new Date('2024-01-01T10:00:00.000Z');
    const result = addMilliseconds(base, 5000);
    expect(result.getTime()).toBe(base.getTime() + 5000);
  });

  it('handles zero', () => {
    const base = new Date('2024-01-01T10:00:00.000Z');
    expect(addMilliseconds(base, 0).getTime()).toBe(base.getTime());
  });
});

describe('diffInDays', () => {
  it('returns positive days between two dates', () => {
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-08T00:00:00.000Z');
    expect(diffInDays(from, to)).toBe(7);
  });

  it('returns negative when to is before from', () => {
    const from = new Date('2024-01-08T00:00:00.000Z');
    const to = new Date('2024-01-01T00:00:00.000Z');
    expect(diffInDays(from, to)).toBe(-7);
  });

  it('returns 0 for same dates', () => {
    const d = new Date('2024-01-01T00:00:00.000Z');
    expect(diffInDays(d, d)).toBe(0);
  });

  it('returns fractional days for partial-day differences', () => {
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-01T12:00:00.000Z');
    expect(diffInDays(from, to)).toBe(0.5);
  });
});

describe('diffInMs', () => {
  it('returns ms difference', () => {
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-01T00:01:00.000Z');
    expect(diffInMs(from, to)).toBe(60000);
  });
});

describe('startOfDay', () => {
  it('resets hours, minutes, seconds, ms to 0', () => {
    const d = new Date('2024-06-15T14:30:45.123');
    const result = startOfDay(d);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    // Date part unchanged
    expect(result.getFullYear()).toBe(d.getFullYear());
    expect(result.getMonth()).toBe(d.getMonth());
    expect(result.getDate()).toBe(d.getDate());
  });

  it('does not mutate the input', () => {
    const d = new Date('2024-06-15T14:30:45.123');
    const origHour = d.getHours();
    startOfDay(d);
    expect(d.getHours()).toBe(origHour);
  });
});

describe('endOfDay', () => {
  it('sets hours 23, minutes 59, seconds 59, ms 999', () => {
    const d = new Date('2024-06-15T00:00:00.000');
    const result = endOfDay(d);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});

describe('toISOStringWithTZ', () => {
  it('returns an ISO 8601 string', () => {
    const d = new Date('2024-01-15T08:00:00.000Z');
    expect(toISOStringWithTZ(d)).toBe('2024-01-15T08:00:00.000Z');
  });
});

describe('isWithinQuietHours (utils/date)', () => {
  it('overnight range: 21-7 — returns true at 22:00', () => {
    const d = new Date();
    d.setHours(22, 0, 0, 0);
    expect(isWithinQuietHours(d, 21, 7)).toBe(true);
  });

  it('overnight range: 21-7 — returns true at 3:00', () => {
    const d = new Date();
    d.setHours(3, 0, 0, 0);
    expect(isWithinQuietHours(d, 21, 7)).toBe(true);
  });

  it('overnight range: 21-7 — returns false at 10:00', () => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    expect(isWithinQuietHours(d, 21, 7)).toBe(false);
  });

  it('same-day range: 12-14 — returns true at 13:00', () => {
    const d = new Date();
    d.setHours(13, 0, 0, 0);
    expect(isWithinQuietHours(d, 12, 14)).toBe(true);
  });

  it('same-day range: 12-14 — returns false at 15:00', () => {
    const d = new Date();
    d.setHours(15, 0, 0, 0);
    expect(isWithinQuietHours(d, 12, 14)).toBe(false);
  });
});

describe('nextQuietHoursEnd', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today at quietEndHr when current time is before it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T03:00:00'));
    const result = nextQuietHoursEnd(7);
    expect(result.getHours()).toBe(7);
    expect(result.getMinutes()).toBe(0);
    // Should be today (same date as fake now)
    expect(result.getDate()).toBe(15);
  });

  it('advances to next day when current time is past quietEndHr', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T08:00:00'));
    const result = nextQuietHoursEnd(7);
    expect(result.getHours()).toBe(7);
    expect(result.getDate()).toBe(16);
  });
});
