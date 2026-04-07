import { z } from 'zod';

export const ListScheduleExecutionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND']).optional(),
  status: z.enum(['RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL']).optional(),
});
export type ListScheduleExecutionsQuery = z.infer<typeof ListScheduleExecutionsQuerySchema>;
