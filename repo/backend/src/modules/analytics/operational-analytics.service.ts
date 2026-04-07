/**
 * Operational analytics for the LeaseOps test-center / participation domain.
 *
 * These analytics derive their dimensions from real operational records:
 *  - TestSession   → scheduled work events
 *  - TestRegistration → user signups
 *  - SeatAllocation → who was placed in a seat (proxy for attended)
 *  - TestRoom / TestSite → physical capacity
 *  - User / UserRole → "team" (role-based grouping)
 *  - Region / Community → geo dimensions (via TestSite.regionId/communityId)
 *
 * The seven analytics produced are:
 *   1. participation       — registrations grouped by region/community/site/role/week
 *   2. attendance          — registered vs allocated (show-up rate) per group
 *   3. hour distribution   — total scheduled session hours bucketed by time
 *   4. retention           — % of users who registered for ≥2 sessions in the window
 *   5. staffing gaps       — sessions over-/under- subscribed, missing equipment
 *   6. event popularity    — sessions ranked by enrollment ratio
 *   7. rankings            — sites/regions/communities/teams ranked by chosen metric
 *
 * The service is intentionally implemented in TypeScript (in-memory aggregation
 * over Prisma findMany() results) rather than raw SQL so it is straightforward
 * to test with mocked Prisma and trivial to extend with new dimensions.
 */
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import {
  ParticipationQuery,
  AttendanceQuery,
  HourDistributionQuery,
  RetentionQuery,
  StaffingGapsQuery,
  EventPopularityQuery,
  RankingsQuery,
} from './operational-analytics.schemas';

// ─── Internal helpers ──────────────────────────────────────────────────────

interface DateRange {
  from?: Date;
  to?: Date;
}

function parseDateRange(filters: { dateFrom?: string; dateTo?: string }): DateRange {
  return {
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined,
  };
}

/**
 * Build the WHERE clause for sessions, applying date range and the
 * region/community/site filters via the room→site relation.
 */
function sessionWhere(filters: {
  dateFrom?: string;
  dateTo?: string;
  regionId?: string;
  communityId?: string;
  siteId?: string;
}): any {
  const range = parseDateRange(filters);
  const where: any = {};

  if (range.from || range.to) {
    where.scheduledStart = {};
    if (range.from) where.scheduledStart.gte = range.from;
    if (range.to) where.scheduledStart.lte = range.to;
  }

  // Filter by site / community / region via the room → site path.
  const roomFilter: any = {};
  const siteFilter: any = {};
  if (filters.siteId) siteFilter.id = filters.siteId;
  if (filters.communityId) siteFilter.communityId = filters.communityId;
  if (filters.regionId) siteFilter.regionId = filters.regionId;
  if (Object.keys(siteFilter).length > 0) {
    roomFilter.site = siteFilter;
  }
  if (Object.keys(roomFilter).length > 0) {
    where.room = roomFilter;
  }

  return where;
}

function isoWeekKey(d: Date): string {
  // Year + ISO-week (no library, good enough for grouping)
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 36e5);
}

function safeRatio(num: number, denom: number): number {
  return denom === 0 ? 0 : num / denom;
}

// ─── 1. Participation ──────────────────────────────────────────────────────

/**
 * Returns total registrations grouped by the chosen dimension.
 *
 * Output shape:
 *   { groupBy, totalRegistrations, totalUsers, rows: [{ key, label, registrations, uniqueUsers }] }
 */
