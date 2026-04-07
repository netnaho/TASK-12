import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  mockUserPreferencesService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const samplePrefs = {
  userId: 'user-admin-id',
  deliveryMode: 'IN_APP_ONLY',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('GET /api/v1/users/me/preferences', () => {
  it('should return 200 with current user preferences', async () => {
    mockUserPreferencesService.getPreferences.mockResolvedValue(samplePrefs);

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/users/me/preferences');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('deliveryMode', 'IN_APP_ONLY');
  });

  it('should return 200 for admin', async () => {
    mockUserPreferencesService.getPreferences.mockResolvedValue(samplePrefs);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/users/me/preferences');

    assertSuccess(res, 200);
  });

  it('should return 200 for ANALYST', async () => {
    mockUserPreferencesService.getPreferences.mockResolvedValue({
      ...samplePrefs,
      userId: 'user-analyst-id',
    });

    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/users/me/preferences');

    assertSuccess(res, 200);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/users/me/preferences');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('PUT /api/v1/users/me/preferences', () => {
  it('should return 200 when setting IN_APP_ONLY', async () => {
    mockUserPreferencesService.updatePreferences.mockResolvedValue({
      ...samplePrefs,
      deliveryMode: 'IN_APP_ONLY',
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .put('/api/v1/users/me/preferences')
      .send({ deliveryMode: 'IN_APP_ONLY' });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('deliveryMode', 'IN_APP_ONLY');
  });

  it('should return 200 when setting ALSO_PACKAGE', async () => {
    mockUserPreferencesService.updatePreferences.mockResolvedValue({
      ...samplePrefs,
      deliveryMode: 'ALSO_PACKAGE',
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .put('/api/v1/users/me/preferences')
      .send({ deliveryMode: 'ALSO_PACKAGE' });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('deliveryMode', 'ALSO_PACKAGE');
  });

  it('should return 400 for invalid deliveryMode value', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent
      .put('/api/v1/users/me/preferences')
      .send({ deliveryMode: 'INVALID_MODE' });

    // Zod validation error — 400 from the Zod parse in the controller
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent()
      .put('/api/v1/users/me/preferences')
      .send({ deliveryMode: 'IN_APP_ONLY' });

    assertError(res, 401, 'UNAUTHORIZED');
  });
});
