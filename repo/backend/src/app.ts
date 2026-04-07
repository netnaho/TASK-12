import express from 'express';

// Foundation middleware (new architecture)
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import {
  helmetMiddleware,
  corsMiddleware,
  compressionMiddleware,
  globalRateLimiter,
  authRateLimiter,
} from './middleware/security';
import { buildSessionMiddleware } from './security/session';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import { healthRouter } from './modules/health/health.router';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/users.routes';
import communityRoutes from './modules/communities/communities.routes';
import listingRoutes from './modules/listings/listings.routes';
import metricRoutes from './modules/metrics/metrics.routes';
import { testCenterRoutes } from './modules/test-center/test-center.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { messagingRoutes } from './modules/messaging/messaging.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import { auditRoutes } from './modules/audit/audit.routes';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy (needed for accurate IP in rate limiter behind nginx)
  app.set('trust proxy', 1);

  // 1. Request ID — must be first for tracing
  app.use(requestId);

  // 2. Security headers
  app.use(helmetMiddleware);

  // 3. CORS
  app.use(corsMiddleware);

  // 4. Compression
  app.use(compressionMiddleware);

  // 5. Global rate limiter
  app.use(globalRateLimiter);

  // 6. Body parsing (1 MB JSON limit)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // 7. Session
  app.use(buildSessionMiddleware());

  // 8. Request logging
  app.use(requestLogger);

  // 9. Health probes (no auth required)
  app.use('/api', healthRouter);

  // 10. Auth routes (stricter rate limit)
  app.use('/api/v1/auth', authRateLimiter, authRoutes);

  // 11. Protected API routes
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/communities', communityRoutes);
  app.use('/api/v1/listings', listingRoutes);
  app.use('/api/v1/metrics', metricRoutes);
  app.use('/api/v1/test-center', testCenterRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/messaging', messagingRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/audit', auditRoutes);

  // 12. 404 catch-all
  app.use(notFoundHandler);

  // 13. Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
