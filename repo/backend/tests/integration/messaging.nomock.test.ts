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

d('Messaging module (no-mock — extended)', () => {
  beforeAll(async () => {
    admin = await loginAs('admin');
    standard = await loginAs('agent');
  });

  it('GET /messaging requires auth', async () => {
    const res = await createAgent().get('/api/v1/messaging');
    assertError(res, 401);
  });

  it('GET /messaging returns paginated list', async () => {
    const res = await standard.get('/api/v1/messaging');
    assertPaginated(res);
  });

  it('GET /messaging/messages (compat) returns paginated list', async () => {
    const res = await standard.get('/api/v1/messaging/messages');
    assertPaginated(res);
  });

  it('POST /messaging/enqueue validates body (422)', async () => {
    const res = await standard.post('/api/v1/messaging/enqueue').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /messaging/messages (compat) validates body (422)', async () => {
    const res = await standard.post('/api/v1/messaging/messages').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /messaging/enqueue round-trips and GET /:id returns status', async () => {
    const u = uniq();
    const enqueue = await standard
      .post('/api/v1/messaging/enqueue')
      .send({
        recipientAddr: `integration-${u}@example.com`,
        channel: 'EMAIL',
        subject: 'test',
      });
    // Either 201 created (newly queued) or 200 with status (delivered/queued)
    expect([200, 201]).toContain(enqueue.status);
    expect(enqueue.body.success).toBe(true);
    const msgId = enqueue.body.data?.id ?? enqueue.body.data?.messageId;
    expect(msgId).toBeTruthy();

    // GET /:id
    const status = await standard.get(`/api/v1/messaging/${msgId}`);
    assertSuccess(status);
    expect(status.body.data.id ?? status.body.data.messageId).toBe(msgId);

    // GET /messages/:id (compat)
    const statusCompat = await standard.get(`/api/v1/messaging/messages/${msgId}`);
    assertSuccess(statusCompat);

    // GET /:id/package
    const pkg = await standard.get(`/api/v1/messaging/${msgId}/package`);
    expect([200, 404]).toContain(pkg.status);
    expect(pkg.body).toHaveProperty('success');

    // PATCH /:id/delivery
    const patch = await standard
      .patch(`/api/v1/messaging/${msgId}/delivery`)
      .send({ status: 'MANUALLY_SENT' });
    expect([200, 404, 409]).toContain(patch.status);

    // PATCH /messages/:id/delivery compat - validation
    const patchCompatInvalid = await standard
      .patch(`/api/v1/messaging/messages/${msgId}/delivery`)
      .send({ status: 'BOGUS' });
    assertError(patchCompatInvalid, 422, 'VALIDATION_ERROR');
  });

  it('GET /messaging/failures is admin-only (403 for standard)', async () => {
    const res = await standard.get('/api/v1/messaging/failures');
    assertError(res, 403);
  });

  it('GET /messaging/failures returns success for admin', async () => {
    const res = await admin.get('/api/v1/messaging/failures');
    assertSuccess(res);
    expect(res.body.data).toBeDefined();
  });

  // ─── Quiet Hours ──────────────────────────────────────────────────

  it('GET /messaging/quiet-hours returns config for any authed user', async () => {
    const res = await standard.get('/api/v1/messaging/quiet-hours');
    assertSuccess(res);
    expect(res.body.data).toHaveProperty('timezone');
  });

  it('PUT /messaging/quiet-hours rejects non-admin (403)', async () => {
    const res = await standard
      .put('/api/v1/messaging/quiet-hours')
      .send({ timezone: 'UTC', quietStartHr: 22, quietEndHr: 6 });
    assertError(res, 403);
  });

  it('PUT /messaging/quiet-hours validates body (422)', async () => {
    const res = await admin.put('/api/v1/messaging/quiet-hours').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('PUT /messaging/quiet-hours persists and GET reads back', async () => {
    const put = await admin
      .put('/api/v1/messaging/quiet-hours')
      .send({ timezone: 'UTC', quietStartHr: 22, quietEndHr: 7 });
    assertSuccess(put);
    expect(put.body.data.quietStartHr).toBe(22);
    expect(put.body.data.quietEndHr).toBe(7);

    const get = await admin.get('/api/v1/messaging/quiet-hours');
    assertSuccess(get);
    expect(get.body.data.quietStartHr).toBe(22);
    expect(get.body.data.quietEndHr).toBe(7);
  });

  // ─── Blacklist CRUD ───────────────────────────────────────────────

  it('POST /messaging/blacklist validates body (422)', async () => {
    const res = await admin.post('/api/v1/messaging/blacklist').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /messaging/blacklist rejects non-admin (403)', async () => {
    const res = await standard
      .post('/api/v1/messaging/blacklist')
      .send({ address: 'spam@test.com', channel: 'EMAIL' });
    assertError(res, 403);
  });

  it('GET /messaging/blacklist rejects non-admin (403)', async () => {
    const res = await standard.get('/api/v1/messaging/blacklist');
    assertError(res, 403);
  });

  it('Blacklist CRUD round-trip (admin): add → list → delete', async () => {
    const u = uniq();
    const address = `blacklist-${u}@example.com`;
    const add = await admin
      .post('/api/v1/messaging/blacklist')
      .send({ address, channel: 'EMAIL', reason: 'integration test' });
    assertSuccess(add, 201);
    const id = add.body.data.id;
    expect(id).toBeTruthy();
    expect(add.body.data.address).toBe(address);

    const list = await admin.get('/api/v1/messaging/blacklist');
    assertPaginated(list);
    const found = list.body.data.find((e: any) => e.id === id);
    expect(found).toBeTruthy();

    const del = await admin.delete(`/api/v1/messaging/blacklist/${id}`);
    expect([200, 204]).toContain(del.status);
  });

  it('DELETE /messaging/blacklist/:id rejects non-admin (403)', async () => {
    const res = await standard.delete(
      '/api/v1/messaging/blacklist/00000000-0000-0000-0000-000000000000',
    );
    assertError(res, 403);
  });
});
