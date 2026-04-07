import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockBcrypt, mockDecryptField } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) },
  },
  mockBcrypt: { compare: vi.fn() },
  mockDecryptField: vi.fn(() => 'EMP-001'),
}));

vi.mock('../../../src/config/database', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('bcrypt', () => ({ default: mockBcrypt }));

vi.mock('../../../src/security/encryption', () => ({
  decryptField: mockDecryptField,
  encryptField: vi.fn(),
  hashForLookup: vi.fn(),
}));

import { AuthService } from '../../../src/modules/auth/auth.service';
import { UnauthorizedError } from '../../../src/shared/errors';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.resetAllMocks();
    mockPrisma.auditLog.create.mockResolvedValue({ id: BigInt(1) });
    service = new AuthService();
  });

  // Role with permissions array (required by formatUser)
  const mockRole = {
    id: 'role-1',
    name: 'ADMIN',
    description: 'Admin role',
    permissions: [],
  };

  const mockUser = {
    id: 'user-1',
    username: 'john',
    displayName: 'John Doe',
    email: 'john@example.com',
    phone: null,
    isActive: true,
    passwordHash: '$2b$10$hashedpassword',
    employeeIdCiphertext: Buffer.from('enc'),
    employeeIdIv: Buffer.from('iv'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deactivatedAt: null,
    roles: [{ grantedAt: new Date(), role: mockRole }],
  };

  describe('login', () => {
    it('with correct credentials returns user without passwordHash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await service.login('john', 'password123');

      expect(result.id).toBe('user-1');
      expect(result.username).toBe('john');
      expect((result as any).passwordHash).toBeUndefined();
      expect((result as any).employeeIdCiphertext).toBeUndefined();
      expect((result as any).employeeIdIv).toBeUndefined();
      expect(result.roles).toEqual([{ id: 'role-1', name: 'ADMIN', description: 'Admin role' }]);
    });

    it('with wrong password throws UnauthorizedError', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(service.login('john', 'wrong')).rejects.toThrow(UnauthorizedError);
    });

    it('with non-existent user throws UnauthorizedError', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('unknown', 'pass')).rejects.toThrow(UnauthorizedError);
    });

    it('with deactivated user throws UnauthorizedError', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.login('john', 'password123')).rejects.toThrow(UnauthorizedError);
    });

    it('records an audit log entry on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      await service.login('john', 'password123');

      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('returns user without passwordHash', async () => {
      const { passwordHash, ...userWithoutPw } = mockUser;
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutPw);

      const result = await service.getCurrentUser('user-1');

      expect(result.id).toBe('user-1');
      expect((result as any).passwordHash).toBeUndefined();
      expect((result as any).employeeIdCiphertext).toBeUndefined();
      expect(result.roles).toEqual([{ id: 'role-1', name: 'ADMIN', description: 'Admin role' }]);
    });

    it('throws UnauthorizedError for unknown user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentUser('unknown')).rejects.toThrow(UnauthorizedError);
    });
  });
});
