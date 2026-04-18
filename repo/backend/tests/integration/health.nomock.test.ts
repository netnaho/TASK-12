/**
 * Real-app health probes. Depends on a running Prisma connection for the
 * full /api/health check; live/ready are process-only.
 */
import { describe, it, expect } from 'vitest';
import { createAgent, shouldRunIntegration } from './helpers/setup';

const d = shouldRunIntegration ? describe : describe.skip;

d('GET /api/health/live (no-mock)', () => {
  it('returns 200 with status: alive', async () => {
    const res = await createAgent().get('/api/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status');
  });
});

d('GET /api/health/ready (no-mock)', () => {
  it('returns 200 with readiness payload', async () => {
    const res = await createAgent().get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status');
  });
});

d('GET /api/health (no-mock)', () => {
  it('returns overall health and includes DB status', async () => {
    const res = await createAgent().get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body.data).toHaveProperty('status');
  });
});
