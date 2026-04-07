import bcrypt from 'bcrypt';
import { RoleName, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { encryptEmployeeId, decryptEmployeeId } from '../../config/encryption';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { CreateUserBody, UpdateUserBody, ListUsersQuery } from './users.schemas';

const BCRYPT_ROUNDS = 12;

const userSelectFields = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  isActive: true,
  employeeIdCiphertext: true,
  employeeIdIv: true,
  createdAt: true,
  updatedAt: true,
  deactivatedAt: true,
  roles: {
    select: {
      grantedAt: true,
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  },
} as const;

function decryptAndStrip(user: any) {
  const { employeeIdCiphertext, employeeIdIv, ...rest } = user;

  let employeeId: string | undefined;
  if (employeeIdCiphertext && employeeIdIv) {
    employeeId = decryptEmployeeId(employeeIdCiphertext, employeeIdIv) ?? undefined;
  }

  return {
    ...rest,
    employeeId,
    roles: rest.roles.map((ur: any) => ur.role),
  };
}

export class UsersService {
  async create(data: CreateUserBody, actorId: string) {
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    let employeeIdCiphertext: Buffer | undefined;
    let employeeIdIv: Buffer | undefined;

    if (data.employeeId) {
      const encrypted = encryptEmployeeId(data.employeeId);
      employeeIdCiphertext = encrypted.ciphertext;
      employeeIdIv = encrypted.iv;
    }

    const role = await prisma.role.findUnique({
      where: { name: data.roleName as RoleName },
    });

    if (!role) {
      throw new BadRequestError(`Role "${data.roleName}" not found`);
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: data.username,
          email: data.email,
          passwordHash,
          displayName: data.displayName,
          employeeIdCiphertext: employeeIdCiphertext ?? null,
          employeeIdIv: employeeIdIv ?? null,
        },
        select: userSelectFields,
      });

      await tx.userRole.create({
        data: {
          userId: created.id,
          roleId: role.id,
          grantedBy: actorId,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        select: userSelectFields,
      });
    });

    logger.info({ userId: user.id, actorId }, 'User created');

    return decryptAndStrip(user);
  }

  async findAll(filters: ListUsersQuery) {
    const { skip, take, page, pageSize } = parsePagination(filters);

    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search } },
        { displayName: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    if (filters.role) {
      where.roles = {
        some: {
          role: {
            name: filters.role as RoleName,
          },
        },
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelectFields,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const data = users.map(decryptAndStrip);
    const meta = buildMeta(total, page, pageSize);

    return { data, meta };
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelectFields,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return decryptAndStrip(user);
  }

  async update(id: string, data: UpdateUserBody, actorId: string) {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.employeeId !== undefined) {
      const encrypted = encryptEmployeeId(data.employeeId);
      updateData.employeeIdCiphertext = encrypted.ciphertext;
      updateData.employeeIdIv = encrypted.iv;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelectFields,
    });

    logger.info({ userId: id, actorId }, 'User updated');

    return decryptAndStrip(user);
  }

  async assignRole(userId: string, roleName: string, actorId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName as RoleName },
    });

    if (!role) {
      throw new BadRequestError(`Role "${roleName}" not found`);
    }

    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId, roleId: role.id },
      },
    });

    if (existingUserRole) {
      throw new ConflictError(`User already has role "${roleName}"`);
    }

    await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
        grantedBy: actorId,
      },
    });

    logger.info({ userId, roleName, actorId }, 'Role assigned to user');

    return this.findById(userId);
  }

  async removeRole(userId: string, roleName: string, actorId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roles: { select: { roleId: true, role: { select: { name: true } } } },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.roles.length <= 1) {
      throw new BadRequestError('Cannot remove the last role from a user');
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName as RoleName },
    });

    if (!role) {
      throw new BadRequestError(`Role "${roleName}" not found`);
    }

    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId, roleId: role.id },
      },
    });

    if (!existingUserRole) {
      throw new NotFoundError(`User does not have role "${roleName}"`);
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: { userId, roleId: role.id },
      },
    });

    logger.info({ userId, roleName, actorId }, 'Role removed from user');

    return this.findById(userId);
  }

  async deactivate(userId: string, actorId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
      select: userSelectFields,
    });

    logger.info({ userId, actorId }, 'User deactivated');

    return decryptAndStrip(updated);
  }
}

export const usersService = new UsersService();
