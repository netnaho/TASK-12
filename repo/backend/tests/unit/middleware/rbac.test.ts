import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenError } from '../../../src/shared/errors';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    rolePermission: { findFirst: vi.fn() },
  },
}));

vi.mock('../../../src/config/database', () => ({
  prisma: mockPrisma,
}));

import { requireRole, requirePermission } from '../../../src/middleware/rbac.middleware';

function mockReq(userRoles?: string[]) {
  return { userRoles } as any;
}

function mockRes() {
  return {} as any;
}

describe('RBAC middleware', () => {
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireRole', () => {
    it('passes when user has matching role', () => {
      const req = mockReq(['ADMIN', 'USER']);
      const middleware = requireRole('ADMIN');
      middleware(req, mockRes(), next);
      expect(next).toHaveBeenCalledWith();
    });

    it('rejects when user does not have role', () => {
      const req = mockReq(['USER']);
      const middleware = requireRole('ADMIN');
      expect(() => middleware(req, mockRes(), next)).toThrow(ForbiddenError);
    });

    it('handles multiple allowed roles', () => {
      const req = mockReq(['MANAGER']);
      const middleware = requireRole('ADMIN', 'MANAGER');
      middleware(req, mockRes(), next);
      expect(next).toHaveBeenCalledWith();
    });

    it('rejects when userRoles is undefined', () => {
      const req = mockReq(undefined);
      const middleware = requireRole('ADMIN');
      expect(() => middleware(req, mockRes(), next)).toThrow(ForbiddenError);
    });

    it('rejects when userRoles is empty', () => {
      const req = mockReq([]);
      const middleware = requireRole('ADMIN');
      expect(() => middleware(req, mockRes(), next)).toThrow(ForbiddenError);
    });
  });

  describe('requirePermission', () => {
    it('passes when user has matching permission', async () => {
      const req = mockReq(['ADMIN']);
      mockPrisma.rolePermission.findFirst.mockResolvedValue({ id: 'perm-1' });
      const middleware = requirePermission('lease', 'read');
      await middleware(req, mockRes(), next);
      expect(next).toHaveBeenCalledWith();
    });

    it('calls next with ForbiddenError when permission not found', async () => {
      const req = mockReq(['USER']);
      mockPrisma.rolePermission.findFirst.mockResolvedValue(null);
      const middleware = requirePermission('lease', 'delete');
      await middleware(req, mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('calls next with ForbiddenError when no roles assigned', async () => {
      const req = mockReq([]);
      const middleware = requirePermission('lease', 'read');
      await middleware(req, mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});
