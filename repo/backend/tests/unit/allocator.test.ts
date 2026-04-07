import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockPrisma, mockEnv } = vi.hoisted(() => {
  return {
    mockPrisma: {
      testSeat: { findMany: vi.fn() },
      seatAllocation: { findMany: vi.fn(), create: vi.fn() },
      adaSeatRelease: { findMany: vi.fn() },
      testRegistration: { findUnique: vi.fn() },
    },
    // Mutable env object — tests can toggle ADA_STRICT_MODE per describe block.
    // LOG_LEVEL is required by the logger singleton at import time.
    mockEnv: { ADA_STRICT_MODE: false, LOG_LEVEL: 'silent', NODE_ENV: 'test' },
  };
});

vi.mock('../../src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../src/config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../src/config/env', () => ({
  env: mockEnv,
}));

import { SeatAllocator } from '../../src/modules/test-center/allocation/allocator';

describe('SeatAllocator', () => {
  let allocator: SeatAllocator;

  beforeEach(() => {
    vi.clearAllMocks();
    allocator = new SeatAllocator();
    // Default: no ADA releases, registration resolves userId
    mockPrisma.adaSeatRelease.findMany.mockResolvedValue([]);
    mockPrisma.testRegistration.findUnique.mockResolvedValue({ userId: 'user-1' });
  });

  function makeSeat(id: string, row: string, pos: number, isAccessible = false) {
    return { id, roomId: 'room-1', rowIdentifier: row, positionInRow: pos, isAccessible, isServiceable: true, seatLabel: `${row}-${pos}` };
  }

  it('allocates first available seat when no prior allocations', async () => {
    const seats = [makeSeat('s1', 'A', 1), makeSeat('s2', 'A', 2)];
    mockPrisma.testSeat.findMany.mockResolvedValue(seats);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([]);
    mockPrisma.adaSeatRelease.findMany.mockResolvedValue([]);
    mockPrisma.seatAllocation.create.mockResolvedValue({ id: 'alloc-1', seatId: 's1', seat: seats[0] });

    const result = await allocator.allocateSeats('sess-1', 'reg-1', 'room-1');

    expect(result).toBeTruthy();
    expect(mockPrisma.seatAllocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seatId: 's1' }) }),
    );
  });

  it('prefers contiguous seating (adjacent to existing allocation)', async () => {
    const seats = [makeSeat('s1', 'A', 1), makeSeat('s2', 'A', 2), makeSeat('s3', 'A', 3), makeSeat('s4', 'B', 1)];
    mockPrisma.testSeat.findMany.mockResolvedValue(seats);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([
      { seatId: 's2', seat: { rowIdentifier: 'A', positionInRow: 2 } },
    ]);
    mockPrisma.seatAllocation.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'alloc-2', seatId: data.seatId, seat: seats.find((s) => s.id === data.seatId) }),
    );

    await allocator.allocateSeats('sess-1', 'reg-2', 'room-1');

    const chosenSeatId = mockPrisma.seatAllocation.create.mock.calls[0][0].data.seatId;
    expect(['s1', 's3']).toContain(chosenSeatId);
  });

  it('reserves accessible seats unless no alternatives', async () => {
    const seats = [makeSeat('s1', 'A', 1, true), makeSeat('s2', 'A', 2, false)];
    mockPrisma.testSeat.findMany.mockResolvedValue(seats);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([]);
    mockPrisma.seatAllocation.create.mockResolvedValue({ id: 'alloc-1', seatId: 's2', seat: seats[1] });

    await allocator.allocateSeats('sess-1', 'reg-1', 'room-1');

    expect(mockPrisma.seatAllocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seatId: 's2' }) }),
    );
  });

  it('falls back to accessible seats when all regular seats are taken', async () => {
    const seats = [makeSeat('s1', 'A', 1, true), makeSeat('s2', 'A', 2, false)];
    mockPrisma.testSeat.findMany.mockResolvedValue(seats);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([
      { seatId: 's2', seat: { rowIdentifier: 'A', positionInRow: 2 } },
    ]);
    mockPrisma.seatAllocation.create.mockResolvedValue({ id: 'alloc-2', seatId: 's1', seat: seats[0] });

    const result = await allocator.allocateSeats('sess-1', 'reg-2', 'room-1');

    expect(result).toBeTruthy();
    expect(mockPrisma.seatAllocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seatId: 's1' }) }),
    );
  });

  it('returns null when room is fully allocated', async () => {
    const seats = [makeSeat('s1', 'A', 1)];
    mockPrisma.testSeat.findMany.mockResolvedValue(seats);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([
      { seatId: 's1', seat: { rowIdentifier: 'A', positionInRow: 1 } },
    ]);

    const result = await allocator.allocateSeats('sess-1', 'reg-2', 'room-1');

    expect(result).toBeNull();
    expect(mockPrisma.seatAllocation.create).not.toHaveBeenCalled();
  });

  it('prefers same-row seat when no adjacent seat is available', async () => {
    const seats = [makeSeat('s1', 'A', 1), makeSeat('s3', 'A', 5), makeSeat('s4', 'B', 1)];
    mockPrisma.testSeat.findMany.mockResolvedValue(seats);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([
      { seatId: 's2', seat: { rowIdentifier: 'A', positionInRow: 3 } },
    ]);
    mockPrisma.seatAllocation.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'alloc-2', seatId: data.seatId, seat: seats.find((s) => s.id === data.seatId) }),
    );

    await allocator.allocateSeats('sess-1', 'reg-2', 'room-1');

    const chosenSeatId = mockPrisma.seatAllocation.create.mock.calls[0][0].data.seatId;
    expect(chosenSeatId).toBe('s1');
  });

  it('uses released ADA seat when all non-accessible seats are taken', async () => {
    // s1 is accessible (ADA), s2 non-accessible and already allocated
    const s1 = makeSeat('s1', 'A', 1, true);
    const s2 = makeSeat('s2', 'A', 2, false);
    mockPrisma.testSeat.findMany.mockResolvedValue([s1, s2]);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([
      { seatId: 's2', seat: { rowIdentifier: 'A', positionInRow: 2 } },
    ]);
    // s1 has been explicitly released for this session
    mockPrisma.adaSeatRelease.findMany.mockResolvedValue([{ seatId: 's1' }]);
    mockPrisma.seatAllocation.create.mockResolvedValue({ id: 'alloc-3', seatId: 's1', seat: s1 });

    const result = await allocator.allocateSeats('sess-1', 'reg-3', 'room-1');

    expect(result).toBeTruthy();
    expect(mockPrisma.seatAllocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seatId: 's1' }) }),
    );
  });

  it('does NOT use unreleased ADA seat when non-accessible seats are available', async () => {
    // s1 is accessible (no release), s2 non-accessible and free
    const s1 = makeSeat('s1', 'A', 1, true);
    const s2 = makeSeat('s2', 'A', 2, false);
    mockPrisma.testSeat.findMany.mockResolvedValue([s1, s2]);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([]);
    mockPrisma.adaSeatRelease.findMany.mockResolvedValue([]); // no releases
    mockPrisma.seatAllocation.create.mockResolvedValue({ id: 'alloc-4', seatId: 's2', seat: s2 });

    await allocator.allocateSeats('sess-1', 'reg-4', 'room-1');

    expect(mockPrisma.seatAllocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seatId: 's2' }) }),
    );
  });

  // ─── Default (non-strict) mode — last resort fallback still active ────────

  it('uses unreleased ADA seat as last resort in default (non-strict) mode', async () => {
    // Only seat is an unreleased ADA seat — in default mode it is used
    const adaSeat = makeSeat('ada-1', 'A', 1, true);
    mockPrisma.testSeat.findMany.mockResolvedValue([adaSeat]);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([]);
    mockPrisma.adaSeatRelease.findMany.mockResolvedValue([]); // not released
    mockPrisma.seatAllocation.create.mockResolvedValue({ id: 'alloc-5', seatId: 'ada-1', seat: adaSeat });

    const result = await allocator.allocateSeats('sess-1', 'reg-5', 'room-1');

    expect(result).toBeTruthy();
    expect(mockPrisma.seatAllocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seatId: 'ada-1' }) }),
    );
  });
});

