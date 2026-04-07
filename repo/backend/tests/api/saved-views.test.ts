import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockSavedViewsService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleView = {
  id: 'view-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'My Region Pivot',
  viewType: 'PIVOT',
  ownerId: 'user-1',
  config: { dimensions: ['region'], measures: ['count'] },
  isPublic: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── LIST ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/saved-views', () => {
  it('should return 200 for any authenticated user', async () => {
    mockSavedViewsService.listSavedViews.mockResolvedValue({
      data: [sampleView],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/analytics/saved-views');

    assertPaginated(res, 200);
  });

  it('should pass scope=mine to the service', async () => {
    mockSavedViewsService.listSavedViews.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('ANALYST');
    await agent.get('/api/v1/analytics/saved-views?scope=mine');

    expect(mockSavedViewsService.listSavedViews).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ scope: 'mine' }),
    );
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/analytics/saved-views');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── CREATE ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/analytics/saved-views', () => {
  const validBody = {
    name: 'My View',
    viewType: 'PIVOT',
    config: { dimensions: ['region'], measures: ['count'] },
  };

  it('should return 201 for ANALYST', async () => {
    mockSavedViewsService.createSavedView.mockResolvedValue(sampleView);

    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/analytics/saved-views').send(validBody);

    assertSuccess(res, 201);
  });

  it('should return 201 for SYSTEM_ADMIN', async () => {
    mockSavedViewsService.createSavedView.mockResolvedValue(sampleView);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/analytics/saved-views').send(validBody);

    assertSuccess(res, 201);
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/analytics/saved-views').send(validBody);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 when name is missing', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent
      .post('/api/v1/analytics/saved-views')
      .send({ viewType: 'PIVOT', config: {} });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid viewType', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/analytics/saved-views').send({
      name: 'X',
      viewType: 'BANANA',
      config: {},
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────

describe('PUT /api/v1/analytics/saved-views/:id', () => {
  const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for owner', async () => {
    mockSavedViewsService.updateSavedView.mockResolvedValue({
      ...sampleView,
      name: 'Renamed',
    });

    const agent = await loginAs('ANALYST');
    const res = await agent
      .put(`/api/v1/analytics/saved-views/${id}`)
      .send({ name: 'Renamed' });

    assertSuccess(res, 200);
  });

  it('should propagate ForbiddenError as 403', async () => {
    const { ForbiddenError } = await import('../../src/shared/errors');
    mockSavedViewsService.updateSavedView.mockRejectedValue(
      new ForbiddenError('Only the owner can update this saved view'),
    );

    const agent = await loginAs('ANALYST');
    const res = await agent
      .put(`/api/v1/analytics/saved-views/${id}`)
      .send({ name: 'X' });

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── DELETE ──────────────────────────────────────────────────────────────────

describe('DELETE /api/v1/analytics/saved-views/:id', () => {
  const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 204 for owner', async () => {
    mockSavedViewsService.deleteSavedView.mockResolvedValue(undefined);

    const agent = await loginAs('ANALYST');
    const res = await agent.delete(`/api/v1/analytics/saved-views/${id}`);

    expect(res.status).toBe(204);
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().delete(`/api/v1/analytics/saved-views/${id}`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── GET BY ID ───────────────────────────────────────────────────────────────

describe('GET /api/v1/analytics/saved-views/:id', () => {
  const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for owner', async () => {
    mockSavedViewsService.getSavedView.mockResolvedValue(sampleView);

    const agent = await loginAs('ANALYST');
    const res = await agent.get(`/api/v1/analytics/saved-views/${id}`);

    assertSuccess(res, 200);
  });

  it('should return 404 for missing view', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockSavedViewsService.getSavedView.mockRejectedValue(
      new NotFoundError('Saved view not found'),
    );

    const agent = await loginAs('ANALYST');
    const res = await agent.get(`/api/v1/analytics/saved-views/${id}`);

    assertError(res, 404, 'NOT_FOUND');
  });
});
