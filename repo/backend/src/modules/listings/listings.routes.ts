import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  CreateListingSchema,
  UpdateListingSchema,
  ListListingsQuerySchema,
  IdParamSchema,
  StatsQuerySchema,
} from './listings.schemas';
import * as controller from './listings.controller';

const router = Router();

const writeRoles = [ROLES.SYSTEM_ADMIN, ROLES.LEASING_OPS_MANAGER];

router.get(
  '/',
  requireAuth,
  validate({ query: ListListingsQuerySchema }),
  controller.findAll,
);

router.get(
  '/stats',
  requireAuth,
  validate({ query: StatsQuerySchema }),
  controller.getStats,
);

router.post(
  '/',
  requireAuth,
  requireRole(...writeRoles),
  validate({ body: CreateListingSchema }),
  controller.create,
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.findById,
);

router.put(
  '/:id',
  requireAuth,
  requireRole(...writeRoles),
  validate({ params: IdParamSchema, body: UpdateListingSchema }),
  controller.update,
);

export default router;
