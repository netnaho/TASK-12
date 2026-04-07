import { z } from 'zod';
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success } from '../../shared/utils/response.util';
import { userPreferencesService } from './user-preferences.service';
import { DeliveryMode } from '@prisma/client';

const UpdatePreferencesSchema = z.object({
  deliveryMode: z.nativeEnum(DeliveryMode),
});

export const getMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  const prefs = await userPreferencesService.getPreferences(req.userId!);
  res.status(200).json(success(prefs));
});

export const updateMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  const body = UpdatePreferencesSchema.parse(req.body);
  const prefs = await userPreferencesService.updatePreferences(req.userId!, body);
  res.status(200).json(success(prefs));
});