// ─── ADA Strict Mode ─────────────────────────────────────────────────────────
//
// ADA_STRICT_MODE=true: unreleased accessible seats are NEVER used as fallback.
// The allocator returns null instead of occupying a reserved ADA seat.

describe('SeatAllocator (ADA_STRICT_MODE=true)', () => {
  let allocator: SeatAllocator;

  function makeSeat(id: string, row: string, pos: number, isAccessible = false) {
    return { id, roomId: 'room-1', rowIdentifier: row, positionInRow: pos, isAccessible, isServiceable: true, seatLabel: `${row}-${pos}` };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.ADA_STRICT_MODE = true;
    allocator = new SeatAllocator();
    mockPrisma.testRegistration.findUnique.mockResolvedValue({ userId: 'user-1' });
    mockPrisma.adaSeatRelease.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    mockEnv.ADA_STRICT_MODE = false;
  });

  it('returns null when only unreleased ADA seats remain (strict mode)', async () => {
    // Only seat is an unreleased ADA seat — in strict mode it must NOT be used
    const adaSeat = makeSeat('ada-1', 'A', 1, true);
    mockPrisma.testSeat.findMany.mockResolvedValue([adaSeat]);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([]);

    const result = await allocator.allocateSeats('sess-1', 'reg-6', 'room-1');

    expect(result).toBeNull();
    expect(mockPrisma.seatAllocation.create).not.toHaveBeenCalled();
  });

  it('still allocates non-accessible seats normally in strict mode', async () => {
    const regular = makeSeat('s1', 'A', 1, false);
    const ada = makeSeat('ada-1', 'A', 2, true);
    mockPrisma.testSeat.findMany.mockResolvedValue([regular, ada]);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([]);
    mockPrisma.seatAllocation.create.mockResolvedValue({ id: 'alloc-6', seatId: 's1', seat: regular });

    const result = await allocator.allocateSeats('sess-1', 'reg-7', 'room-1');

    expect(result).toBeTruthy();
    expect(mockPrisma.seatAllocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seatId: 's1' }) }),
    );
  });

  it('still allocates explicitly released ADA seats in strict mode', async () => {
    // All non-accessible seats taken; ada-1 has been explicitly released
    const regular = makeSeat('s1', 'A', 1, false);
    const ada = makeSeat('ada-1', 'A', 2, true);
    mockPrisma.testSeat.findMany.mockResolvedValue([regular, ada]);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([
      { seatId: 's1', seat: { rowIdentifier: 'A', positionInRow: 1 } },
    ]);
    mockPrisma.adaSeatRelease.findMany.mockResolvedValue([{ seatId: 'ada-1' }]);
    mockPrisma.seatAllocation.create.mockResolvedValue({ id: 'alloc-7', seatId: 'ada-1', seat: ada });

    const result = await allocator.allocateSeats('sess-1', 'reg-8', 'room-1');

    expect(result).toBeTruthy();
    expect(mockPrisma.seatAllocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seatId: 'ada-1' }) }),
    );
  });

  it('returns null when both non-accessible and unreleased ADA are the only options', async () => {
    // Two unreleased ADA seats, no regular seats, no releases — strict mode → null
    const ada1 = makeSeat('ada-1', 'A', 1, true);
    const ada2 = makeSeat('ada-2', 'A', 2, true);
    mockPrisma.testSeat.findMany.mockResolvedValue([ada1, ada2]);
    mockPrisma.seatAllocation.findMany.mockResolvedValue([]);
    mockPrisma.adaSeatRelease.findMany.mockResolvedValue([]); // none released

    const result = await allocator.allocateSeats('sess-1', 'reg-9', 'room-1');

    expect(result).toBeNull();
    expect(mockPrisma.seatAllocation.create).not.toHaveBeenCalled();
  });
});
