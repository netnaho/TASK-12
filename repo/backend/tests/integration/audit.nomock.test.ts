import { describe, it, beforeAll } from 'vitest';
import {
  loginAs,
  assertError,
  assertPaginated,
  shouldRunIntegration,
} from './helpers/setup';

const d = shouldRunIntegration ? describe : describe.skip;

let admin: Awaited<ReturnType<typeof loginAs>>;
let standard: Awaited<ReturnType<typeof loginAs>>;

d('Audit module (no-mock)', () => {
  beforeAll(async () => {
    admin = await loginAs('admin');
    standard = await loginAs('agent');
  });

  it('GET /audit is admin-only (403 for standard)', async () => {
    const res = await standard.get('/api/v1/audit');
    assertError(res, 403);
  });

  it('GET /audit returns a paginated list for admin', async () => {
    const res = await admin.get('/api/v1/audit');
    assertPaginated(res);
  });

  it('GET /audit/:id returns 404 for unknown id', async () => {
    // Audit log IDs are BigInt, not UUIDs, so use a numeric id.
    const res = await admin.get('/api/v1/audit/9999999999');
    assertError(res, 404);
  });
});
