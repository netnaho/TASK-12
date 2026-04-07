import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    testSession: { findMany: vi.fn() },
  },
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { operationalAnalyticsService } from '../../../src/modules/analytics/operational-analytics.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSite(overrides: any = {}) {
  return {
    id: 'site-1',
    name: 'Site A',
    region: { id: 'region-1', name: 'Region North' },
    community: { id: 'comm-1', name: 'Community Alpha' },
    ...overrides,
  };
}

function makeRoom(overrides: any = {}) {
  return {
    id: 'room-1',
    name: 'Room 101',
    site: makeSite(),
    seats: [],
    ...overrides,
  };
}

function makeUser(roleName = 'STANDARD_USER') {
  return {
    id: 'user-1',
    roles: [{ role: { name: roleName } }],
  };
}

function makeRegistration(userId: string, role = 'STANDARD_USER') {
  return {
    userId,
    cancelledAt: null,
    user: { id: userId, roles: [{ role: { name: role } }] },
  };
}

function makeSession(overrides: any = {}) {
  return {
    id: 'sess-1',
    name: 'Session A',
    status: 'SCHEDULED',
    scheduledStart: new Date('2024-06-01T09:00:00Z'),
    scheduledEnd: new Date('2024-06-01T11:00:00Z'),
    currentEnrolled: 5,
    maxCapacity: 10,
    registrations: [],
    seatAllocations: [],
    room: makeRoom(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── 1. Participation ────────────────────────────────────────────────────────

describe('operationalAnalyticsService.getParticipation', () => {
  it('groups by site and counts registrations', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        registrations: [
          makeRegistration('u1'),
          makeRegistration('u2'),
        ],
      }),
      makeSession({
        id: 'sess-2',
        room: makeRoom({ site: makeSite({ id: 'site-2', name: 'Site B' }) }),
        registrations: [makeRegistration('u3')],
      }),
    ]);

    const result = await operationalAnalyticsService.getParticipation({ groupBy: 'site' });

    expect(result.totalRegistrations).toBe(3);
    expect(result.totalUsers).toBe(3);
    expect(result.rows).toHaveLength(2);
    // Largest first
    expect(result.rows[0].registrations).toBe(2);
    expect(result.rows[0].label).toBe('Site A');
  });

  it('groups by region', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        registrations: [makeRegistration('u1'), makeRegistration('u2')],
      }),
    ]);

    const result = await operationalAnalyticsService.getParticipation({ groupBy: 'region' });

    expect(result.rows[0].label).toBe('Region North');
    expect(result.rows[0].registrations).toBe(2);
    expect(result.rows[0].uniqueUsers).toBe(2);
  });

  it('groups by community', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({ registrations: [makeRegistration('u1')] }),
    ]);

    const result = await operationalAnalyticsService.getParticipation({
      groupBy: 'community',
    });

    expect(result.rows[0].label).toBe('Community Alpha');
  });

  it('groups by role/team', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        registrations: [
          makeRegistration('u1', 'ANALYST'),
          makeRegistration('u2', 'STANDARD_USER'),
          makeRegistration('u3', 'STANDARD_USER'),
        ],
      }),
    ]);

    const result = await operationalAnalyticsService.getParticipation({ groupBy: 'role' });

    const standard = result.rows.find((r) => r.label === 'STANDARD_USER');
    expect(standard?.registrations).toBe(2);
    const analyst = result.rows.find((r) => r.label === 'ANALYST');
    expect(analyst?.registrations).toBe(1);
  });

  it('handles unassigned region gracefully', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        room: makeRoom({ site: makeSite({ region: null }) }),
        registrations: [makeRegistration('u1')],
      }),
    ]);

    const result = await operationalAnalyticsService.getParticipation({ groupBy: 'region' });

    expect(result.rows[0].label).toBe('Unassigned');
    expect(result.rows[0].key).toBe('unassigned');
  });

  it('returns empty result with no sessions', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([]);

    const result = await operationalAnalyticsService.getParticipation({ groupBy: 'site' });

    expect(result.totalRegistrations).toBe(0);
    expect(result.rows).toHaveLength(0);
  });
});

// ─── 2. Attendance ───────────────────────────────────────────────────────────

describe('operationalAnalyticsService.getAttendance', () => {
  it('computes attendance rate as allocated/registered', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        registrations: [{ cancelledAt: null }, { cancelledAt: null }, { cancelledAt: null }, { cancelledAt: null }],
        seatAllocations: [{}, {}, {}],
      }),
    ]);

    const result = await operationalAnalyticsService.getAttendance({ groupBy: 'site' });

    expect(result.totalRegistered).toBe(4);
    expect(result.totalAllocated).toBe(3);
    expect(result.overallAttendanceRate).toBeCloseTo(0.75);
    expect(result.rows[0].attendanceRate).toBeCloseTo(0.75);
  });

  it('returns zero rate when no registrations', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({ registrations: [], seatAllocations: [] }),
    ]);

    const result = await operationalAnalyticsService.getAttendance({ groupBy: 'site' });

    expect(result.overallAttendanceRate).toBe(0);
  });
});