async function getParticipation(query: ParticipationQuery) {
  const where = sessionWhere(query);

  const sessions = await prisma.testSession.findMany({
    where,
    include: {
      registrations: {
        where: { cancelledAt: null },
        include: {
          user: {
            include: {
              roles: { include: { role: true } },
            },
          },
        },
      },
      room: { include: { site: { include: { region: true, community: true } } } },
    },
  });

  const groups = new Map<string, { label: string; users: Set<string>; registrations: number }>();

  const upsertGroup = (key: string, label: string, userId: string) => {
    if (!groups.has(key)) {
      groups.set(key, { label, users: new Set(), registrations: 0 });
    }
    const g = groups.get(key)!;
    g.registrations += 1;
    g.users.add(userId);
  };

  let total = 0;
  const allUsers = new Set<string>();

  for (const session of sessions) {
    for (const reg of session.registrations) {
      total += 1;
      allUsers.add(reg.userId);

      switch (query.groupBy) {
        case 'region': {
          const region = session.room.site.region;
          const key = region?.id ?? 'unassigned';
          const label = region?.name ?? 'Unassigned';
          upsertGroup(key, label, reg.userId);
          break;
        }
        case 'community': {
          const community = session.room.site.community;
          const key = community?.id ?? 'unassigned';
          const label = community?.name ?? 'Unassigned';
          upsertGroup(key, label, reg.userId);
          break;
        }
        case 'site': {
          const site = session.room.site;
          upsertGroup(site.id, site.name, reg.userId);
          break;
        }
        case 'role': {
          const roles = reg.user.roles.map((r: any) => r.role.name);
          const primary = roles[0] ?? 'NO_ROLE';
          upsertGroup(primary, primary, reg.userId);
          break;
        }
        case 'week': {
          const wk = isoWeekKey(session.scheduledStart);
          upsertGroup(wk, wk, reg.userId);
          break;
        }
      }
    }
  }

  const rows = Array.from(groups.entries())
    .map(([key, g]) => ({
      key,
      label: g.label,
      registrations: g.registrations,
      uniqueUsers: g.users.size,
    }))
    .sort((a, b) => b.registrations - a.registrations);

  return {
    groupBy: query.groupBy,
    totalRegistrations: total,
    totalUsers: allUsers.size,
    rows,
  };
}

// ─── 2. Attendance ─────────────────────────────────────────────────────────

/**
 * Attendance rate = seat allocations / non-cancelled registrations.
 *
 * Returns per-group registered, allocated, and rate (0..1).
 */
async function getAttendance(query: AttendanceQuery) {
  const where = sessionWhere(query);

  const sessions = await prisma.testSession.findMany({
    where,
    include: {
      registrations: { where: { cancelledAt: null } },
      seatAllocations: true,
      room: { include: { site: { include: { region: true, community: true } } } },
    },
  });

  const groups = new Map<string, { label: string; registered: number; allocated: number }>();

  const upsert = (key: string, label: string, registered: number, allocated: number) => {
    if (!groups.has(key)) groups.set(key, { label, registered: 0, allocated: 0 });
    const g = groups.get(key)!;
    g.registered += registered;
    g.allocated += allocated;
  };

  let totalRegistered = 0;
  let totalAllocated = 0;

  for (const session of sessions) {
    const reg = session.registrations.length;
    const alloc = session.seatAllocations.length;
    totalRegistered += reg;
    totalAllocated += alloc;

    switch (query.groupBy) {
      case 'region': {
        const r = session.room.site.region;
        upsert(r?.id ?? 'unassigned', r?.name ?? 'Unassigned', reg, alloc);
        break;
      }
      case 'community': {
        const c = session.room.site.community;
        upsert(c?.id ?? 'unassigned', c?.name ?? 'Unassigned', reg, alloc);
        break;
      }
      case 'site': {
        const s = session.room.site;
        upsert(s.id, s.name, reg, alloc);
        break;
      }
      case 'week': {
        const wk = isoWeekKey(session.scheduledStart);
        upsert(wk, wk, reg, alloc);
        break;
      }
    }
  }

  const rows = Array.from(groups.entries())
    .map(([key, g]) => ({
      key,
      label: g.label,
      registered: g.registered,
      allocated: g.allocated,
      attendanceRate: safeRatio(g.allocated, g.registered),
    }))
    .sort((a, b) => b.attendanceRate - a.attendanceRate);

  return {
    groupBy: query.groupBy,
    totalRegistered,
    totalAllocated,
    overallAttendanceRate: safeRatio(totalAllocated, totalRegistered),
    rows,
  };
}

// ─── 3. Hour Distribution ──────────────────────────────────────────────────

