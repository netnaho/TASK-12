import { describe, it, expect, beforeAll } from 'vitest';
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
let standard: Awaited<ReturnType<typeof loginAs>>;

function uniq() { return `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`; }

d('Notifications module (no-mock — extended)', () => {
  beforeAll(async () => {
    admin = await loginAs('admin');
    standard = await loginAs('agent');
  });

  // ─── User inbox ──────────────────────────────────────────────────

  it('GET /notifications requires auth', async () => {
    const res = await createAgent().get('/api/v1/notifications');
    assertError(res, 401);
  });

  it('GET /notifications returns paginated list', async () => {
    const res = await standard.get('/api/v1/notifications');
    assertPaginated(res);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('pageSize');
  });

  it('GET /notifications filters by status', async () => {
    const res = await standard.get('/api/v1/notifications?status=UNREAD');
    assertPaginated(res);
  });

  it('GET /notifications/unread-count returns a numeric count', async () => {
    const res = await standard.get('/api/v1/notifications/unread-count');
    assertSuccess(res);
    expect(res.body.data).toHaveProperty('count');
    expect(typeof res.body.data.count).toBe('number');
    expect(res.body.data.count).toBeGreaterThanOrEqual(0);
  });

  it('PATCH /notifications/read-all is idempotent and returns success', async () => {
    const res = await standard.patch('/api/v1/notifications/read-all');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PATCH /notifications/:id/read returns 404 for unknown id', async () => {
    const res = await standard.patch('/api/v1/notifications/missing-zzz/read');
    assertError(res, 404);
  });

  it('PATCH /notifications/:id/snooze requires snoozedUntil or until (422)', async () => {
    const res = await standard
      .patch('/api/v1/notifications/missing-zzz/snooze')
      .send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('PATCH /notifications/:id/snooze accepts "until" compat field', async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    // Unknown id → service should surface NotFound after validation passes
    const res = await standard
      .patch('/api/v1/notifications/missing-zzz/snooze')
      .send({ until: future });
    assertError(res, 404);
  });

  it('PATCH /notifications/:id/dismiss returns 404 for unknown id', async () => {
    const res = await standard.patch('/api/v1/notifications/missing-zzz/dismiss');
    assertError(res, 404);
  });

  // ─── Templates (ADMIN ONLY) ──────────────────────────────────────

  it('GET /notifications/templates rejects non-admin (403)', async () => {
    const res = await standard.get('/api/v1/notifications/templates');
    assertError(res, 403);
  });

  it('GET /notifications/templates returns paginated for admin', async () => {
    const res = await admin.get('/api/v1/notifications/templates');
    assertPaginated(res);
  });

  it('POST /notifications/templates validates body (422)', async () => {
    const res = await admin.post('/api/v1/notifications/templates').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /notifications/templates rejects non-admin (403)', async () => {
    const res = await standard
      .post('/api/v1/notifications/templates')
      .send({
        slug: 'x',
        name: 'x',
        subjectTpl: 'y',
        bodyTpl: 'z',
        channel: 'EMAIL',
      });
    assertError(res, 403);
  });

  it('Template CRUD + PATCH compat + preview round-trip', async () => {
    const u = uniq();
    const create = await admin
      .post('/api/v1/notifications/templates')
      .send({
        slug: `tmpl-${u}`,
        name: `Template ${u}`,
        subjectTpl: 'Hello {{name}}',
        bodyTpl: 'Body for {{name}}',
        channel: 'EMAIL',
      });
    assertSuccess(create, 201);
    const id = create.body.data.id;
    expect(id).toBeTruthy();
    expect(create.body.data.slug).toBe(`tmpl-${u}`);

    const get = await admin.get(`/api/v1/notifications/templates/${id}`);
    assertSuccess(get);
    expect(get.body.data.id).toBe(id);

    const put = await admin
      .put(`/api/v1/notifications/templates/${id}`)
      .send({ name: `Template ${u} (renamed)` });
    assertSuccess(put);
    expect(put.body.data.name).toBe(`Template ${u} (renamed)`);

    const patch = await admin
      .patch(`/api/v1/notifications/templates/${id}`)
      .send({ subjectTpl: 'New subject {{name}}' });
    assertSuccess(patch);
    expect(patch.body.data.subjectTpl).toBe('New subject {{name}}');

    // Preview
    const preview = await admin
      .post('/api/v1/notifications/templates/preview')
      .send({ templateId: id, variables: { name: 'World' } });
    assertSuccess(preview);
    expect(preview.body.data).toBeTruthy();
    const body = preview.body.data.body ?? preview.body.data.bodyRendered ?? '';
    // Interpolation must have happened (variable substituted somewhere)
    const combined = JSON.stringify(preview.body.data);
    expect(combined).toContain('World');

    const del = await admin.delete(`/api/v1/notifications/templates/${id}`);
    expect([200, 204]).toContain(del.status);

    const gone = await admin.get(`/api/v1/notifications/templates/${id}`);
    assertError(gone, 404);
  });

  it('POST /notifications/templates/preview validates body (422)', async () => {
    const res = await admin.post('/api/v1/notifications/templates/preview').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });
});
