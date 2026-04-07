import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import { env } from '../../config/env';
import {
  CreateMetricDefinitionSchema,
  CreateMetricVersionSchema,
  TriggerRecalcSchema,
  ListMetricsQuerySchema,
  IdParamSchema,
  ListJobsQuerySchema,
} from './metrics.schemas';
import * as controller from './metrics.controller';

const router = Router();

const adminRoles = [ROLES.SYSTEM_ADMIN, ROLES.LEASING_OPS_MANAGER];
// ANALYST_CAN_TRIGGER_RECALC: aligns route with domain model when enabled.
// Domain model grants METRIC_CALC_TRIGGER to ANALYST; default off for compat.
const recalcRoles = env.ANALYST_CAN_TRIGGER_RECALC
  ? [...adminRoles, ROLES.ANALYST]
  : adminRoles;

// ─── Definitions ─────────────────────────────────────────────────────

router.get(
  '/definitions',
  requireAuth,
  controller.listDefinitions,
);

router.get(
  '/definitions/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.getDefinition,
);

router.post(
  '/definitions',
  requireAuth,
  requireRole(...adminRoles),
  validate({ body: CreateMetricDefinitionSchema }),
  controller.createDefinition,
);

// ─── Versions ────────────────────────────────────────────────────────

router.post(
  '/definitions/:id/versions',
  requireAuth,
  requireRole(...adminRoles),
  validate({
    params: IdParamSchema,
    body: CreateMetricVersionSchema.omit({ metricDefinitionId: true }),
  }),
  controller.createVersion,
);

// ─── Metric Values ───────────────────────────────────────────────────

router.get(
  '/values',
  requireAuth,
  validate({ query: ListMetricsQuerySchema }),
  controller.listMetricValues,
);

// ─── Recalculation ───────────────────────────────────────────────────

router.post(
  '/recalculate',
  requireAuth,
  requireRole(...recalcRoles),
  validate({ body: TriggerRecalcSchema }),
  controller.triggerRecalculation,
);

// ─── Jobs ────────────────────────────────────────────────────────────

router.get(
  '/jobs',
  requireAuth,
  validate({ query: ListJobsQuerySchema }),
  controller.listJobs,
);

export default router;
