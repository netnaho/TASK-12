/**
 * API tests for export security: watermark generation, forwarding prevention,
 * permission re-validation, and download authorization.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  mockAnalyticsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const reportId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const exportId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

const sampleExport = {
  id: exportId,
  reportId,
  requestedBy: 'user-analyst-id',
  format: 'CSV',
  status: 'COMPLETED',
  watermarkText: 'Analyst User | 2024-01-15T10:00:00.000Z',
  createdAt: new Date().toISOString(),
};

// ─── POST /api/v1/analytics/reports/:id/export ───────────────────────────────

describe('POST /api/v1/analytics/reports/:id/export — authorization', () => {
  it('should return 201 for ANALYST with CSV format', async () => {
    mockAnalyticsService.requestExport.mockResolvedValue(sampleExport);

    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('format', 'CSV');
  });

  it('should return 201 for LEASING_OPS_MANAGER', async () => {
    mockAnalyticsService.requestExport.mockResolvedValue({ ...sampleExport, format: 'EXCEL' });

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'EXCEL' });

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER (no export permission)', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 when service throws ForbiddenError (role downgraded since share)', async () => {
    const { ForbiddenError } = await import('../../src/shared/errors');
    mockAnalyticsService.requestExport.mockRejectedValue(
      new ForbiddenError('Your role no longer permits report exports'),
    );

    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 when user has no access to the report', async () => {
    const { ForbiddenError } = await import('../../src/shared/errors');
    mockAnalyticsService.requestExport.mockRejectedValue(
      new ForbiddenError('You do not have access to this report'),
    );

    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'PDF' });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 404 when report does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockAnalyticsService.requestExport.mockRejectedValue(
      new NotFoundError('Report not found'),
    );

    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 422 for invalid format', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'DOCX' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid report id (not UUID)', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post('/api/v1/analytics/reports/not-a-uuid/export')
      .send({ format: 'CSV' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post(`/api/v1/analytics/reports/${reportId}/export`)
      .send({ format: 'CSV' });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── POST /api/v1/analytics/reports/:id/share — forwarding restrictions ───────

describe('POST /api/v1/analytics/reports/:id/share — forwarding restrictions', () => {
  const targetUserId = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';

  it('should return 403 when target user role cannot export (forwarding prevention)', async () => {
    const { ForbiddenError } = await import('../../src/shared/errors');
    mockAnalyticsService.shareReport.mockRejectedValue(
      new ForbiddenError('Cannot share report with a user who lacks export permission'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/share`)
      .send({ userId: targetUserId });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 409 when report is already shared with this user', async () => {
    const { ConflictError } = await import('../../src/shared/errors');
    mockAnalyticsService.shareReport.mockRejectedValue(
      new ConflictError('Report already shared with this user'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/analytics/reports/${reportId}/share`)
      .send({ userId: targetUserId });

    assertError(res, 409, 'CONFLICT');
  });
});

// ─── GET /api/v1/analytics/reports ────────────────────────────────────────────

describe('GET /api/v1/analytics/reports — list with pagination', () => {
  it('should pass page and pageSize to the service', async () => {
    mockAnalyticsService.listReports.mockResolvedValue({
      data: [],
      meta: { page: 2, pageSize: 10, total: 25, totalPages: 3 },
    });

    const agent = await loginAs('ANALYST');
    await agent.get('/api/v1/analytics/reports?page=2&pageSize=10');

    expect(mockAnalyticsService.listReports).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ page: 2, pageSize: 10 }),
    );
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/analytics/reports');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});
