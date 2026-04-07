/**
 * Authentication middleware.
 *
 * 1. Validates that an active express-session exists with a userId.
 * 2. Enforces 30-minute sliding inactivity timeout.
 * 3. Loads the user + roles + permissions from DB (mass-assignment-safe SELECT).
 * 4. Populates req.user (AuthenticatedUser) for downstream use.
 * 5. Populates req.userId / req.userRoles for backward-compatible controllers.
 * 6. Caches roles and permissions in the session to reduce DB queries on
 *    permission-only checks (the full user is always re-fetched to catch
 *    deactivation in real time).
 */
import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';
import { env } from '../config/env';
import { prisma } from '../config/database';
import type { RoleName, PermissionKey } from '../domain/roles';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // --- 1. Session presence ------------------------------------------------
    const userId = req.session?.userId;
    if (!userId) {
      throw new UnauthorizedError('No active session');
    }

    // --- 2. Inactivity timeout (30 min sliding window) ----------------------
    const now = Date.now();
    const lastActivity = req.session.lastActivityAt ?? req.session.lastActivity ?? 0;
    const elapsed = now - lastActivity;

    if (elapsed > env.SESSION_INACTIVITY_MS) {
      req.session.destroy(() => {});
      throw new UnauthorizedError('Session expired due to inactivity');
    }

    // --- 3. Load user from DB (mass-assignment-safe explicit select) ---------
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: { resource: true, action: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      req.session.destroy(() => {});
      throw new UnauthorizedError('User account not found or deactivated');
    }

    // --- 4. Build roles & permissions arrays --------------------------------
    const roles = user.roles.map((ur) => ur.role.name as RoleName);
    const permissionSet = new Set<PermissionKey>();
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        permissionSet.add(
          `${rp.permission.resource}:${rp.permission.action}` as PermissionKey,
        );
      }
    }
    const permissions = Array.from(permissionSet);

    // --- 5. Populate req.user (new pattern) ---------------------------------
    req.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      roles,
      permissions,
    };

    // --- 6. Backward-compat for old controllers that use req.userId ----------
    req.userId = user.id;
    req.userRoles = roles as string[];

    // --- 7. Update session with fresh data ----------------------------------
    req.session.lastActivityAt = now;
    req.session.lastActivity = now;          // compat alias
    req.session.roles = roles;
    req.session.permissions = permissions;
    req.session.userRoles = roles as string[]; // compat alias

    next();
  } catch (err) {
    next(err);
  }
}
