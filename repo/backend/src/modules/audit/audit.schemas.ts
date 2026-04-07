import { z } from 'zod';

const auditActionValues = [
  'SEAT_ALLOCATION_CREATED',
  'SEAT_ALLOCATION_CHANGED',
  'SEAT_ALLOCATION_CANCELLED',
  'METRIC_DEF_VERSION_CREATED',
  'METRIC_DEF_VERSION_LOCKED',
  'METRIC_DEF_UPDATED',
  'REPORT_SHARED',
  'REPORT_SHARE_REVOKED',
  'REPORT_PUBLISHED',
  'REPORT_EXPORTED',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_ROLE_CHANGED',
  'SESSION_CREATED',
  'SESSION_CANCELLED',
  'LISTING_CREATED',
  'LISTING_UPDATED',
  'NOTIFICATION_TEMPLATE_UPDATED',
] as const;

export const ListAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  action: z.enum(auditActionValues).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsQuerySchema>;
