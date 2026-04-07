/**
 * Extended unit tests for metricsService — covers getMetricValues, triggerRecalculation,
 * runRecalculation, recalculateAll, and listJobs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAudit, mockMetricEngine } = vi.hoisted(() => ({
  mockPrisma: {
    metricDefinition: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    metricDefinitionVersion: { update: vi.fn(), create: vi.fn() },
    metricValue: { findMany: vi.fn(), count: vi.fn(), createMany: vi.fn() },
    metricCalcJob: { create: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    property: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
  mockAudit: { create: vi.fn() },
  mockMetricEngine: { calculateAll: vi.fn(), calculate: vi.fn(), getRegisteredTypes: vi.fn() },
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/audit/audit.service', () => ({
  auditService: mockAudit,
}));
vi.mock('../../../src/modules/metrics/metric-engine', () => ({
  metricEngine: mockMetricEngine,
}));

import { metricsService } from '../../../src/modules/metrics/metrics.service';

beforeEach(() => {
  vi.resetAllMocks();
  mockAudit.create.mockResolvedValue({});
  mockPrisma.$transaction.mockImplementation((fn: any) =>
    fn({ metricDefinitionVersion: { update: vi.fn(), create: vi.fn() } }),
  );
});

const metricValue = {
  id: 'mv-1',
  propertyId: 'prop-1',
  value: 1500,
  calculatedAt: new Date(),
  periodStart: new Date(),
  periodEnd: new Date(),
  metricDefinitionVersion: {
    id: 'ver-1',
    metricDefinition: { id: 'def-1', metricType: 'UNIT_RENT' },
  },
};

// ─── getMetricValues ─────────────────────────────────────────────────────────

describe('getMetricValues', () => {
  it('returns paginated metric values', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([metricValue]);
    mockPrisma.metricValue.count.mockResolvedValue(1);

    const result = await metricsService.getMetricValues({});
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('filters by propertyId', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([]);
    mockPrisma.metricValue.count.mockResolvedValue(0);

    await metricsService.getMetricValues({ propertyId: 'prop-1' });
    expect(mockPrisma.metricValue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ propertyId: 'prop-1' }) }),
    );
  });

  it('filters by metricType', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([]);
    mockPrisma.metricValue.count.mockResolvedValue(0);

    await metricsService.getMetricValues({ metricType: 'UNIT_RENT' });
    expect(mockPrisma.metricValue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          metricDefinitionVersion: expect.objectContaining({
            metricDefinition: { metricType: 'UNIT_RENT' },
          }),
        }),
      }),
    );
  });

  it('filters by periodStart and periodEnd', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([]);
    mockPrisma.metricValue.count.mockResolvedValue(0);

    await metricsService.getMetricValues({
      periodStart: '2024-01-01T00:00:00.000Z',
      periodEnd: '2024-12-31T23:59:59.000Z',
    });
    expect(mockPrisma.metricValue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ periodEnd: expect.any(Object) }),
      }),
    );
  });
});

// ─── triggerRecalculation ─────────────────────────────────────────────────────

describe('triggerRecalculation', () => {
  it('creates a PENDING job, audits, and starts async recalculation', async () => {
    const job = { id: 'job-1', status: 'PENDING' };
    mockPrisma.metricCalcJob.create.mockResolvedValue(job);
    mockPrisma.metricCalcJob.update.mockResolvedValue({});
    // runRecalculation will call property.findMany and metricDefinition.findMany
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.metricDefinition.findMany.mockResolvedValue([]);

    const result = await metricsService.triggerRecalculation(undefined, 'actor-id');
    expect(result.id).toBe('job-1');
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'METRIC_CALC_TRIGGERED' }),
    );
  });

  it('passes propertyIds filter to the job', async () => {
    const job = { id: 'job-2', status: 'PENDING' };
    mockPrisma.metricCalcJob.create.mockResolvedValue(job);
    mockPrisma.metricCalcJob.update.mockResolvedValue({});
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.metricDefinition.findMany.mockResolvedValue([]);

    const result = await metricsService.triggerRecalculation(['prop-1', 'prop-2'], 'actor-id');
    expect(result.id).toBe('job-2');
  });
});

// ─── listJobs ────────────────────────────────────────────────────────────────

describe('listJobs', () => {
  it('returns paginated metric calculation jobs', async () => {
    const job = { id: 'job-1', status: 'COMPLETED', createdAt: new Date() };
    mockPrisma.metricCalcJob.findMany.mockResolvedValue([job]);
    mockPrisma.metricCalcJob.count.mockResolvedValue(1);

    const result = await metricsService.listJobs({});
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});

// ─── recalculateAll (covers runRecalculation) ─────────────────────────────────

describe('recalculateAll', () => {
  it('creates a cron job and runs recalculation with no properties', async () => {
    const job = { id: 'job-cron-1', status: 'PENDING' };
    mockPrisma.metricCalcJob.create.mockResolvedValue(job);
    mockPrisma.metricCalcJob.update.mockResolvedValue({});
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.metricDefinition.findMany.mockResolvedValue([]);

    const result = await metricsService.recalculateAll();
    expect(result.id).toBe('job-cron-1');
    // runRecalculation is awaited, so update should have been called
    expect(mockPrisma.metricCalcJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });

  it('processes properties and calculates metrics', async () => {
    const job = { id: 'job-cron-2', status: 'PENDING' };
    mockPrisma.metricCalcJob.create.mockResolvedValue(job);
    mockPrisma.metricCalcJob.update.mockResolvedValue({});
    mockPrisma.property.findMany.mockResolvedValue([
      { id: 'prop-1', totalUnits: 10, listings: [] },
    ]);
    mockPrisma.metricDefinition.findMany.mockResolvedValue([
      {
        metricType: 'UNIT_RENT',
        versions: [{ id: 'ver-1', effectiveTo: null, versionNumber: 1 }],
      },
    ]);
    mockMetricEngine.calculateAll.mockReturnValue(
      new Map([['UNIT_RENT', { value: 1500 }]]),
    );
    mockPrisma.metricValue.createMany.mockResolvedValue({ count: 1 });

    await metricsService.recalculateAll();
    expect(mockPrisma.metricValue.createMany).toHaveBeenCalled();
  });

  it('marks job as FAILED when recalculation throws', async () => {
    const job = { id: 'job-fail', status: 'PENDING' };
    mockPrisma.metricCalcJob.create.mockResolvedValue(job);
    mockPrisma.metricCalcJob.update.mockResolvedValue({});
    mockPrisma.property.findMany.mockRejectedValue(new Error('DB error'));

    await expect(metricsService.recalculateAll()).rejects.toThrow('DB error');
    expect(mockPrisma.metricCalcJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
  });
});
