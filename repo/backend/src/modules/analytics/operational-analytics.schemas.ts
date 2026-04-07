import { z } from 'zod';

/**
 * Common filter shape used by every operational analytics endpoint.
 *
 * dateFrom / dateTo bound the period of interest.
 * regionId / communityId / siteId narrow scope when supplied.
 *
 * NOTE: filters are intentionally optional — if none supplied the query
 * returns the full window of available data so the dashboard can render
 * something on first load.
 */
export const OperationalFiltersSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  regionId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
});
export type OperationalFilters = z.infer<typeof OperationalFiltersSchema>;

export const ParticipationQuerySchema = OperationalFiltersSchema.extend({
  groupBy: z.enum(['region', 'community', 'site', 'role', 'week']).default('site'),
});
export type ParticipationQuery = z.infer<typeof ParticipationQuerySchema>;

export const AttendanceQuerySchema = OperationalFiltersSchema.extend({
  groupBy: z.enum(['region', 'community', 'site', 'week']).default('site'),
});
export type AttendanceQuery = z.infer<typeof AttendanceQuerySchema>;

export const HourDistributionQuerySchema = OperationalFiltersSchema.extend({
  bucket: z.enum(['hour-of-day', 'day-of-week', 'week']).default('hour-of-day'),
});
export type HourDistributionQuery = z.infer<typeof HourDistributionQuerySchema>;

export const RetentionQuerySchema = OperationalFiltersSchema.extend({
  // Cohort window in days for "did the user come back?"
  cohortWindowDays: z.coerce.number().int().positive().max(365).default(30),
});
export type RetentionQuery = z.infer<typeof RetentionQuerySchema>;

export const StaffingGapsQuerySchema = OperationalFiltersSchema.extend({
  // Sessions whose enrolled / capacity ratio is below this threshold are
  // flagged as under-utilised.
  underutilisedThreshold: z.coerce.number().min(0).max(1).default(0.5),
});
export type StaffingGapsQuery = z.infer<typeof StaffingGapsQuerySchema>;

export const EventPopularityQuerySchema = OperationalFiltersSchema.extend({
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type EventPopularityQuery = z.infer<typeof EventPopularityQuerySchema>;

export const RankingsQuerySchema = OperationalFiltersSchema.extend({
  dimension: z.enum(['region', 'community', 'site', 'team']),
  metric: z
    .enum([
      'total_sessions',
      'total_registrations',
      'avg_fill_rate',
      'attendance_rate',
    ])
    .default('total_registrations'),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
export type RankingsQuery = z.infer<typeof RankingsQuerySchema>;
