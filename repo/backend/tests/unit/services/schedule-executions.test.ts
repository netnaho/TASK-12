import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAuditCreate } = vi.hoisted(() => ({
  mockPrisma: {
    reportScheduleExecution: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
  mockAuditCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/audit/audit.service', () => ({
  auditService: { create: mockAuditCreate },
}));

import { scheduleExecutionsService } from '../../../src/modules/analytics/schedule-executions.service';
import { ReportFrequency } from '@prisma/client';

beforeEach(() => {
  vi.resetAllMocks();
  mockAuditCreate.mockResolvedValue({ id: BigInt(1) });
  mockPrisma.reportScheduleExecution.create.mockResolvedValue({
    id: 'exec-1',
    frequency: 'DAILY',
    status: 'RUNNING',
  });
  mockPrisma.reportScheduleExecution.update.mockResolvedValue({});
});

describe('scheduleExecutionsService.runWithExecutionLog', () => {
  it('marks execution SUCCEEDED when all definitions generate', async () => {
    await scheduleExecutionsService.runWithExecutionLog(
      ReportFrequency.DAILY,
      'cron:0 6 * * *',
      async () => ({ totalDefinitions: 3, generatedCount: 3, failedCount: 0 }),
    );

    expect(mockPrisma.reportScheduleExecution.create).toHaveBeenCalled();
    const updateCall = mockPrisma.reportScheduleExecution.update.mock.calls[0]?.[0];
    expect(updateCall.data.status).toBe('SUCCEEDED');
    expect(updateCall.data.generatedCount).toBe(3);
    expect(updateCall.data.failedCount).toBe(0);
  });

  it('marks execution PARTIAL when some succeed and some fail', async () => {
    await scheduleExecutionsService.runWithExecutionLog(
      ReportFrequency.WEEKLY,
      'cron:0 7 * * 1',
      async () => ({ totalDefinitions: 5, generatedCount: 3, failedCount: 2 }),
    );

    const updateCall = mockPrisma.reportScheduleExecution.update.mock.calls[0]?.[0];
    expect(updateCall.data.status).toBe('PARTIAL');
  });

  it('marks execution FAILED when all definitions fail', async () => {
    await scheduleExecutionsService.runWithExecutionLog(
      ReportFrequency.MONTHLY,
      'cron:0 8 1 * *',
      async () => ({ totalDefinitions: 4, generatedCount: 0, failedCount: 4 }),
    );

    const updateCall = mockPrisma.reportScheduleExecution.update.mock.calls[0]?.[0];
    expect(updateCall.data.status).toBe('FAILED');
  });

  it('marks execution SUCCEEDED when no definitions exist', async () => {
    await scheduleExecutionsService.runWithExecutionLog(
      ReportFrequency.DAILY,
      'cron',
      async () => ({ totalDefinitions: 0, generatedCount: 0, failedCount: 0 }),
    );

    const updateCall = mockPrisma.reportScheduleExecution.update.mock.calls[0]?.[0];
    expect(updateCall.data.status).toBe('SUCCEEDED');
  });

  it('marks execution FAILED with errorMessage when job throws', async () => {
    await scheduleExecutionsService.runWithExecutionLog(
      ReportFrequency.DAILY,
      'cron',
      async () => {
        throw new Error('database connection lost');
      },
    );

    const updateCall = mockPrisma.reportScheduleExecution.update.mock.calls[0]?.[0];
    expect(updateCall.data.status).toBe('FAILED');
    expect(updateCall.data.errorMessage).toContain('database connection lost');
  });

  it('always writes a REPORT_SCHEDULE_EXECUTED audit log', async () => {
    await scheduleExecutionsService.runWithExecutionLog(
      ReportFrequency.DAILY,
      'cron',
      async () => ({ totalDefinitions: 1, generatedCount: 1, failedCount: 0 }),
    );

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_SCHEDULE_EXECUTED',
        entityType: 'report_schedule_execution',
      }),
    );
  });
});

describe('scheduleExecutionsService.listExecutions', () => {
  it('returns paginated execution rows', async () => {
    mockPrisma.reportScheduleExecution.findMany.mockResolvedValue([
      { id: 'e1', frequency: 'DAILY', status: 'SUCCEEDED' },
      { id: 'e2', frequency: 'WEEKLY', status: 'FAILED' },
    ]);
    mockPrisma.reportScheduleExecution.count.mockResolvedValue(2);

    const result = await scheduleExecutionsService.listExecutions({} as any);

    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('filters by frequency', async () => {
    mockPrisma.reportScheduleExecution.findMany.mockResolvedValue([]);
    mockPrisma.reportScheduleExecution.count.mockResolvedValue(0);

    await scheduleExecutionsService.listExecutions({ frequency: 'DAILY' } as any);

    const findArgs = mockPrisma.reportScheduleExecution.findMany.mock.calls[0]?.[0];
    expect(findArgs.where.frequency).toBe('DAILY');
  });

  it('filters by status', async () => {
    mockPrisma.reportScheduleExecution.findMany.mockResolvedValue([]);
    mockPrisma.reportScheduleExecution.count.mockResolvedValue(0);

    await scheduleExecutionsService.listExecutions({ status: 'SUCCEEDED' } as any);

    const findArgs = mockPrisma.reportScheduleExecution.findMany.mock.calls[0]?.[0];
    expect(findArgs.where.status).toBe('SUCCEEDED');
  });
});