/**
 * Total scheduled session-hours bucketed by hour-of-day, day-of-week, or week.
 * Useful for spotting peak operating windows.
 */
async function getHourDistribution(query: HourDistributionQuery) {
  const where = sessionWhere(query);

  const sessions = await prisma.testSession.findMany({
    where,
    select: {
      scheduledStart: true,
      scheduledEnd: true,
      currentEnrolled: true,
      maxCapacity: true,
    },
  });

  const buckets = new Map<string, { label: string; sessions: number; hours: number; enrolled: number }>();

  const labelFor = (start: Date): { key: string; label: string } => {
    switch (query.bucket) {
      case 'hour-of-day': {
        const h = start.getUTCHours();
        return { key: String(h), label: `${String(h).padStart(2, '0')}:00` };
      }
      case 'day-of-week': {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const d = start.getUTCDay();
        return { key: String(d), label: days[d] };
      }
      case 'week':
      default: {
        const wk = isoWeekKey(start);
        return { key: wk, label: wk };
      }
    }
  };

  let totalHours = 0;
  let totalSessions = 0;

  for (const s of sessions) {
    const { key, label } = labelFor(s.scheduledStart);
    if (!buckets.has(key)) buckets.set(key, { label, sessions: 0, hours: 0, enrolled: 0 });
    const b = buckets.get(key)!;
    const h = hoursBetween(s.scheduledStart, s.scheduledEnd);
    b.sessions += 1;
    b.hours += h;
    b.enrolled += s.currentEnrolled;
    totalHours += h;
    totalSessions += 1;
  }

  const rows = Array.from(buckets.entries())
    .map(([key, b]) => ({
      key,
      label: b.label,
      sessions: b.sessions,
      hours: Number(b.hours.toFixed(2)),
      enrolled: b.enrolled,
    }))
    .sort((a, b) => {
      // Numeric sort for hour-of-day / day-of-week, lexical for week
      const an = Number(a.key);
      const bn = Number(b.key);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return a.key.localeCompare(b.key);
    });

  return {
    bucket: query.bucket,
    totalSessions,
    totalHours: Number(totalHours.toFixed(2)),
    averageSessionHours: totalSessions > 0 ? Number((totalHours / totalSessions).toFixed(2)) : 0,
    rows,
  };
}

// ─── 4. Retention ──────────────────────────────────────────────────────────

/**
 * Of all users who registered for at least one session in the window,
 * how many registered for ≥2 sessions? Returns counts and a rate.
 *
 * Also returns a "returningWithinDays" cohort: users whose 2nd registration
 * happened within `cohortWindowDays` of their 1st.
 */
async function getRetention(query: RetentionQuery) {
  const where = sessionWhere(query);

  const sessions = await prisma.testSession.findMany({
    where,
    include: {
      registrations: { where: { cancelledAt: null } },
    },
  });

  const userRegs = new Map<string, Date[]>();

  for (const session of sessions) {
    for (const reg of session.registrations) {
      if (!userRegs.has(reg.userId)) userRegs.set(reg.userId, []);
      userRegs.get(reg.userId)!.push(session.scheduledStart);
    }
  }

  let totalUsers = userRegs.size;
  let returningUsers = 0;
  let cohortReturning = 0;
  const cohortMs = query.cohortWindowDays * 24 * 60 * 60 * 1000;

  for (const [, dates] of userRegs) {
    if (dates.length >= 2) {
      returningUsers += 1;
      const sorted = dates.slice().sort((a, b) => a.getTime() - b.getTime());
      if (sorted[1].getTime() - sorted[0].getTime() <= cohortMs) {
        cohortReturning += 1;
      }
    }
  }

  return {
    totalUsers,
    returningUsers,
    retentionRate: safeRatio(returningUsers, totalUsers),
    cohortWindowDays: query.cohortWindowDays,
    cohortReturning,
    cohortRetentionRate: safeRatio(cohortReturning, totalUsers),
  };
}

// ─── 5. Staffing Gaps ──────────────────────────────────────────────────────

