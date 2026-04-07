/**
 * Auth service — handles login, current-user, logout.
 *
 * Security invariants:
 *   - Passwords are never logged or returned in responses.
 *   - Login failures return a generic message (no user enumeration).
 *   - Encrypted employee IDs are decrypted only when explicitly requested.
 *   - Audit log entries are created for login success and failure.
 */
import bcrypt from 'bcrypt';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { decryptField } from '../../security/encryption';
import { UnauthorizedError } from '../../shared/errors';
import { auditService } from '../audit/audit.service';
import type { RoleName, PermissionKey } from '../../domain/roles';

// Mass-assignment-safe: explicit select — no passwordHash, no raw ciphertext
const USER_SAFE_SELECT = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  phone: true,
  isActive: true,
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
          permissions: {
            select: {
              permission: { select: { resource: true, action: true } },
            },
          },
        },
      },
    },
  },
} as const;

interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deactivatedAt: Date | null;
  roles: { id: string; name: string; description: string }[];
  permissions: string[];
  employeeId?: string | null;
}

function formatUser(user: any, includeEmployeeId = false): UserResponse {
  const roles = user.roles.map((ur: any) => ur.role);
  const permSet = new Set<string>();
  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) {
      permSet.add(`${rp.permission.resource}:${rp.permission.action}`);
    }
  }

  const result: UserResponse = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    phone: user.phone ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deactivatedAt: user.deactivatedAt ?? null,
    roles: roles.map((r: any) => ({ id: r.id, name: r.name, description: r.description })),
    permissions: Array.from(permSet),
  };

  if (includeEmployeeId && user.employeeIdCiphertext && user.employeeIdIv) {
    result.employeeId = decryptField(user.employeeIdCiphertext, user.employeeIdIv);
  }

  return result;
}

export class AuthService {
  /**
   * Authenticate a user by username + password.
   * Returns the user profile (no sensitive fields) on success.
   * Writes an audit log entry for both success and failure.
   */
  async login(username: string, password: string, ipAddress?: string): Promise<UserResponse> {
    // Look up user — include passwordHash for verification
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        ...USER_SAFE_SELECT,
        passwordHash: true,
        employeeIdCiphertext: true,
        employeeIdIv: true,
      },
    });

    if (!user) {
      logger.warn({ username }, 'Login failed: user not found');
      // Audit log with null actor (user doesn't exist)
      await this.auditLoginFailure(null, username, ipAddress, 'User not found');
      // Generic message to prevent user enumeration
      throw new UnauthorizedError('Invalid username or password');
    }

    if (!user.isActive) {
      logger.warn({ username }, 'Login failed: user deactivated');
      await this.auditLoginFailure(user.id, username, ipAddress, 'Account deactivated');
      throw new UnauthorizedError('Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      logger.warn({ username }, 'Login failed: bad password');
      await this.auditLoginFailure(user.id, username, ipAddress, 'Invalid password');
      throw new UnauthorizedError('Invalid username or password');
    }

    // Success
    logger.info({ userId: user.id, username }, 'User logged in');
    await auditService.create({
      action: 'USER_LOGGED_IN',
      actorId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: { username },
      ipAddress,
    });

    return formatUser(user, true);
  }

  /**
   * Fetch the current user's profile (called by GET /auth/me).
   * Re-validates that the user still exists and is active.
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        ...USER_SAFE_SELECT,
        employeeIdCiphertext: true,
        employeeIdIv: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    return formatUser(user, true);
  }

  /**
   * Record a logout audit event. Session destruction happens at the controller.
   */
  async logout(userId: string, ipAddress?: string): Promise<void> {
    await auditService.create({
      action: 'USER_LOGGED_OUT',
      actorId: userId,
      entityType: 'User',
      entityId: userId,
      ipAddress,
    });
    logger.info({ userId }, 'User logged out');
  }

  // ── private helpers ──────────────────────────────────────────────────

  private async auditLoginFailure(
    userId: string | null,
    username: string,
    ipAddress?: string,
    reason?: string,
  ): Promise<void> {
    try {
      await auditService.create({
        action: 'USER_LOGGED_IN', // same action, metadata distinguishes success/fail
        actorId: userId ?? undefined,
        entityType: 'User',
        entityId: userId ?? 'unknown',
        metadata: { username, success: false, reason },
        ipAddress,
      });
    } catch {
      // Audit failure must never block login flow
    }
  }
}

export const authService = new AuthService();
