import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { paginated } from '../../shared/utils/response.util';
import { scheduleExecutionsService } from './schedule-executions.service';
import { ListScheduleExecutionsQuery } from './schedule-executions.schemas';

export const listExecutions = asyncHandler(async (req: Request, res: Response) => {
  const result = await scheduleExecutionsService.listExecutions(
    req.query as unknown as ListScheduleExecutionsQuery,
  );
  res.status(200).json(paginated(result.data, result.meta));
});
