import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { communitiesService } from './communities.service';

// ─── Regions ─────────────────────────────────────────────────────────

export const createRegion = asyncHandler(async (req: Request, res: Response) => {
  const region = await communitiesService.createRegion(req.body);
  res.status(201).json(created(region));
});

export const listRegions = asyncHandler(async (req: Request, res: Response) => {
  const result = await communitiesService.listRegions(req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});

export const getRegion = asyncHandler(async (req: Request, res: Response) => {
  const region = await communitiesService.getRegion(req.params.id);
  res.status(200).json(success(region));
});

export const updateRegion = asyncHandler(async (req: Request, res: Response) => {
  const region = await communitiesService.updateRegion(req.params.id, req.body);
  res.status(200).json(success(region));
});

export const deleteRegion = asyncHandler(async (req: Request, res: Response) => {
  await communitiesService.deleteRegion(req.params.id);
  res.status(200).json(success({ message: 'Region deleted' }));
});

// ─── Communities ─────────────────────────────────────────────────────

export const createCommunity = asyncHandler(async (req: Request, res: Response) => {
  const community = await communitiesService.createCommunity(req.body);
  res.status(201).json(created(community));
});

export const listCommunities = asyncHandler(async (req: Request, res: Response) => {
  const result = await communitiesService.listCommunities(req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});

export const getCommunity = asyncHandler(async (req: Request, res: Response) => {
  const community = await communitiesService.getCommunity(req.params.id);
  res.status(200).json(success(community));
});

export const updateCommunity = asyncHandler(async (req: Request, res: Response) => {
  const community = await communitiesService.updateCommunity(req.params.id, req.body);
  res.status(200).json(success(community));
});

export const deleteCommunity = asyncHandler(async (req: Request, res: Response) => {
  await communitiesService.deleteCommunity(req.params.id);
  res.status(200).json(success({ message: 'Community deleted' }));
});

// ─── Properties ──────────────────────────────────────────────────────

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await communitiesService.createProperty(req.body, req.userId);
  res.status(201).json(created(property));
});

export const listProperties = asyncHandler(async (req: Request, res: Response) => {
  const result = await communitiesService.listProperties(req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});

export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await communitiesService.getProperty(req.params.id);
  res.status(200).json(success(property));
});

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await communitiesService.updateProperty(req.params.id, req.body, req.userId);
  res.status(200).json(success(property));
});
