/**
 * Verifies that the daily/weekly/monthly report generation jobs are wrapped
 * by scheduleExecutionsService.runWithExecutionLog and produce the correct
 * counts when underlying definitions succeed/fail.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockRunWithExec } = vi.hoisted(() => ({
  mockPrisma: {
    reportDefinition: { findMany: vi.fn() },
    metricValue: { findMany: vi.fn() },
    report: { create: vi.fn() },
    reportMetricSnapshot: { create: vi.fn() },
    metricDefinitionVersion: { update: vi.fn() },
  },
  mockRunWithExec: vi.fn(),
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/analytics/schedule-executions.service', () => ({
  scheduleExecutionsService: { runWithExecutionLog: mockRunWithExec },
}));

import {
  dailyReportGeneration,
  weeklyReportGeneration,
  monthlyReportGeneration,
  reportGenerationInternal,
} from '../../../src/jobs/report-generation.job';
import { ReportFrequency } from '@prisma/client';

beforeEach(() => {
  vi.resetAllMocks();
  // The job calls runWithExecutionLog with a callback — we invoke the
  // callback so we can observe the result it returns.
  mockRunWithExec.mockImplementation(async (_freq, _trig, fn: any) => {
    return fn();
  });
});

describe('Scheduled report generation jobs', () => {
  it('dailyReportGeneration calls runWithExecutionLog with DAILY frequency', async () => {
    mockPrisma.reportDefinition.findMany.mockResolvedValue([]);

    await dailyReportGeneration();

    expect(mockRunWithExec).toHaveBeenCalledWith(
      ReportFrequency.DAILY,
      expect.stringContaining('cron:0 6'),
      expect.any(Function),
    );
  });

  it('weeklyReportGeneration calls runWithExecutionLog with WEEKLY frequency', async () => {
    mockPrisma.reportDefinition.findMany.mockResolvedValue([]);

    await weeklyReportGeneration();

    expect(mockRunWithExec).toHaveBeenCalledWith(
      ReportFrequency.WEEKLY,
      expect.stringContaining('cron:0 7'),
      expect.any(Function),
    );
  });

  it('monthlyReportGeneration calls runWithExecutionLog with MONTHLY frequency', async () => {
    mockPrisma.reportDefinition.findMany.mockResolvedValue([]);

    await monthlyReportGeneration();

    expect(mockRunWithExec).toHaveBeenCalledWith(
      ReportFrequency.MONTHLY,
      expect.stringContaining('cron:0 8 1'),
      expect.any(Function),
    );
  });
});

describe('reportGenerationInternal.generateReportsForFrequency', () => {
  it('returns generated count when all definitions succeed', async () => {
    mockPrisma.reportDefinition.findMany.mockResolvedValue([
      { id: 'def-1', createdBy: 'user-1' },
      { id: 'def-2', createdBy: 'user-1' },
    ]);
    mockPrisma.metricValue.findMany.mockResolvedValue([
      {
        propertyId: 'p1',
        property: { name: 'Property 1' },
        metricDefinitionVersion: {
          metricDefinition: { metricType: 'UNIT_RENT', name: 'Unit Rent' },
          versionNumber: 1,
        },
        metricDefinitionVersionId: 'v1',
        value: { toString: () => '100' },
        calculatedAt: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(),
      },
    ]);
    mockPrisma.report.create.mockResolvedValue({ id: 'rpt-1' });
    mockPrisma.reportMetricSnapshot.create.mockResolvedValue({});
    mockPrisma.metricDefinitionVersion.update.mockResolvedValue({});

    const result = await reportGenerationInternal.generateReportsForFrequency(
      ReportFrequency.DAILY,
      new Date('2024-01-01'),
      new Date('2024-01-02'),
    );

    expect(result.totalDefinitions).toBe(2);
    expect(result.generatedCount).toBe(2);
    expect(result.failedCount).toBe(0);
  });

  it('returns failed count when some definitions throw', async () => {
    mockPrisma.reportDefinition.findMany.mockResolvedValue([
      { id: 'def-1', createdBy: 'user-1' },
      { id: 'def-2', createdBy: 'user-1' },
    ]);
    mockPrisma.metricValue.findMany.mockResolvedValue([]);
    let createCalls = 0;
    mockPrisma.report.create.mockImplementation(() => {
      createCalls += 1;
      if (createCalls === 1) return Promise.resolve({ id: 'rpt-1' });
      return Promise.reject(new Error('database error'));
    });

    const result = await reportGenerationInternal.generateReportsForFrequency(
      ReportFrequency.DAILY,
      new Date('2024-01-01'),
      new Date('2024-01-02'),
    );

    expect(result.totalDefinitions).toBe(2);
    expect(result.generatedCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.errorMessage).toContain('database error');
  });

  it('returns zeros when no definitions exist', async () => {
    mockPrisma.reportDefinition.findMany.mockResolvedValue([]);

    const result = await reportGenerationInternal.generateReportsForFrequency(
      ReportFrequency.MONTHLY,
      new Date('2024-01-01'),
      new Date('2024-02-01'),
    );

    expect(result.totalDefinitions).toBe(0);
    expect(result.generatedCount).toBe(0);
  });
});
