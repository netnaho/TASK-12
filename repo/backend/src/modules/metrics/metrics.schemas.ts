import { z } from 'zod';

export const CreateMetricDefinitionSchema = z.object({
  metricType: z.enum([
    'UNIT_RENT',
    'PRICE_CHANGE_PCT',
    'VOLATILITY_30D',
    'VACANCY_DAYS_ON_MARKET',
    'LISTING_DURATION_DOM',
    'SUPPLY_DEMAND_RATIO',
  ]),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
});
export type CreateMetricDefinitionBody = z.infer<typeof CreateMetricDefinitionSchema>;

export const CreateMetricVersionSchema = z.object({
  metricDefinitionId: z.string().uuid('metricDefinitionId must be a valid UUID'),
  formulaJson: z.record(z.unknown()),
  effectiveFrom: z.string().datetime({ message: 'effectiveFrom must be a valid ISO date string' }),
});
export type CreateMetricVersionBody = z.infer<typeof CreateMetricVersionSchema>;

export const TriggerRecalcSchema = z.object({
  propertyIds: z.array(z.string().uuid()).optional(),
});
export type TriggerRecalcBody = z.infer<typeof TriggerRecalcSchema>;

export const ListMetricsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  metricType: z
    .enum([
      'UNIT_RENT',
      'PRICE_CHANGE_PCT',
      'VOLATILITY_30D',
      'VACANCY_DAYS_ON_MARKET',
      'LISTING_DURATION_DOM',
      'SUPPLY_DEMAND_RATIO',
    ])
    .optional(),
  propertyId: z.string().uuid().optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});
export type ListMetricsQuery = z.infer<typeof ListMetricsQuerySchema>;

export const IdParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const ListJobsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});
