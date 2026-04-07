/**
 * Authorization middleware (runs AFTER authenticate).
 *
 * Performs in-memory checks against req.user.roles and req.user.permissions
 * — no database round-trip per request.
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';
import type { RoleName, PermissionKey } from '../domain/roles';

/**
 * Requires that the caller holds at least one of the listed roles.
 */
export function requireRole(...roles: RoleName[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    const hasRole = roles.some((r) => req.user!.roles.includes(r));
    if (!hasRole) {
      next(new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Requires that the caller holds ALL of the listed permissions.
 */
export function requirePermission(...permissions: PermissionKey[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    const hasAll = permissions.every((p) => req.user!.permissions.includes(p));
    if (!hasAll) {
      next(new ForbiddenError(`Missing required permission(s): ${permissions.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Requires that the caller holds at least one of the listed permissions.
 */
export function requireAnyPermission(...permissions: PermissionKey[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    const hasAny = permissions.some((p) => req.user!.permissions.includes(p));
    if (!hasAny) {
      next(new ForbiddenError(`Requires one of: ${permissions.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Convenience: requirePermission for a resource:action pair.
 * Usage: requirePerm('report', 'create')
 */
export function requirePerm(resource: string, action: string): RequestHandler {
  return requirePermission(`${resource}:${action}` as PermissionKey);
}
