/**
 * Tests for audit log immutability rules.
 * The AuditService only exposes 'create' — there are no update or delete methods.
 * This suite verifies that:
 *  - create() successfully writes an audit log entry
 *  - The service object has no update/delete methods (append-only guarantee)
 *  - Sensitive field metadata is stored correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { AuditService } from '../../../src/modules/audit/audit.service';

let service: AuditService;

beforeEach(() => {
  vi.resetAllMocks();
  service = new AuditService();
});

describe('AuditService — append-only contract', () => {
  it('exposes a create method', () => {
    expect(typeof service.create).toBe('function');
  });

  it('does NOT expose an update method', () => {
    expect((service as any).update).toBeUndefined();
  });

  it('does NOT expose a delete method', () => {
    expect((service as any).delete).toBeUndefined();
  });

  it('does NOT expose a deleteMany method', () => {
    expect((service as any).deleteMany).toBeUndefined();
  });
});

describe('AuditService.create', () => {
  it('creates an audit log entry with all required fields', async () => {
    const entry = {
      id: BigInt(1),
      action: 'USER_CREATED',
      actorId: 'actor-1',
      entityType: 'user',
      entityId: 'user-1',
      beforeJson: null,
      afterJson: { username: 'alice' },
      metadata: null,
      ipAddress: null,
      requestId: null,
      createdAt: new Date(),
    };
    mockPrisma.auditLog.create.mockResolvedValue(entry);

    const result = await service.create({
      action: 'USER_CREATED' as any,
      actorId: 'actor-1',
      entityType: 'user',
      entityId: 'user-1',
      afterJson: { username: 'alice' },
    });

    expect(result).toEqual(entry);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'USER_CREATED',
          actorId: 'actor-1',
          entityType: 'user',
          entityId: 'user-1',
        }),
      }),
    );
  });

  it('stores beforeJson for update operations', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: BigInt(2) });

    await service.create({
      action: 'USER_UPDATED' as any,
      actorId: 'admin-1',
      entityType: 'user',
      entityId: 'user-2',
      beforeJson: { displayName: 'Old Name' },
      afterJson: { displayName: 'New Name' },
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          beforeJson: { displayName: 'Old Name' },
          afterJson: { displayName: 'New Name' },
        }),
      }),
    );
  });

  it('stores metadata for enriched entries', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: BigInt(3) });

    await service.create({
      action: 'REPORT_EXPORT_BLOCKED' as any,
      actorId: 'user-3',
      entityType: 'export',
      entityId: 'exp-1',
      metadata: { reason: 'share_revoked' },
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: { reason: 'share_revoked' },
        }),
      }),
    );
  });

  it('stores null actorId for system-triggered entries', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({ id: BigInt(4) });

    await service.create({
      action: 'REPORT_SCHEDULE_EXECUTED' as any,
      entityType: 'schedule',
      entityId: 'sched-1',
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorId: null }),
      }),
    );
  });
});

describe('AuditService.list', () => {
  it('returns paginated results', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([
      { id: BigInt(1), action: 'USER_CREATED', entityType: 'user', entityId: 'u1', createdAt: new Date() },
    ]);
    mockPrisma.auditLog.count.mockResolvedValue(1);

    const result = await service.list({ page: 1, pageSize: 20 } as any);
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});
