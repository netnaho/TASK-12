import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  CreateUserSchema,
  UpdateUserSchema,
  AssignRoleSchema,
  ListUsersQuerySchema,
} from './users.schemas';
import * as controller from './users.controller';
import * as prefsController from './user-preferences.controller';

const userRoutes = Router();

// ─── SELF-SERVICE PREFERENCES ──────────────────────────────────
// Any authenticated user can view/update their own delivery preferences.
// These routes must be before the /:id param routes.

userRoutes.get('/me/preferences', requireAuth, prefsController.getMyPreferences);
userRoutes.put('/me/preferences', requireAuth, prefsController.updateMyPreferences);

userRoutes.get(
  '/',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ query: ListUsersQuerySchema }),
  controller.list,
);

userRoutes.post(
  '/',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: CreateUserSchema }),
  controller.create,
);

userRoutes.get(
  '/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.getById,
);

userRoutes.put(
  '/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: UpdateUserSchema }),
  controller.update,
);

userRoutes.post(
  '/:id/roles',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ body: AssignRoleSchema }),
  controller.assignRole,
);

userRoutes.delete(
  '/:id/roles/:roleName',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.removeRole,
);

userRoutes.patch(
  '/:id/deactivate',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.deactivate,
);

export { userRoutes };
