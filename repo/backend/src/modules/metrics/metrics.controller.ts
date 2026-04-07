import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { metricsService } from './metrics.service';

export const listDefinitions = asyncHandler(async (_req: Request, res: Response) => {
  const definitions = await metricsService.listDefinitions();
  res.status(200).json(success(definitions));
});

export const getDefinition = asyncHandler(async (req: Request, res: Response) => {
  const definition = await metricsService.getDefinition(req.params.id);
  res.status(200).json(success(definition));
});

export const createDefinition = asyncHandler(async (req: Request, res: Response) => {
  const definition = await metricsService.createDefinition(req.body, req.userId);
  res.status(201).json(created(definition));
});

export const createVersion = asyncHandler(async (req: Request, res: Response) => {
  const body = { ...req.body, metricDefinitionId: req.params.id };
  const version = await metricsService.createVersion(body, req.userId);
  res.status(201).json(created(version));
});

export const listMetricValues = asyncHandler(async (req: Request, res: Response) => {
  const result = await metricsService.getMetricValues(req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});

export const triggerRecalculation = asyncHandler(async (req: Request, res: Response) => {
  const job = await metricsService.triggerRecalculation(req.body.propertyIds, req.userId);
  res.status(202).json(created(job));
});

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const result = await metricsService.listJobs(req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});
