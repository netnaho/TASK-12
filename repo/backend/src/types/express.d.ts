/**
 * Unified Express type augmentation.
 *
 * req.user    – populated by authenticate middleware after session validation
 * req.id      – populated by requestId middleware
 *
 * Session fields (express-session):
 *   userId         – FK into users table
 *   roles          – role names array (cached from authenticate)
 *   permissions    – permission key array (cached from authenticate)
 *   lastActivityAt – ms timestamp of last request (sliding inactivity window)
 */
import type { AuthenticatedUser } from '../domain/types';
import type { RoleName, PermissionKey } from '../domain/roles';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: AuthenticatedUser;
      /** @deprecated Use req.user.id instead. Kept for backward compat with old controllers. */
      userId: string;
      /** @deprecated Use req.user.roles instead. Kept for backward compat with old controllers. */
      userRoles: string[];
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
    roles: RoleName[];
    permissions: PermissionKey[];
    lastActivityAt: number;
    /** @deprecated alias for roles — old controllers write here */
    userRoles?: string[];
    /** @deprecated alias for lastActivityAt — old controllers write here */
    lastActivity?: number;
  }
}

export {};
