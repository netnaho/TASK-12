import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockAnalyticsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleReport = {
  id: 'rpt-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  definitionId: 'def-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  status: 'PUBLISHED',
  generatedBy: 'user-analyst-id',
  periodStart: '2024-01-01T00:00:00.000Z',
  periodEnd: '2024-01-31T23:59:59.000Z',
  resultJson: { totalListings: 100 },
  createdAt: new Date().toISOString(),
};

const sampleShare = {
  id: 'share-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  reportId: sampleReport.id,
  userId: 'user-other-id',
  sharedBy: 'user-admin-id',
  createdAt: new Date().toISOString(),
};

const sampleExport = {
  id: 'exp-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  reportId: sampleReport.id,
  format: 'CSV',
  status: 'COMPLETED',
};

// ─── Generate Report ────────────────────────────────────────────────────

describe('POST /api/v1/analytics/reports/generate', () => {
  const validPayload = {
    definitionId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    periodStart: '2024-01-01T00:00:00.000Z',
    periodEnd: '2024-01-31T23:59:59.000Z',
  };

  it('should return 201 for analyst', async () => {
    mockAnalyticsService.generateReport.mockResolvedValue(sampleReport);

    const agent = await loginAs('ANALYST');
    const res = await agent
      .post('/api/v1/analytics/reports/generate')
      .send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('status', 'PUBLISHED');
  });

  it('should return 201 for admin', async () => {
    mockAnalyticsService.generateReport.mockResolvedValue(sampleReport);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/analytics/reports/generate')
      .send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 201 for LEASING_OPS_MANAGER', async () => {
    mockAnalyticsService.generateReport.mockResolvedValue(sampleReport);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .post('/api/v1/analytics/reports/generate')
      .send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post('/api/v1/analytics/reports/generate')
      .send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for invalid definitionId', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post('/api/v1/analytics/reports/generate')
      .send({ ...validPayload, definitionId: 'not-uuid' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid date format', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post('/api/v1/analytics/reports/generate')
      .send({ ...validPayload, periodStart: 'bad-date' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post('/api/v1/analytics/reports/generate')
      .send(validPayload);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── List Reports ───────────────────────────────────────────────────────

describe('GET /api/v1/analytics/reports', () => {
  it('should return 200 with paginated reports', async () => {
    mockAnalyticsService.listReports.mockResolvedValue({
      data: [sampleReport],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/reports');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should be accessible to any authenticated user', async () => {
    mockAnalyticsService.listReports.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/analytics/reports');

    assertPaginated(res, 200);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/analytics/reports');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Share Report ───────────────────────────────────────────────────────

describe('POST /api/v1/analytics/reports/:id/share', () => {
  const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const targetUserId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

  it('should return 201 for admin', async () => {
    mockAnalyticsService.shareReport.mockResolvedValue(sampleShare);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/share`)
      .send({ userId: targetUserId });

    assertSuccess(res, 201);
  });

  it('should return 201 for LEASING_OPS_MANAGER', async () => {
    mockAnalyticsService.shareReport.mockResolvedValue(sampleShare);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/share`)
      .send({ userId: targetUserId });

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/share`)
      .send({ userId: targetUserId });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST (not a manager role)', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/share`)
      .send({ userId: targetUserId });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for invalid userId in body', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/share`)
      .send({ userId: 'bad' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid report id', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/analytics/reports/not-a-uuid/share')
      .send({ userId: targetUserId });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── Export Report ──────────────────────────────────────────────────────

describe('POST /api/v1/analytics/reports/:id/export', () => {
  const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 201 for analyst', async () => {
    mockAnalyticsService.requestExport.mockResolvedValue(sampleExport);

    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('format', 'CSV');
  });

  it('should return 201 for admin', async () => {
    mockAnalyticsService.requestExport.mockResolvedValue(sampleExport);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'PDF' });

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for invalid format', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'DOCX' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── Pivot ──────────────────────────────────────────────────────────────

describe('POST /api/v1/analytics/pivot', () => {
  const validPayload = {
    dimensions: ['region', 'month'],
    measures: ['avg_value', 'count'],
  };

  it('should return 200 for analyst', async () => {
    const pivotData = { rows: [{ region: 'SE', month: '2024-01', avg_value: 1400, count: 50 }] };
    mockAnalyticsService.pivotQuery.mockResolvedValue(pivotData);

    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/analytics/pivot').send(validPayload);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('rows');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/analytics/pivot').send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 with empty dimensions array', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/analytics/pivot').send({
      dimensions: [],
      measures: ['count'],
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with empty measures array', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/analytics/pivot').send({
      dimensions: ['region'],
      measures: [],
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with invalid dimension', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/analytics/pivot').send({
      dimensions: ['invalid_dimension'],
      measures: ['count'],
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post('/api/v1/analytics/pivot')
      .send(validPayload);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Archive Report ─────────────────────────────────────────────────────

describe('PATCH /api/v1/analytics/reports/:id/archive', () => {
  const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for the report owner', async () => {
    mockAnalyticsService.archiveReport.mockResolvedValue({
      ...sampleReport,
      status: 'ARCHIVED',
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.patch(`/api/v1/analytics/reports/${reportId}/archive`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'ARCHIVED');
  });

  it('should return 403 when service throws ForbiddenError', async () => {
    const { ForbiddenError } = await import('../../src/shared/errors');
    mockAnalyticsService.archiveReport.mockRejectedValue(
      new ForbiddenError('Only the report creator or an admin can archive it'),
    );

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.patch(`/api/v1/analytics/reports/${reportId}/archive`);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 404 when report does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockAnalyticsService.archiveReport.mockRejectedValue(
      new NotFoundError('Report not found'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.patch(`/api/v1/analytics/reports/${reportId}/archive`);

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().patch(`/api/v1/analytics/reports/${reportId}/archive`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── List Shares ─────────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/reports/:id/shares', () => {
  const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 with shares for authenticated user', async () => {
    mockAnalyticsService.listShares.mockResolvedValue([sampleShare]);

    const agent = await loginAs('ANALYST');
    const res = await agent.get(`/api/v1/analytics/reports/${reportId}/shares`);

    assertSuccess(res, 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get(`/api/v1/analytics/reports/${reportId}/shares`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Export Report ───────────────────────────────────────────────────────────

describe('POST /api/v1/analytics/reports/:id/export', () => {
  const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 201 with export request for analyst', async () => {
    const exportReq = { id: 'exp-1', reportId, format: 'CSV', status: 'PENDING' };
    mockAnalyticsService.requestExport.mockResolvedValue(exportReq);

    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('format', 'CSV');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: PATCH /definitions/:id ────────────────────────────────────────

describe('PATCH /api/v1/analytics/definitions/:id (compat alias for PUT)', () => {
  const defId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const payload = { name: 'Updated Name' };

  it('should return 200 for admin using PATCH', async () => {
    mockAnalyticsService.updateDefinition.mockResolvedValue({
      id: defId,
      name: 'Updated Name',
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .patch(`/api/v1/analytics/definitions/${defId}`)
      .send(payload);

    assertSuccess(res, 200);
  });

  it('should return 200 for LEASING_OPS_MANAGER using PATCH', async () => {
    mockAnalyticsService.updateDefinition.mockResolvedValue({ id: defId });

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .patch(`/api/v1/analytics/definitions/${defId}`)
      .send(payload);

    assertSuccess(res, 200);
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .patch(`/api/v1/analytics/definitions/${defId}`)
      .send(payload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .patch(`/api/v1/analytics/definitions/${defId}`)
      .send(payload);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: POST /reports ──────────────────────────────────────────────────

describe('POST /api/v1/analytics/reports (compat alias for POST /reports/generate)', () => {
  const validPayload = {
    definitionId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    periodStart: '2024-01-01T00:00:00.000Z',
    periodEnd: '2024-01-31T23:59:59.000Z',
  };

  it('should return 201 for analyst using POST /reports', async () => {
    mockAnalyticsService.generateReport.mockResolvedValue(sampleReport);

    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/analytics/reports').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('status', 'PUBLISHED');
  });

  it('should return 201 for admin using POST /reports', async () => {
    mockAnalyticsService.generateReport.mockResolvedValue(sampleReport);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/analytics/reports').send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/analytics/reports').send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for invalid definitionId', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post('/api/v1/analytics/reports')
      .send({ ...validPayload, definitionId: 'not-uuid' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── COMPAT: POST /reports/:id/shares ──────────────────────────────────────

describe('POST /api/v1/analytics/reports/:id/shares (compat alias)', () => {
  const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const targetUserId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

  it('should return 201 for admin', async () => {
    mockAnalyticsService.shareReport.mockResolvedValue(sampleShare);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/shares`)
      .send({ userId: targetUserId });

    assertSuccess(res, 201);
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/shares`)
      .send({ userId: targetUserId });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post(`/api/v1/analytics/reports/${reportId}/shares`)
      .send({ userId: targetUserId });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: DELETE /reports/:id/shares/:shareId ───────────────────────────

describe('DELETE /api/v1/analytics/reports/:id/shares/:shareId (compat alias)', () => {
  const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const shareId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

  it('should return 200 for admin and bridge shareId to userId', async () => {
    mockAnalyticsService.revokeShare.mockResolvedValue({ removed: true });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete(
      `/api/v1/analytics/reports/${reportId}/shares/${shareId}`,
    );

    assertSuccess(res, 200);
    expect(mockAnalyticsService.revokeShare).toHaveBeenCalledWith(
      reportId,
      shareId,
      expect.any(String),
    );
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.delete(
      `/api/v1/analytics/reports/${reportId}/shares/${shareId}`,
    );

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: GET /schedules ─────────────────────────────────────────────────

describe('GET /api/v1/analytics/schedules (compat: lists scheduled definitions)', () => {
  it('should return 200 for analyst', async () => {
    mockAnalyticsService.listSchedules.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/schedules');

    assertPaginated(res, 200);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/analytics/schedules');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/analytics/schedules');

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── COMPAT: POST /schedules ────────────────────────────────────────────────

describe('POST /api/v1/analytics/schedules (compat: create scheduled definition)', () => {
  const validPayload = { name: 'Daily Metrics', frequency: 'DAILY' };

  it('should return 201 for analyst', async () => {
    mockAnalyticsService.createDefinition.mockResolvedValue({
      id: 'new-def-id',
      ...validPayload,
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/analytics/schedules').send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/analytics/schedules').send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: PATCH /schedules/:id ──────────────────────────────────────────

describe('PATCH /api/v1/analytics/schedules/:id (compat: update scheduled definition)', () => {
  const defId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for manager', async () => {
    mockAnalyticsService.updateDefinition.mockResolvedValue({ id: defId });

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .patch(`/api/v1/analytics/schedules/${defId}`)
      .send({ isActive: false });

    assertSuccess(res, 200);
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .patch(`/api/v1/analytics/schedules/${defId}`)
      .send({ isActive: false });

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── COMPAT: DELETE /schedules/:id ─────────────────────────────────────────

describe('DELETE /api/v1/analytics/schedules/:id (compat: soft-delete definition)', () => {
  const defId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 204 for admin', async () => {
    mockAnalyticsService.deleteDefinition.mockResolvedValue({
      id: defId,
      isActive: false,
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.delete(`/api/v1/analytics/schedules/${defId}`);

    expect(res.status).toBe(204);
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.delete(`/api/v1/analytics/schedules/${defId}`);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().delete(`/api/v1/analytics/schedules/${defId}`);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});