// ─── 3. Hour Distribution ────────────────────────────────────────────────────

describe('operationalAnalyticsService.getHourDistribution', () => {
  it('buckets sessions by hour-of-day', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      {
        scheduledStart: new Date('2024-06-01T09:00:00Z'),
        scheduledEnd: new Date('2024-06-01T11:00:00Z'),
        currentEnrolled: 5,
        maxCapacity: 10,
      },
      {
        scheduledStart: new Date('2024-06-02T09:30:00Z'),
        scheduledEnd: new Date('2024-06-02T10:30:00Z'),
        currentEnrolled: 8,
        maxCapacity: 10,
      },
      {
        scheduledStart: new Date('2024-06-03T14:00:00Z'),
        scheduledEnd: new Date('2024-06-03T15:00:00Z'),
        currentEnrolled: 3,
        maxCapacity: 10,
      },
    ]);

    const result = await operationalAnalyticsService.getHourDistribution({
      bucket: 'hour-of-day',
    });

    expect(result.totalSessions).toBe(3);
    expect(result.totalHours).toBeCloseTo(4);
    const nineAm = result.rows.find((r) => r.label === '09:00');
    expect(nineAm?.sessions).toBe(2);
  });

  it('buckets by day-of-week', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      {
        scheduledStart: new Date('2024-06-03T09:00:00Z'), // Mon
        scheduledEnd: new Date('2024-06-03T11:00:00Z'),
        currentEnrolled: 5,
        maxCapacity: 10,
      },
      {
        scheduledStart: new Date('2024-06-04T09:00:00Z'), // Tue
        scheduledEnd: new Date('2024-06-04T10:00:00Z'),
        currentEnrolled: 3,
        maxCapacity: 5,
      },
    ]);

    const result = await operationalAnalyticsService.getHourDistribution({
      bucket: 'day-of-week',
    });

    expect(result.rows.map((r) => r.label)).toEqual(['Mon', 'Tue']);
  });

  it('returns 0 average when no sessions', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([]);

    const result = await operationalAnalyticsService.getHourDistribution({
      bucket: 'hour-of-day',
    });

    expect(result.totalSessions).toBe(0);
    expect(result.averageSessionHours).toBe(0);
  });

  it('buckets by week (ISO week key)', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      {
        scheduledStart: new Date('2024-06-03T09:00:00Z'), // Week 23
        scheduledEnd: new Date('2024-06-03T11:00:00Z'),
        currentEnrolled: 5,
        maxCapacity: 10,
      },
      {
        scheduledStart: new Date('2024-06-10T09:00:00Z'), // Week 24
        scheduledEnd: new Date('2024-06-10T10:00:00Z'),
        currentEnrolled: 3,
        maxCapacity: 5,
      },
    ]);

    const result = await operationalAnalyticsService.getHourDistribution({
      bucket: 'week',
    });

    expect(result.totalSessions).toBe(2);
    expect(result.rows).toHaveLength(2);
  });
});

// ─── 4. Retention ────────────────────────────────────────────────────────────

describe('operationalAnalyticsService.getRetention', () => {
  it('computes retention rate from users with ≥2 registrations', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({ registrations: [makeRegistration('u1'), makeRegistration('u2')] }),
      makeSession({
        id: 'sess-2',
        scheduledStart: new Date('2024-06-15T09:00:00Z'),
        registrations: [makeRegistration('u1'), makeRegistration('u3')],
      }),
    ]);

    const result = await operationalAnalyticsService.getRetention({ cohortWindowDays: 30 });

    expect(result.totalUsers).toBe(3);
    expect(result.returningUsers).toBe(1); // only u1 came back
    expect(result.retentionRate).toBeCloseTo(1 / 3);
    expect(result.cohortReturning).toBe(1); // u1's gap was ~14 days
  });

  it('cohort excludes users whose return is outside the window', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        scheduledStart: new Date('2024-01-01T09:00:00Z'),
        registrations: [makeRegistration('u1')],
      }),
      makeSession({
        id: 'sess-2',
        scheduledStart: new Date('2024-06-01T09:00:00Z'),
        registrations: [makeRegistration('u1')],
      }),
    ]);

    const result = await operationalAnalyticsService.getRetention({ cohortWindowDays: 30 });

    expect(result.returningUsers).toBe(1);
    expect(result.cohortReturning).toBe(0); // gap > 30 days
  });

  it('handles no registrations', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([]);

    const result = await operationalAnalyticsService.getRetention({ cohortWindowDays: 30 });

    expect(result.totalUsers).toBe(0);
    expect(result.retentionRate).toBe(0);
  });
});

