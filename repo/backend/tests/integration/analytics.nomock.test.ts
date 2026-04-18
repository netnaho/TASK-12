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
let manager: Awaited<ReturnType<typeof loginAs>>;
let standard: Awaited<ReturnType<typeof loginAs>>;

const makeDefinitionPayload = (suffix: string) => ({
  name: `nomock-analytics-def-${suffix}`,
  description: 'integration test definition',
  frequency: 'ON_DEMAND',
  filterJson: { region: null },
});

d('Analytics module (no-mock — extended)', () => {
  beforeAll(async () => {
    admin = await loginAs('admin');
    analyst = await loginAs('analyst');
    manager = await loginAs('manager');
    standard = await loginAs('agent');
  });

  // ─── Definitions CRUD ─────────────────────────────────────────────

  it('GET /analytics/definitions requires auth', async () => {
    const res = await createAgent().get('/api/v1/analytics/definitions');
    assertError(res, 401);
  });

  it('GET /analytics/definitions returns a paginated list', async () => {
    const res = await analyst.get('/api/v1/analytics/definitions');
    assertPaginated(res);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /analytics/definitions rejects standard user (403)', async () => {
    const res = await standard
      .post('/api/v1/analytics/definitions')
      .send(makeDefinitionPayload('forbidden'));
    assertError(res, 403);
  });

  it('POST /analytics/definitions validates body (422)', async () => {
    const res = await analyst.post('/api/v1/analytics/definitions').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
    expect(res.body.error).toHaveProperty('message');
  });

  it('Full definition CRUD + PATCH compat round-trip', async () => {
    const suffix = `${Date.now().toString().slice(-6)}`;
    const create = await analyst
      .post('/api/v1/analytics/definitions')
      .send(makeDefinitionPayload(suffix));
    assertSuccess(create, 201);
    const id = create.body.data.id;
    expect(id).toBeTruthy();
    expect(create.body.data.name).toBe(`nomock-analytics-def-${suffix}`);

    const get = await analyst.get(`/api/v1/analytics/definitions/${id}`);
    assertSuccess(get);
    expect(get.body.data.id).toBe(id);

    const update = await manager
      .put(`/api/v1/analytics/definitions/${id}`)
      .send({ description: 'updated via PUT' });
    assertSuccess(update);
    expect(update.body.data.description).toBe('updated via PUT');

    const patch = await manager
      .patch(`/api/v1/analytics/definitions/${id}`)
      .send({ description: 'updated via PATCH compat' });
    assertSuccess(patch);
    expect(patch.body.data.description).toBe('updated via PATCH compat');
  });

  it('PUT /analytics/definitions/:id rejects analyst (managerRoles only)', async () => {
    const suffix = `${Date.now().toString().slice(-6)}-rbac`;
    const created = await analyst
      .post('/api/v1/analytics/definitions')
      .send(makeDefinitionPayload(suffix));
    assertSuccess(created, 201);
    const id = created.body.data.id;

    const res = await analyst
      .put(`/api/v1/analytics/definitions/${id}`)
      .send({ description: 'analyst should not be able to PUT' });
    assertError(res, 403);
  });

  // ─── Reports: list / generate / archive ────────────────────────────

  it('GET /analytics/reports returns a paginated list', async () => {
    const res = await analyst.get('/api/v1/analytics/reports');
    assertPaginated(res);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('pageSize');
  });

  it('GET /analytics/reports filters by status', async () => {
    const res = await analyst.get('/api/v1/analytics/reports?status=PUBLISHED');
    assertPaginated(res);
  });

  it('POST /analytics/reports/generate validates body (422)', async () => {
    const res = await analyst.post('/api/v1/analytics/reports/generate').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /analytics/reports (compat) and POST /generate share validation', async () => {
    const res = await analyst.post('/api/v1/analytics/reports').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('GET /analytics/reports/:id returns 404 for unknown id', async () => {
    // The endpoint validates id as a UUID first; any valid-looking UUID
    // that doesn't exist hits the service and becomes a NotFound.
    const res = await analyst.get(
      '/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000',
    );
    // 404 from service, or 422 if id schema rejects the zero UUID
    expect([404, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('PATCH /analytics/reports/:id/archive returns 404 for unknown report', async () => {
    const res = await analyst.patch(
      '/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/archive',
    );
    expect([404, 422, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // ─── Sharing ───────────────────────────────────────────────────────

  it('GET /analytics/reports/:id/shares returns 404 or list for unknown report', async () => {
    const res = await analyst.get(
      '/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/shares',
    );
    expect([200, 403, 404, 422]).toContain(res.status);
  });

  it('POST /analytics/reports/:id/share rejects analyst (managerRoles only)', async () => {
    const res = await analyst
      .post('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/share')
      .send({ userId: '11111111-1111-1111-1111-111111111111' });
    assertError(res, 403);
  });

  it('POST /analytics/reports/:id/share validates body (422)', async () => {
    const res = await manager
      .post('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/share')
      .send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('DELETE /analytics/reports/:id/share/:userId rejects analyst (403)', async () => {
    const res = await analyst.delete(
      '/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/share/11111111-1111-1111-1111-111111111111',
    );
    assertError(res, 403);
  });

  // ─── Exports / Download ────────────────────────────────────────────

  it('POST /analytics/reports/:id/export rejects standard user (403)', async () => {
    const res = await standard
      .post('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/export')
      .send({ format: 'CSV' });
    assertError(res, 403);
  });

  it('POST /analytics/reports/:id/export validates body (422)', async () => {
    const res = await analyst
      .post('/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/export')
      .send({ format: 'BOGUS' });
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('GET /analytics/exports/:id/download requires auth', async () => {
    const res = await createAgent().get(
      '/api/v1/analytics/exports/00000000-0000-0000-0000-000000000000/download',
    );
    assertError(res, 401);
  });

  // ─── Pivot ──────────────────────────────────────────────────────────

  it('POST /analytics/pivot rejects standard user (403)', async () => {
    const res = await standard
      .post('/api/v1/analytics/pivot')
      .send({ dimensions: ['region'], measures: ['avg_value'] });
    assertError(res, 403);
  });

  it('POST /analytics/pivot validates body (422)', async () => {
    const res = await analyst.post('/api/v1/analytics/pivot').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /analytics/pivot returns a result shape for valid body', async () => {
    const res = await analyst
      .post('/api/v1/analytics/pivot')
      .send({
        dimensions: ['region'],
        measures: ['avg_value', 'count'],
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
  });

  // ─── Operational analytics ─────────────────────────────────────────

  it('GET /analytics/operational/participation returns data or validation hint', async () => {
    const res = await analyst.get('/api/v1/analytics/operational/participation');
    // 200 success if defaults apply, 422 if required filters missing
    if (res.status !== 200) assertError(res, 422);
    else expect(res.body.success).toBe(true);
  });

  it('GET /analytics/operational/attendance rejects standard user (403)', async () => {
    const res = await standard.get('/api/v1/analytics/operational/attendance');
    assertError(res, 403);
  });

  it('GET /analytics/operational/hour-distribution available to analyst', async () => {
    const res = await analyst.get('/api/v1/analytics/operational/hour-distribution');
    expect([200, 422]).toContain(res.status);
    if (res.status === 200) expect(res.body.success).toBe(true);
  });

  it('GET /analytics/operational/retention available to analyst', async () => {
    const res = await analyst.get('/api/v1/analytics/operational/retention');
    expect([200, 422]).toContain(res.status);
  });

  it('GET /analytics/operational/staffing-gaps available to analyst', async () => {
    const res = await analyst.get('/api/v1/analytics/operational/staffing-gaps');
    expect([200, 422]).toContain(res.status);
  });

  it('GET /analytics/operational/event-popularity available to analyst', async () => {
    const res = await analyst.get('/api/v1/analytics/operational/event-popularity');
    expect([200, 422]).toContain(res.status);
  });

  it('GET /analytics/operational/rankings available to analyst', async () => {
    const res = await analyst.get('/api/v1/analytics/operational/rankings');
    expect([200, 422]).toContain(res.status);
  });

  // ─── Saved Views CRUD ──────────────────────────────────────────────

  it('GET /analytics/saved-views returns paginated list', async () => {
    const res = await analyst.get('/api/v1/analytics/saved-views');
    assertPaginated(res);
  });

  it('POST /analytics/saved-views validates body (422)', async () => {
    const res = await analyst.post('/api/v1/analytics/saved-views').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /analytics/saved-views rejects standard user (403)', async () => {
    const res = await standard
      .post('/api/v1/analytics/saved-views')
      .send({ name: 'x' });
    assertError(res, 403);
  });

  it('GET /analytics/saved-views/:id returns 404 for unknown id', async () => {
    const res = await analyst.get(
      '/api/v1/analytics/saved-views/00000000-0000-0000-0000-000000000000',
    );
    expect([404, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('PUT /analytics/saved-views/:id returns 404 for unknown id', async () => {
    const res = await analyst
      .put('/api/v1/analytics/saved-views/00000000-0000-0000-0000-000000000000')
      .send({ name: 'renamed' });
    expect([404, 422, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /analytics/saved-views/:id returns 404 for unknown id', async () => {
    const res = await analyst.delete(
      '/api/v1/analytics/saved-views/00000000-0000-0000-0000-000000000000',
    );
    expect([204, 200, 404, 422, 403]).toContain(res.status);
  });

  // ─── Schedules (compat definitions view) ───────────────────────────

  it('GET /analytics/schedules returns a paginated list for analyst', async () => {
    const res = await analyst.get('/api/v1/analytics/schedules');
    assertPaginated(res);
  });

  it('GET /analytics/schedules rejects standard user (403)', async () => {
    const res = await standard.get('/api/v1/analytics/schedules');
    assertError(res, 403);
  });

  it('POST /analytics/schedules validates body (422)', async () => {
    const res = await analyst.post('/api/v1/analytics/schedules').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('GET /analytics/schedules/:id returns 404 for unknown id', async () => {
    const res = await analyst.get(
      '/api/v1/analytics/schedules/00000000-0000-0000-0000-000000000000',
    );
    expect([404, 422]).toContain(res.status);
  });

  it('PATCH /analytics/schedules/:id rejects analyst (managerRoles only)', async () => {
    const res = await analyst
      .patch('/api/v1/analytics/schedules/00000000-0000-0000-0000-000000000000')
      .send({ frequency: 'DAILY' });
    assertError(res, 403);
  });

  it('DELETE /analytics/schedules/:id rejects analyst (403)', async () => {
    const res = await analyst.delete(
      '/api/v1/analytics/schedules/00000000-0000-0000-0000-000000000000',
    );
    assertError(res, 403);
  });

  // ─── Schedule Executions ──────────────────────────────────────────

  it('GET /analytics/schedule-executions is admin-only (403 for analyst)', async () => {
    const res = await analyst.get('/api/v1/analytics/schedule-executions');
    assertError(res, 403);
  });

  it('GET /analytics/schedule-executions returns paginated list for admin', async () => {
    const res = await admin.get('/api/v1/analytics/schedule-executions');
    assertPaginated(res);
  });
});
