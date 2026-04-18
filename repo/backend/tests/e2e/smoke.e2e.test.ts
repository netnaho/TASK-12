/**
 * FE↔BE E2E smoke — runs inside Docker (see docker-compose.test.yml → e2e-test)
 * against the *live* stack (prod compose profile). No mocks, no supertest —
 * this talks HTTP over the real Docker network to the real nginx + Express
 * containers.
 *
 *   frontend (nginx :80)  ─/api/─▶  backend (express :3000)  ─▶  MySQL (:3306)
 *
 * Verifies:
 *   1. Frontend is reachable (returns the SPA shell HTML).
 *   2. nginx correctly proxies /api/ to the backend.
 *   3. Full login round-trip works with seeded credentials.
 *   4. At least one protected endpoint returns authenticated data.
 *   5. Logout destroys the session.
 *
 * The test is a no-op outside the e2e container (it depends on the
 * BACKEND_URL / FRONTEND_URL env vars that docker-compose.test.yml supplies).
 */
import { describe, it, expect } from 'vitest';

const BACKEND = process.env.BACKEND_URL ?? 'http://backend:3000';
const FRONTEND = process.env.FRONTEND_URL ?? 'http://frontend:80';
const USERNAME = process.env.E2E_USERNAME ?? 'admin';
const PASSWORD = process.env.E2E_PASSWORD ?? 'Password123!';

const enabled = Boolean(process.env.BACKEND_URL && process.env.FRONTEND_URL);
const d = enabled ? describe : describe.skip;

function extractCookie(setCookie: string | string[] | undefined): string | undefined {
  if (!setCookie) return undefined;
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  // pull leaseops.sid cookie
  for (const c of arr) {
    const m = c.match(/leaseops\.sid=[^;]+/);
    if (m) return m[0];
  }
  return undefined;
}

d('E2E: FE↔BE smoke flow', () => {
  it('frontend nginx serves the SPA shell HTML on /', async () => {
    const res = await fetch(`${FRONTEND}/`);
    expect(res.status).toBe(200);
    const body = await res.text();
    // The Vite-built index.html references the app entry
    expect(body).toMatch(/<!doctype html>|<!DOCTYPE html>/i);
    expect(body).toMatch(/<div id="app"/i);
  });

  it('nginx proxies /api/health through to the backend', async () => {
    const res = await fetch(`${FRONTEND}/api/health`);
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('data');
  });

  it('backend /api/health reports healthy when DB is up', async () => {
    const res = await fetch(`${BACKEND}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('healthy');
  });

  it('login → GET /me (protected) → logout round trip', async () => {
    // 1. login
    const loginRes = await fetch(`${BACKEND}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);
    expect(loginBody.data.username).toBe(USERNAME);

    const cookie = extractCookie(loginRes.headers.get('set-cookie') ?? undefined);
    expect(cookie).toBeTruthy();

    // 2. call a protected endpoint with the session cookie
    const meRes = await fetch(`${BACKEND}/api/v1/auth/me`, {
      headers: { cookie: cookie! },
    });
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.success).toBe(true);
    expect(meBody.data.username).toBe(USERNAME);

    // 3. exercise a real protected workflow: list listings
    const listingsRes = await fetch(`${BACKEND}/api/v1/listings`, {
      headers: { cookie: cookie! },
    });
    expect(listingsRes.status).toBe(200);
    const listingsBody = await listingsRes.json();
    expect(listingsBody.success).toBe(true);
    expect(Array.isArray(listingsBody.data)).toBe(true);
    expect(listingsBody).toHaveProperty('meta');

    // 4. logout must destroy the session
    const logoutRes = await fetch(`${BACKEND}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { cookie: cookie! },
    });
    expect(logoutRes.status).toBe(200);

    // 5. subsequent /me should be 401
    const meAfter = await fetch(`${BACKEND}/api/v1/auth/me`, {
      headers: { cookie: cookie! },
    });
    expect(meAfter.status).toBe(401);
  });

  it('invalid credentials return 401', async () => {
    const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: 'WRONG' }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
