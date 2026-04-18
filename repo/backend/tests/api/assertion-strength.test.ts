/**
 * Assertion-strength uplift tests.
 *
 * Several existing mocked API tests only asserted status codes. These tests
 * add envelope-shape, data-field, pagination-meta, and side-effect
 * assertions so coverage of *behavior* (not just wire-level response code)
 * materially improves.
 *
 * Uses the mocked-HTTP setup — same patterns as tests/api/*.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertPaginated,
  assertSuccess,
  assertError,
  mockAuthService,
  mockAuditService,
  mockListingsService,
  mockMetricsService,
  mockTestCenterService,
  mockNotificationsService,
  mockPrisma,
} from './helpers/setup';

beforeEach(() => { vi.clearAllMocks(); });

describe('Envelope shape: success responses carry the full envelope', () => {
  it('GET /api/v1/audit returns a paginated envelope with all required meta keys', async () => {
    mockAuditService.list.mockResolvedValue({
      data: [{ id: 'a1', actorId: 'u1', action: 'LOGIN', createdAt: '2024-01-01T00:00:00Z' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/audit');
    assertPaginated(res);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.pageSize).toBe(20);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.meta.totalPages).toBe(1);
    expect(res.body.data[0].action).toBe('LOGIN');
    expect(mockAuditService.list).toHaveBeenCalledTimes(1);
  });
});

describe('Side effects: service calls receive the right arguments', () => {
  it('POST /api/v1/auth/login forwards the IP address as a third arg', async () => {
    const mockUser = {
      id: 'u', username: 'admin', displayName: '', email: '', isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      roles: [{ id: 'r', name: 'SYSTEM_ADMIN', description: '' }], permissions: [],
    };
    mockAuthService.login.mockResolvedValue(mockUser);
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Password123!' });
    assertSuccess(res);
    expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    const [username, password, ip] = mockAuthService.login.mock.calls[0];
    expect(username).toBe('admin');
    expect(password).toBe('Password123!');
    // IP must be a string-typed value (Express-set x-forwarded-for or socket.remoteAddress)
    expect(typeof ip).toBe('string');
  });

  it('PUT /api/v1/listings/:id forwards body fields and id param', async () => {
    mockListingsService.update.mockResolvedValue({
      id: 'l1', rentPrice: 1250, unitNumber: 'A1',
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put('/api/v1/listings/00000000-0000-0000-0000-000000000001')
      .send({ rentPrice: 1250 });
    assertSuccess(res);
    expect(mockListingsService.update).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      expect.objectContaining({ rentPrice: 1250 }),
      expect.anything(),
    );
    expect(res.body.data.rentPrice).toBe(1250);
  });

  it('POST /api/v1/metrics/recalculate forwards propertyIds + userId', async () => {
    mockMetricsService.triggerRecalculation.mockResolvedValue({
      jobId: 'job-1', status: 'QUEUED',
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/metrics/recalculate')
      .send({ propertyIds: ['00000000-0000-0000-0000-000000000001'] });
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    // Controller signature: triggerRecalculation(propertyIds, userId)
    expect(mockMetricsService.triggerRecalculation).toHaveBeenCalledWith(
      ['00000000-0000-0000-0000-000000000001'],
      expect.anything(),
    );
  });
});

describe('Envelope shape: error responses carry error code + message', () => {
  it('422 VALIDATION_ERROR includes an error.message field', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({});
    assertError(res, 422, 'VALIDATION_ERROR');
    expect(res.body.error).toHaveProperty('message');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('401 UNAUTHORIZED envelope shape on unauthenticated /me', async () => {
    const res = await createAgent().get('/api/v1/auth/me');
    assertError(res, 401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code');
  });
});

describe('Compat alias parity: aliases emit the same status + envelope shape as canonical', () => {
  it('PATCH /test-center/sites/:id returns the same envelope as PUT', async () => {
    mockTestCenterService.updateSite.mockResolvedValue({
      id: 'site-1', name: 'Updated', address: '1 main', timezone: 'UTC',
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    const put = await agent
      .put('/api/v1/test-center/sites/site-1')
      .send({ name: 'Updated' });
    const patch = await agent
      .patch('/api/v1/test-center/sites/site-1')
      .send({ name: 'Updated' });

    expect(put.status).toBe(patch.status);
    expect(Object.keys(put.body).sort()).toEqual(Object.keys(patch.body).sort());
    expect(put.body.data).toMatchObject({ id: 'site-1' });
    expect(patch.body.data).toMatchObject({ id: 'site-1' });
  });

  it('PATCH /notifications/templates/:id returns same envelope as PUT', async () => {
    mockNotificationsService.updateTemplate.mockResolvedValue({
      id: 't-1', name: 'Updated',
    });
    const agent = await loginAs('SYSTEM_ADMIN');
    const put = await agent
      .put('/api/v1/notifications/templates/t-1')
      .send({ name: 'Updated' });
    const patch = await agent
      .patch('/api/v1/notifications/templates/t-1')
      .send({ name: 'Updated' });
    expect(put.status).toBe(patch.status);
    expect(put.body.data).toMatchObject({ id: 't-1' });
    expect(patch.body.data).toMatchObject({ id: 't-1' });
  });
});

describe('Pagination: meta reflects query params', () => {
  it('GET /audit respects ?page=2&pageSize=5 and surfaces them in meta', async () => {
    mockAuditService.list.mockImplementation(async ({ page, pageSize }: any) => ({
      data: [],
      meta: { page, pageSize, total: 42, totalPages: Math.ceil(42 / pageSize) },
    }));
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/audit?page=2&pageSize=5');
    assertPaginated(res);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.pageSize).toBe(5);
    expect(res.body.meta.total).toBe(42);
    expect(res.body.meta.totalPages).toBe(9);
  });
});
