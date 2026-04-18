/**
 * TRUE NO-MOCK integration tests for the auth module.
 *
 *   real MySQL  →  real Prisma client  →  real services  →  real Express app
 *
 * These tests assume the seed has been run and that seeded users exist.
 * They are gated on INTEGRATION_NO_MOCK=1 so local vitest runs skip them.
 */
import { describe, it, expect } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  shouldRunIntegration,
} from './helpers/setup';

const d = shouldRunIntegration ? describe : describe.skip;

d('POST /api/v1/auth/login (no-mock)', () => {
  it('returns 200 + normalized user on valid credentials', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Password123!' });
    assertSuccess(res);
    expect(res.body.data).toMatchObject({ username: 'admin', isActive: true });
    expect(res.body.data.roles).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'SYSTEM_ADMIN' })]),
    );
    // session cookie must be returned by the real express-session middleware
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 + UNAUTHORIZED on wrong password', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'WRONG' });
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('returns 401 for an unknown username', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: 'ghost', password: 'Password123!' });
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('returns 422 when body is invalid', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: '' });
    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

d('GET /api/v1/auth/me (no-mock)', () => {
  it('returns current user for logged-in session', async () => {
    const agent = await loginAs('admin');
    const res = await agent.get('/api/v1/auth/me');
    assertSuccess(res);
    expect(res.body.data.username).toBe('admin');
  });

  it('returns 401 without a session', async () => {
    const res = await createAgent().get('/api/v1/auth/me');
    assertError(res, 401);
  });
});

d('POST /api/v1/auth/logout (no-mock)', () => {
  it('destroys the session and clears the cookie', async () => {
    const agent = await loginAs('analyst');
    const res = await agent.post('/api/v1/auth/logout');
    assertSuccess(res);
    const me = await agent.get('/api/v1/auth/me');
    assertError(me, 401);
  });
});

d('POST /api/v1/auth/touch (no-mock)', () => {
  it('returns 204 for an active session', async () => {
    const agent = await loginAs('manager');
    const res = await agent.post('/api/v1/auth/touch');
    expect(res.status).toBe(204);
  });

  it('returns 401 without a session', async () => {
    const res = await createAgent().post('/api/v1/auth/touch');
    assertError(res, 401);
  });
});
