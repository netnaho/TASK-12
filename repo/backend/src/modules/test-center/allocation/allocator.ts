import { prisma } from '../../../config/database';
import { logger } from '../../../logging/logger';
import { env } from '../../../config/env';

export class SeatAllocator {
  /**
   * Allocate a seat for a registration within a session.
   *
   * Rules:
   * 1. Only serviceable seats in the room are considered.
   * 2. Accessible seats are reserved for accessibility needs - skip them
   *    unless no other seats are available.
   * 3. Prefer a seat in a row that already has allocations for this session
   *    (contiguous/adjacent seating preference).
   * 4. If no adjacent seat is possible, pick the first available non-accessible seat.
   */
  async allocateSeats(
    sessionId: string,
    registrationId: string,
    roomId: string,
  ) {
    // Get all serviceable seats ordered by row then position
    const allSeats = await prisma.testSeat.findMany({
      where: { roomId, isServiceable: true },
      orderBy: [{ rowIdentifier: 'asc' }, { positionInRow: 'asc' }],
    });

    // Get already-allocated seat IDs for this session
    const existingAllocations = await prisma.seatAllocation.findMany({
      where: { sessionId },
      select: { seatId: true, seat: { select: { rowIdentifier: true, positionInRow: true } } },
    });

    const allocatedSeatIds = new Set(existingAllocations.map((a) => a.seatId));

    // Filter out already-allocated seats
    const availableSeats = allSeats.filter((s) => !allocatedSeatIds.has(s.id));

    if (availableSeats.length === 0) {
      logger.warn({ sessionId, roomId }, 'No available seats for allocation');
      return null;
    }

    // Check which accessible seats have an AdaSeatRelease for this session
    // ADA seats are held unless an explicit release record exists for this session.
    const adaReleases = await prisma.adaSeatRelease.findMany({
      where: { sessionId },
      select: { seatId: true },
    });
    const releasedAdaSeatIds = new Set(adaReleases.map((r) => r.seatId));

    // Separate non-accessible and accessible-but-released seats (usable by anyone)
    const nonAccessible = availableSeats.filter((s) => !s.isAccessible);
    // Accessible seats are only available to general allocation if explicitly released
    const accessible = availableSeats.filter(
      (s) => s.isAccessible && releasedAdaSeatIds.has(s.id),
    );
    // Unreleased ADA seats are last resort only when nothing else is available
    const unreleasedAda = availableSeats.filter(
      (s) => s.isAccessible && !releasedAdaSeatIds.has(s.id),
    );

    // Build a set of rows that already have allocations in this session
    const allocatedRowPositions = new Map<string, number[]>();
    for (const alloc of existingAllocations) {
      const row = alloc.seat.rowIdentifier;
      if (!allocatedRowPositions.has(row)) {
        allocatedRowPositions.set(row, []);
      }
      allocatedRowPositions.get(row)!.push(alloc.seat.positionInRow);
    }

    let chosenSeat = null;

    // Try contiguous preference: find a non-accessible seat adjacent to an existing allocation
    if (nonAccessible.length > 0 && allocatedRowPositions.size > 0) {
      for (const seat of nonAccessible) {
        const positions = allocatedRowPositions.get(seat.rowIdentifier);
        if (positions) {
          const isAdjacent = positions.some(
            (pos) => Math.abs(pos - seat.positionInRow) === 1,
          );
          if (isAdjacent) {
            chosenSeat = seat;
            break;
          }
        }
      }

      // If no adjacent seat found, try any seat in an already-occupied row
      if (!chosenSeat) {
        for (const seat of nonAccessible) {
          if (allocatedRowPositions.has(seat.rowIdentifier)) {
            chosenSeat = seat;
            break;
          }
        }
      }
    }

    // Fall back to first available non-accessible seat
    if (!chosenSeat && nonAccessible.length > 0) {
      chosenSeat = nonAccessible[0];
    }

    // Use a released ADA seat if available
    if (!chosenSeat && accessible.length > 0) {
      chosenSeat = accessible[0];
    }

    // Absolute last resort: use an unreleased ADA seat (e.g. room is otherwise full).
    // ADA_STRICT_MODE=true: skip this fallback and preserve accessible seating.
    // Default (false): soft fallback — consistent with prior behavior.
    if (!chosenSeat && unreleasedAda.length > 0 && !env.ADA_STRICT_MODE) {
      logger.warn({ sessionId, roomId }, 'Using unreleased ADA seat as last resort');
      chosenSeat = unreleasedAda[0];
    }

    if (!chosenSeat) {
      logger.warn({ sessionId, roomId }, 'No suitable seat found');
      return null;
    }

    // Resolve userId from registration (required by SeatAllocation FK)
    const registration = await prisma.testRegistration.findUnique({
      where: { id: registrationId },
      select: { userId: true },
    });
    const userId = registration?.userId ?? 'unknown';

    // Create the allocation
    const allocation = await prisma.seatAllocation.create({
      data: {
        sessionId,
        registrationId,
        seatId: chosenSeat.id,
        userId,
        allocatedBy: 'auto',
      },
      include: {
        seat: true,
      },
    });

    logger.info(
      { sessionId, registrationId, seatId: chosenSeat.id, seatLabel: chosenSeat.seatLabel },
      'Seat allocated',
    );

    return allocation;
  }
}

export const seatAllocator = new SeatAllocator();
