/**
 * Extended unit tests for TestCenterService — rooms, seats, equipment, sessions list/get,
 * cancelRegistration, utilization.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAudit, mockSeatAllocator } = vi.hoisted(() => ({
  mockPrisma: {
    testSite: { findUnique: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    testRoom: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    testSeat: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    equipmentLedgerEntry: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    testSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    testRegistration: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    seatAllocation: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    adaSeatRelease: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
  mockAudit: { create: vi.fn() },
  mockSeatAllocator: { allocateSeats: vi.fn() },
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/audit/audit.service', () => ({
  auditService: mockAudit,
}));
vi.mock('../../../src/modules/test-center/allocation/allocator', () => ({
  seatAllocator: mockSeatAllocator,
}));

import { TestCenterService } from '../../../src/modules/test-center/test-center.service';

let service: TestCenterService;

const site = { id: 'site-1', name: 'Main Center', address: '1 Main St', timezone: 'UTC', rooms: [] };
const room = { id: 'room-1', siteId: 'site-1', name: 'Room A', capacity: 30, site };
const seat = { id: 'seat-1', roomId: 'room-1', seatLabel: 'A1', rowIdentifier: 'A', positionInRow: 1 };
const equipment = { id: 'eq-1', seatId: 'seat-1', equipmentType: 'COMPUTER', status: 'OPERATIONAL' };
const session = {
  id: 'sess-1',
  roomId: 'room-1',
  name: 'Session 1',
  scheduledStart: new Date('2024-06-01T09:00:00Z'),
  scheduledEnd: new Date('2024-06-01T11:00:00Z'),
  status: 'SCHEDULED',
  maxCapacity: 20,
  currentEnrolled: 5,
};

beforeEach(() => {
  vi.resetAllMocks();
  mockAudit.create.mockResolvedValue({});
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
  service = new TestCenterService();
});

// ─── Sites ───────────────────────────────────────────────────────────────────

describe('listSites', () => {
  it('returns all sites', async () => {
    mockPrisma.testSite.findMany.mockResolvedValue([site]);
    const result = await service.listSites();
    expect(result).toHaveLength(1);
  });
});

describe('deleteSite', () => {
  it('deletes site when found', async () => {
    mockPrisma.testSite.findUnique.mockResolvedValue(site);
    mockPrisma.testSite.delete.mockResolvedValue(site);

    await service.deleteSite('site-1');
    expect(mockPrisma.testSite.delete).toHaveBeenCalled();
  });

  it('throws NotFoundError when site does not exist', async () => {
    mockPrisma.testSite.findUnique.mockResolvedValue(null);
    await expect(service.deleteSite('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── Rooms ───────────────────────────────────────────────────────────────────

describe('listRooms', () => {
  it('returns all rooms when no siteId filter', async () => {
    mockPrisma.testRoom.findMany.mockResolvedValue([room]);
    const result = await service.listRooms();
    expect(result).toHaveLength(1);
    expect(mockPrisma.testRoom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('filters by siteId when provided', async () => {
    mockPrisma.testRoom.findMany.mockResolvedValue([room]);
    await service.listRooms('site-1');
    expect(mockPrisma.testRoom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: 'site-1' } }),
    );
  });
});

describe('getRoom', () => {
  it('returns room when found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(room);
    const result = await service.getRoom('room-1');
    expect(result.id).toBe('room-1');
  });

  it('throws NotFoundError when room not found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(null);
    await expect(service.getRoom('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('getRoomWithSeats', () => {
  it('returns room with seats when found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue({ ...room, seats: [seat] });
    const result = await service.getRoomWithSeats('room-1');
    expect(result).toHaveProperty('seats');
  });

  it('throws NotFoundError when room not found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(null);
    await expect(service.getRoomWithSeats('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('updateRoom', () => {
  it('updates room when found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(room);
    mockPrisma.testRoom.update.mockResolvedValue({ ...room, name: 'Room B' });

    const result = await service.updateRoom('room-1', { name: 'Room B' });
    expect(result.name).toBe('Room B');
  });

  it('throws NotFoundError when room not found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(null);
    await expect(service.updateRoom('ghost', {})).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deleteRoom', () => {
  it('deletes room when found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(room);
    mockPrisma.testRoom.delete.mockResolvedValue(room);

    await service.deleteRoom('room-1');
    expect(mockPrisma.testRoom.delete).toHaveBeenCalled();
  });

  it('throws NotFoundError when room not found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(null);
    await expect(service.deleteRoom('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── Seats ───────────────────────────────────────────────────────────────────

describe('createSeat', () => {
  it('creates seat when room exists', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(room);
    mockPrisma.testSeat.create.mockResolvedValue(seat);

    const result = await service.createSeat({
      roomId: 'room-1',
      seatLabel: 'A1',
      rowIdentifier: 'A',
      positionInRow: 1,
      isAccessible: false,
    });
    expect(result.id).toBe('seat-1');
  });

  it('throws NotFoundError when room not found', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(null);
    await expect(service.createSeat({ roomId: 'ghost', seatLabel: 'A1', rowIdentifier: 'A', positionInRow: 1, isAccessible: false }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('listSeatsByRoom', () => {
  it('returns seats for a room', async () => {
    mockPrisma.testSeat.findMany.mockResolvedValue([seat]);
    const result = await service.listSeatsByRoom('room-1');
    expect(result).toHaveLength(1);
  });
});

describe('updateSeat', () => {
  it('updates seat when found', async () => {
    mockPrisma.testSeat.findUnique.mockResolvedValue(seat);
    mockPrisma.testSeat.update.mockResolvedValue({ ...seat, isAccessible: true });

    const result = await service.updateSeat('seat-1', { isAccessible: true });
    expect(result.isAccessible).toBe(true);
  });

  it('throws NotFoundError when seat not found', async () => {
    mockPrisma.testSeat.findUnique.mockResolvedValue(null);
    await expect(service.updateSeat('ghost', {})).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── Equipment ───────────────────────────────────────────────────────────────

describe('createEquipment', () => {
  it('creates equipment when seat exists', async () => {
    mockPrisma.testSeat.findUnique.mockResolvedValue(seat);
    mockPrisma.equipmentLedgerEntry.create.mockResolvedValue(equipment);

    const result = await service.createEquipment({
      seatId: 'seat-1',
      equipmentType: 'COMPUTER',
      status: 'OPERATIONAL',
    });
    expect(result.id).toBe('eq-1');
  });

  it('throws NotFoundError when seat not found', async () => {
    mockPrisma.testSeat.findUnique.mockResolvedValue(null);
    await expect(service.createEquipment({ seatId: 'ghost', equipmentType: 'COMPUTER', status: 'OPERATIONAL' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('listEquipmentBySeat', () => {
  it('returns equipment for a seat', async () => {
    mockPrisma.equipmentLedgerEntry.findMany.mockResolvedValue([equipment]);
    const result = await service.listEquipmentBySeat('seat-1');
    expect(result).toHaveLength(1);
  });
});

describe('getEquipment', () => {
  it('returns equipment when found', async () => {
    mockPrisma.equipmentLedgerEntry.findUnique.mockResolvedValue(equipment);
    const result = await service.getEquipment('eq-1');
    expect(result.id).toBe('eq-1');
  });

  it('throws NotFoundError when not found', async () => {
    mockPrisma.equipmentLedgerEntry.findUnique.mockResolvedValue(null);
    await expect(service.getEquipment('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('updateEquipment', () => {
  it('updates equipment when found', async () => {
    mockPrisma.equipmentLedgerEntry.findUnique.mockResolvedValue(equipment);
    mockPrisma.equipmentLedgerEntry.update.mockResolvedValue({ ...equipment, status: 'NEEDS_REPAIR' });

    const result = await service.updateEquipment('eq-1', { status: 'NEEDS_REPAIR' });
    expect(result.status).toBe('NEEDS_REPAIR');
  });

  it('throws NotFoundError when equipment not found', async () => {
    mockPrisma.equipmentLedgerEntry.findUnique.mockResolvedValue(null);
    await expect(service.updateEquipment('ghost', {})).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deleteEquipment', () => {
  it('soft-deletes equipment by setting removedAt', async () => {
    mockPrisma.equipmentLedgerEntry.findUnique.mockResolvedValue(equipment);
    mockPrisma.equipmentLedgerEntry.update.mockResolvedValue({ ...equipment, removedAt: new Date() });

    await service.deleteEquipment('eq-1');
    expect(mockPrisma.equipmentLedgerEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ removedAt: expect.any(Date) }) }),
    );
  });
});

// ─── Sessions list/get ───────────────────────────────────────────────────────

describe('listSessions', () => {
  it('returns paginated sessions', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([session]);
    mockPrisma.testSession.count.mockResolvedValue(1);

    const result = await service.listSessions({});
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('filters by roomId', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([]);
    mockPrisma.testSession.count.mockResolvedValue(0);

    await service.listSessions({ roomId: 'room-1' });
    expect(mockPrisma.testSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ roomId: 'room-1' }) }),
    );
  });

  it('filters by siteId', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([]);
    mockPrisma.testSession.count.mockResolvedValue(0);

    await service.listSessions({ siteId: 'site-1' });
    expect(mockPrisma.testSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ room: { siteId: 'site-1' } }) }),
    );
  });

  it('filters by status', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([]);
    mockPrisma.testSession.count.mockResolvedValue(0);

    await service.listSessions({ status: 'SCHEDULED' });
    expect(mockPrisma.testSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'SCHEDULED' }) }),
    );
  });

  it('filters by dateFrom and dateTo', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([]);
    mockPrisma.testSession.count.mockResolvedValue(0);

    await service.listSessions({ dateFrom: '2024-01-01', dateTo: '2024-12-31' });
    expect(mockPrisma.testSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ scheduledStart: expect.any(Object) }),
      }),
    );
  });
});

describe('getSession', () => {
  it('returns session with related data', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue({
      ...session,
      room: { ...room, site },
      registrations: [],
      seatAllocations: [],
    });

    const result = await service.getSession('sess-1');
    expect(result.id).toBe('sess-1');
  });

  it('throws NotFoundError when session not found', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue(null);
    await expect(service.getSession('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── cancelRegistration ───────────────────────────────────────────────────────

describe('cancelRegistration', () => {
  const reg = { id: 'reg-1', sessionId: 'sess-1', userId: 'user-1', cancelledAt: null };

  it('cancels an active registration', async () => {
    mockPrisma.testRegistration.findUnique.mockResolvedValue(reg);
    mockPrisma.testRegistration.update.mockResolvedValue({ ...reg, cancelledAt: new Date() });
    mockPrisma.testSession.update.mockResolvedValue({});
    // The service now snapshots seat allocations before the transaction so it
    // can audit each one as cancelled. Provide an empty list (no allocations).
    mockPrisma.seatAllocation.findMany.mockResolvedValue([]);

    await service.cancelRegistration('sess-1', 'user-1', 'actor-id');
    expect(mockPrisma.testRegistration.update).toHaveBeenCalled();
  });

  it('emits a SEAT_ALLOCATION_CANCELLED audit event for each released seat', async () => {
    mockPrisma.testRegistration.findUnique.mockResolvedValue(reg);
    mockPrisma.testRegistration.update.mockResolvedValue({ ...reg, cancelledAt: new Date() });
    mockPrisma.testSession.update.mockResolvedValue({});
    mockPrisma.seatAllocation.findMany.mockResolvedValue([
      { id: 'alloc-1', seatId: 'seat-7' },
      { id: 'alloc-2', seatId: 'seat-8' },
    ]);

    await service.cancelRegistration('sess-1', 'user-1', 'actor-id');

    const cancelEvents = mockAudit.create.mock.calls
      .map((c: any[]) => c[0].action)
      .filter((a: string) => a === 'SEAT_ALLOCATION_CANCELLED');
    expect(cancelEvents).toHaveLength(2);
  });

  it('throws NotFoundError when registration not found', async () => {
    mockPrisma.testRegistration.findUnique.mockResolvedValue(null);
    await expect(service.cancelRegistration('sess-1', 'user-1', 'actor-id'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws BadRequestError when registration already cancelled', async () => {
    mockPrisma.testRegistration.findUnique.mockResolvedValue({ ...reg, cancelledAt: new Date() });
    await expect(service.cancelRegistration('sess-1', 'user-1', 'actor-id'))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});
