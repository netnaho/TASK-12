import { Prisma, TestSessionStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { auditService } from '../audit/audit.service';
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
} from './test-center.schemas';
import { seatAllocator } from './allocation/allocator';

export class TestCenterService {
  // ─── SITES ──────────────────────────────────────────────────────────

  async createSite(data: CreateSiteBody) {
    const site = await prisma.testSite.create({ data });
    logger.info({ siteId: site.id }, 'Test site created');
    return site;
  }

  async listSites() {
    return prisma.testSite.findMany({
      orderBy: { createdAt: 'desc' },
      include: { rooms: true },
    });
  }

  async getSite(id: string) {
    const site = await prisma.testSite.findUnique({
      where: { id },
      include: { rooms: true },
    });
    if (!site) throw new NotFoundError('Test site not found');
    return site;
  }

  async updateSite(id: string, data: UpdateSiteBody) {
    await this.getSite(id);
    const site = await prisma.testSite.update({ where: { id }, data });
    logger.info({ siteId: id }, 'Test site updated');
    return site;
  }

  async deleteSite(id: string) {
    await this.getSite(id);
    await prisma.testSite.delete({ where: { id } });
    logger.info({ siteId: id }, 'Test site deleted');
  }

  // ─── ROOMS ─────────────────────────────────────────────────────────

  async createRoom(data: CreateRoomBody) {
    const site = await prisma.testSite.findUnique({ where: { id: data.siteId } });
    if (!site) throw new NotFoundError('Test site not found');

    const room = await prisma.testRoom.create({
      data,
      include: { site: true },
    });
    logger.info({ roomId: room.id, siteId: data.siteId }, 'Test room created');
    return room;
  }

