import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  EnqueueMessageSchema,
  UpdateDeliverySchema,
  AddBlacklistSchema,
  ListMessagesQuerySchema,
  ListBlacklistQuerySchema,
  UpdateQuietHoursSchema,
} from './messaging.schemas';
import * as controller from './messaging.controller';

const messagingRoutes = Router();

// ─── MESSAGES ───────────────────────────────────────────────────

messagingRoutes.post(
  '/enqueue',
  requireAuth,
  validate({ body: EnqueueMessageSchema }),
  controller.enqueueMessage,
);

messagingRoutes.get(
  '/',
  requireAuth,
  validate({ query: ListMessagesQuerySchema }),
  controller.listMessages,
);

messagingRoutes.get(
  '/failures',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.getFailureAlerts,
);

// ─── BLACKLIST ──────────────────────────────────────────────────

messagingRoutes.post(
  '/blacklist',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: AddBlacklistSchema }),
  controller.addToBlacklist,
);

messagingRoutes.get(
  '/blacklist',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ query: ListBlacklistQuerySchema }),
  controller.listBlacklist,
);

messagingRoutes.delete(
  '/blacklist/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.removeFromBlacklist,
);

// ─── QUIET HOURS ────────────────────────────────────────────────

messagingRoutes.get(
  '/quiet-hours',
  requireAuth,
  controller.getQuietHours,
);

messagingRoutes.put(
  '/quiet-hours',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: UpdateQuietHoursSchema }),
  controller.updateQuietHours,
);

// ─── MESSAGES (compat aliases — frontend uses /messages/* prefix) ────
// COMPAT: frontend calls /messaging/messages* instead of flat /messaging/* paths
// These must be registered BEFORE the dynamic /:id routes below to avoid
// GET /messages being swallowed by GET /:id.

messagingRoutes.post(
  '/messages',
  requireAuth,
  validate({ body: EnqueueMessageSchema }),
  controller.enqueueMessage,
);

messagingRoutes.get(
  '/messages',
  requireAuth,
  validate({ query: ListMessagesQuerySchema }),
  controller.listMessages,
);

messagingRoutes.get(
  '/messages/:id',
  requireAuth,
  controller.getMessageStatus,
);

messagingRoutes.patch(
  '/messages/:id/delivery',
  requireAuth,
  validate({ body: UpdateDeliverySchema }),
  controller.updateDeliveryStatus,
);

// ─── DYNAMIC ROUTES (must come after all static paths) ──────────

/**
 * Download or generate a message package file for manual delivery.
 * Any authenticated user can download a package for messages they have access to.
 */
messagingRoutes.get(
  '/:id/package',
  requireAuth,
  controller.downloadPackage,
);

messagingRoutes.get(
  '/:id',
  requireAuth,
  controller.getMessageStatus,
);

messagingRoutes.patch(
  '/:id/delivery',
  requireAuth,
  validate({ body: UpdateDeliverySchema }),
  controller.updateDeliveryStatus,
);

export { messagingRoutes };
