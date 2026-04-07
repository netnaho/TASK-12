import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import { ListAuditLogsQuerySchema } from './audit.schemas';
import * as controller from './audit.controller';

const auditRoutes = Router();

auditRoutes.get(
  '/',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ query: ListAuditLogsQuerySchema }),
  controller.list,
);

auditRoutes.get(
  '/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.getById,
);

export { auditRoutes };
