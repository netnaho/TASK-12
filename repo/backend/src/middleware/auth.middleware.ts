/**
 * Authoritative request auth middleware (DB-refresh).
 *
 * Historical note: this module previously exposed a session-only `requireAuth`
 * that trusted role data cached in the express-session. That allowed stale
 * privilege: a user whose role was revoked or whose account was deactivated
 * would continue to pass authorization checks until their session expired.
 *
 * It now delegates to the async `authenticate` middleware, which:
 *   1. Validates session presence + 30-minute sliding inactivity window
 *   2. Re-loads the user (with roles + permissions) from the DB on every request
 *   3. Refuses requests for inactive/deleted users
 *   4. Populates BOTH the modern `req.user` shape AND the legacy
 *      `req.userId` / `req.userRoles` fields used by older controllers
 *
 * Because authenticate populates the same legacy fields, all existing route
 * modules that import `requireAuth` from this file get DB-refreshed auth
 * with no other source changes required. RBAC middleware (requireRole) reads
 * `req.userRoles`, which is now sourced from the DB rather than the session.
 *
 * The sync `requireAuth` symbol is retained as an alias for backward
 * compatibility — Express handles both sync and async middleware uniformly.
 */
import { authenticate } from './authenticate';

export const requireAuth = authenticate;
