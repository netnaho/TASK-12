/**
 * Integration test setup — TRUE NO-MOCK API tests.
 *
 * This file must NEVER contain vi.mock() calls against DB, services, or
 * controllers. It boots the real Express app, talks to the real Prisma
 * client, and hits a real MySQL test database (provisioned by
 * docker-compose.test.yml).
 *
 * The companion file `tests/api/helpers/setup.ts` is the mocked-HTTP suite.
 * Keep them strictly separate — cross-contamination would break the
 * "no-mock" guarantee that the audit reports rely on.
 */
import request from 'supertest';
import type { Application } from 'express';
import type { Response } from 'supertest';
import { expect } from 'vitest';

// These env vars are required BEFORE importing src/* so that env.ts validation
// succeeds. They are set by docker-compose.test.yml for containerized runs;
// this block makes local direct invocation possible as a last resort.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || 'integration-test-session-secret-at-least-32-chars';
process.env.AES_ENCRYPTION_KEY =
  process.env.AES_ENCRYPTION_KEY || 'a'.repeat(64);
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '10000';
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '10000';

// NO vi.mock calls. Real imports only.
import { createApp } from '../../../src/app';
import { prisma } from '../../../src/config/database';

let _app: Application | null = null;

export function getApp(): Application {
  if (!_app) _app = createApp();
  return _app;
}

export function createAgent() {
  return request(getApp());
}

export { prisma };

/**
 * Log in via the real auth pipeline and return a supertest.Agent with the
 * session cookie already attached. All seeded users share the password
 * "Password123!".
 */
export async function loginAs(
  username: 'admin' | 'manager' | 'proctor' | 'analyst' | 'agent',
): Promise<request.Agent> {
  const agent = request.agent(getApp());
  const res = await agent
    .post('/api/v1/auth/login')
    .send({ username, password: 'Password123!' });
  if (res.status !== 200) {
    throw new Error(
      `login failed for ${username}: status=${res.status} body=${JSON.stringify(res.body)}`,
    );
  }
  return agent;
}

// ---------------------------------------------------------------------------
// Assertion helpers — same contract as tests/api/helpers/setup.ts so tests
// can be read side-by-side.
// ---------------------------------------------------------------------------

export function assertSuccess(res: Response, statusCode = 200) {
  expect(res.status).toBe(statusCode);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('data');
}

export function assertError(res: Response, statusCode: number, code?: string) {
  expect(res.status).toBe(statusCode);
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('error');
  if (code) {
    expect(res.body.error.code).toBe(code);
  }
}

export function assertPaginated(res: Response, statusCode = 200) {
  expect(res.status).toBe(statusCode);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('data');
  expect(res.body).toHaveProperty('meta');
  expect(res.body.meta).toHaveProperty('page');
  expect(res.body.meta).toHaveProperty('pageSize');
  expect(res.body.meta).toHaveProperty('total');
}

/**
 * Skip a suite when NOT running in the integration container.
 * Used as a top-of-file guard so CI can detect the flag and other local
 * invocations silently no-op.
 */
export const shouldRunIntegration = process.env.INTEGRATION_NO_MOCK === '1';
