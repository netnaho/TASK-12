import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockAuditService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleAuditLog = {
  id: 'audit-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  action: 'USER_CREATED',
  entityType: 'User',
  entityId: 'user-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  actorId: 'user-admin-id',
  detail: { username: 'newuser' },
  createdAt: new Date().toISOString(),
};

describe('GET /api/v1/audit', () => {
  it('should return 200 with paginated audit logs for admin', async () => {
    mockAuditService.list.mockResolvedValue({
      data: [sampleAuditLog],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/audit');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('action', 'USER_CREATED');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/audit');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.get('/api/v1/audit');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/audit');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for TEST_PROCTOR', async () => {
    const agent = await loginAs('TEST_PROCTOR');
    const res = await agent.get('/api/v1/audit');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/audit');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should accept filter params', async () => {
    mockAuditService.list.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/audit?action=USER_CREATED&entityType=User');

    expect(mockAuditService.list).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_CREATED',
        entityType: 'User',
      }),
    );
  });
});

describe('GET /api/v1/audit/:id', () => {
  it('should return 200 with audit log entry for admin', async () => {
    mockAuditService.getById.mockResolvedValue(sampleAuditLog);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get(`/api/v1/audit/${sampleAuditLog.id}`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('id', sampleAuditLog.id);
    expect(res.body.data).toHaveProperty('action', 'USER_CREATED');
  });

  it('should return 403 for non-admin', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/audit/${sampleAuditLog.id}`);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 404 when entry does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockAuditService.getById.mockRejectedValue(new NotFoundError('Audit log not found'));

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/audit/nonexistent-id');

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get(`/api/v1/audit/${sampleAuditLog.id}`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});
