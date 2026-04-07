import { describe, it, expect } from 'vitest';
import {
  isWithinQuietHours,
  getQuietHoursEndTime,
  getLocalHour,
} from '../../src/shared/utils/quiet-hours.util';

/**
 * Helper: build a Date whose UTC hour matches the given local hour in UTC
 * (i.e. we use UTC as the "timezone" to keep tests timezone-agnostic).
 */
function utcDate(hour: number, minute = 0): Date {
  const d = new Date('2024-01-15T00:00:00.000Z');
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

const UTC_CFG = (startHr: number, endHr: number) => ({
  timezone: 'UTC',
  quietStartHr: startHr,
  quietEndHr: endHr,
});

describe('getLocalHour', () => {
  it('returns UTC hour for UTC timezone', () => {
    expect(getLocalHour('UTC', utcDate(14))).toBe(14);
  });

  it('returns 0 for midnight UTC', () => {
    expect(getLocalHour('UTC', utcDate(0))).toBe(0);
  });

  it('falls back to UTC hours for invalid timezone', () => {
    const d = utcDate(10);
    const result = getLocalHour('Not/ATimezone', d);
    expect(result).toBe(10); // fallback to getUTCHours()
  });
});

describe('isWithinQuietHours — overnight window (21 → 7)', () => {
  const cfg = UTC_CFG(21, 7);

  it('is quiet at 21:00 (start hour)', () => {
    expect(isWithinQuietHours(cfg, utcDate(21))).toBe(true);
  });

  it('is quiet at 23:00', () => {
    expect(isWithinQuietHours(cfg, utcDate(23))).toBe(true);
  });

  it('is quiet at 00:00 (midnight)', () => {
    expect(isWithinQuietHours(cfg, utcDate(0))).toBe(true);
  });

  it('is quiet at 06:00', () => {
    expect(isWithinQuietHours(cfg, utcDate(6))).toBe(true);
  });

  it('is NOT quiet at 07:00 (exclusive end)', () => {
    expect(isWithinQuietHours(cfg, utcDate(7))).toBe(false);
  });

  it('is NOT quiet at 10:00', () => {
    expect(isWithinQuietHours(cfg, utcDate(10))).toBe(false);
  });

  it('is NOT quiet at 20:00 (one hour before start)', () => {
    expect(isWithinQuietHours(cfg, utcDate(20))).toBe(false);
  });
});

describe('isWithinQuietHours — same-day window (9 → 17)', () => {
  const cfg = UTC_CFG(9, 17);

  it('is quiet at 09:00 (start hour)', () => {
    expect(isWithinQuietHours(cfg, utcDate(9))).toBe(true);
  });

  it('is quiet at 12:00', () => {
    expect(isWithinQuietHours(cfg, utcDate(12))).toBe(true);
  });

  it('is NOT quiet at 17:00 (exclusive end)', () => {
    expect(isWithinQuietHours(cfg, utcDate(17))).toBe(false);
  });

  it('is NOT quiet at 08:00 (before start)', () => {
    expect(isWithinQuietHours(cfg, utcDate(8))).toBe(false);
  });

  it('is NOT quiet at 23:00', () => {
    expect(isWithinQuietHours(cfg, utcDate(23))).toBe(false);
  });
});

describe('isWithinQuietHours — equal start/end', () => {
  it('always returns false (no quiet window)', () => {
    const cfg = UTC_CFG(12, 12);
    expect(isWithinQuietHours(cfg, utcDate(12))).toBe(false);
    expect(isWithinQuietHours(cfg, utcDate(0))).toBe(false);
  });
});

describe('getQuietHoursEndTime — overnight window (21 → 7)', () => {
  const cfg = UTC_CFG(21, 7);

  it('at 22:00, end time is ~9 h away at 07:xx', () => {
    const now = utcDate(22);
    const end = getQuietHoursEndTime(cfg, now);
    // end should be ≥ now and within 10 h
    expect(end.getTime()).toBeGreaterThan(now.getTime());
    expect(end.getUTCHours()).toBe(7);
    expect(end.getUTCMinutes()).toBe(0);
  });

  it('at 06:30, end time is ~0.5 h away at 07:00', () => {
    const now = utcDate(6, 30);
    const end = getQuietHoursEndTime(cfg, now);
    expect(end.getUTCHours()).toBe(7);
    expect(end.getTime()).toBeGreaterThan(now.getTime());
  });

  it('end time always has zero minutes and seconds', () => {
    const now = utcDate(3, 45);
    const end = getQuietHoursEndTime(cfg, now);
    expect(end.getUTCMinutes()).toBe(0);
    expect(end.getUTCSeconds()).toBe(0);
  });
});

describe('getQuietHoursEndTime — end time is always in the future', () => {
  it('when now equals quietEndHr, adds 24 h', () => {
    const cfg = UTC_CFG(21, 7);
    const now = utcDate(7); // exactly at the boundary
    const end = getQuietHoursEndTime(cfg, now);
    expect(end.getTime()).toBeGreaterThan(now.getTime());
  });
});
