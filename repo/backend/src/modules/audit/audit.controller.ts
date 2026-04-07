import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, paginated } from '../../shared/utils/response.util';
import { auditService } from './audit.service';
import { ListAuditLogsQuery } from './audit.schemas';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListAuditLogsQuery;
  const result = await auditService.list(filters);
  res.status(200).json(paginated(result.data, result.meta));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const entry = await auditService.getById(req.params.id);
  res.status(200).json(success(entry));
});
