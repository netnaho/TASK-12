import { z } from 'zod';

export const CreateSavedViewSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  viewType: z.enum(['PIVOT', 'FILTER', 'DASHBOARD']),
  config: z.record(z.unknown()),
  isPublic: z.boolean().optional(),
});
export type CreateSavedViewBody = z.infer<typeof CreateSavedViewSchema>;

export const UpdateSavedViewSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  config: z.record(z.unknown()).optional(),
  isPublic: z.boolean().optional(),
});
export type UpdateSavedViewBody = z.infer<typeof UpdateSavedViewSchema>;

export const ListSavedViewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  viewType: z.enum(['PIVOT', 'FILTER', 'DASHBOARD']).optional(),
  scope: z.enum(['mine', 'public', 'all']).default('all'),
});
export type ListSavedViewsQuery = z.infer<typeof ListSavedViewsQuerySchema>;