  async listRooms(siteId?: string) {
    const where: Prisma.TestRoomWhereInput = {};
    if (siteId) where.siteId = siteId;

    return prisma.testRoom.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { site: true },
    });
  }

  async getRoom(id: string) {
    const room = await prisma.testRoom.findUnique({
      where: { id },
      include: { site: true },
    });
    if (!room) throw new NotFoundError('Test room not found');
    return room;
  }

  async getRoomWithSeats(id: string) {
    const room = await prisma.testRoom.findUnique({
      where: { id },
      include: { site: true, seats: { orderBy: [{ rowIdentifier: 'asc' }, { positionInRow: 'asc' }] } },
    });
    if (!room) throw new NotFoundError('Test room not found');
    return room;
  }

  async updateRoom(id: string, data: UpdateRoomBody) {
    await this.getRoom(id);
    const room = await prisma.testRoom.update({
      where: { id },
      data,
      include: { site: true },
    });
    logger.info({ roomId: id }, 'Test room updated');
    return room;
  }

  async deleteRoom(id: string) {
    await this.getRoom(id);
    await prisma.testRoom.delete({ where: { id } });
    logger.info({ roomId: id }, 'Test room deleted');
  }

  // ─── SEATS ─────────────────────────────────────────────────────────

  async createSeat(data: CreateSeatBody) {
    const room = await prisma.testRoom.findUnique({ where: { id: data.roomId } });
    if (!room) throw new NotFoundError('Test room not found');

    const seat = await prisma.testSeat.create({
      data: {
        roomId: data.roomId,
        seatLabel: data.seatLabel,
        rowIdentifier: data.rowIdentifier,
        positionInRow: data.positionInRow,
        isAccessible: data.isAccessible,
        hasEquipment: data.hasEquipment ?? true,
      },
    });
    logger.info({ seatId: seat.id, roomId: data.roomId }, 'Test seat created');
    return seat;
  }

  async listSeatsByRoom(roomId: string) {
    return prisma.testSeat.findMany({
      where: { roomId },
      orderBy: [{ rowIdentifier: 'asc' }, { positionInRow: 'asc' }],
    });
  }

  async updateSeat(id: string, data: UpdateSeatBody) {
    const seat = await prisma.testSeat.findUnique({ where: { id } });
    if (!seat) throw new NotFoundError('Test seat not found');

    const updated = await prisma.testSeat.update({ where: { id }, data });
    logger.info({ seatId: id }, 'Test seat updated');
    return updated;
  }

  async deleteSeat(id: string) {
    const seat = await prisma.testSeat.findUnique({ where: { id } });
    if (!seat) throw new NotFoundError('Test seat not found');
    await prisma.testSeat.delete({ where: { id } });
    logger.info({ seatId: id }, 'Test seat deleted');
  }

  // ─── EQUIPMENT ─────────────────────────────────────────────────────

  async createEquipment(data: CreateEquipmentBody) {
    const seat = await prisma.testSeat.findUnique({ where: { id: data.seatId } });
    if (!seat) throw new NotFoundError('Test seat not found');

    const entry = await prisma.equipmentLedgerEntry.create({
      data: {
        seatId: data.seatId,
        equipmentType: data.equipmentType,
        serialNumber: data.serialNumber ?? null,
        status: data.status,
        installedAt: new Date(),
      },
    });
    logger.info({ equipmentId: entry.id, seatId: data.seatId }, 'Equipment created');
    return entry;
  }

  async listEquipmentBySeat(seatId: string) {
    return prisma.equipmentLedgerEntry.findMany({
      where: { seatId },
      orderBy: { installedAt: 'desc' },
    });
  }

  async getEquipment(id: string) {
    const entry = await prisma.equipmentLedgerEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundError('Equipment entry not found');
    return entry;
  }

  async updateEquipment(id: string, data: UpdateEquipmentBody) {
    await this.getEquipment(id);
    const entry = await prisma.equipmentLedgerEntry.update({ where: { id }, data });
    logger.info({ equipmentId: id }, 'Equipment updated');
    return entry;
  }

  async deleteEquipment(id: string) {
    await this.getEquipment(id);
    await prisma.equipmentLedgerEntry.update({
      where: { id },
      data: { removedAt: new Date() },
    });
    logger.info({ equipmentId: id }, 'Equipment removed');
  }

  // ─── SESSIONS ──────────────────────────────────────────────────────

  async createSession(data: CreateSessionBody, actorId: string) {
    const room = await prisma.testRoom.findUnique({ where: { id: data.roomId } });
    if (!room) throw new NotFoundError('Test room not found');

    if (data.maxCapacity > room.capacity) {
      throw new BadRequestError(
        `Max capacity (${data.maxCapacity}) exceeds room capacity (${room.capacity})`,
      );
    }

    const scheduledStart = new Date(data.scheduledStart);
    const scheduledEnd = new Date(data.scheduledEnd);

    if (scheduledEnd <= scheduledStart) {
      throw new BadRequestError('scheduledEnd must be after scheduledStart');
    }

    // Enforce 10-minute buffer between sessions in the same room
    const bufferMs = 10 * 60 * 1000; // 10 minutes in milliseconds
    const bufferedStart = new Date(scheduledStart.getTime() - bufferMs);
    const bufferedEnd = new Date(scheduledEnd.getTime() + bufferMs);

    const overlapping = await prisma.testSession.findFirst({
      where: {
        roomId: data.roomId,
        status: { not: 'CANCELLED' },
        scheduledStart: { lt: bufferedEnd },
        scheduledEnd: { gt: bufferedStart },
      },
    });

    if (overlapping) {
      throw new ConflictError(
        'Session conflicts with existing session. A 10-minute buffer is required between sessions.',
      );
    }

    const session = await prisma.testSession.create({
      data: {
        roomId: data.roomId,
        name: data.name,
        scheduledStart,
        scheduledEnd,
        maxCapacity: data.maxCapacity,
        createdBy: actorId,
      },
      include: { room: { include: { site: true } } },
    });

    logger.info({ sessionId: session.id, actorId }, 'Test session created');
    await auditService.create({
      action: 'TEST_SESSION_CREATED',
      actorId,
      entityType: 'testSession',
      entityId: session.id,
      afterJson: { roomId: data.roomId, scheduledStart: data.scheduledStart, scheduledEnd: data.scheduledEnd, maxCapacity: data.maxCapacity },
    });
    return session;
  }

  async listSessions(filters: ListSessionsQuery) {
    const { skip, take, page, pageSize } = parsePagination(filters);

    const where: Prisma.TestSessionWhereInput = {};

    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.siteId) {
      where.room = { siteId: filters.siteId };
    }
    if (filters.status) {
      where.status = filters.status as TestSessionStatus;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.scheduledStart = {};
      if (filters.dateFrom) where.scheduledStart.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.scheduledStart.lte = new Date(filters.dateTo);
    }

    const [sessions, total] = await Promise.all([
      prisma.testSession.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledStart: 'desc' },
        include: { room: { include: { site: true } } },
      }),
      prisma.testSession.count({ where }),
    ]);

    return { data: sessions, meta: buildMeta(total, page, pageSize) };
  }

  async getSession(id: string) {
    const session = await prisma.testSession.findUnique({
      where: { id },
      include: {
        room: { include: { site: true } },
        registrations: {
          include: { user: { select: { id: true, displayName: true, email: true } } },
        },
        seatAllocations: {
          include: { seat: true },
        },
      },
    });
    if (!session) throw new NotFoundError('Test session not found');
    return session;
  }

  async cancelSession(id: string, actorId: string) {
    const session = await prisma.testSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Test session not found');

    const updated = await prisma.testSession.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { room: { include: { site: true } } },
    });

    logger.info({ sessionId: id, actorId }, 'Test session cancelled');
    await auditService.create({
      action: 'TEST_SESSION_CANCELLED',
      actorId,
      entityType: 'testSession',
      entityId: id,
    });
    return updated;
  }

  // ─── REGISTRATION ──────────────────────────────────────────────────

  async registerForSession(sessionId: string, userId: string) {
    const session = await prisma.testSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundError('Test session not found');

    if (session.status !== 'SCHEDULED') {
      throw new BadRequestError('Can only register for sessions with SCHEDULED status');
    }

    // Enforce capacity
    if (session.currentEnrolled >= session.maxCapacity) {
      throw new ConflictError('Session is full. No more registrations allowed.');
    }

    // Check duplicate registration
    const existing = await prisma.testRegistration.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (existing) {
      throw new ConflictError('User is already registered for this session');
    }

    // Create registration and increment enrolled count in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const registration = await tx.testRegistration.create({
        data: { sessionId, userId },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
      });

      await tx.testSession.update({
        where: { id: sessionId },
        data: { currentEnrolled: { increment: 1 } },
      });

      return registration;
    });

    // Auto-allocate seat
    const allocation = await seatAllocator.allocateSeats(
      sessionId,
      result.id,
      session.roomId,
    );

    logger.info({ sessionId, userId, registrationId: result.id }, 'User registered for session');
    if (allocation) {
      await auditService.create({
        action: 'SEAT_ALLOCATION_CREATED',
        actorId: userId,
        entityType: 'seatAllocation',
        entityId: allocation.id,
        afterJson: { sessionId, seatId: allocation.seatId, registrationId: result.id },
      });
    }

    return { registration: result, seatAllocation: allocation };
  }

  async cancelRegistration(sessionId: string, userId: string, actorId: string) {
    const registration = await prisma.testRegistration.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (registration.cancelledAt) {
      throw new BadRequestError('Registration is already cancelled');
    }

    // Capture the seat allocations being released so we can audit each one
    // BEFORE the transaction deletes them. This guarantees the audit log
    // contains the seat that was previously allocated, even if it gets
    // re-allocated to another registrant immediately afterwards.
    const releasedAllocations = await prisma.seatAllocation.findMany({
      where: { registrationId: registration.id },
      select: { id: true, seatId: true },
    });

    await prisma.$transaction(async (tx) => {
      // Cancel the registration
      await tx.testRegistration.update({
        where: { id: registration.id },
        data: { cancelledAt: new Date() },
      });

      // Decrement enrolled count
      await tx.testSession.update({
        where: { id: sessionId },
        data: { currentEnrolled: { decrement: 1 } },
      });

      // Remove seat allocation
      await tx.seatAllocation.deleteMany({
        where: { registrationId: registration.id },
      });
    });

    logger.info({ sessionId, userId, actorId }, 'Registration cancelled');

    // Emit an audit event for the registration cancellation itself, plus one
    // SEAT_ALLOCATION_CANCELLED event per released seat so the audit trail
    // captures the full effect of the cancellation (including seats freed for
    // reallocation).
    await auditService.create({
      action: 'TEST_SESSION_UPDATED',
      actorId,
      entityType: 'testRegistration',
      entityId: registration.id,
      beforeJson: { sessionId, userId, status: 'enrolled' },
      afterJson: { sessionId, userId, status: 'cancelled' },
      metadata: { reason: actorId === userId ? 'self_cancel' : 'admin_cancel' },
    });

    for (const alloc of releasedAllocations) {
      await auditService.create({
        action: 'SEAT_ALLOCATION_CANCELLED',
        actorId,
        entityType: 'seatAllocation',
        entityId: alloc.id,
        beforeJson: { sessionId, seatId: alloc.seatId, registrationId: registration.id },
        metadata: { releasedFor: 'registration_cancellation' },
      });
    }
  }

  async cancelRegistrationById(registrationId: string, actorId: string, isPrivileged: boolean) {
    const registration = await prisma.testRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!registration) throw new NotFoundError('Registration not found');
    // Security: non-privileged users can only cancel their own registrations
    if (!isPrivileged && registration.userId !== actorId) {
      throw new ForbiddenError('You can only cancel your own registration');
    }
    return this.cancelRegistration(registration.sessionId, registration.userId, actorId);
  }

  // ─── UTILIZATION ───────────────────────────────────────────────────

  async getRoomUtilization(roomId: string, startDate: string, endDate: string) {
    const room = await prisma.testRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError('Test room not found');

    const sessions = await prisma.testSession.findMany({
      where: {
        roomId,
        status: { not: 'CANCELLED' },
        scheduledStart: { gte: new Date(startDate) },
        scheduledEnd: { lte: new Date(endDate) },
      },
      orderBy: { scheduledStart: 'asc' },
    });

    const sessionStats = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      scheduledStart: s.scheduledStart,
      scheduledEnd: s.scheduledEnd,
      maxCapacity: s.maxCapacity,
      currentEnrolled: s.currentEnrolled,
      occupancyRate: s.maxCapacity > 0
        ? Math.round((s.currentEnrolled / s.maxCapacity) * 10000) / 100
        : 0,
    }));

    const totalCapacity = sessions.reduce((sum, s) => sum + s.maxCapacity, 0);
    const totalEnrolled = sessions.reduce((sum, s) => sum + s.currentEnrolled, 0);

    return {
      roomId,
      roomName: room.name,
      roomCapacity: room.capacity,
      totalSessions: sessions.length,
      averageOccupancyRate: totalCapacity > 0
        ? Math.round((totalEnrolled / totalCapacity) * 10000) / 100
        : 0,
      sessions: sessionStats,
    };
  }

  async getSiteUtilization(siteId: string, startDate: string, endDate: string) {
    const site = await prisma.testSite.findUnique({
      where: { id: siteId },
      include: { rooms: true },
    });
    if (!site) throw new NotFoundError('Test site not found');

    const roomUtilizations = await Promise.all(
      site.rooms.map((room) => this.getRoomUtilization(room.id, startDate, endDate)),
    );

    const totalSessions = roomUtilizations.reduce((sum, r) => sum + r.totalSessions, 0);
    const totalCapacity = roomUtilizations.reduce(
      (sum, r) => sum + r.sessions.reduce((s, sess) => s + sess.maxCapacity, 0),
      0,
    );
    const totalEnrolled = roomUtilizations.reduce(
      (sum, r) => sum + r.sessions.reduce((s, sess) => s + sess.currentEnrolled, 0),
      0,
    );

    return {
      siteId,
      siteName: site.name,
      totalRooms: site.rooms.length,
      totalSessions,
      averageOccupancyRate: totalCapacity > 0
        ? Math.round((totalEnrolled / totalCapacity) * 10000) / 100
        : 0,
      rooms: roomUtilizations,
    };
  }
}

export const testCenterService = new TestCenterService();
