export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addMilliseconds(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

export function diffInDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function diffInMs(from: Date, to: Date): number {
  return to.getTime() - from.getTime();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function toISOStringWithTZ(date: Date): string {
  return date.toISOString();
}

export function isWithinQuietHours(
  date: Date,
  quietStartHr: number,
  quietEndHr: number,
): boolean {
  const hour = date.getHours();
  if (quietStartHr > quietEndHr) {
    return hour >= quietStartHr || hour < quietEndHr;
  }
  return hour >= quietStartHr && hour < quietEndHr;
}

export function nextQuietHoursEnd(quietEndHr: number): Date {
  const now = new Date();
  const target = new Date(now);
  target.setHours(quietEndHr, 0, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}
