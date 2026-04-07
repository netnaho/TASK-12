/**
 * Unit tests for TestCenterService.
 * Covers: sites, rooms, sessions (conflict/buffer/capacity), registration, seat allocation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAudit, mockSeatAllocator } = vi.hoisted(() => ({
  mockPrisma: {
    testSite: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    testRoom: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    testSeat: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    seatEquipment: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    testSession: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), count: vi.fn() },
    testRegistration: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    seatAllocation: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    adaSeatRelease: { findMany: vi.fn() },
    $transaction: vi.fn((fn: any) => fn()),
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

beforeEach(() => {
  vi.resetAllMocks();
  service = new TestCenterService();
  mockAudit.create.mockResolvedValue({});
  // Restore $transaction to pass mockPrisma as the tx object
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
});

// ─── Sites ───────────────────────────────────────────────────────────────────

describe('createSite', () => {
  it('creates and returns the site', async () => {
    const site = { id: 'site-1', name: 'Main Center', address: '123 Main St', timezone: 'UTC' };
    mockPrisma.testSite.create.mockResolvedValue(site);
    const result = await service.createSite({ name: 'Main Center', address: '123 Main St', timezone: 'UTC' });
    expect(result).toEqual(site);
  });
});

describe('getSite', () => {
  it('returns the site when found', async () => {
    const site = { id: 'site-1', name: 'Center', rooms: [] };
    mockPrisma.testSite.findUnique.mockResolvedValue(site);
    const result = await service.getSite('site-1');
    expect(result).toEqual(site);
  });

  it('throws NotFoundError when site does not exist', async () => {
    mockPrisma.testSite.findUnique.mockResolvedValue(null);
    await expect(service.getSite('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('updateSite', () => {
  it('updates and returns the site', async () => {
    mockPrisma.testSite.findUnique.mockResolvedValue({ id: 'site-1', rooms: [] });
    const updated = { id: 'site-1', name: 'Renamed', address: 'New Addr', timezone: 'UTC' };
    mockPrisma.testSite.update.mockResolvedValue(updated);
    const result = await service.updateSite('site-1', { name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });

  it('throws NotFoundError when site does not exist', async () => {
    mockPrisma.testSite.findUnique.mockResolvedValue(null);
    await expect(service.updateSite('ghost', { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── Rooms ────────────────────────────────────────────────────────────────────

describe('createRoom', () => {
  it('creates a room when site exists', async () => {
    mockPrisma.testSite.findUnique.mockResolvedValue({ id: 'site-1' });
    const room = { id: 'room-1', siteId: 'site-1', name: 'Room A', capacity: 30, hasAda: false };
    mockPrisma.testRoom.create.mockResolvedValue(room);
    const result = await service.createRoom({ siteId: 'site-1', name: 'Room A', capacity: 30, hasAda: false });
    expect(result).toEqual(room);
  });

  it('throws NotFoundError when site does not exist', async () => {
    mockPrisma.testSite.findUnique.mockResolvedValue(null);
    await expect(
      service.createRoom({ siteId: 'ghost', name: 'Room A', capacity: 30, hasAda: false }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── Sessions — conflict / buffer / capacity ──────────────────────────────────

describe('createSession', () => {
  const validData = {
    roomId: 'room-1',
    name: 'Exam A',
    scheduledStart: '2024-06-01T09:00:00.000Z',
    scheduledEnd: '2024-06-01T12:00:00.000Z',
    maxCapacity: 25,
  };

  beforeEach(() => {
    mockPrisma.testRoom.findUnique.mockResolvedValue({ id: 'room-1', capacity: 30 });
    mockPrisma.testSession.findFirst.mockResolvedValue(null); // no conflict by default
    mockPrisma.testSession.create.mockResolvedValue({
      id: 'sess-1',
      room: { id: 'room-1', site: { id: 'site-1' } },
      ...validData,
    });
  });

  it('creates a session when room is free', async () => {
    const result = await service.createSession(validData, 'actor-1');
    expect(result.id).toBe('sess-1');
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TEST_SESSION_CREATED' }),
    );
  });

  it('throws BadRequestError when maxCapacity exceeds room capacity', async () => {
    await expect(
      service.createSession({ ...validData, maxCapacity: 50 }, 'actor-1'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws BadRequestError when scheduledEnd <= scheduledStart', async () => {
    await expect(
      service.createSession({
        ...validData,
        scheduledStart: '2024-06-01T12:00:00.000Z',
        scheduledEnd: '2024-06-01T09:00:00.000Z',
      }, 'actor-1'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws ConflictError when session overlaps within 10-min buffer', async () => {
    mockPrisma.testSession.findFirst.mockResolvedValue({ id: 'existing-sess' });
    await expect(service.createSession(validData, 'actor-1')).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('throws NotFoundError when room does not exist', async () => {
    mockPrisma.testRoom.findUnique.mockResolvedValue(null);
    await expect(service.createSession(validData, 'actor-1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── Registration — capacity enforcement ─────────────────────────────────────

describe('registerForSession', () => {
  const sessionId = 'sess-1';
  const userId = 'user-1';

  it('registers a user when capacity is available', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue({
      id: sessionId,
      status: 'SCHEDULED',
      maxCapacity: 30,
      currentEnrolled: 10,
      roomId: 'room-1',
    });
    mockPrisma.testRegistration.findUnique.mockResolvedValue(null);
    const reg = { id: 'reg-1', sessionId, userId };
    mockPrisma.testRegistration.create.mockResolvedValue(reg);
    mockPrisma.testSession.update.mockResolvedValue({});
    mockSeatAllocator.allocateSeats.mockResolvedValue({ id: 'alloc-1', seatId: 'seat-1' });
    mockPrisma.seatAllocation.create.mockResolvedValue({});

    const result = await service.registerForSession(sessionId, userId);
    expect(result.registration.id).toBe('reg-1');
  });

  it('throws ConflictError when session is full (capacity enforcement)', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue({
      id: sessionId,
      status: 'SCHEDULED',
      maxCapacity: 30,
      currentEnrolled: 30,
      roomId: 'room-1',
    });
    await expect(service.registerForSession(sessionId, userId)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('throws BadRequestError when session is not SCHEDULED', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue({
      id: sessionId,
      status: 'CANCELLED',
      maxCapacity: 30,
      currentEnrolled: 0,
      roomId: 'room-1',
    });
    await expect(service.registerForSession(sessionId, userId)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws NotFoundError when session does not exist', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue(null);
    await expect(service.registerForSession(sessionId, userId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws ConflictError when user is already registered', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue({
      id: sessionId,
      status: 'SCHEDULED',
      maxCapacity: 30,
      currentEnrolled: 5,
      roomId: 'room-1',
    });
    mockPrisma.testRegistration.findUnique.mockResolvedValue({ id: 'existing-reg' });
    await expect(service.registerForSession(sessionId, userId)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});

// ─── Cancel session ───────────────────────────────────────────────────────────

describe('cancelSession', () => {
  it('sets status to CANCELLED', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue({ id: 'sess-1', status: 'SCHEDULED' });
    mockPrisma.testSession.update.mockResolvedValue({ id: 'sess-1', status: 'CANCELLED' });

    await service.cancelSession('sess-1', 'actor-1');
    expect(mockPrisma.testSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) }),
    );
  });

  it('throws NotFoundError when session does not exist', async () => {
    mockPrisma.testSession.findUnique.mockResolvedValue(null);
    await expect(service.cancelSession('ghost', 'actor-1')).rejects.toMatchObject({ statusCode: 404 });
  });
});
