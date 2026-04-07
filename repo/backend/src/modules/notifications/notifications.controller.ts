import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { notificationsService } from './notifications.service';
import {
  CreateNotificationBody,
  SnoozeNotificationBody,
  UpdateNotificationStatusBody,
  ListNotificationsQuery,
  CreateTemplateBody,
  UpdateTemplateBody,
  PreviewTemplateBody,
} from './notifications.schemas';

// ─── NOTIFICATIONS ──────────────────────────────────────────────────

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListNotificationsQuery;
  const result = await notificationsService.listForUser(req.userId, filters);
  res.status(200).json(paginated(result.data, result.meta));
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.getUnreadCount(req.userId);
  res.status(200).json(success(result));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationsService.markRead(req.params.id, req.userId);
  res.status(200).json(success(notification));
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.markAllRead(req.userId);
  res.status(200).json(success(result));
});

export const snooze = asyncHandler(async (req: Request, res: Response) => {
  const { snoozedUntil } = req.body as SnoozeNotificationBody;
  const notification = await notificationsService.snooze(
    req.params.id,
    req.userId,
    snoozedUntil,
  );
  res.status(200).json(success(notification));
});

export const dismiss = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationsService.dismiss(req.params.id, req.userId);
  res.status(200).json(success(notification));
});

// ─── TEMPLATES ──────────────────────────────────────────────────────

export const listTemplates = asyncHandler(async (_req: Request, res: Response) => {
  const templates = await notificationsService.listTemplates();
  res.status(200).json(success(templates));
});

export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateTemplateBody;
  const template = await notificationsService.createTemplate(data);
  res.status(201).json(created(template));
});

export const getTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await notificationsService.getTemplate(req.params.id);
  res.status(200).json(success(template));
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateTemplateBody;
  const template = await notificationsService.updateTemplate(req.params.id, data);
  res.status(200).json(success(template));
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.deleteTemplate(req.params.id);
  res.status(204).send();
});

export const previewTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { templateId, variables } = req.body as PreviewTemplateBody;
  const result = await notificationsService.previewTemplate(templateId, variables);
  res.status(200).json(success(result));
});
