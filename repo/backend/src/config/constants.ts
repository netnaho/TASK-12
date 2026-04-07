export const API_PREFIX = '/api/v1' as const;

export const SESSION_COOKIE_NAME = 'leaseops.sid' as const;

export const MAX_PAGE_SIZE = 100 as const;
export const DEFAULT_PAGE_SIZE = 20 as const;

export const BCRYPT_SALT_ROUNDS = 12 as const;

export const EXPORT_DIR = '/tmp/leaseops-exports' as const;
export const MESSAGE_FILE_DIR = '/tmp/leaseops-messages' as const;

export const METRIC_RECALC_CRON = '0 2 * * *' as const;
export const REPORT_DAILY_CRON = '0 6 * * *' as const;
export const REPORT_WEEKLY_CRON = '0 7 * * 1' as const;
export const REPORT_MONTHLY_CRON = '0 8 1 * *' as const;
export const SESSION_CLEANUP_CRON = '*/15 * * * *' as const;
export const MESSAGE_RETRY_CRON = '*/5 * * * *' as const;

export const MESSAGE_RETRY_INTERVALS_MS = [
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
] as const;

export const QUIET_HOURS_START = 21 as const;
export const QUIET_HOURS_END = 7 as const;

export const SESSION_BUFFER_MINUTES = 10 as const;
