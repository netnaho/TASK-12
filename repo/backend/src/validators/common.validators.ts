import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'startDate must be before or equal to endDate',
    path: ['startDate'],
  });

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(255).optional(),
});

export const booleanStringSchema = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((val) => val === true || val === 'true' || val === '1');
