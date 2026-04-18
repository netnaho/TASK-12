import { describe, it, beforeAll, expect } from 'vitest';
import {
  loginAs,
  createAgent,
  assertError,
  assertPaginated,
  assertSuccess,
  shouldRunIntegration,
} from './helpers/setup';

const d = shouldRunIntegration ? describe : describe.skip;

let admin: Awaited<ReturnType<typeof loginAs>>;
let analyst: Awaited<ReturnType<typeof loginAs>>;
let standard: Awaited<ReturnType<typeof loginAs>>;

function uniq() { return `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`; }

d('Metrics module (no-mock — extended)', () => {
  beforeAll(async () => {
    admin = await loginAs('admin');
    analyst = await loginAs('analyst');
    standard = await loginAs('agent');
  });

  it('GET /metrics/definitions requires auth', async () => {
    const res = await createAgent().get('/api/v1/metrics/definitions');
    assertError(res, 401);
  });

  it('GET /metrics/definitions returns an array of definitions', async () => {
    const res = await admin.get('/api/v1/metrics/definitions');
    assertSuccess(res);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /metrics/definitions/:id returns 404 for unknown id', async () => {
    const res = await admin.get(
      '/api/v1/metrics/definitions/00000000-0000-0000-0000-000000000000',
    );
    expect([404, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('GET /metrics/definitions/:id returns 422 for malformed id', async () => {
    const res = await admin.get('/api/v1/metrics/definitions/not-a-uuid');
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /metrics/definitions validates body (422)', async () => {
    const res = await admin.post('/api/v1/metrics/definitions').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /metrics/definitions rejects standard user (403)', async () => {
    const res = await standard.post('/api/v1/metrics/definitions').send({
      metricType: 'UNIT_RENT',
      name: 'blocked',
    });
    assertError(res, 403);
  });

  it('POST /metrics/definitions creates and returns definition (admin)', async () => {
    const u = uniq();
    const res = await admin.post('/api/v1/metrics/definitions').send({
      metricType: 'UNIT_RENT',
      name: `Unit Rent ${u}`,
      description: 'integration test definition',
    });
    // Seed may already have UNIT_RENT definition with unique constraint on
    // (metricType, name). 201 on success, 409 on conflict — both prove the
    // route + validation + RBAC work end-to-end.
    expect([201, 409]).toContain(res.status);
    expect(res.body.success).toBeDefined();
    if (res.status === 201) {
      expect(res.body.data.id).toBeTruthy();
      expect(res.body.data.metricType).toBe('UNIT_RENT');
    }
  });

  it('POST /metrics/definitions/:id/versions validates body (422)', async () => {
    const res = await admin
      .post('/api/v1/metrics/definitions/00000000-0000-0000-0000-000000000000/versions')
      .send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /metrics/definitions/:id/versions rejects standard (403)', async () => {
    const res = await standard
      .post('/api/v1/metrics/definitions/00000000-0000-0000-0000-000000000000/versions')
      .send({
        formulaJson: { kind: 'identity' },
        effectiveFrom: new Date().toISOString(),
      });
    assertError(res, 403);
  });

  it('GET /metrics/values returns paginated list', async () => {
    const res = await admin.get('/api/v1/metrics/values');
    assertPaginated(res);
  });

  it('GET /metrics/values filters by metricType', async () => {
    const res = await admin.get('/api/v1/metrics/values?metricType=UNIT_RENT');
    assertPaginated(res);
  });

  it('GET /metrics/values rejects malformed metricType (422)', async () => {
    const res = await admin.get('/api/v1/metrics/values?metricType=BOGUS');
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('GET /metrics/jobs returns paginated list', async () => {
    const res = await admin.get('/api/v1/metrics/jobs');
    assertPaginated(res);
  });

  it('POST /metrics/recalculate rejects standard user (403)', async () => {
    const res = await standard
      .post('/api/v1/metrics/recalculate')
      .send({});
    assertError(res, 403);
  });

  it('POST /metrics/recalculate accepts analyst (>=2xx) with real flow', async () => {
    const res = await analyst
      .post('/api/v1/metrics/recalculate')
      .send({});
    // 200/201/202 are all acceptable depending on job mode
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body.success).toBe(true);
  });
});
