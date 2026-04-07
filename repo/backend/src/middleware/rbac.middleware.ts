/**
 * Backward-compatible RBAC middleware.
 *
 * These versions use req.userRoles (populated by requireAuth from session data)
 * rather than req.user.roles (populated by the async authenticate middleware).
 *
 * New routes should use authorize.ts (in-memory checks after authenticate).
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ForbiddenError } from '../shared/errors';
import { prisma } from '../config/database';

/**
 * Synchronous role check against req.userRoles.
 * Throws ForbiddenError synchronously if the user doesn't have any of the
 * listed roles (compatible with routes that aren't wrapped in asyncHandler).
 */
export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRoles: string[] = req.userRoles ?? [];
    const hasRole = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      throw new ForbiddenError(`Requires one of roles: ${allowedRoles.join(', ')}`);
    }
    next();
  };
}

/**
 * Async permission check that queries role_permissions for the user's roles.
 * @param resource  e.g. 'lease'
 * @param action    e.g. 'read'
 */
export function requirePermission(resource: string, action: string): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRoles: string[] = req.userRoles ?? [];
      if (userRoles.length === 0) {
        next(new ForbiddenError('No roles assigned'));
        return;
      }

      const match = await prisma.rolePermission.findFirst({
        where: {
          role: { name: { in: userRoles as any } },
          permission: { resource, action },
        },
      });

      if (!match) {
        next(new ForbiddenError(`Missing permission: ${resource}:${action}`));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Re-export the new in-memory permission check under an alias.
 */
export { requirePermission as requirePerm } from './authorize';
