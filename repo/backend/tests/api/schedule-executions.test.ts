import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockScheduleExecutionsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleExecution = {
  id: 'exec-1',
  frequency: 'DAILY',
  status: 'SUCCEEDED',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  totalDefinitions: 5,
  generatedCount: 5,
  failedCount: 0,
  triggeredBy: 'cron:0 6 * * *',
};

describe('GET /api/v1/analytics/schedule-executions', () => {
  it('should return 200 paginated for SYSTEM_ADMIN', async () => {
    mockScheduleExecutionsService.listExecutions.mockResolvedValue({
      data: [sampleExecution],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/analytics/schedule-executions');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('frequency', 'DAILY');
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.get('/api/v1/analytics/schedule-executions');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/schedule-executions');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should filter by frequency=WEEKLY', async () => {
    mockScheduleExecutionsService.listExecutions.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/analytics/schedule-executions?frequency=WEEKLY');

    expect(mockScheduleExecutionsService.listExecutions).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'WEEKLY' }),
    );
  });

  it('should return 422 for invalid frequency', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get(
      '/api/v1/analytics/schedule-executions?frequency=YEARLY',
    );

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/analytics/schedule-executions');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});
