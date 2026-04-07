import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { ROLES } from '../../shared/constants/roles.constant';
import { NotFoundError } from '../../shared/errors';
import { messagingService } from './messaging.service';
import {
  EnqueueMessageBody,
  UpdateDeliveryBody,
  AddBlacklistBody,
  ListMessagesQuery,
  ListBlacklistQuery,
  UpdateQuietHoursBody,
} from './messaging.schemas';

// ─── MESSAGES ───────────────────────────────────────────────────

export const enqueueMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as EnqueueMessageBody;
  const message = await messagingService.enqueueMessage(data);
  res.status(201).json(created(message));
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListMessagesQuery;
  const isAdmin = (req.userRoles ?? []).includes(ROLES.SYSTEM_ADMIN);
  const result = await messagingService.listMessages(filters, req.userId!, isAdmin);
  res.status(200).json(paginated(result.data, result.meta));
});

export const getMessageStatus = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.userRoles?.includes(ROLES.SYSTEM_ADMIN) ?? false;
  const message = await messagingService.getMessageStatus(req.params.id, req.userId, isAdmin);
  res.status(200).json(success(message));
});

export const updateDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateDeliveryBody;
  const isAdmin = req.userRoles?.includes(ROLES.SYSTEM_ADMIN) ?? false;
  const message = await messagingService.updateDeliveryStatus(req.params.id, data, req.userId, isAdmin);
  res.status(200).json(success(message));
});

export const getFailureAlerts = asyncHandler(async (_req: Request, res: Response) => {
  const alerts = await messagingService.getFailureAlerts();
  res.status(200).json(success(alerts));
});

// ─── PACKAGE DOWNLOAD ────────────────────────────────────────────

/**
 * Generate (or regenerate) a downloadable message package file for the given
 * message and stream it to the client.
 *
 * If the message already has a file at fileOutputPath that still exists on
 * disk, it is returned directly. Otherwise a new file is generated first.
 */
export const downloadPackage = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.userRoles?.includes(ROLES.SYSTEM_ADMIN) ?? false;
  const message = await messagingService.getMessageStatus(req.params.id, req.userId, isAdmin);

  // Use the existing file if present, otherwise generate a new one
  let filePath = message.fileOutputPath;

  if (!filePath || !fs.existsSync(filePath)) {
    filePath = await messagingService.generatePackage(req.params.id, req.userId, isAdmin);
  }

  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === '.txt' ? 'text/plain' : 'application/json';

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);

  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);

  fs.createReadStream(filePath).pipe(res);
});

// ─── BLACKLIST ───────────────────────────────────────────────────

export const addToBlacklist = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as AddBlacklistBody;
  const entry = await messagingService.addToBlacklist(data);
  res.status(201).json(created(entry));
});

export const listBlacklist = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListBlacklistQuery;
  const result = await messagingService.listBlacklist(filters);
  res.status(200).json(paginated(result.data, result.meta));
});

export const removeFromBlacklist = asyncHandler(async (req: Request, res: Response) => {
  await messagingService.removeFromBlacklist(req.params.id);
  res.status(204).send();
});

// ─── QUIET HOURS ────────────────────────────────────────────────

export const getQuietHours = asyncHandler(async (_req: Request, res: Response) => {
  const config = await messagingService.getQuietHoursConfig();
  res.status(200).json(success(config));
});

export const updateQuietHours = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateQuietHoursBody;
  const config = await messagingService.updateQuietHoursConfig(data);
  res.status(200).json(success(config));
});
