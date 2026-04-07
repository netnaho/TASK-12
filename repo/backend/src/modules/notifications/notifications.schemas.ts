import { z } from 'zod';

// ─── NOTIFICATION CATEGORIES ────────────────────────────────────

/**
 * Well-known category values for the unified inbox.
 * Additional arbitrary values are permitted (the field is a plain VarChar).
 */
export const NOTIFICATION_CATEGORIES = {
  APPROVAL: 'approval',
  OVERDUE: 'overdue',
  MISSING_MATERIAL: 'missing_material',
  SYSTEM: 'system',
  GENERAL: 'general',
} as const;

export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORIES)[keyof typeof NOTIFICATION_CATEGORIES];

// ─── NOTIFICATIONS ──────────────────────────────────────────────

export const CreateNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  category: z.string().optional(),
  isTaskReminder: z.boolean().optional(),
  templateId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

// Accepts both { snoozedUntil } (canonical) and { until } (compat alias from frontend).
// After validation the body is normalised to { snoozedUntil }.
export const SnoozeNotificationSchema = z
  .object({
    snoozedUntil: z.string().datetime('snoozedUntil must be an ISO-8601 datetime').optional(),
    until: z.string().datetime('until must be an ISO-8601 datetime').optional(),
  })
  .refine((val) => val.snoozedUntil !== undefined || val.until !== undefined, {
    message: 'Either snoozedUntil or until is required',
  })
  .transform((val) => ({ snoozedUntil: (val.snoozedUntil ?? val.until)! }));

export const UpdateNotificationStatusSchema = z.object({
  status: z.enum(['READ', 'UNREAD', 'SNOOZED', 'DISMISSED']),
  snoozedUntil: z.string().datetime('Invalid datetime for snoozedUntil').optional(),
});

export const ListNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  isTaskReminder: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

// ─── TEMPLATES ──────────────────────────────────────────────────

export const CreateTemplateSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  subjectTpl: z.string().min(1, 'Subject template is required'),
  bodyTpl: z.string().min(1, 'Body template is required'),
  channel: z.enum(['EMAIL', 'SMS', 'IN_APP', 'ENTERPRISE_IM']),
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  subjectTpl: z.string().min(1).optional(),
  bodyTpl: z.string().min(1).optional(),
  channel: z.enum(['EMAIL', 'SMS', 'IN_APP', 'ENTERPRISE_IM']).optional(),
});

export const PreviewTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  variables: z.record(z.string()),
});

// ─── TYPE EXPORTS ───────────────────────────────────────────────

export type CreateNotificationBody = z.infer<typeof CreateNotificationSchema>;
export type SnoozeNotificationBody = z.infer<typeof SnoozeNotificationSchema>;
export type UpdateNotificationStatusBody = z.infer<typeof UpdateNotificationStatusSchema>;
export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>;
export type CreateTemplateBody = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateBody = z.infer<typeof UpdateTemplateSchema>;
export type PreviewTemplateBody = z.infer<typeof PreviewTemplateSchema>;
