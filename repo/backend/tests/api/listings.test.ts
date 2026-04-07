import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockListingsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleListing = {
  id: 'lst-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  propertyId: 'prop-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  unitNumber: '101A',
  bedrooms: 2,
  bathrooms: 1.5,
  sqft: 950,
  rentPrice: 1500,
  listedAt: '2024-01-15T00:00:00.000Z',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('GET /api/v1/listings', () => {
  it('should return 200 with paginated listings for authenticated user', async () => {
    mockListingsService.findAll.mockResolvedValue({
      data: [sampleListing],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/listings');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('unitNumber', '101A');
  });

  it('should return 200 for any authenticated role', async () => {
    mockListingsService.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/listings');

    assertPaginated(res, 200);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/listings');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should pass filter params to service', async () => {
    mockListingsService.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/listings?bedrooms=2&minRent=1000&maxRent=2000');

    expect(mockListingsService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ bedrooms: 2, minRent: 1000, maxRent: 2000 }),
    );
  });
});

describe('POST /api/v1/listings', () => {
  const validPayload = {
    propertyId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    unitNumber: '101A',
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 950,
    rentPrice: 1500,
    listedAt: '2024-01-15T00:00:00.000Z',
  };

  it('should return 201 for admin with valid data', async () => {
    mockListingsService.create.mockResolvedValue(sampleListing);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/listings').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('unitNumber', '101A');
  });

  it('should return 201 for LEASING_OPS_MANAGER', async () => {
    mockListingsService.create.mockResolvedValue(sampleListing);

    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.post('/api/v1/listings').send(validPayload);

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/listings').send(validPayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for invalid propertyId', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/listings').send({
      ...validPayload,
      propertyId: 'not-uuid',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid listedAt date', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/listings').send({
      ...validPayload,
      listedAt: 'not-a-date',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for negative rent price', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/listings').send({
      ...validPayload,
      rentPrice: -100,
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid bathrooms (not a multiple of 0.5)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/listings').send({
      ...validPayload,
      bathrooms: 1.3,
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

describe('GET /api/v1/listings/stats', () => {
  it('should return 200 with stats for authenticated user', async () => {
    const stats = { totalListings: 50, activeListings: 30, avgRent: 1450.5 };
    mockListingsService.getListingStats.mockResolvedValue(stats);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/listings/stats');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('totalListings', 50);
  });

  it('should accept optional propertyId filter', async () => {
    mockListingsService.getListingStats.mockResolvedValue({});

    const agent = await loginAs('SYSTEM_ADMIN');
    const propId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    await agent.get(`/api/v1/listings/stats?propertyId=${propId}`);

    expect(mockListingsService.getListingStats).toHaveBeenCalledWith(propId);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/listings/stats');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('PUT /api/v1/listings/:id', () => {
  const listingId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for admin with valid update', async () => {
    mockListingsService.update.mockResolvedValue({
      ...sampleListing,
      rentPrice: 1600,
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put(`/api/v1/listings/${listingId}`)
      .send({ rentPrice: 1600 });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('rentPrice', 1600);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .put(`/api/v1/listings/${listingId}`)
      .send({ rentPrice: 1600 });

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 for non-UUID id', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put('/api/v1/listings/not-a-uuid')
      .send({ rentPrice: 1600 });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});
