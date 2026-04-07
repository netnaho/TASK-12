import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  CreateReportDefinitionSchema,
  UpdateReportDefinitionSchema,
  GenerateReportSchema,
  ShareReportSchema,
  ExportReportSchema,
  ListReportsQuerySchema,
  PivotQuerySchema,
  IdParamSchema,
  ReportShareParamSchema,
} from './analytics.schemas';
import {
  ParticipationQuerySchema,
  AttendanceQuerySchema,
  HourDistributionQuerySchema,
  RetentionQuerySchema,
  StaffingGapsQuerySchema,
  EventPopularityQuerySchema,
  RankingsQuerySchema,
} from './operational-analytics.schemas';
import {
  CreateSavedViewSchema,
  UpdateSavedViewSchema,
  ListSavedViewsQuerySchema,
} from './saved-views.schemas';
import { ListScheduleExecutionsQuerySchema } from './schedule-executions.schemas';
import * as controller from './analytics.controller';
import * as opController from './operational-analytics.controller';
import * as savedViewsController from './saved-views.controller';
import * as scheduleController from './schedule-executions.controller';

const router = Router();

const analyticsRoles = [ROLES.SYSTEM_ADMIN, ROLES.LEASING_OPS_MANAGER, ROLES.ANALYST];
const managerRoles = [ROLES.SYSTEM_ADMIN, ROLES.LEASING_OPS_MANAGER];

// ─── Report Definitions ─────────────────────────────────────────────

router.get(
  '/definitions',
  requireAuth,
  controller.listDefinitions,
);

router.post(
  '/definitions',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ body: CreateReportDefinitionSchema }),
  controller.createDefinition,
);

router.get(
  '/definitions/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.getDefinition,
);

router.put(
  '/definitions/:id',
  requireAuth,
  requireRole(...managerRoles),
  validate({ params: IdParamSchema, body: UpdateReportDefinitionSchema }),
  controller.updateDefinition,
);

// COMPAT: frontend calls PATCH /definitions/:id
router.patch(
  '/definitions/:id',
  requireAuth,
  requireRole(...managerRoles),
  validate({ params: IdParamSchema, body: UpdateReportDefinitionSchema }),
  controller.updateDefinition,
);

// ─── Reports ────────────────────────────────────────────────────────

router.post(
  '/reports/generate',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ body: GenerateReportSchema }),
  controller.generateReport,
);

// COMPAT: frontend calls POST /reports instead of POST /reports/generate
router.post(
  '/reports',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ body: GenerateReportSchema }),
  controller.generateReport,
);

router.get(
  '/reports',
  requireAuth,
  validate({ query: ListReportsQuerySchema }),
  controller.listReports,
);

router.get(
  '/reports/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.getReport,
);

// ─── Sharing ────────────────────────────────────────────────────────

router.post(
  '/reports/:id/share',
  requireAuth,
  requireRole(...managerRoles),
  validate({ params: IdParamSchema, body: ShareReportSchema }),
  controller.shareReport,
);

router.delete(
  '/reports/:id/share/:userId',
  requireAuth,
  requireRole(...managerRoles),
  validate({ params: ReportShareParamSchema }),
  controller.revokeShare,
);

router.get(
  '/reports/:id/shares',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.listShares,
);

// COMPAT: frontend calls POST /reports/:id/shares
router.post(
  '/reports/:id/shares',
  requireAuth,
  requireRole(...managerRoles),
  validate({ params: IdParamSchema, body: ShareReportSchema }),
  controller.shareReport,
);

// COMPAT: frontend calls DELETE /reports/:id/shares/:shareId (shareId == userId)
router.delete(
  '/reports/:id/shares/:shareId',
  requireAuth,
  requireRole(...managerRoles),
  (req: Request, _res: Response, next: NextFunction) => {
    req.params.userId = req.params.shareId;
    next();
  },
  controller.revokeShare,
);

// ─── Exports ────────────────────────────────────────────────────────

router.post(
  '/reports/:id/export',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ params: IdParamSchema, body: ExportReportSchema }),
  controller.exportReport,
);

router.get(
  '/exports/:id/download',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.downloadExport,
);

// ─── Pivot ──────────────────────────────────────────────────────────

router.post(
  '/pivot',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ body: PivotQuerySchema }),
  controller.pivotQuery,
);

// ─── Operational Analytics (LeaseOps participation/sessions) ─────────
//
// All operational analytics endpoints are gated to analytics roles
// (SYSTEM_ADMIN, LEASING_OPS_MANAGER, ANALYST). They produce data
// shaped for direct consumption by the Vue analytics dashboard.

router.get(
  '/operational/participation',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ query: ParticipationQuerySchema }),
  opController.getParticipation,
);

router.get(
  '/operational/attendance',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ query: AttendanceQuerySchema }),
  opController.getAttendance,
);

router.get(
  '/operational/hour-distribution',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ query: HourDistributionQuerySchema }),
  opController.getHourDistribution,
);

router.get(
  '/operational/retention',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ query: RetentionQuerySchema }),
  opController.getRetention,
);

router.get(
  '/operational/staffing-gaps',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ query: StaffingGapsQuerySchema }),
  opController.getStaffingGaps,
);

router.get(
  '/operational/event-popularity',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ query: EventPopularityQuerySchema }),
  opController.getEventPopularity,
);

router.get(
  '/operational/rankings',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ query: RankingsQuerySchema }),
  opController.getRankings,
);

// ─── Saved Views (saved filters / pivots) ────────────────────────────

router.get(
  '/saved-views',
  requireAuth,
  validate({ query: ListSavedViewsQuerySchema }),
  savedViewsController.listSavedViews,
);

router.post(
  '/saved-views',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ body: CreateSavedViewSchema }),
  savedViewsController.createSavedView,
);

router.get(
  '/saved-views/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  savedViewsController.getSavedView,
);

router.put(
  '/saved-views/:id',
  requireAuth,
  validate({ params: IdParamSchema, body: UpdateSavedViewSchema }),
  savedViewsController.updateSavedView,
);

router.delete(
  '/saved-views/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  savedViewsController.deleteSavedView,
);

// ─── Schedule Executions (admin only) ────────────────────────────────

router.get(
  '/schedule-executions',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  validate({ query: ListScheduleExecutionsQuerySchema }),
  scheduleController.listExecutions,
);

// ─── Report Archive (lifecycle) ──────────────────────────────────────

router.patch(
  '/reports/:id/archive',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.archiveReport,
);

// ─── Schedules (compat CRUD for definitions with a recurring frequency) ─────
//
// These routes allow the frontend to manage scheduled report definitions via
// a /schedules resource. They delegate to the existing definitions controller.
// COMPAT: frontend calls /analytics/schedules instead of /analytics/definitions

router.get(
  '/schedules',
  requireAuth,
  requireRole(...analyticsRoles),
  controller.listSchedules,
);

router.get(
  '/schedules/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  controller.getDefinition,
);

router.post(
  '/schedules',
  requireAuth,
  requireRole(...analyticsRoles),
  validate({ body: CreateReportDefinitionSchema }),
  controller.createDefinition,
);

router.patch(
  '/schedules/:id',
  requireAuth,
  requireRole(...managerRoles),
  validate({ params: IdParamSchema, body: UpdateReportDefinitionSchema }),
  controller.updateDefinition,
);

router.delete(
  '/schedules/:id',
  requireAuth,
  requireRole(...managerRoles),
  validate({ params: IdParamSchema }),
  controller.deleteDefinition,
);

export const analyticsRoutes = router;
export default router;
