import { z } from 'zod';

/** Channels supported for outbound message packages */
const channelEnum = z.enum(['EMAIL', 'SMS', 'IN_APP', 'ENTERPRISE_IM']);

/**
 * Channels that can be blacklisted.
 * IN_APP is excluded because in-app notifications cannot be externally suppressed.
 */
const blacklistChannelEnum = z.enum(['EMAIL', 'SMS', 'ENTERPRISE_IM']);

export const EnqueueMessageSchema = z.object({
  templateId: z.string().uuid().optional(),
  recipientAddr: z.string().min(1, 'Recipient address is required'),
  recipientUserId: z.string().uuid().optional(),
  channel: channelEnum,
  subject: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

export const UpdateDeliverySchema = z.object({
  status: z.enum(['DELIVERED', 'FAILED', 'MANUALLY_SENT']),
  failureReason: z.string().optional(),
});

export const AddBlacklistSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  channel: blacklistChannelEnum,
  reason: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const ListMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().optional(),
  channel: z.string().optional(),
  recipientUserId: z.string().uuid().optional(),
});

export const ListBlacklistQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  channel: z.string().optional(),
});

export const UpdateQuietHoursSchema = z.object({
  timezone: z.string().min(1),
  quietStartHr: z.number().int().min(0).max(23),
  quietEndHr: z.number().int().min(0).max(23),
  isGlobal: z.boolean().optional(),
});

export type EnqueueMessageBody = z.infer<typeof EnqueueMessageSchema>;
export type UpdateDeliveryBody = z.infer<typeof UpdateDeliverySchema>;
export type AddBlacklistBody = z.infer<typeof AddBlacklistSchema>;
export type ListMessagesQuery = z.infer<typeof ListMessagesQuerySchema>;
export type ListBlacklistQuery = z.infer<typeof ListBlacklistQuerySchema>;
export type UpdateQuietHoursBody = z.infer<typeof UpdateQuietHoursSchema>;
