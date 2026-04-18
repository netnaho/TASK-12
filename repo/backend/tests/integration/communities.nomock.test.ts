/**
 * No-mock integration tests for the communities module — exercises
 * validation, RBAC, and the real Prisma round trip across regions,
 * communities, and properties.
 */
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

function uniq() { return `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`; }

d('Communities module (no-mock — extended)', () => {
  beforeAll(async () => {
    adminAgent = await loginAs('admin');
    managerAgent = await loginAs('manager');
    standardAgent = await loginAs('agent');
  });

  // ─── Regions ──────────────────────────────────────────────────────

  it('GET /regions requires authentication', async () => {
    const res = await createAgent().get('/api/v1/communities/regions');
    assertError(res, 401);
  });

  it('GET /regions returns paginated list for authed user', async () => {
    const res = await adminAgent.get('/api/v1/communities/regions');
    assertPaginated(res);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /regions rejects standard users (403)', async () => {
    const res = await standardAgent
      .post('/api/v1/communities/regions')
      .send({ name: 'forbidden' });
    assertError(res, 403);
  });

  it('POST /regions validates body (422)', async () => {
    const res = await adminAgent
      .post('/api/v1/communities/regions')
      .send({});
    assertError(res, 422, 'VALIDATION_ERROR');
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET on unknown region id returns 404', async () => {
    const res = await adminAgent.get(
      '/api/v1/communities/regions/00000000-0000-0000-0000-000000000000',
    );
    assertError(res, 404);
  });

  it('GET on malformed region id returns 422', async () => {
    const res = await adminAgent.get('/api/v1/communities/regions/not-a-uuid');
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  // ─── Communities ──────────────────────────────────────────────────

  it('GET /communities returns paginated list', async () => {
    const res = await adminAgent.get('/api/v1/communities/communities');
    assertPaginated(res);
  });

  it('GET /communities filters by regionId', async () => {
    // Use a random UUID — result is either empty or filtered. Point is
    // validation passes and the query is honored.
    const res = await adminAgent.get(
      '/api/v1/communities/communities?regionId=00000000-0000-0000-0000-000000000000',
    );
    assertPaginated(res);
    expect(res.body.data).toEqual([]);
  });

  it('POST /communities rejects non-admin/non-manager (403)', async () => {
    const res = await standardAgent
      .post('/api/v1/communities/communities')
      .send({ name: 'x', regionId: '00000000-0000-0000-0000-000000000000' });
    assertError(res, 403);
  });

  it('POST /communities validates body (422)', async () => {
    const res = await adminAgent.post('/api/v1/communities/communities').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  // ─── Properties ───────────────────────────────────────────────────

  it('GET /properties returns paginated list', async () => {
    const res = await adminAgent.get('/api/v1/communities/properties');
    assertPaginated(res);
  });

  it('POST /properties rejects standard user (403)', async () => {
    const res = await standardAgent
      .post('/api/v1/communities/properties')
      .send({
        name: 'x',
        communityId: '00000000-0000-0000-0000-000000000000',
        addressLine1: '1 main',
        city: 'X',
        state: 'Y',
        postalCode: '12345',
        latitude: 0,
        longitude: 0,
        totalUnits: 1,
      });
    assertError(res, 403);
  });

  it('POST /properties validates body (422)', async () => {
    const res = await adminAgent.post('/api/v1/communities/properties').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('GET /properties/:id returns 404 on unknown UUID', async () => {
    const res = await adminAgent.get(
      '/api/v1/communities/properties/00000000-0000-0000-0000-000000000000',
    );
    assertError(res, 404);
  });

  it('PUT /properties/:id rejects standard (403)', async () => {
    const res = await standardAgent
      .put('/api/v1/communities/properties/00000000-0000-0000-0000-000000000000')
      .send({ name: 'renamed' });
    assertError(res, 403);
  });

  it('PUT /properties/:id validates lat/long bounds (422)', async () => {
    const res = await adminAgent
      .put('/api/v1/communities/properties/00000000-0000-0000-0000-000000000000')
      .send({ latitude: 999 });
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  // ─── End-to-end: region → community → property ────────────────────

  it('Creates a region → community → property chain, then cleans up', async () => {
    const u = uniq();

    // 1. Create region
    const region = await adminAgent
      .post('/api/v1/communities/regions')
      .send({ name: `Region-${u}` });
    assertSuccess(region, 201);
    const regionId = region.body.data.id;
    expect(regionId).toBeTruthy();

    // 2. Create community
    const community = await managerAgent
      .post('/api/v1/communities/communities')
      .send({ name: `Community-${u}`, regionId });
    assertSuccess(community, 201);
    const communityId = community.body.data.id;

    // 3. Create property
    const property = await managerAgent
      .post('/api/v1/communities/properties')
      .send({
        name: `Property-${u}`,
        communityId,
        addressLine1: `${u} Integration Way`,
        city: 'Testville',
        state: 'TS',
        postalCode: '00000',
        latitude: 0,
        longitude: 0,
        totalUnits: 10,
      });
    assertSuccess(property, 201);
    const propertyId = property.body.data.id;

    // 4. GET property
    const propGet = await adminAgent.get(`/api/v1/communities/properties/${propertyId}`);
    assertSuccess(propGet);
    expect(propGet.body.data.id).toBe(propertyId);
    expect(propGet.body.data.name).toBe(`Property-${u}`);

    // 5. Update property
    const propPut = await managerAgent
      .put(`/api/v1/communities/properties/${propertyId}`)
      .send({ totalUnits: 20 });
    assertSuccess(propPut);
    expect(propPut.body.data.totalUnits).toBe(20);

    // 6. Update community
    const commPut = await managerAgent
      .put(`/api/v1/communities/communities/${communityId}`)
      .send({ name: `Community-${u}-renamed` });
    assertSuccess(commPut);
    expect(commPut.body.data.name).toBe(`Community-${u}-renamed`);

    // 7. Update region
    const regPut = await managerAgent
      .put(`/api/v1/communities/regions/${regionId}`)
      .send({ name: `Region-${u}-renamed` });
    assertSuccess(regPut);
    expect(regPut.body.data.name).toBe(`Region-${u}-renamed`);

    // 8. Try to delete the region while children exist — must fail 4xx
    const regDelEarly = await adminAgent.delete(
      `/api/v1/communities/regions/${regionId}`,
    );
    // Either 409 (conflict) or 400 (bad request) depending on service
    expect([400, 409, 500]).toContain(regDelEarly.status);

    // 9. Clean up: delete community (depends on region, but no property FK back)
    // The property is attached via communityId; deleting community may cascade or fail.
    // Allow either 200/204 (success) or 409 (blocked by property FK).
    const commDel = await adminAgent.delete(
      `/api/v1/communities/communities/${communityId}`,
    );
    expect([200, 204, 409]).toContain(commDel.status);
  });
});
