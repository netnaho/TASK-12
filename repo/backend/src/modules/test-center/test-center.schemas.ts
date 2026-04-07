import { z } from 'zod';

// ─── SITES ──────────────────────────────────────────────────────────

export const CreateSiteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  timezone: z.string().default('America/New_York'),
});

export const UpdateSiteSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── ROOMS ──────────────────────────────────────────────────────────

export const CreateRoomSchema = z.object({
  siteId: z.string().uuid('Invalid site ID'),
  name: z.string().min(1, 'Name is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  hasAda: z.boolean(),
});

export const UpdateRoomSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  hasAda: z.boolean().optional(),
});

// ─── SEATS ──────────────────────────────────────────────────────────

export const CreateSeatSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  seatLabel: z.string().min(1, 'Seat label is required'),
  rowIdentifier: z.string().min(1, 'Row identifier is required'),
  positionInRow: z.number().int(),
  isAccessible: z.boolean(),
  hasEquipment: z.boolean().optional(),
});

export const UpdateSeatSchema = z.object({
  seatLabel: z.string().min(1).optional(),
  rowIdentifier: z.string().min(1).optional(),
  positionInRow: z.number().int().optional(),
  isAccessible: z.boolean().optional(),
  hasEquipment: z.boolean().optional(),
  isServiceable: z.boolean().optional(),
});

// ─── EQUIPMENT ──────────────────────────────────────────────────────

export const CreateEquipmentSchema = z.object({
  seatId: z.string().uuid('Invalid seat ID'),
  equipmentType: z.string().min(1, 'Equipment type is required'),
  serialNumber: z.string().optional(),
  status: z.enum(['OPERATIONAL', 'NEEDS_REPAIR', 'DECOMMISSIONED']),
});

export const UpdateEquipmentSchema = z.object({
  equipmentType: z.string().min(1).optional(),
  serialNumber: z.string().optional(),
  status: z.enum(['OPERATIONAL', 'NEEDS_REPAIR', 'DECOMMISSIONED']).optional(),
  notes: z.string().optional(),
});

// ─── SESSIONS ───────────────────────────────────────────────────────

export const CreateSessionSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  name: z.string().min(1, 'Session name is required'),
  scheduledStart: z.string().datetime('Invalid datetime for scheduledStart'),
  scheduledEnd: z.string().datetime('Invalid datetime for scheduledEnd'),
  maxCapacity: z.number().int().positive('Max capacity must be a positive integer'),
});

export const ListSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  roomId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ─── REGISTRATION ───────────────────────────────────────────────────

export const RegisterForSessionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// ─── TYPE EXPORTS ───────────────────────────────────────────────────

export type CreateSiteBody = z.infer<typeof CreateSiteSchema>;
export type UpdateSiteBody = z.infer<typeof UpdateSiteSchema>;
export type CreateRoomBody = z.infer<typeof CreateRoomSchema>;
export type UpdateRoomBody = z.infer<typeof UpdateRoomSchema>;
export type CreateSeatBody = z.infer<typeof CreateSeatSchema>;
export type UpdateSeatBody = z.infer<typeof UpdateSeatSchema>;
export type CreateEquipmentBody = z.infer<typeof CreateEquipmentSchema>;
export type UpdateEquipmentBody = z.infer<typeof UpdateEquipmentSchema>;
export type CreateSessionBody = z.infer<typeof CreateSessionSchema>;
export type ListSessionsQuery = z.infer<typeof ListSessionsQuerySchema>;
export type RegisterForSessionBody = z.infer<typeof RegisterForSessionSchema>;