/**
 * Identifies operational gaps:
 *  - over-subscribed sessions (currentEnrolled === maxCapacity)
 *  - under-utilised sessions  (currentEnrolled / maxCapacity < threshold)
 *  - rooms with no operational seats / equipment problems
 *  - cancelled sessions in window
 *
 * Returns counts plus a small list of the worst offenders so the dashboard
 * can render an alert table.
 */
async function getStaffingGaps(query: StaffingGapsQuery) {
  const where = sessionWhere(query);

  const sessions = await prisma.testSession.findMany({
    where,
    include: {
      room: {
        include: {
          site: { select: { id: true, name: true } },
          seats: {
            include: {
              equipmentLedger: { where: { removedAt: null } },
            },
          },
        },
      },
    },
  });

  let overSubscribed = 0;
  let underUtilised = 0;
  let cancelled = 0;
  let roomsMissingEquipment = 0;
  const offenders: any[] = [];

  for (const s of sessions) {
    if (s.status === 'CANCELLED') {
      cancelled += 1;
      continue;
    }

    const ratio = safeRatio(s.currentEnrolled, s.maxCapacity);

    if (s.currentEnrolled >= s.maxCapacity) {
      overSubscribed += 1;
      offenders.push({
        sessionId: s.id,
        sessionName: s.name,
        siteName: s.room.site.name,
        scheduledStart: s.scheduledStart.toISOString(),
        issue: 'OVER_SUBSCRIBED',
        details: `${s.currentEnrolled}/${s.maxCapacity} enrolled`,
      });
    } else if (ratio < query.underutilisedThreshold) {
      underUtilised += 1;
      offenders.push({
        sessionId: s.id,
        sessionName: s.name,
        siteName: s.room.site.name,
        scheduledStart: s.scheduledStart.toISOString(),
        issue: 'UNDER_UTILISED',
        details: `${s.currentEnrolled}/${s.maxCapacity} enrolled (${(ratio * 100).toFixed(0)}%)`,
      });
    }

    // Equipment check: a room is "missing equipment" if it has seats but
    // none of them have an active equipment ledger entry.
    const seats = s.room.seats;
    const seatsWithEquipment = seats.filter((seat: any) => seat.equipmentLedger.length > 0);
    if (seats.length > 0 && seatsWithEquipment.length === 0) {
      roomsMissingEquipment += 1;
      offenders.push({
        sessionId: s.id,
        sessionName: s.name,
        siteName: s.room.site.name,
        scheduledStart: s.scheduledStart.toISOString(),
        issue: 'EQUIPMENT_MISSING',
        details: `Room "${s.room.name}" has no active equipment`,
      });
    }
  }

  return {
    totalSessions: sessions.length,
    overSubscribed,
    underUtilised,
    cancelled,
    roomsMissingEquipment,
    underutilisedThreshold: query.underutilisedThreshold,
    offenders: offenders.slice(0, 50),
  };
}

// ─── 6. Event Popularity ───────────────────────────────────────────────────

/**
 * Top sessions ranked by enrollment ratio (currentEnrolled / maxCapacity).
 * Ties broken by absolute enrollment count, then by start date desc.
 */
async function getEventPopularity(query: EventPopularityQuery) {
  const where = sessionWhere(query);

  const sessions = await prisma.testSession.findMany({
    where,
    include: {
      room: { include: { site: { select: { id: true, name: true } } } },
    },
  });

  const ranked = sessions
    .map((s: any) => ({
      sessionId: s.id,
      sessionName: s.name,
      siteId: s.room.site.id,
      siteName: s.room.site.name,
      scheduledStart: s.scheduledStart.toISOString(),
      enrolled: s.currentEnrolled,
      capacity: s.maxCapacity,
      fillRate: safeRatio(s.currentEnrolled, s.maxCapacity),
    }))
    .sort((a, b) => {
      if (b.fillRate !== a.fillRate) return b.fillRate - a.fillRate;
      if (b.enrolled !== a.enrolled) return b.enrolled - a.enrolled;
      return b.scheduledStart.localeCompare(a.scheduledStart);
    })
    .slice(0, query.limit);

  return {
    totalSessions: sessions.length,
    rows: ranked,
  };
}

