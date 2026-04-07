/**
 * API tests for report definitions CRUD and schedule management.
 */
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

const sampleDefinition = {
  id: 'def-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Monthly Rent Report',
  frequency: 'MONTHLY',
  filterJson: {},
  isActive: true,
  createdAt: new Date().toISOString(),
};

// ─── List definitions ─────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/definitions', () => {
  it('should return 200 for ANALYST', async () => {
    mockAnalyticsService.listDefinitions.mockResolvedValue({
      data: [sampleDefinition],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/analytics/definitions');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/analytics/definitions');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── Create definition ────────────────────────────────────────────────────────

describe('POST /api/v1/analytics/definitions', () => {
  const validPayload = {
    name: 'Monthly Rent Report',
    frequency: 'MONTHLY',
    filterJson: { regionId: 'r1' },
  };

  it('should return 201 for SYSTEM_ADMIN', async () => {
    mockAnalyticsService.createDefinition.mockResolvedValue(sampleDefinition);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/analytics/definitions').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('frequency', 'MONTHLY');
  });

  it('should return 201 for LEASING_OPS_MANAGER', async () => {
    mockAnalyticsService.createDefinition.mockResolvedValue(sampleDefinition);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.post('/api/v1/analytics/definitions').send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/analytics/definitions').send(validPayload);
    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for invalid frequency', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/analytics/definitions')
      .send({ ...validPayload, frequency: 'YEARLY' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when name is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/analytics/definitions')
      .send({ frequency: 'DAILY' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── Update definition ────────────────────────────────────────────────────────

describe('PUT /api/v1/analytics/definitions/:id', () => {
  const defId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const validUpdate = { name: 'Renamed Report', frequency: 'MONTHLY', filterJson: {}, isActive: true };

  it('should return 200 for admin with valid update', async () => {
    mockAnalyticsService.updateDefinition.mockResolvedValue({
      ...sampleDefinition,
      name: 'Renamed Report',
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put(`/api/v1/analytics/definitions/${defId}`)
      .send(validUpdate);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('name', 'Renamed Report');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .put(`/api/v1/analytics/definitions/${defId}`)
      .send(validUpdate);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 404 when definition does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockAnalyticsService.updateDefinition.mockRejectedValue(
      new NotFoundError('Report definition not found'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put(`/api/v1/analytics/definitions/${defId}`)
      .send(validUpdate);

    assertError(res, 404, 'NOT_FOUND');
  });
});

// ─── Get definition by id ─────────────────────────────────────────────────────

describe('GET /api/v1/analytics/definitions/:id', () => {
  const defId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 when definition exists', async () => {
    mockAnalyticsService.getDefinition.mockResolvedValue(sampleDefinition);

    const agent = await loginAs('ANALYST');
    const res = await agent.get(`/api/v1/analytics/definitions/${defId}`);

    assertSuccess(res, 200);
  });

  it('should return 404 when definition does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockAnalyticsService.getDefinition.mockRejectedValue(
      new NotFoundError('Report definition not found'),
    );

    const agent = await loginAs('ANALYST');
    const res = await agent.get(`/api/v1/analytics/definitions/${defId}`);

    assertError(res, 404, 'NOT_FOUND');
  });
});
