import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler.util';
import { success, created, paginated } from '../../shared/utils/response.util';
import { BadRequestError } from '../../shared/errors';
import { testCenterService } from './test-center.service';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  CreateSiteBody,
  UpdateSiteBody,
  CreateRoomBody,
  UpdateRoomBody,
  CreateSeatBody,
  UpdateSeatBody,
  CreateEquipmentBody,
  UpdateEquipmentBody,
  CreateSessionBody,
  ListSessionsQuery,
  RegisterForSessionBody,
} from './test-center.schemas';

// ─── SITES ──────────────────────────────────────────────────────────

export const listSites = asyncHandler(async (_req: Request, res: Response) => {
  const sites = await testCenterService.listSites();
  res.status(200).json(success(sites));
});

export const createSite = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateSiteBody;
  const site = await testCenterService.createSite(data);
  res.status(201).json(created(site));
});

export const getSite = asyncHandler(async (req: Request, res: Response) => {
  const site = await testCenterService.getSite(req.params.id);
  res.status(200).json(success(site));
});

export const updateSite = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateSiteBody;
  const site = await testCenterService.updateSite(req.params.id, data);
  res.status(200).json(success(site));
});

export const deleteSite = asyncHandler(async (req: Request, res: Response) => {
  await testCenterService.deleteSite(req.params.id);
  res.status(204).send();
});

// ─── ROOMS ──────────────────────────────────────────────────────────

export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  const siteId = req.query.siteId as string | undefined;
  const rooms = await testCenterService.listRooms(siteId);
  res.status(200).json(success(rooms));
});

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateRoomBody;
  const room = await testCenterService.createRoom(data);
  res.status(201).json(created(room));
});

export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await testCenterService.getRoomWithSeats(req.params.id);
  res.status(200).json(success(room));
});

export const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateRoomBody;
  const room = await testCenterService.updateRoom(req.params.id, data);
  res.status(200).json(success(room));
});

export const deleteRoom = asyncHandler(async (req: Request, res: Response) => {
  await testCenterService.deleteRoom(req.params.id);
  res.status(204).send();
});

// ─── SEATS ──────────────────────────────────────────────────────────

export const listSeats = asyncHandler(async (req: Request, res: Response) => {
  const roomId = req.query.roomId as string;
  const seats = await testCenterService.listSeatsByRoom(roomId);
  res.status(200).json(success(seats));
});

export const createSeat = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateSeatBody;
  const seat = await testCenterService.createSeat(data);
  res.status(201).json(created(seat));
});

export const updateSeat = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateSeatBody;
  const seat = await testCenterService.updateSeat(req.params.id, data);
  res.status(200).json(success(seat));
});

export const deleteSeat = asyncHandler(async (req: Request, res: Response) => {
  await testCenterService.deleteSeat(req.params.id);
  res.status(204).send();
});

// ─── EQUIPMENT ──────────────────────────────────────────────────────

export const listEquipment = asyncHandler(async (req: Request, res: Response) => {
  const seatId = req.query.seatId as string;
  const equipment = await testCenterService.listEquipmentBySeat(seatId);
  res.status(200).json(success(equipment));
});

export const createEquipment = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateEquipmentBody;
  const equipment = await testCenterService.createEquipment(data);
  res.status(201).json(created(equipment));
});

export const getEquipment = asyncHandler(async (req: Request, res: Response) => {
  const equipment = await testCenterService.getEquipment(req.params.id);
  res.status(200).json(success(equipment));
});

export const updateEquipment = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateEquipmentBody;
  const equipment = await testCenterService.updateEquipment(req.params.id, data);
  res.status(200).json(success(equipment));
});

export const deleteEquipment = asyncHandler(async (req: Request, res: Response) => {
  await testCenterService.deleteEquipment(req.params.id);
  res.status(204).send();
});

// ─── SESSIONS ───────────────────────────────────────────────────────

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as ListSessionsQuery;
  const result = await testCenterService.listSessions(filters);
  res.status(200).json(paginated(result.data, result.meta));
});

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateSessionBody;
  const session = await testCenterService.createSession(data, req.userId);
  res.status(201).json(created(session));
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await testCenterService.getSession(req.params.id);
  res.status(200).json(success(session));
});

export const cancelSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await testCenterService.cancelSession(req.params.id, req.userId);
  res.status(200).json(success(session));
});

// ─── REGISTRATION ───────────────────────────────────────────────────

export const registerForSession = asyncHandler(async (req: Request, res: Response) => {
  const { userId: bodyUserId } = req.body as RegisterForSessionBody;
  const isPrivileged = req.userRoles?.some(
    (r) => r === ROLES.SYSTEM_ADMIN || r === ROLES.TEST_PROCTOR,
  ) ?? false;
  // Security: non-privileged users can only register themselves
  const userId = isPrivileged ? bodyUserId : req.userId;
  const result = await testCenterService.registerForSession(req.params.id, userId);
  res.status(201).json(created(result));
});

export const cancelRegistration = asyncHandler(async (req: Request, res: Response) => {
  const isPrivileged = req.userRoles?.some(
    (r) => r === ROLES.SYSTEM_ADMIN || r === ROLES.TEST_PROCTOR,
  ) ?? false;
  // Security: non-privileged users can only cancel their own registration
  const userId = isPrivileged ? ((req.query.userId as string) ?? req.userId) : req.userId;
  await testCenterService.cancelRegistration(req.params.id, userId, req.userId);
  res.status(204).send();
});

export const cancelRegistrationById = asyncHandler(async (req: Request, res: Response) => {
  const isPrivileged = req.userRoles?.some(
    (r) => r === ROLES.SYSTEM_ADMIN || r === ROLES.TEST_PROCTOR,
  ) ?? false;
  await testCenterService.cancelRegistrationById(req.params.registrationId, req.userId, isPrivileged);
  res.status(204).send();
});

// ─── UTILIZATION ────────────────────────────────────────────────────

export const getRoomUtilization = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as { startDate: string; endDate: string };
  const result = await testCenterService.getRoomUtilization(req.params.roomId, startDate, endDate);
  res.status(200).json(success(result));
});

export const getSiteUtilization = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as { startDate: string; endDate: string };
  const result = await testCenterService.getSiteUtilization(req.params.siteId, startDate, endDate);
  res.status(200).json(success(result));
});

// COMPAT: flat route — dispatches on roomId or siteId query param
export const getUtilization = asyncHandler(async (req: Request, res: Response) => {
  const { roomId, siteId, startDate, endDate } = req.query as {
    roomId?: string;
    siteId?: string;
    startDate?: string;
    endDate?: string;
  };
  if (roomId) {
    const result = await testCenterService.getRoomUtilization(roomId, startDate ?? '', endDate ?? '');
    return res.status(200).json(success(result));
  }
  if (siteId) {
    const result = await testCenterService.getSiteUtilization(siteId, startDate ?? '', endDate ?? '');
    return res.status(200).json(success(result));
  }
  throw new BadRequestError('Either roomId or siteId query parameter is required');
});
