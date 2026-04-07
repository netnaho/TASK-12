import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { savedViewsService } from './saved-views.service';
import {
  CreateSavedViewBody,
  UpdateSavedViewBody,
  ListSavedViewsQuery,
} from './saved-views.schemas';

export const listSavedViews = asyncHandler(async (req: Request, res: Response) => {
  const result = await savedViewsService.listSavedViews(
    req.userId,
    req.userRoles ?? [],
    req.query as unknown as ListSavedViewsQuery,
  );
  res.status(200).json(paginated(result.data, result.meta));
});

export const getSavedView = asyncHandler(async (req: Request, res: Response) => {
  const view = await savedViewsService.getSavedView(
    req.params.id,
    req.userId,
    req.userRoles ?? [],
  );
  res.status(200).json(success(view));
});

export const createSavedView = asyncHandler(async (req: Request, res: Response) => {
  const view = await savedViewsService.createSavedView(
    req.body as CreateSavedViewBody,
    req.userId,
  );
  res.status(201).json(created(view));
});

export const updateSavedView = asyncHandler(async (req: Request, res: Response) => {
  const view = await savedViewsService.updateSavedView(
    req.params.id,
    req.body as UpdateSavedViewBody,
    req.userId,
    req.userRoles ?? [],
  );
  res.status(200).json(success(view));
});

export const deleteSavedView = asyncHandler(async (req: Request, res: Response) => {
  await savedViewsService.deleteSavedView(
    req.params.id,
    req.userId,
    req.userRoles ?? [],
  );
  res.status(204).send();
});
