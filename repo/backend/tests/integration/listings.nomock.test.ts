import { describe, it, expect, beforeAll } from 'vitest';
import {
  loginAs,
  createAgent,
  assertSuccess,
  assertError,
  assertPaginated,
  shouldRunIntegration,
} from './helpers/setup';

const d = shouldRunIntegration ? describe : describe.skip;

let adminAgent: Awaited<ReturnType<typeof loginAs>>;
let managerAgent: Awaited<ReturnType<typeof loginAs>>;
let standardAgent: Awaited<ReturnType<typeof loginAs>>;

d('Listings module (no-mock — extended)', () => {
  beforeAll(async () => {
    adminAgent = await loginAs('admin');
    managerAgent = await loginAs('manager');
    standardAgent = await loginAs('agent');
  });

  it('GET /listings requires auth', async () => {
    const res = await createAgent().get('/api/v1/listings');
    assertError(res, 401);
  });

  it('GET /listings returns a paginated list with a meta block', async () => {
    const res = await standardAgent.get('/api/v1/listings');
    assertPaginated(res);
    expect(res.body.meta).toHaveProperty('page');
    expect(res.body.meta).toHaveProperty('pageSize');
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /listings filters by isActive', async () => {
    const res = await standardAgent.get('/api/v1/listings?isActive=true');
    assertPaginated(res);
    for (const l of res.body.data) expect(l.isActive).toBe(true);
  });

  it('GET /listings rejects invalid bedrooms filter (422)', async () => {
    const res = await standardAgent.get('/api/v1/listings?bedrooms=abc');
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('GET /listings/stats returns an aggregate object', async () => {
    const res = await standardAgent.get('/api/v1/listings/stats');
    assertSuccess(res);
    expect(res.body.data).toBeTruthy();
  });

  it('POST /listings rejects standard user (403)', async () => {
    const res = await standardAgent.post('/api/v1/listings').send({
      propertyId: '00000000-0000-0000-0000-000000000000',
      unitNumber: 'X',
      bedrooms: 1,
      bathrooms: 1,
      sqft: 500,
      rentPrice: 1000,
      listedAt: new Date().toISOString(),
    });
    assertError(res, 403);
  });

  it('POST /listings validates body (422)', async () => {
    const res = await adminAgent.post('/api/v1/listings').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /listings rejects non-UUID propertyId (422)', async () => {
    const res = await adminAgent.post('/api/v1/listings').send({
      propertyId: 'nope',
      unitNumber: 'A1',
      bedrooms: 1,
      bathrooms: 1,
      sqft: 500,
      rentPrice: 1000,
      listedAt: new Date().toISOString(),
    });
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('GET /listings/:id with malformed id returns 422', async () => {
    const res = await adminAgent.get('/api/v1/listings/not-a-uuid');
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('GET /listings/:id returns 404 for unknown valid UUID', async () => {
    const res = await adminAgent.get(
      '/api/v1/listings/00000000-0000-0000-0000-000000000000',
    );
    assertError(res, 404);
  });

  it('PUT /listings/:id rejects standard user (403)', async () => {
    const res = await standardAgent
      .put('/api/v1/listings/00000000-0000-0000-0000-000000000000')
      .send({ rentPrice: 999 });
    assertError(res, 403);
  });

  it('PUT /listings/:id validates body (422)', async () => {
    const res = await adminAgent
      .put('/api/v1/listings/00000000-0000-0000-0000-000000000000')
      .send({ bedrooms: -5 });
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('PUT /listings/:id returns 404 for unknown listing', async () => {
    const res = await managerAgent
      .put('/api/v1/listings/00000000-0000-0000-0000-000000000000')
      .send({ rentPrice: 500 });
    assertError(res, 404);
  });
});
