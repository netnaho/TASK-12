import { Request, Response } from 'express';
import { ExportFormat } from '@prisma/client';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { analyticsService } from './analytics.service';

// ─── Report Definitions ─────────────────────────────────────────────

export const listDefinitions = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.listDefinitions(req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});

export const getDefinition = asyncHandler(async (req: Request, res: Response) => {
  const definition = await analyticsService.getDefinition(req.params.id);
  res.status(200).json(success(definition));
});

export const createDefinition = asyncHandler(async (req: Request, res: Response) => {
  const definition = await analyticsService.createDefinition(req.body, req.userId);
  res.status(201).json(created(definition));
});

export const updateDefinition = asyncHandler(async (req: Request, res: Response) => {
  const definition = await analyticsService.updateDefinition(
    req.params.id,
    req.body,
    req.userId,
  );
  res.status(200).json(success(definition));
});

export const deleteDefinition = asyncHandler(async (req: Request, res: Response) => {
  await analyticsService.deleteDefinition(req.params.id);
  res.status(204).send();
});

export const listSchedules = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.listSchedules(req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});

export const archiveReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await analyticsService.archiveReport(
    req.params.id,
    req.userId,
    req.userRoles ?? [],
  );
  res.status(200).json(success(report));
});

// ─── Reports ────────────────────────────────────────────────────────

export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const { definitionId, periodStart, periodEnd } = req.body;
  const report = await analyticsService.generateReport(
    definitionId,
    periodStart,
    periodEnd,
    req.userId,
  );
  res.status(201).json(created(report));
});

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.listReports(req.userId, req.query as any);
  res.status(200).json(paginated(result.data, result.meta));
});

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await analyticsService.getReport(req.params.id, req.userId);
  res.status(200).json(success(report));
});

// ─── Sharing ────────────────────────────────────────────────────────

export const shareReport = asyncHandler(async (req: Request, res: Response) => {
  const share = await analyticsService.shareReport(
    req.params.id,
    req.body.userId,
    req.userId,
  );
  res.status(201).json(created(share));
});

export const revokeShare = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.revokeShare(
    req.params.id,
    req.params.userId,
    req.userId,
  );
  res.status(200).json(success(result));
});

export const listShares = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = (req.userRoles ?? []).includes('SYSTEM_ADMIN');
  const shares = await analyticsService.listShares(req.params.id, req.userId, isAdmin);
  res.status(200).json(success(shares));
});

// ─── Exports ────────────────────────────────────────────────────────

export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const exportRequest = await analyticsService.requestExport(
    req.params.id,
    req.body.format as ExportFormat,
    req.userId,
  );
  res.status(201).json(created(exportRequest));
});

export const downloadExport = asyncHandler(async (req: Request, res: Response) => {
  const { filePath, contentType, fileName } = await analyticsService.downloadExport(
    req.params.id,
    req.userId,
  );

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.sendFile(filePath);
});

// ─── Pivot ──────────────────────────────────────────────────────────

export const pivotQuery = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.pivotQuery(req.body);
  res.status(200).json(success(result));
});
