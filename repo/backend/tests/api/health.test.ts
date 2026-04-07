import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent, assertSuccess } from './helpers/setup';

describe('GET /api/health', () => {
  it('should return 200 with healthy status', async () => {
    const res = await createAgent().get('/api/health');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('status', 'healthy');
    expect(res.body.data).toHaveProperty('timestamp');
  });

  it('should include a valid ISO timestamp', async () => {
    const res = await createAgent().get('/api/health');

    const timestamp = res.body.data.timestamp;
    expect(() => new Date(timestamp).toISOString()).not.toThrow();
  });
});
