import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success } from '../../shared/utils/response.util';
import { operationalAnalyticsService } from './operational-analytics.service';
import {
  ParticipationQuery,
  AttendanceQuery,
  HourDistributionQuery,
  RetentionQuery,
  StaffingGapsQuery,
  EventPopularityQuery,
  RankingsQuery,
} from './operational-analytics.schemas';

export const getParticipation = asyncHandler(async (req: Request, res: Response) => {
  const result = await operationalAnalyticsService.getParticipation(
    req.query as unknown as ParticipationQuery,
  );
  res.status(200).json(success(result));
});

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const result = await operationalAnalyticsService.getAttendance(
    req.query as unknown as AttendanceQuery,
  );
  res.status(200).json(success(result));
});

export const getHourDistribution = asyncHandler(async (req: Request, res: Response) => {
  const result = await operationalAnalyticsService.getHourDistribution(
    req.query as unknown as HourDistributionQuery,
  );
  res.status(200).json(success(result));
});

export const getRetention = asyncHandler(async (req: Request, res: Response) => {
  const result = await operationalAnalyticsService.getRetention(
    req.query as unknown as RetentionQuery,
  );
  res.status(200).json(success(result));
});

export const getStaffingGaps = asyncHandler(async (req: Request, res: Response) => {
  const result = await operationalAnalyticsService.getStaffingGaps(
    req.query as unknown as StaffingGapsQuery,
  );
  res.status(200).json(success(result));
});

export const getEventPopularity = asyncHandler(async (req: Request, res: Response) => {
  const result = await operationalAnalyticsService.getEventPopularity(
    req.query as unknown as EventPopularityQuery,
  );
  res.status(200).json(success(result));
});

export const getRankings = asyncHandler(async (req: Request, res: Response) => {
  const result = await operationalAnalyticsService.getRankings(
    req.query as unknown as RankingsQuery,
  );
  res.status(200).json(success(result));
});