// ─── 5. Staffing Gaps ────────────────────────────────────────────────────────

describe('operationalAnalyticsService.getStaffingGaps', () => {
  it('flags over-subscribed and under-utilised sessions', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        id: 's1',
        currentEnrolled: 10,
        maxCapacity: 10, // OVER_SUBSCRIBED
        room: makeRoom({ seats: [{ equipmentLedger: [{}] }] }),
      }),
      makeSession({
        id: 's2',
        currentEnrolled: 1,
        maxCapacity: 10, // UNDER_UTILISED
        room: makeRoom({ seats: [{ equipmentLedger: [{}] }] }),
      }),
      makeSession({
        id: 's3',
        currentEnrolled: 7,
        maxCapacity: 10, // healthy
        room: makeRoom({ seats: [{ equipmentLedger: [{}] }] }),
      }),
    ]);

    const result = await operationalAnalyticsService.getStaffingGaps({
      underutilisedThreshold: 0.5,
    });

    expect(result.overSubscribed).toBe(1);
    expect(result.underUtilised).toBe(1);
    expect(result.offenders.find((o) => o.issue === 'OVER_SUBSCRIBED')).toBeDefined();
    expect(result.offenders.find((o) => o.issue === 'UNDER_UTILISED')).toBeDefined();
  });

  it('flags rooms missing equipment', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        currentEnrolled: 5,
        maxCapacity: 10,
        room: makeRoom({ seats: [{ equipmentLedger: [] }, { equipmentLedger: [] }] }),
      }),
    ]);

    const result = await operationalAnalyticsService.getStaffingGaps({
      underutilisedThreshold: 0.5,
    });

    expect(result.roomsMissingEquipment).toBe(1);
    expect(result.offenders.find((o) => o.issue === 'EQUIPMENT_MISSING')).toBeDefined();
  });

  it('counts cancelled sessions separately', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({ status: 'CANCELLED' }),
      makeSession({ status: 'CANCELLED' }),
      makeSession({ status: 'SCHEDULED', currentEnrolled: 5, maxCapacity: 10 }),
    ]);

    const result = await operationalAnalyticsService.getStaffingGaps({
      underutilisedThreshold: 0.4,
    });

    expect(result.cancelled).toBe(2);
  });
});

// ─── 6. Event Popularity ─────────────────────────────────────────────────────

describe('operationalAnalyticsService.getEventPopularity', () => {
  it('ranks sessions by fill rate descending', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({ id: 's1', currentEnrolled: 9, maxCapacity: 10 }),
      makeSession({ id: 's2', currentEnrolled: 5, maxCapacity: 10 }),
      makeSession({ id: 's3', currentEnrolled: 10, maxCapacity: 10 }),
    ]);

    const result = await operationalAnalyticsService.getEventPopularity({ limit: 10 });

    expect(result.rows[0].sessionId).toBe('s3');
    expect(result.rows[0].fillRate).toBe(1);
    expect(result.rows[1].sessionId).toBe('s1');
  });

  it('respects limit', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({ id: 's1' }),
      makeSession({ id: 's2' }),
      makeSession({ id: 's3' }),
    ]);

    const result = await operationalAnalyticsService.getEventPopularity({ limit: 2 });

    expect(result.rows).toHaveLength(2);
  });
});

// ─── 7. Rankings ─────────────────────────────────────────────────────────────

