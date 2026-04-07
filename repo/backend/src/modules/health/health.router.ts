import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { getHealthStatus, getLivenessStatus, getReadinessStatus } from './health.service';

export const healthRouter = Router();

// Full health check — DB connectivity included
healthRouter.get(
  '/health',
  asyncHandler(async (req, res) => {
    const status = await getHealthStatus();
    const httpStatus = status.status === 'healthy' ? 200 : 503;
    res.status(httpStatus).json({ success: true, data: status });
  }),
);

// Liveness probe — is the process alive?
healthRouter.get('/health/live', (_req, res) => {
  sendSuccess(res, getLivenessStatus());
});

// Readiness probe — is the app ready to serve traffic?
healthRouter.get('/health/ready', (_req, res) => {
  sendSuccess(res, getReadinessStatus());
});