// ─── 7. Rankings ───────────────────────────────────────────────────────────

/**
 * Cross-cutting rankings by region/community/site/team.
 * The metric chosen determines what is being ranked:
 *  - total_sessions       — count of sessions
 *  - total_registrations  — count of non-cancelled registrations
 *  - avg_fill_rate        — mean of enrolled/capacity across sessions
 *  - attendance_rate      — allocations / registrations
 */
async function getRankings(query: RankingsQuery) {
  const where = sessionWhere(query);

  const sessions = await prisma.testSession.findMany({
    where,
    include: {
      registrations: {
        where: { cancelledAt: null },
        include: {
          user: { include: { roles: { include: { role: true } } } },
        },
      },
      seatAllocations: true,
      room: { include: { site: { include: { region: true, community: true } } } },
    },
  });

  type Bucket = {
    key: string;
    label: string;
    sessions: number;
    registrations: number;
    allocations: number;
    sumFillRate: number;
  };
  const buckets = new Map<string, Bucket>();

  const upsert = (key: string, label: string): Bucket => {
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label,
        sessions: 0,
        registrations: 0,
        allocations: 0,
        sumFillRate: 0,
      });
    }
    return buckets.get(key)!;
  };

  for (const s of sessions) {
    const fill = safeRatio(s.currentEnrolled, s.maxCapacity);

    const apply = (key: string, label: string) => {
      const b = upsert(key, label);
      b.sessions += 1;
      b.registrations += s.registrations.length;
      b.allocations += s.seatAllocations.length;
      b.sumFillRate += fill;
    };

    switch (query.dimension) {
      case 'region': {
        const r = s.room.site.region;
        apply(r?.id ?? 'unassigned', r?.name ?? 'Unassigned');
        break;
      }
      case 'community': {
        const c = s.room.site.community;
        apply(c?.id ?? 'unassigned', c?.name ?? 'Unassigned');
        break;
      }
      case 'site': {
        const site = s.room.site;
        apply(site.id, site.name);
        break;
      }
      case 'team': {
        // Team = primary role of each registrant
        for (const reg of s.registrations) {
          const roleName = reg.user.roles[0]?.role?.name ?? 'NO_ROLE';
          const b = upsert(roleName, roleName);
          b.registrations += 1;
        }
        // Each session counted once for sessions/allocations/fillRate against
        // every represented team. This double-counts intentionally so the
        // sessions column reflects "sessions involving members of this team."
        const teamsInSession = new Set(
          s.registrations.map((r: any) => r.user.roles[0]?.role?.name ?? 'NO_ROLE'),
        );
        for (const tn of teamsInSession) {
          const b = upsert(tn, tn);
          b.sessions += 1;
          b.allocations += s.seatAllocations.length;
          b.sumFillRate += fill;
        }
        break;
      }
    }
  }

  const ranked = Array.from(buckets.values())
    .map((b) => ({
      key: b.key,
      label: b.label,
      sessions: b.sessions,
      registrations: b.registrations,
      allocations: b.allocations,
      avgFillRate: b.sessions > 0 ? Number((b.sumFillRate / b.sessions).toFixed(4)) : 0,
      attendanceRate: safeRatio(b.allocations, b.registrations),
    }))
    .sort((a, b) => {
      switch (query.metric) {
        case 'total_sessions':
          return b.sessions - a.sessions;
        case 'total_registrations':
          return b.registrations - a.registrations;
        case 'avg_fill_rate':
          return b.avgFillRate - a.avgFillRate;
        case 'attendance_rate':
          return b.attendanceRate - a.attendanceRate;
      }
    })
    .slice(0, query.limit);

  return {
    dimension: query.dimension,
    metric: query.metric,
    rows: ranked,
  };
}

// ─── Public service ────────────────────────────────────────────────────────

export const operationalAnalyticsService = {
  getParticipation,
  getAttendance,
  getHourDistribution,
  getRetention,
  getStaffingGaps,
  getEventPopularity,
  getRankings,
};