describe('operationalAnalyticsService.getRankings', () => {
  it('ranks sites by total_registrations', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        registrations: [makeRegistration('u1'), makeRegistration('u2')],
        seatAllocations: [{}, {}],
      }),
      makeSession({
        room: makeRoom({ site: makeSite({ id: 'site-2', name: 'Site B' }) }),
        registrations: [makeRegistration('u3')],
        seatAllocations: [{}],
      }),
    ]);

    const result = await operationalAnalyticsService.getRankings({
      dimension: 'site',
      metric: 'total_registrations',
      limit: 10,
    });

    expect(result.rows[0].label).toBe('Site A');
    expect(result.rows[0].registrations).toBe(2);
    expect(result.rows[1].label).toBe('Site B');
  });

  it('ranks by avg_fill_rate', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        currentEnrolled: 2,
        maxCapacity: 10,
        registrations: [],
        seatAllocations: [],
      }),
      makeSession({
        room: makeRoom({ site: makeSite({ id: 'site-2', name: 'Site B' }) }),
        currentEnrolled: 9,
        maxCapacity: 10,
        registrations: [],
        seatAllocations: [],
      }),
    ]);

    const result = await operationalAnalyticsService.getRankings({
      dimension: 'site',
      metric: 'avg_fill_rate',
      limit: 10,
    });

    expect(result.rows[0].label).toBe('Site B');
    expect(result.rows[0].avgFillRate).toBeCloseTo(0.9);
  });

  it('ranks by region', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        room: makeRoom({
          site: makeSite({ region: { id: 'r1', name: 'North' } }),
        }),
        registrations: [makeRegistration('u1'), makeRegistration('u2')],
        seatAllocations: [],
      }),
      makeSession({
        room: makeRoom({
          site: makeSite({ region: { id: 'r2', name: 'South' } }),
        }),
        registrations: [makeRegistration('u3')],
        seatAllocations: [],
      }),
    ]);

    const result = await operationalAnalyticsService.getRankings({
      dimension: 'region',
      metric: 'total_registrations',
      limit: 10,
    });

    expect(result.rows[0].label).toBe('North');
    expect(result.rows[0].registrations).toBe(2);
  });

  it('ranks by team (role)', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        registrations: [
          makeRegistration('u1', 'ANALYST'),
          makeRegistration('u2', 'ANALYST'),
          makeRegistration('u3', 'STANDARD_USER'),
        ],
        seatAllocations: [],
      }),
    ]);

    const result = await operationalAnalyticsService.getRankings({
      dimension: 'team',
      metric: 'total_registrations',
      limit: 10,
    });

    expect(result.rows[0].label).toBe('ANALYST');
    expect(result.rows[0].registrations).toBe(2);
  });

  it('respects the limit parameter', async () => {
    const sessions = ['site-1', 'site-2', 'site-3'].map((id, i) =>
      makeSession({
        room: makeRoom({ site: makeSite({ id, name: `Site ${i}` }) }),
        registrations: [makeRegistration(`u${i}`)],
      }),
    );
    mockPrisma.testSession.findMany.mockResolvedValue(sessions);

    const result = await operationalAnalyticsService.getRankings({
      dimension: 'site',
      metric: 'total_registrations',
      limit: 2,
    });

    expect(result.rows).toHaveLength(2);
  });

  it('ranks by community dimension', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        room: makeRoom({ site: makeSite({ community: { id: 'c1', name: 'Community A' } }) }),
        registrations: [makeRegistration('u1'), makeRegistration('u2')],
        seatAllocations: [],
      }),
      makeSession({
        id: 'sess-2',
        room: makeRoom({ site: makeSite({ id: 'site-2', community: { id: 'c2', name: 'Community B' } }) }),
        registrations: [makeRegistration('u3')],
        seatAllocations: [],
      }),
    ]);

    const result = await operationalAnalyticsService.getRankings({
      dimension: 'community',
      metric: 'total_registrations',
      limit: 10,
    });

    expect(result.rows[0].label).toBe('Community A');
    expect(result.rows[0].registrations).toBe(2);
  });

  it('ranks by total_sessions metric', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({ room: makeRoom({ site: makeSite({ id: 'site-1', name: 'Site A' }) }), registrations: [] }),
      makeSession({ id: 'sess-2', room: makeRoom({ site: makeSite({ id: 'site-1', name: 'Site A' }) }), registrations: [] }),
      makeSession({ id: 'sess-3', room: makeRoom({ site: makeSite({ id: 'site-2', name: 'Site B' }) }), registrations: [] }),
    ]);

    const result = await operationalAnalyticsService.getRankings({
      dimension: 'site',
      metric: 'total_sessions',
      limit: 10,
    });

    expect(result.rows[0].label).toBe('Site A');
    expect(result.rows[0].sessions).toBe(2);
  });

  it('ranks by attendance_rate metric', async () => {
    mockPrisma.testSession.findMany.mockResolvedValue([
      makeSession({
        room: makeRoom({ site: makeSite({ id: 'site-1', name: 'Site A' }) }),
        registrations: [makeRegistration('u1'), makeRegistration('u2')],
        seatAllocations: [{}],
      }),
      makeSession({
        id: 'sess-2',
        room: makeRoom({ site: makeSite({ id: 'site-2', name: 'Site B' }) }),
        registrations: [makeRegistration('u3')],
        seatAllocations: [{}],
      }),
    ]);

    const result = await operationalAnalyticsService.getRankings({
      dimension: 'site',
      metric: 'attendance_rate',
      limit: 10,
    });

    // Site B has 1/1 = 1.0 attendance rate, Site A has 1/2 = 0.5
    expect(result.rows[0].label).toBe('Site B');
  });
});
