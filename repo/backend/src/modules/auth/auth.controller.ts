/**
 * Auth controller — login, me, logout, touch.
 *
 * Session semantics:
 *   - login:  creates a new session, stores userId + roles + permissions
 *   - me:     returns current user profile (authenticate middleware already validated)
 *   - logout: destroys the express session, clears cookie
 *   - touch:  explicit keep-alive for polling UIs; authenticate already bumps
 *             lastActivityAt so this is just a lightweight ping
 */
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNoContent } from '../../utils/response';
import { authService } from './auth.service';
import type { LoginBody } from './auth.schemas';
import type { RoleName, PermissionKey } from '../../domain/roles';
import { SESSION_COOKIE_NAME } from '../../config/constants';

// ─── POST /auth/login ─────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as LoginBody;
  const ipAddress = req.ip ?? req.socket?.remoteAddress;

  const user = await authService.login(username, password, ipAddress);

  // Regenerate session ID to prevent session-fixation attacks
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });

  // Populate session
  req.session.userId = user.id;
  req.session.roles = user.roles.map((r) => r.name) as RoleName[];
  req.session.permissions = user.permissions as PermissionKey[];
  req.session.lastActivityAt = Date.now();
  // Backward-compat aliases
  req.session.userRoles = user.roles.map((r) => r.name);
  req.session.lastActivity = Date.now();

  // Explicitly save before responding (guarantees store write completes)
  await new Promise<void>((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

  sendSuccess(res, user);
});

// ─── GET /auth/me ─────────────────────────────────────────────────────
export const me = asyncHandler(async (req: Request, res: Response) => {
  // authenticate middleware already validated session and set req.user,
  // but we call the service to get the full profile with employeeId
  const userId = req.user?.id ?? req.userId;
  const user = await authService.getCurrentUser(userId);
  sendSuccess(res, user);
});

// ─── POST /auth/logout ────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id ?? req.userId;
  const ipAddress = req.ip ?? req.socket?.remoteAddress;

  await authService.logout(userId, ipAddress);

  // Destroy the server-side session
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });

  // Clear the session cookie
  res.clearCookie(SESSION_COOKIE_NAME);

  sendSuccess(res, { message: 'Logged out' });
});

// ─── POST /auth/touch ─────────────────────────────────────────────────
// Explicit activity ping. authenticate middleware already bumps lastActivityAt,
// so this endpoint just returns 204 to confirm the session is still alive.
export const touch = asyncHandler(async (req: Request, res: Response) => {
  sendNoContent(res);
});
