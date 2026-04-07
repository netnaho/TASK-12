/**
 * Security middleware stack.
 *
 * Provides: helmet (security headers), CORS, compression, rate limiters.
 *
 * Helmet config:
 *   - CSP enabled with restrictive default (self only) — the API is JSON-only
 *     so CSP blocks any accidental HTML rendering with inline scripts.
 *   - X-Frame-Options: DENY (no iframe embedding)
 *   - Strict-Transport-Security: 1 year with includeSubDomains
 *   - X-Content-Type-Options: nosniff
 *   - Referrer-Policy: no-referrer
 *
 * Rate limiters throw TooManyRequestsError (not the default express-rate-limit
 * HTML response) so our errorHandler produces a consistent JSON envelope.
 */
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { TooManyRequestsError } from '../errors';

export const helmetMiddleware: RequestHandler = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,   // not needed for an API
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
  },
  referrerPolicy: { policy: 'no-referrer' },
  xFrameOptions: { action: 'deny' },
});

export const corsMiddleware: RequestHandler = cors({
  origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600, // preflight cache 10 min
});

export const compressionMiddleware: RequestHandler = compression({
  level: 6,
  threshold: 1024,
});

function buildRateLimiter(max: number): RateLimitRequestHandler {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError());
    },
  });
}

export const globalRateLimiter = buildRateLimiter(env.RATE_LIMIT_MAX);

// Stricter limit for auth endpoints (brute-force protection).
// Default: 10 attempts per 15-min window.
export const authRateLimiter = buildRateLimiter(env.AUTH_RATE_LIMIT_MAX);
