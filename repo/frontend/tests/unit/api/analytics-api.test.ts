/**
 * Analytics frontend API wrapper — guards against URL/method drift for the
 * entire analytics surface. Each wrapper must call the exact HTTP method +
 * path that the backend exposes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/api/client', () => ({ default: apiMock }));

import * as analytics from '@/api/endpoints/analytics.api';

beforeEach(() => {
  Object.values(apiMock).forEach((m) => m.mockReset());
  Object.values(apiMock).forEach((m) => m.mockResolvedValue({ data: { success: true } }));
});

describe('api/endpoints/analytics.api — definitions', () => {
  it('getDefinitions GETs /v1/analytics/definitions with query params', async () => {
    await analytics.getDefinitions({ page: 2 });
    expect(apiMock.get).toHaveBeenCalledWith('/v1/analytics/definitions', { params: { page: 2 } });
  });

  it('getDefinition GETs /v1/analytics/definitions/:id', async () => {
    await analytics.getDefinition('d1');
    expect(apiMock.get).toHaveBeenCalledWith('/v1/analytics/definitions/d1');
  });

  it('createDefinition POSTs /v1/analytics/definitions with body', async () => {
    await analytics.createDefinition({ name: 'x', frequency: 'DAILY' });
    expect(apiMock.post).toHaveBeenCalledWith('/v1/analytics/definitions', {
      name: 'x', frequency: 'DAILY',
    });
  });

  it('updateDefinition PATCHes /v1/analytics/definitions/:id', async () => {
    await analytics.updateDefinition('d1', { name: 'renamed' });
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/analytics/definitions/d1', {
      name: 'renamed',
    });
  });

  it('deleteDefinition DELETEs /v1/analytics/definitions/:id', async () => {
    await analytics.deleteDefinition('d1');
    expect(apiMock.delete).toHaveBeenCalledWith('/v1/analytics/definitions/d1');
  });
});

describe('api/endpoints/analytics.api — reports & sharing', () => {
  it('generateReport POSTs /v1/analytics/reports', async () => {
    const body = {
      definitionId: 'd1',
      periodStart: '2024-01-01T00:00:00.000Z',
      periodEnd: '2024-01-31T00:00:00.000Z',
    };
    await analytics.generateReport(body);
    expect(apiMock.post).toHaveBeenCalledWith('/v1/analytics/reports', body);
  });

  it('getReports GETs /v1/analytics/reports', async () => {
    await analytics.getReports({ status: 'PUBLISHED' });
    expect(apiMock.get).toHaveBeenCalledWith('/v1/analytics/reports', {
      params: { status: 'PUBLISHED' },
    });
  });

  it('getReport GETs /v1/analytics/reports/:id', async () => {
    await analytics.getReport('r1');
    expect(apiMock.get).toHaveBeenCalledWith('/v1/analytics/reports/r1');
  });

  it('shareReport POSTs /v1/analytics/reports/:id/shares', async () => {
    await analytics.shareReport('r1', { userId: 'u1' });
    expect(apiMock.post).toHaveBeenCalledWith(
      '/v1/analytics/reports/r1/shares',
      { userId: 'u1' },
    );
  });

  it('revokeShare DELETEs /v1/analytics/reports/:id/shares/:shareId', async () => {
    await analytics.revokeShare('r1', 's1');
    expect(apiMock.delete).toHaveBeenCalledWith(
      '/v1/analytics/reports/r1/shares/s1',
    );
  });

  it('getShares GETs /v1/analytics/reports/:id/shares', async () => {
    await analytics.getShares('r1');
    expect(apiMock.get).toHaveBeenCalledWith('/v1/analytics/reports/r1/shares');
  });

  it('exportReport POSTs /v1/analytics/reports/:id/export', async () => {
    await analytics.exportReport('r1', { format: 'CSV' });
    expect(apiMock.post).toHaveBeenCalledWith(
      '/v1/analytics/reports/r1/export',
      { format: 'CSV' },
    );
  });

  it('downloadExport GETs /v1/analytics/exports/:id/download with blob responseType', async () => {
    await analytics.downloadExport('e1');
    expect(apiMock.get).toHaveBeenCalledWith(
      '/v1/analytics/exports/e1/download',
      { responseType: 'blob' },
    );
  });
});

describe('api/endpoints/analytics.api — pivot & schedules', () => {
  it('pivotQuery POSTs /v1/analytics/pivot', async () => {
    await analytics.pivotQuery({
      dimensions: ['region'],
      measures: ['avg_value'],
    });
    expect(apiMock.post).toHaveBeenCalledWith('/v1/analytics/pivot', {
      dimensions: ['region'],
      measures: ['avg_value'],
    });
  });

  it('schedule CRUD maps to /v1/analytics/schedules endpoints', async () => {
    await analytics.getSchedules({ page: 1 });
    await analytics.getSchedule('s1');
    await analytics.createSchedule({ name: 'x' });
    await analytics.updateSchedule('s1', { frequency: 'WEEKLY' });
    await analytics.deleteSchedule('s1');

    expect(apiMock.get).toHaveBeenCalledWith('/v1/analytics/schedules', { params: { page: 1 } });
    expect(apiMock.get).toHaveBeenCalledWith('/v1/analytics/schedules/s1');
    expect(apiMock.post).toHaveBeenCalledWith('/v1/analytics/schedules', { name: 'x' });
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/analytics/schedules/s1', {
      frequency: 'WEEKLY',
    });
    expect(apiMock.delete).toHaveBeenCalledWith('/v1/analytics/schedules/s1');
  });
});
