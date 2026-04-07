import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { listingsService } from './listings.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const listing = await listingsService.create(req.body, req.userId);
  res.status(201).json(created(listing));
});

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await listingsService.findAll(req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const listing = await listingsService.findById(req.params.id);
  res.status(200).json(success(listing));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const listing = await listingsService.update(req.params.id, req.body, req.userId);
  res.status(200).json(success(listing));
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await listingsService.getListingStats(req.query.propertyId as string | undefined);
  res.status(200).json(success(stats));
});
