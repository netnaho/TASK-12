import { z } from 'zod';

// ─── Region Schemas ──────────────────────────────────────────────────

export const CreateRegionSchema = z.object({
  name: z.string().min(1, 'Region name is required').max(150),
});
export type CreateRegionBody = z.infer<typeof CreateRegionSchema>;

export const UpdateRegionSchema = z.object({
  name: z.string().min(1).max(150).optional(),
});
export type UpdateRegionBody = z.infer<typeof UpdateRegionSchema>;

// ─── Community Schemas ───────────────────────────────────────────────

export const CreateCommunitySchema = z.object({
  name: z.string().min(1, 'Community name is required').max(200),
  regionId: z.string().uuid('regionId must be a valid UUID'),
});
export type CreateCommunityBody = z.infer<typeof CreateCommunitySchema>;

export const UpdateCommunitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  regionId: z.string().uuid('regionId must be a valid UUID').optional(),
});
export type UpdateCommunityBody = z.infer<typeof UpdateCommunitySchema>;

// ─── Property Schemas ────────────────────────────────────────────────

export const CreatePropertySchema = z.object({
  name: z.string().min(1, 'Property name is required').max(255),
  communityId: z.string().uuid('communityId must be a valid UUID'),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(50),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  totalUnits: z.number().int().positive('Total units must be a positive integer'),
});
export type CreatePropertyBody = z.infer<typeof CreatePropertySchema>;

export const UpdatePropertySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  communityId: z.string().uuid('communityId must be a valid UUID').optional(),
  addressLine1: z.string().min(1).max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(50).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  totalUnits: z.number().int().positive().optional(),
});
export type UpdatePropertyBody = z.infer<typeof UpdatePropertySchema>;

// ─── Param Schemas ───────────────────────────────────────────────────

export const IdParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const ListCommunitiesQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  regionId: z.string().uuid().optional(),
});

export const ListPropertiesQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  communityId: z.string().uuid().optional(),
});

export const ListRegionsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});
