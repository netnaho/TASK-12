/**
 * Pure utilities for quiet-hours enforcement.
 *
 * Quiet hours are defined by a start hour and end hour in a named IANA timezone.
 * When quietStartHr > quietEndHr the window wraps overnight
 * (e.g. 21 → 7 = 9 PM to 7 AM next day).
 */

export interface QuietHoursConfig {
  quietStartHr: number; // 0-23 local hour (inclusive)
  quietEndHr:   number; // 0-23 local hour (exclusive)
  timezone:     string; // IANA timezone string
}

/**
 * Returns the current local hour (0-23) in the given IANA timezone.
 * Falls back to UTC if the timezone is unrecognised.
 */
export function getLocalHour(timezone: string, date: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(date);
    const h = parts.find((p) => p.type === 'hour')?.value ?? '0';
    const n = parseInt(h, 10);
    return n === 24 ? 0 : n; // Intl can return '24' for midnight
  } catch {
    return date.getUTCHours();
  }
}

/**
 * Returns true if `now` falls within the configured quiet window.
 *
 * Overnight range (quietStartHr > quietEndHr):
 *   e.g. 21→7: hours 21,22,23,0,1,2,3,4,5,6 are quiet.
 *
 * Same-day range (quietStartHr < quietEndHr):
 *   e.g. 9→17: hours 9,10,...,16 are quiet.
 *
 * Equal values → no quiet period (always returns false).
 */
export function isWithinQuietHours(
  config: QuietHoursConfig,
  now: Date = new Date(),
): boolean {
  const { quietStartHr, quietEndHr, timezone } = config;

  if (quietStartHr === quietEndHr) return false;

  const localHour = getLocalHour(timezone, now);

  if (quietStartHr > quietEndHr) {
    // Overnight: quiet from start → midnight → end
    return localHour >= quietStartHr || localHour < quietEndHr;
  }

  // Same-day: quiet between start and end
  return localHour >= quietStartHr && localHour < quietEndHr;
}

/**
 * Given a time that is currently within quiet hours, returns the UTC Date
 * at which the quiet period ends (i.e. when quietEndHr begins in local time).
 *
 * The returned time has minutes, seconds, and ms zeroed so it lands on the
 * exact hour boundary.
 */
export function getQuietHoursEndTime(
  config: QuietHoursConfig,
  now: Date = new Date(),
): Date {
  const { quietEndHr, timezone } = config;
  const localHour = getLocalHour(timezone, now);

  // Hours until the quiet period ends
  let hoursToAdd = (quietEndHr - localHour + 24) % 24;
  if (hoursToAdd === 0) hoursToAdd = 24; // already at the boundary → wait full day

  const end = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  // Snap to the start of the hour
  end.setUTCMinutes(0, 0, 0);
  return end;
}
