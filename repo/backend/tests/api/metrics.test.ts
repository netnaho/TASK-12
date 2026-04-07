import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockMetricsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleDefinition = {
  id: 'mdef-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  metricType: 'UNIT_RENT',
  name: 'Unit Rent',
  description: 'Average rent per unit',
  createdAt: new Date().toISOString(),
};

const sampleMetricValue = {
  id: 'mv-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  metricDefinitionId: sampleDefinition.id,
  propertyId: 'prop-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  value: 1450.5,
  periodStart: '2024-01-01T00:00:00.000Z',
  periodEnd: '2024-01-31T23:59:59.000Z',
};

describe('GET /api/v1/metrics/definitions', () => {
  it('should return 200 with definitions for any authenticated user', async () => {
    mockMetricsService.listDefinitions.mockResolvedValue([sampleDefinition]);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/metrics/definitions');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('metricType', 'UNIT_RENT');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/metrics/definitions');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('POST /api/v1/metrics/definitions', () => {
  const validPayload = {
    metricType: 'UNIT_RENT',
    name: 'Unit Rent',
    description: 'Average rent per unit',
  };

  it('should return 201 for admin', async () => {
    mockMetricsService.createDefinition.mockResolvedValue(sampleDefinition);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/metrics/definitions').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('name', 'Unit Rent');
  });

  it('should return 201 for LEASING_OPS_MANAGER', async () => {
    mockMetricsService.createDefinition.mockResolvedValue(sampleDefinition);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.post('/api/v1/metrics/definitions').send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/metrics/definitions').send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/metrics/definitions').send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for invalid metricType', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/metrics/definitions').send({
      ...validPayload,
      metricType: 'INVALID_TYPE',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when name is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/metrics/definitions').send({
      metricType: 'UNIT_RENT',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

describe('POST /api/v1/metrics/recalculate', () => {
  it('should return 202 for admin', async () => {
    const job = { id: 'job-1', status: 'QUEUED' };
    mockMetricsService.triggerRecalculation.mockResolvedValue(job);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/metrics/recalculate')
      .send({ propertyIds: ['aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'] });

    // Controller returns 202 for recalculation
    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post('/api/v1/metrics/recalculate')
      .send({ propertyIds: [] });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 202 for ANALYST (default: ANALYST_CAN_TRIGGER_RECALC=true)', async () => {
    // ANALYST has METRIC_CALC_TRIGGER in the domain model; the route default
    // aligns with this. Set ANALYST_CAN_TRIGGER_RECALC=false to restrict.
    mockMetricsService.triggerRecalculation.mockResolvedValueOnce({ id: 'job-1', status: 'QUEUED' });

    const agent = await loginAs('ANALYST');
    const res = await agent
      .post('/api/v1/metrics/recalculate')
      .send({ propertyIds: [] });

    expect(res.status).toBe(202);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .post('/api/v1/metrics/recalculate')
      .send({});

    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should accept empty body (recalculate all)', async () => {
    mockMetricsService.triggerRecalculation.mockResolvedValue({ id: 'job-1', status: 'QUEUED' });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/metrics/recalculate').send({});

    expect(res.status).toBe(202);
  });
});

describe('GET /api/v1/metrics/values', () => {
  it('should return 200 with paginated metric values', async () => {
    mockMetricsService.getMetricValues.mockResolvedValue({
      data: [sampleMetricValue],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/metrics/values');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/metrics/values');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});
