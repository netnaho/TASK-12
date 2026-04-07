import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  CreateSiteSchema,
  UpdateSiteSchema,
  CreateRoomSchema,
  UpdateRoomSchema,
  CreateSeatSchema,
  UpdateSeatSchema,
  CreateEquipmentSchema,
  UpdateEquipmentSchema,
  CreateSessionSchema,
  ListSessionsQuerySchema,
  RegisterForSessionSchema,
} from './test-center.schemas';
import * as controller from './test-center.controller';

const router = Router();

// ─── SITES ──────────────────────────────────────────────────────────

router.get('/sites', requireAuth, controller.listSites);

router.post(
  '/sites',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: CreateSiteSchema }),
  controller.createSite,
);

router.get('/sites/:id', requireAuth, controller.getSite);

router.put(
  '/sites/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: UpdateSiteSchema }),
  controller.updateSite,
);

// COMPAT: frontend calls PATCH /sites/:id
router.patch(
  '/sites/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: UpdateSiteSchema }),
  controller.updateSite,
);

router.delete(
  '/sites/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.deleteSite,
);

// ─── ROOMS ──────────────────────────────────────────────────────────

router.get('/rooms', requireAuth, controller.listRooms);

router.post(
  '/rooms',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: CreateRoomSchema }),
  controller.createRoom,
);

router.get('/rooms/:id', requireAuth, controller.getRoom);

router.put(
  '/rooms/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: UpdateRoomSchema }),
  controller.updateRoom,
);

router.delete(
  '/rooms/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.deleteRoom,
);

// ─── SEATS ──────────────────────────────────────────────────────────

router.get('/seats', requireAuth, controller.listSeats);

router.post(
  '/seats',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: CreateSeatSchema }),
  controller.createSeat,
);

router.put(
  '/seats/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: UpdateSeatSchema }),
  controller.updateSeat,
);

// COMPAT: frontend calls PATCH /seats/:id
router.patch(
  '/seats/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: UpdateSeatSchema }),
  controller.updateSeat,
);

router.delete(
  '/seats/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  controller.deleteSeat,
);

// ─── EQUIPMENT ──────────────────────────────────────────────────────

router.get('/equipment', requireAuth, controller.listEquipment);

router.post(
  '/equipment',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: CreateEquipmentSchema }),
  controller.createEquipment,
);

router.get('/equipment/:id', requireAuth, controller.getEquipment);

router.put(
  '/equipment/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: UpdateEquipmentSchema }),
  controller.updateEquipment,
);

// COMPAT: frontend calls PATCH /equipment/:id
router.patch(
  '/equipment/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: UpdateEquipmentSchema }),
  controller.updateEquipment,
);

router.delete(
  '/equipment/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  controller.deleteEquipment,
);

// ─── SESSIONS ───────────────────────────────────────────────────────

router.get(
  '/sessions',
  requireAuth,
  validate({ query: ListSessionsQuerySchema }),
  controller.listSessions,
);

router.post(
  '/sessions',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  validate({ body: CreateSessionSchema }),
  controller.createSession,
);

router.get('/sessions/:id', requireAuth, controller.getSession);

router.patch(
  '/sessions/:id/cancel',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  controller.cancelSession,
);

// COMPAT: frontend calls PATCH /sessions/:id (general update maps to cancel)
router.patch(
  '/sessions/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  controller.cancelSession,
);

// COMPAT: frontend calls DELETE /sessions/:id
router.delete(
  '/sessions/:id',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  controller.cancelSession,
);

// ─── REGISTRATION ───────────────────────────────────────────────────

router.post(
  '/sessions/:id/register',
  requireAuth,
  validate({ body: RegisterForSessionSchema }),
  controller.registerForSession,
);

router.delete(
  '/sessions/:id/register',
  requireAuth,
  controller.cancelRegistration,
);

// COMPAT: frontend calls DELETE /sessions/:sessionId/registrations/:registrationId
router.delete(
  '/sessions/:sessionId/registrations/:registrationId',
  requireAuth,
  controller.cancelRegistrationById,
);

// ─── NESTED ROOMS (compat: frontend uses /sites/:siteId/rooms) ───────────────
// COMPAT: frontend calls nested /sites/:siteId/rooms paths

router.get(
  '/sites/:siteId/rooms',
  requireAuth,
  (req: Request, _res: Response, next: NextFunction) => {
    req.query.siteId = req.params.siteId;
    next();
  },
  controller.listRooms,
);

router.post(
  '/sites/:siteId/rooms',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  (req: Request, _res: Response, next: NextFunction) => {
    req.body.siteId = req.params.siteId;
    next();
  },
  validate({ body: CreateRoomSchema }),
  controller.createRoom,
);

router.patch(
  '/sites/:siteId/rooms/:roomId',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  (req: Request, _res: Response, next: NextFunction) => {
    req.params.id = req.params.roomId;
    next();
  },
  validate({ body: UpdateRoomSchema }),
  controller.updateRoom,
);

router.delete(
  '/sites/:siteId/rooms/:roomId',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    req.params.id = req.params.roomId;
    next();
  },
  controller.deleteRoom,
);

// ─── NESTED SEATS (compat: frontend uses /rooms/:roomId/seats) ───────────────
// COMPAT: frontend calls nested /rooms/:roomId/seats paths

router.get(
  '/rooms/:roomId/seats',
  requireAuth,
  (req: Request, _res: Response, next: NextFunction) => {
    req.query.roomId = req.params.roomId;
    next();
  },
  controller.listSeats,
);

router.post(
  '/rooms/:roomId/seats',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  (req: Request, _res: Response, next: NextFunction) => {
    req.body.roomId = req.params.roomId;
    next();
  },
  validate({ body: CreateSeatSchema }),
  controller.createSeat,
);

router.patch(
  '/rooms/:roomId/seats/:seatId',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.TEST_PROCTOR),
  (req: Request, _res: Response, next: NextFunction) => {
    req.params.id = req.params.seatId;
    next();
  },
  validate({ body: UpdateSeatSchema }),
  controller.updateSeat,
);

router.delete(
  '/rooms/:roomId/seats/:seatId',
  requireAuth,
  requireRole(ROLES.SYSTEM_ADMIN),
  (req: Request, _res: Response, next: NextFunction) => {
    req.params.id = req.params.seatId;
    next();
  },
  controller.deleteSeat,
);

// ─── UTILIZATION ────────────────────────────────────────────────────

// COMPAT: flat GET /utilization?roomId= or ?siteId=
router.get('/utilization', requireAuth, controller.getUtilization);

router.get('/utilization/rooms/:roomId', requireAuth, controller.getRoomUtilization);

router.get('/utilization/sites/:siteId', requireAuth, controller.getSiteUtilization);

export { router as testCenterRoutes };
export default router;
