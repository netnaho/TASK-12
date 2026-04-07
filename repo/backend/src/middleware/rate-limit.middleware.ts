/**
 * Backward-compatible re-export.
 * Old routes import { authLimiter, globalLimiter } from './rate-limit.middleware'.
 */
export { authRateLimiter as authLimiter, globalRateLimiter as globalLimiter } from './security';
