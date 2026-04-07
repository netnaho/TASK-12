import { z } from 'zod';

export const CreateListingSchema = z.object({
  propertyId: z.string().uuid('propertyId must be a valid UUID'),
  unitNumber: z.string().min(1, 'Unit number is required').max(50),
  bedrooms: z.number().int().min(0).max(10),
  bathrooms: z.number().min(0).max(10).multipleOf(0.5),
  sqft: z.number().int().positive('Square footage must be positive'),
  rentPrice: z.number().positive('Rent price must be positive'),
  listedAt: z.string().datetime({ message: 'listedAt must be a valid ISO date string' }),
});
export type CreateListingBody = z.infer<typeof CreateListingSchema>;

export const UpdateListingSchema = z.object({
  unitNumber: z.string().min(1).max(50).optional(),
  bedrooms: z.number().int().min(0).max(10).optional(),
  bathrooms: z.number().min(0).max(10).multipleOf(0.5).optional(),
  sqft: z.number().int().positive().optional(),
  rentPrice: z.number().positive().optional(),
  listedAt: z.string().datetime().optional(),
  leasedAt: z.string().datetime().nullable().optional(),
  delistedAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateListingBody = z.infer<typeof UpdateListingSchema>;

export const ListListingsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  propertyId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  minRent: z.coerce.number().optional(),
  maxRent: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export type ListListingsQuery = z.infer<typeof ListListingsQuerySchema>;

export const IdParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const StatsQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
});
