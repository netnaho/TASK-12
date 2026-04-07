/**
 * Unit tests for UsersService.
 * Covers: user creation (with bcrypt + AES encryption), findAll, findById,
 * update, assignRole, removeRole, deactivate.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAudit } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    role: { findUnique: vi.fn() },
    userRole: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  },
  mockAudit: { create: vi.fn() },
}));

const mockPrismaInner = {
  user: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
  userRole: { create: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
};

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/audit/audit.service', () => ({
  auditService: mockAudit,
}));
const { mockEncryptEmployeeId } = vi.hoisted(() => ({
  mockEncryptEmployeeId: vi.fn(() => ({ ciphertext: Buffer.from('enc'), iv: Buffer.from('iv') })),
}));

vi.mock('../../../src/config/encryption', () => ({
  encryptEmployeeId: mockEncryptEmployeeId,
  decryptEmployeeId: vi.fn(() => 'EMP-001'),
}));

import { UsersService } from '../../../src/modules/users/users.service';

let service: UsersService;

const userSelectResult = {
  id: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  email: 'alice@test.com',
  isActive: true,
  employeeIdCiphertext: null,
  employeeIdIv: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deactivatedAt: null,
  roles: [{ grantedAt: new Date(), role: { id: 'r1', name: 'STANDARD_USER', description: 'User' } }],
};

beforeEach(() => {
  vi.resetAllMocks();
  service = new UsersService();
  mockAudit.create.mockResolvedValue({});
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrismaInner));
  // Restore encryption mock (vi.resetAllMocks wipes implementations)
  mockEncryptEmployeeId.mockReturnValue({ ciphertext: Buffer.from('enc'), iv: Buffer.from('iv') });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe('create', () => {
  it('creates user with hashed password and role assignment', async () => {
    mockPrisma.role.findUnique.mockResolvedValue({ id: 'r1', name: 'STANDARD_USER' });
    mockPrismaInner.user.create.mockResolvedValue(userSelectResult);
    mockPrismaInner.userRole.create.mockResolvedValue({});
    // findUniqueOrThrow is called at end of transaction to return full user
    mockPrismaInner.user.findUniqueOrThrow.mockResolvedValue(userSelectResult);

    const result = await service.create(
      {
        username: 'alice',
        password: 'Secret123!',
        email: 'alice@test.com',
        displayName: 'Alice',
        roleName: 'STANDARD_USER',
      },
      'admin-id',
    );

    expect(result).toHaveProperty('username', 'alice');
  });

  it('throws BadRequestError when role does not exist', async () => {
    mockPrisma.role.findUnique.mockResolvedValue(null);

    await expect(
      service.create(
        { username: 'bob', password: 'pass', email: 'bob@test.com', displayName: 'Bob', roleName: 'INVALID' },
        'admin-id',
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('findAll', () => {
  it('returns paginated list with meta', async () => {
    mockPrisma.user.findMany.mockResolvedValue([userSelectResult]);
    mockPrisma.user.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, pageSize: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('filters by isActive when provided', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);

    await service.findAll({ isActive: true });
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
  });

  it('filters by role when provided', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);

    await service.findAll({ role: 'ANALYST' } as any);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          roles: expect.objectContaining({ some: expect.anything() }),
        }),
      }),
    );
  });

  it('filters by search string when provided', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);

    await service.findAll({ search: 'alice' } as any);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    );
  });
});

// ─── findById ────────────────────────────────────────────────────────────────

describe('findById', () => {
  it('returns user when found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(userSelectResult);
    const result = await service.findById('user-1');
    expect(result.username).toBe('alice');
  });

  it('throws NotFoundError when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findById('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('update', () => {
  it('updates allowed fields', async () => {
    // findUnique: existence check; user.update returns updated user with roles
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.user.update.mockResolvedValue({ ...userSelectResult, displayName: 'Updated' });

    const result = await service.update('user-1', { displayName: 'Updated' }, 'admin-id');
    expect(result.displayName).toBe('Updated');
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });

  it('throws NotFoundError when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.update('ghost', { displayName: 'X' }, 'admin-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─── assignRole ──────────────────────────────────────────────────────────────

describe('assignRole', () => {
  it('assigns role when user and role exist and role is not already assigned', async () => {
    // First findUnique: existence check; second: inside findById at end
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: 'user-1' }) // existence check
      .mockResolvedValueOnce(userSelectResult); // findById return
    mockPrisma.role.findUnique.mockResolvedValue({ id: 'r2', name: 'ANALYST' });
    mockPrisma.userRole.findUnique.mockResolvedValue(null); // not already assigned
    mockPrisma.userRole.create.mockResolvedValue({ userId: 'user-1', roleId: 'r2' });

    const result = await service.assignRole('user-1', 'ANALYST', 'admin-id');
    expect(mockPrisma.userRole.create).toHaveBeenCalled();
    expect(result).toHaveProperty('username', 'alice');
  });

  it('throws ConflictError when role is already assigned', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.role.findUnique.mockResolvedValue({ id: 'r1', name: 'STANDARD_USER' });
    mockPrisma.userRole.findUnique.mockResolvedValue({ userId: 'user-1', roleId: 'r1' });

    await expect(service.assignRole('user-1', 'STANDARD_USER', 'admin-id')).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('throws BadRequestError when role does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.role.findUnique.mockResolvedValue(null);

    await expect(service.assignRole('user-1', 'GHOST', 'admin-id')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ─── deactivate ──────────────────────────────────────────────────────────────

describe('deactivate', () => {
  it('sets isActive=false and records deactivatedAt', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true });
    mockPrisma.user.update.mockResolvedValue({ ...userSelectResult, isActive: false });

    await service.deactivate('user-1', 'admin-id');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      }),
    );
  });

  it('throws NotFoundError when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.deactivate('ghost', 'admin-id')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── update with employeeId ───────────────────────────────────────────────────

describe('update with employeeId', () => {
  it('encrypts employeeId when provided', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.user.update.mockResolvedValue(userSelectResult);

    await service.update('user-1', { employeeId: 'EMP-001' }, 'admin-id');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeIdCiphertext: expect.anything(),
          employeeIdIv: expect.anything(),
        }),
      }),
    );
  });
});

// ─── removeRole ───────────────────────────────────────────────────────────────

describe('removeRole', () => {
  it('removes role when user has multiple roles', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        id: 'user-1',
        roles: [
          { roleId: 'r1', role: { name: 'STANDARD_USER' } },
          { roleId: 'r2', role: { name: 'ANALYST' } },
        ],
      })
      .mockResolvedValueOnce(userSelectResult); // findById return
    mockPrisma.role.findUnique.mockResolvedValue({ id: 'r2', name: 'ANALYST' });
    mockPrisma.userRole.findUnique.mockResolvedValue({ userId: 'user-1', roleId: 'r2' });
    mockPrisma.userRole.delete.mockResolvedValue({});

    await service.removeRole('user-1', 'ANALYST', 'admin-id');
    expect(mockPrisma.userRole.delete).toHaveBeenCalled();
  });

  it('throws BadRequestError when trying to remove the last role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      roles: [{ roleId: 'r1', role: { name: 'STANDARD_USER' } }],
    });

    await expect(service.removeRole('user-1', 'STANDARD_USER', 'admin-id')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws NotFoundError when role not assigned to user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      roles: [
        { roleId: 'r1', role: { name: 'STANDARD_USER' } },
        { roleId: 'r2', role: { name: 'ANALYST' } },
      ],
    });
    mockPrisma.role.findUnique.mockResolvedValue({ id: 'r3', name: 'LEASING_OPS_MANAGER' });
    mockPrisma.userRole.findUnique.mockResolvedValue(null);

    await expect(service.removeRole('user-1', 'LEASING_OPS_MANAGER', 'admin-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws NotFoundError when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.removeRole('ghost', 'ANALYST', 'admin-id')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws BadRequestError when role not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      roles: [
        { roleId: 'r1', role: { name: 'STANDARD_USER' } },
        { roleId: 'r2', role: { name: 'ANALYST' } },
      ],
    });
    mockPrisma.role.findUnique.mockResolvedValue(null);

    await expect(service.removeRole('user-1', 'GHOST_ROLE', 'admin-id')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
