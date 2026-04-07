import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockCommunitiesService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleRegion = {
  id: 'reg-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Southeast',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sampleProperty = {
  id: 'prop-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Sunrise Apartments',
  communityId: 'comm-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  addressLine1: '123 Main St',
  city: 'Tampa',
  state: 'FL',
  postalCode: '33601',
  latitude: 27.9506,
  longitude: -82.4572,
  totalUnits: 100,
};

// ─── Regions ────────────────────────────────────────────────────────────

describe('GET /api/v1/communities/regions', () => {
  it('should return 200 with paginated regions for authenticated user', async () => {
    mockCommunitiesService.listRegions.mockResolvedValue({
      data: [sampleRegion],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/communities/regions');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('name', 'Southeast');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/communities/regions');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should be accessible to any authenticated role', async () => {
    mockCommunitiesService.listRegions.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/communities/regions');

    assertPaginated(res, 200);
  });
});

describe('POST /api/v1/communities/regions', () => {
  it('should return 201 for admin', async () => {
    mockCommunitiesService.createRegion.mockResolvedValue(sampleRegion);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/regions')
      .send({ name: 'Southeast' });

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('name', 'Southeast');
  });

  it('should return 201 for LEASING_OPS_MANAGER', async () => {
    mockCommunitiesService.createRegion.mockResolvedValue(sampleRegion);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .post('/api/v1/communities/regions')
      .send({ name: 'Southeast' });

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post('/api/v1/communities/regions')
      .send({ name: 'Southeast' });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post('/api/v1/communities/regions')
      .send({ name: 'Southeast' });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 when name is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/regions')
      .send({});

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when name is empty string', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/regions')
      .send({ name: '' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── Properties ─────────────────────────────────────────────────────────

describe('GET /api/v1/communities/properties', () => {
  it('should return 200 with paginated properties for authenticated user', async () => {
    mockCommunitiesService.listProperties.mockResolvedValue({
      data: [sampleProperty],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/communities/properties');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/communities/properties');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('POST /api/v1/communities/properties', () => {
  const validPropertyPayload = {
    name: 'Sunrise Apartments',
    communityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    addressLine1: '123 Main St',
    city: 'Tampa',
    state: 'FL',
    postalCode: '33601',
    latitude: 27.9506,
    longitude: -82.4572,
    totalUnits: 100,
  };

  it('should return 201 with valid geo coords as admin', async () => {
    mockCommunitiesService.createProperty.mockResolvedValue(sampleProperty);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send(validPropertyPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('name', 'Sunrise Apartments');
  });

  it('should return 201 as LEASING_OPS_MANAGER', async () => {
    mockCommunitiesService.createProperty.mockResolvedValue(sampleProperty);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send(validPropertyPayload);

    assertSuccess(res, 201);
  });

  it('should return 422 with latitude out of range (> 90)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send({ ...validPropertyPayload, latitude: 91 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with latitude out of range (< -90)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send({ ...validPropertyPayload, latitude: -91 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with longitude out of range (> 180)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send({ ...validPropertyPayload, longitude: 181 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with longitude out of range (< -180)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send({ ...validPropertyPayload, longitude: -181 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with invalid communityId (not UUID)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send({ ...validPropertyPayload, communityId: 'not-a-uuid' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with missing required fields', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send({ name: 'Only Name' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with totalUnits zero', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send({ ...validPropertyPayload, totalUnits: 0 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .post('/api/v1/communities/properties')
      .send(validPropertyPayload);

    assertError(res, 403, 'FORBIDDEN');
  });
});
