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
let agentAgent: Awaited<ReturnType<typeof loginAs>>;

function uniq() { return `${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`; }

d('Users module (no-mock — extended)', () => {
  beforeAll(async () => {
    adminAgent = await loginAs('admin');
    agentAgent = await loginAs('agent');
  });

  it('GET /users requires auth (401)', async () => {
    const res = await createAgent().get('/api/v1/users');
    assertError(res, 401);
  });

  it('GET /users requires SYSTEM_ADMIN (403 for standard)', async () => {
    const res = await agentAgent.get('/api/v1/users');
    assertError(res, 403);
  });

  it('GET /users returns paginated list for admin', async () => {
    const res = await adminAgent.get('/api/v1/users');
    assertPaginated(res);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Every returned user must carry roles
    for (const u of res.body.data) {
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('username');
      expect(u).toHaveProperty('roles');
    }
  });

  it('GET /users?search=admin filters result set', async () => {
    const res = await adminAgent.get('/api/v1/users?search=admin');
    assertPaginated(res);
    // at least the seeded admin user should match
    expect(res.body.data.some((u: any) => u.username === 'admin')).toBe(true);
  });

  it('POST /users validates body (422)', async () => {
    const res = await adminAgent.post('/api/v1/users').send({});
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /users enforces strong password (422)', async () => {
    const u = uniq();
    const res = await adminAgent.post('/api/v1/users').send({
      username: `u-${u}`,
      email: `u-${u}@test.com`,
      password: 'weak',
      displayName: `User ${u}`,
      roleName: 'STANDARD_USER',
    });
    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('POST /users rejects non-admin (403)', async () => {
    const u = uniq();
    const res = await agentAgent.post('/api/v1/users').send({
      username: `u-${u}`,
      email: `u-${u}@test.com`,
      password: 'StrongPass1!',
      displayName: `User ${u}`,
      roleName: 'STANDARD_USER',
    });
    assertError(res, 403);
  });

  it('User admin lifecycle: create → get → update → assign role → remove role → deactivate', async () => {
    const u = uniq();
    const created = await adminAgent.post('/api/v1/users').send({
      username: `nomock-${u}`,
      email: `nomock-${u}@test.com`,
      password: 'StrongPass1!',
      displayName: `User ${u}`,
      roleName: 'STANDARD_USER',
    });
    assertSuccess(created, 201);
    const id = created.body.data.id;
    expect(id).toBeTruthy();
    expect(created.body.data.username).toBe(`nomock-${u}`);

    const get = await adminAgent.get(`/api/v1/users/${id}`);
    assertSuccess(get);
    expect(get.body.data.id).toBe(id);
    expect(get.body.data.isActive).toBe(true);

    const update = await adminAgent
      .put(`/api/v1/users/${id}`)
      .send({ displayName: `User ${u} (renamed)` });
    assertSuccess(update);
    expect(update.body.data.displayName).toBe(`User ${u} (renamed)`);

    const assign = await adminAgent
      .post(`/api/v1/users/${id}/roles`)
      .send({ roleName: 'ANALYST' });
    assertSuccess(assign);
    const roleNames = (assign.body.data.roles ?? []).map((r: any) => r.name ?? r);
    expect(roleNames).toContain('ANALYST');

    const remove = await adminAgent.delete(`/api/v1/users/${id}/roles/ANALYST`);
    assertSuccess(remove);
    const remainingRoles = (remove.body.data.roles ?? []).map((r: any) => r.name ?? r);
    expect(remainingRoles).not.toContain('ANALYST');

    const deactivate = await adminAgent.patch(`/api/v1/users/${id}/deactivate`);
    assertSuccess(deactivate);
    expect(deactivate.body.data.isActive).toBe(false);
  });

  it('GET /users/:id returns 404 for unknown id', async () => {
    const res = await adminAgent.get('/api/v1/users/nonexistent-id-zzz');
    assertError(res, 404);
  });

  it('PUT /users/:id rejects non-admin (403)', async () => {
    const res = await agentAgent
      .put('/api/v1/users/any-id')
      .send({ displayName: 'nope' });
    assertError(res, 403);
  });

  it('POST /users/:id/roles rejects non-admin (403)', async () => {
    const res = await agentAgent
      .post('/api/v1/users/any-id/roles')
      .send({ roleName: 'ANALYST' });
    assertError(res, 403);
  });

  it('DELETE /users/:id/roles/:roleName rejects non-admin (403)', async () => {
    const res = await agentAgent.delete('/api/v1/users/any-id/roles/ANALYST');
    assertError(res, 403);
  });

  it('PATCH /users/:id/deactivate rejects non-admin (403)', async () => {
    const res = await agentAgent.patch('/api/v1/users/any-id/deactivate');
    assertError(res, 403);
  });

  it('GET /users/me/preferences returns preferences object', async () => {
    const res = await agentAgent.get('/api/v1/users/me/preferences');
    assertSuccess(res);
    expect(res.body.data).toBeTruthy();
    // Any persisted preference key should come back
    expect(res.body.data).toBeInstanceOf(Object);
  });

  it('PUT /users/me/preferences persists and is read back', async () => {
    const put = await agentAgent
      .put('/api/v1/users/me/preferences')
      .send({ deliveryMode: 'ALSO_PACKAGE' });
    assertSuccess(put);
    expect(put.body.data.deliveryMode).toBe('ALSO_PACKAGE');

    const get = await agentAgent.get('/api/v1/users/me/preferences');
    assertSuccess(get);
    expect(get.body.data.deliveryMode).toBe('ALSO_PACKAGE');
  });
});
