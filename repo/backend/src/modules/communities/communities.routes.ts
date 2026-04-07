import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  CreateRegionSchema,
  UpdateRegionSchema,
  CreateCommunitySchema,
  UpdateCommunitySchema,
  CreatePropertySchema,
  UpdatePropertySchema,
  IdParamSchema,
  ListRegionsQuerySchema,
  ListCommunitiesQuerySchema,
  ListPropertiesQuerySchema,
} from './communities.schemas';
import * as controller from './communities.controller';

const router = Router();

const writeRoles = [ROLES.SYSTEM_ADMIN, ROLES.LEASING_OPS_MANAGER];

// ─── Regions ─────────────────────────────────────────────────────────

router.get(
  '/regions',
  requireAuth,
  validate({ query: ListRegionsQuerySchema }),
  controller.listRegions,
);

router.post(
  '/regions',
  requireAuth,
  requireRole(...writeRoles),
  validate({ body: CreateRegionSchema }),
  controller.createRegion,
);

router.get(
  '/regions/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.getRegion,
);

router.put(
  '/regions/:id',
  requireAuth,
  requireRole(...writeRoles),
  validate({ params: IdParamSchema, body: UpdateRegionSchema }),
  controller.updateRegion,
);

router.delete(
  '/regions/:id',
  requireAuth,
  requireRole(...writeRoles),
  validate({ params: IdParamSchema }),
  controller.deleteRegion,
);

// ─── Communities ─────────────────────────────────────────────────────

router.get(
  '/communities',
  requireAuth,
  validate({ query: ListCommunitiesQuerySchema }),
  controller.listCommunities,
);

router.post(
  '/communities',
  requireAuth,
  requireRole(...writeRoles),
  validate({ body: CreateCommunitySchema }),
  controller.createCommunity,
);

router.get(
  '/communities/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.getCommunity,
);

router.put(
  '/communities/:id',
  requireAuth,
  requireRole(...writeRoles),
  validate({ params: IdParamSchema, body: UpdateCommunitySchema }),
  controller.updateCommunity,
);

router.delete(
  '/communities/:id',
  requireAuth,
  requireRole(...writeRoles),
  validate({ params: IdParamSchema }),
  controller.deleteCommunity,
);

// ─── Properties ──────────────────────────────────────────────────────

router.get(
  '/properties',
  requireAuth,
  validate({ query: ListPropertiesQuerySchema }),
  controller.listProperties,
);

router.post(
  '/properties',
  requireAuth,
  requireRole(...writeRoles),
  validate({ body: CreatePropertySchema }),
  controller.createProperty,
);

router.get(
  '/properties/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.getProperty,
);

router.put(
  '/properties/:id',
  requireAuth,
  requireRole(...writeRoles),
  validate({ params: IdParamSchema, body: UpdatePropertySchema }),
  controller.updateProperty,
);

export default router;
