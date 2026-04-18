/**
 * Drift-prevention suite: asserts that analytics & schedule-executions role
 * gating continues to match what README.md promises. If production code is
 * edited to (e.g.) widen /schedule-executions beyond SYSTEM_ADMIN, this
 * suite fails with a meaningful diff so the README can be updated in the
 * same PR.
 *
 * These tests rely on the mocked-HTTP helpers (they probe middleware
 * behavior; no service I/O is required).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loginAs,
  assertError,
} from './helpers/setup';

beforeEach(() => { vi.clearAllMocks(); });

// Each entry: [method, path, [rolesThatMustBeAccepted], [rolesThatMustBe403]]
type RoleCase = [
  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  string,
  Array<'SYSTEM_ADMIN' | 'LEASING_OPS_MANAGER' | 'ANALYST' | 'TEST_PROCTOR' | 'STANDARD_USER'>,
  Array<'SYSTEM_ADMIN' | 'LEASING_OPS_MANAGER' | 'ANALYST' | 'TEST_PROCTOR' | 'STANDARD_USER'>,
];

const CASES: RoleCase[] = [
  // Admin-only
  ['GET', '/api/v1/analytics/schedule-executions',
    ['SYSTEM_ADMIN'],
    ['LEASING_OPS_MANAGER', 'ANALYST', 'TEST_PROCTOR', 'STANDARD_USER']],

  // Manager roles
  ['PATCH', '/api/v1/analytics/schedules/00000000-0000-0000-0000-000000000000',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER'],
    ['ANALYST', 'TEST_PROCTOR', 'STANDARD_USER']],
  ['DELETE', '/api/v1/analytics/schedules/00000000-0000-0000-0000-000000000000',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER'],
    ['ANALYST', 'TEST_PROCTOR', 'STANDARD_USER']],
  ['POST', '/api/v1/analytics/reports/00000000-0000-0000-0000-000000000000/share',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER'],
    ['ANALYST', 'TEST_PROCTOR', 'STANDARD_USER']],
  ['PUT', '/api/v1/analytics/definitions/00000000-0000-0000-0000-000000000000',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER'],
    ['ANALYST', 'TEST_PROCTOR', 'STANDARD_USER']],

  // Analytics roles
  ['POST', '/api/v1/analytics/definitions',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER', 'ANALYST'],
    ['TEST_PROCTOR', 'STANDARD_USER']],
  ['POST', '/api/v1/analytics/pivot',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER', 'ANALYST'],
    ['TEST_PROCTOR', 'STANDARD_USER']],
  ['GET', '/api/v1/analytics/operational/attendance',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER', 'ANALYST'],
    ['TEST_PROCTOR', 'STANDARD_USER']],
  ['POST', '/api/v1/analytics/saved-views',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER', 'ANALYST'],
    ['TEST_PROCTOR', 'STANDARD_USER']],
  ['GET', '/api/v1/analytics/schedules',
    ['SYSTEM_ADMIN', 'LEASING_OPS_MANAGER', 'ANALYST'],
    ['TEST_PROCTOR', 'STANDARD_USER']],
];

describe('Analytics role docs drift lock', () => {
  for (const [method, path, allowed, denied] of CASES) {
    for (const role of denied) {
      it(`${method} ${path} returns 403 for ${role}`, async () => {
        const agent = await loginAs(role);
        // Send minimal body (may still hit validate → 422, but RBAC middleware
        // runs BEFORE validate, so 403 fires first for denied roles).
        const req = (agent as any)[method.toLowerCase()](path);
        const res = await (method === 'GET' || method === 'DELETE'
          ? req
          : req.send({}));
        assertError(res, 403);
      });
    }

    for (const role of allowed) {
      it(`${method} ${path} is NOT 403 for ${role}`, async () => {
        const agent = await loginAs(role);
        const req = (agent as any)[method.toLowerCase()](path);
        const res = await (method === 'GET' || method === 'DELETE'
          ? req
          : req.send({}));
        // Allowed roles must pass the role gate. The response may still be
        // 422 (invalid body), 404 (unknown id), 400, or 200 — ANY non-403.
        expect(res.status).not.toBe(403);
      });
    }
  }
});
