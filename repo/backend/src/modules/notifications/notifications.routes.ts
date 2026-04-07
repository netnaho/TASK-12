import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  ListNotificationsQuerySchema,
  SnoozeNotificationSchema,
  UpdateNotificationStatusSchema,
  CreateTemplateSchema,
  UpdateTemplateSchema,
  PreviewTemplateSchema,
} from './notifications.schemas';
import * as controller from './notifications.controller';

const router = Router();

// ─── USER NOTIFICATIONS ─────────────────────────────────────────────

router.get(
  '/',
  requireAuth,
  validate({ query: ListNotificationsQuerySchema }),
  controller.list,
);

router.get(
  '/unread-count',
  requireAuth,
  controller.getUnreadCount,
);

router.patch(
  '/read-all',
  requireAuth,
  controller.markAllRead,
);

router.patch(
  '/:id/read',
  requireAuth,
  controller.markRead,
);

router.patch(
  '/:id/snooze',
  requireAuth,
  validate({ body: SnoozeNotificationSchema }),
  controller.snooze,
);

router.patch(
  '/:id/dismiss',
  requireAuth,
  controller.dismiss,
);

// ─── TEMPLATES (ADMIN ONLY) ─────────────────────────────────────────

router.get(
  '/templates',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.listTemplates,
);

router.post(
  '/templates',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: CreateTemplateSchema }),
  controller.createTemplate,
);

router.get(
  '/templates/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.getTemplate,
);

router.put(
  '/templates/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: UpdateTemplateSchema }),
  controller.updateTemplate,
);

// COMPAT: frontend calls PATCH /templates/:id
router.patch(
  '/templates/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: UpdateTemplateSchema }),
  controller.updateTemplate,
);

router.delete(
  '/templates/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.deleteTemplate,
);

router.post(
  '/templates/preview',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: PreviewTemplateSchema }),
  controller.previewTemplate,
);

export { router as notificationRoutes };
export default router;
