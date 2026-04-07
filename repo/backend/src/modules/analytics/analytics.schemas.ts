import { z } from 'zod';

// ─── Report Definitions ─────────────────────────────────────────────

export const CreateReportDefinitionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND']),
  filterJson: z.record(z.unknown()).optional(),
  pivotConfig: z.record(z.unknown()).optional(),
});
export type CreateReportDefinitionBody = z.infer<typeof CreateReportDefinitionSchema>;

export const UpdateReportDefinitionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND']).optional(),
  filterJson: z.record(z.unknown()).optional(),
  pivotConfig: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateReportDefinitionBody = z.infer<typeof UpdateReportDefinitionSchema>;

// ─── Reports ────────────────────────────────────────────────────────

export const GenerateReportSchema = z.object({
  definitionId: z.string().uuid('definitionId must be a valid UUID'),
  periodStart: z.string().datetime({ message: 'periodStart must be a valid ISO date string' }),
  periodEnd: z.string().datetime({ message: 'periodEnd must be a valid ISO date string' }),
});
export type GenerateReportBody = z.infer<typeof GenerateReportSchema>;

export const ListReportsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  status: z.enum(['DRAFT', 'GENERATING', 'PUBLISHED', 'FAILED', 'ARCHIVED']).optional(),
  definitionId: z.string().uuid().optional(),
});
export type ListReportsQuery = z.infer<typeof ListReportsQuerySchema>;

// ─── Sharing ────────────────────────────────────────────────────────

export const ShareReportSchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
});
export type ShareReportBody = z.infer<typeof ShareReportSchema>;

// ─── Exports ────────────────────────────────────────────────────────

export const ExportReportSchema = z.object({
  format: z.enum(['CSV', 'EXCEL', 'PDF']),
});
export type ExportReportBody = z.infer<typeof ExportReportSchema>;

// ─── Pivot ──────────────────────────────────────────────────────────

export const PivotQuerySchema = z.object({
  dimensions: z.array(
    z.enum(['region', 'community', 'property', 'metric_type', 'month']),
  ).min(1, 'At least one dimension is required'),
  measures: z.array(
    z.enum(['avg_value', 'sum_value', 'count', 'min_value', 'max_value']),
  ).min(1, 'At least one measure is required'),
  filters: z.object({
    regionId: z.string().uuid().optional(),
    communityId: z.string().uuid().optional(),
    metricType: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
});
export type PivotQueryBody = z.infer<typeof PivotQuerySchema>;

// ─── Common Params ──────────────────────────────────────────────────

export const IdParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const ReportShareParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
  userId: z.string().uuid('userId must be a valid UUID'),
});
