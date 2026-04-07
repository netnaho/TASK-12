import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../src/config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client') as any;
  return {
    ...actual,
    Prisma: {
      ...(actual.Prisma || {}),
      JsonNull: 'DbNull',
    },
    AuditAction: {
      CREATE: 'CREATE',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
    },
  };
});

import { AuditService } from '../../../src/modules/audit/audit.service';
import { NotFoundError } from '../../../src/shared/errors';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuditService();
  });

  describe('create()', () => {
    it('inserts audit log entry', async () => {
      const mockEntry = {
        id: BigInt(1),
        action: 'CREATE',
        actorId: 'user-1',
        entityType: 'Lease',
        entityId: 'lease-1',
        createdAt: new Date(),
      };

      mockPrisma.auditLog.create.mockResolvedValue(mockEntry);

      const result = await service.create({
        action: 'CREATE' as any,
        actorId: 'user-1',
        entityType: 'Lease',
        entityId: 'lease-1',
        afterJson: { status: 'active' },
        ipAddress: '127.0.0.1',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CREATE',
          actorId: 'user-1',
          entityType: 'Lease',
          entityId: 'lease-1',
        }),
      });
      expect(result).toBe(mockEntry);
    });

    it('handles optional fields with defaults', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: BigInt(2) });

      await service.create({
        action: 'UPDATE' as any,
        entityType: 'User',
        entityId: 'user-2',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: null,
          ipAddress: null,
        }),
      });
    });
  });

  describe('immutability guarantees', () => {
    it('has no update method', () => {
      expect((service as any).update).toBeUndefined();
    });

    it('has no delete method', () => {
      expect((service as any).delete).toBeUndefined();
    });
  });

  describe('list()', () => {
    it('returns paginated audit logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        { id: BigInt(1), action: 'CREATE', createdAt: new Date(), actor: { displayName: 'Admin' } },
      ]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.list({ page: '1', pageSize: '10' } as any);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.meta.total).toBe(1);
    });

    it('filters by entityId when provided', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.list({ entityId: 'entity-1' } as any);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ entityId: 'entity-1' }) }),
      );
    });

    it('filters by actorId when provided', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.list({ actorId: 'user-1' } as any);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ actorId: 'user-1' }) }),
      );
    });

    it('filters by dateFrom and dateTo when provided', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.list({ dateFrom: new Date('2024-01-01'), dateTo: new Date('2024-12-31') } as any);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ createdAt: expect.any(Object) }) }),
      );
    });

    it('filters by action when provided', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.list({ action: 'CREATE' } as any);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ action: 'CREATE' }) }),
      );
    });

    it('filters by entityType when provided', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.list({ entityType: 'Lease' } as any);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ entityType: 'Lease' }) }),
      );
    });
  });

  describe('getById()', () => {
    it('returns audit log entry with string id', async () => {
      mockPrisma.auditLog.findUnique.mockResolvedValue({
        id: BigInt(42),
        action: 'CREATE',
        actor: { displayName: 'Admin' },
      });

      const result = await service.getById('42');

      expect(result.id).toBe('42');
      expect(mockPrisma.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(42) },
        include: { actor: { select: { displayName: true } } },
      });
    });

    it('throws NotFoundError for unknown id', async () => {
      mockPrisma.auditLog.findUnique.mockResolvedValue(null);

      await expect(service.getById('999')).rejects.toThrow(NotFoundError);
    });
  });
});
