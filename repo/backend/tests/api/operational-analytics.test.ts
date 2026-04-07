import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  mockOperationalAnalyticsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleParticipation = {
  groupBy: 'site',
  totalRegistrations: 50,
  totalUsers: 25,
  rows: [{ key: 'site-1', label: 'Site A', registrations: 50, uniqueUsers: 25 }],
};

const sampleAttendance = {
  groupBy: 'site',
  totalRegistered: 50,
  totalAllocated: 40,
  overallAttendanceRate: 0.8,
  rows: [],
};

const sampleHourDist = {
  bucket: 'hour-of-day',
  totalSessions: 12,
  totalHours: 24,
  averageSessionHours: 2,
  rows: [],
};

const sampleRetention = {
  totalUsers: 100,
  returningUsers: 30,
  retentionRate: 0.3,
  cohortWindowDays: 30,
  cohortReturning: 25,
  cohortRetentionRate: 0.25,
};

const sampleStaffingGaps = {
  totalSessions: 10,
  overSubscribed: 2,
  underUtilised: 3,
  cancelled: 1,
  roomsMissingEquipment: 0,
  underutilisedThreshold: 0.5,
  offenders: [],
};

const samplePopularity = {
  totalSessions: 5,
  rows: [],
};

const sampleRankings = {
  dimension: 'site',
  metric: 'total_registrations',
  rows: [],
};

// ─── PARTICIPATION ──────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/operational/participation', () => {
  it('should return 200 for ANALYST', async () => {
    mockOperationalAnalyticsService.getParticipation.mockResolvedValue(sampleParticipation);

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/participation');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('totalRegistrations', 50);
  });

  it('should return 200 for SYSTEM_ADMIN', async () => {
    mockOperationalAnalyticsService.getParticipation.mockResolvedValue(sampleParticipation);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/analytics/operational/participation?groupBy=region');

    assertSuccess(res, 200);
  });

  it('should return 200 for LEASING_OPS_MANAGER', async () => {
    mockOperationalAnalyticsService.getParticipation.mockResolvedValue(sampleParticipation);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.get('/api/v1/analytics/operational/participation');

    assertSuccess(res, 200);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/analytics/operational/participation');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for invalid groupBy', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/participation?groupBy=banana');

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/analytics/operational/participation');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── ATTENDANCE ─────────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/operational/attendance', () => {
  it('should return 200 with attendance rates', async () => {
    mockOperationalAnalyticsService.getAttendance.mockResolvedValue(sampleAttendance);

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/attendance');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('overallAttendanceRate', 0.8);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/analytics/operational/attendance');

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── HOUR DISTRIBUTION ──────────────────────────────────────────────────────

describe('GET /api/v1/analytics/operational/hour-distribution', () => {
  it('should return 200 with hour buckets', async () => {
    mockOperationalAnalyticsService.getHourDistribution.mockResolvedValue(sampleHourDist);

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/hour-distribution?bucket=hour-of-day');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('totalSessions', 12);
  });

  it('should return 422 for invalid bucket', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/hour-distribution?bucket=year');

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── RETENTION ──────────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/operational/retention', () => {
  it('should return 200 with retention rate', async () => {
    mockOperationalAnalyticsService.getRetention.mockResolvedValue(sampleRetention);

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/retention');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('retentionRate', 0.3);
  });

  it('should return 422 when cohortWindowDays is negative', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/retention?cohortWindowDays=-5');

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── STAFFING GAPS ──────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/operational/staffing-gaps', () => {
  it('should return 200 with gap counts', async () => {
    mockOperationalAnalyticsService.getStaffingGaps.mockResolvedValue(sampleStaffingGaps);

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/staffing-gaps');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('overSubscribed', 2);
  });
});

// ─── EVENT POPULARITY ───────────────────────────────────────────────────────

describe('GET /api/v1/analytics/operational/event-popularity', () => {
  it('should return 200 with ranked sessions', async () => {
    mockOperationalAnalyticsService.getEventPopularity.mockResolvedValue(samplePopularity);

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/event-popularity?limit=5');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('totalSessions', 5);
  });

  it('should return 422 for limit > 100', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/event-popularity?limit=500');

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── RANKINGS ───────────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/operational/rankings', () => {
  it('should return 200 with rankings by region', async () => {
    mockOperationalAnalyticsService.getRankings.mockResolvedValue({
      ...sampleRankings,
      dimension: 'region',
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.get(
      '/api/v1/analytics/operational/rankings?dimension=region&metric=total_registrations',
    );

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('dimension', 'region');
  });

  it('should return 200 for community dimension', async () => {
    mockOperationalAnalyticsService.getRankings.mockResolvedValue(sampleRankings);

    const agent = await loginAs('ANALYST');
    const res = await agent.get(
      '/api/v1/analytics/operational/rankings?dimension=community',
    );

    assertSuccess(res, 200);
  });

  it('should return 200 for team dimension', async () => {
    mockOperationalAnalyticsService.getRankings.mockResolvedValue(sampleRankings);

    const agent = await loginAs('ANALYST');
    const res = await agent.get(
      '/api/v1/analytics/operational/rankings?dimension=team',
    );

    assertSuccess(res, 200);
  });

  it('should return 422 when dimension is missing', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/operational/rankings');

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid metric', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get(
      '/api/v1/analytics/operational/rankings?dimension=site&metric=invalid_metric',
    );

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(
      '/api/v1/analytics/operational/rankings?dimension=site',
    );

    assertError(res, 403, 'FORBIDDEN');
  });
});
