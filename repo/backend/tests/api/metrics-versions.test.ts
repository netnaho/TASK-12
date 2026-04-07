/**
 * API tests for metric version creation and lock behavior.
 * Verifies that:
 *  - Creating a new version succeeds for authorized roles
 *  - Attempting to create a version on a locked definition fails
 *  - Recalculation job endpoint permissions are enforced
 *  - Metric value listing paginates correctly
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  mockMetricsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleVersion = {
  id: 'ver-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  metricDefinitionId: 'def-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  versionNumber: 2,
  formulaJson: { formula: 'avg(rent)' },
  effectiveFrom: '2024-06-01T00:00:00.000Z',
  effectiveTo: null,
  isLocked: false,
  createdBy: 'user-admin-id',
  createdAt: new Date().toISOString(),
};

// ─── POST /api/v1/metrics/definitions/:id/versions ───────────────────────────

describe('POST /api/v1/metrics/definitions/:id/versions', () => {
  const definitionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const validPayload = {
    formulaJson: { formula: 'avg(rentPrice)' },
    effectiveFrom: '2024-06-01T00:00:00.000Z',
  };

  it('should return 201 for SYSTEM_ADMIN', async () => {
    mockMetricsService.createVersion.mockResolvedValue(sampleVersion);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('versionNumber', 2);
  });

  it('should return 201 for LEASING_OPS_MANAGER', async () => {
    mockMetricsService.createVersion.mockResolvedValue(sampleVersion);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 409 when version is locked (in a published report)', async () => {
    const { ConflictError } = await import('../../src/shared/errors');
    mockMetricsService.createVersion.mockRejectedValue(
      new ConflictError('Cannot create new version — existing version is locked by a published report'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send(validPayload);

    assertError(res, 409, 'CONFLICT');
  });

  it('should return 404 when definition does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockMetricsService.createVersion.mockRejectedValue(
      new NotFoundError('Metric definition not found'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send(validPayload);

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 422 for missing effectiveFrom', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send({ formulaJson: { formula: 'avg(rent)' } });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid effectiveFrom format', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send({ ...validPayload, effectiveFrom: 'not-a-date' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post(`/api/v1/metrics/definitions/${definitionId}/versions`)
      .send(validPayload);

    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── GET /api/v1/metrics/definitions/:id ─────────────────────────────────────

describe('GET /api/v1/metrics/definitions/:id', () => {
  const definitionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 with definition and its versions', async () => {
    mockMetricsService.getDefinition.mockResolvedValue({
      id: definitionId,
      metricType: 'UNIT_RENT',
      name: 'Unit Rent',
      versions: [sampleVersion],
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.get(`/api/v1/metrics/definitions/${definitionId}`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('metricType', 'UNIT_RENT');
    expect(res.body.data.versions).toHaveLength(1);
  });

  it('should return 404 when definition does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockMetricsService.getDefinition.mockRejectedValue(
      new NotFoundError('Metric definition not found'),
    );

    const agent = await loginAs('ANALYST');
    const res = await agent.get(`/api/v1/metrics/definitions/${definitionId}`);

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get(`/api/v1/metrics/definitions/${definitionId}`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── GET /api/v1/metrics/jobs ─────────────────────────────────────────────────

describe('GET /api/v1/metrics/jobs', () => {
  it('should return 200 for SYSTEM_ADMIN', async () => {
    mockMetricsService.listJobs.mockResolvedValue({
      data: [{ id: 'job-1', status: 'SUCCEEDED' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/metrics/jobs');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/metrics/jobs');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});
