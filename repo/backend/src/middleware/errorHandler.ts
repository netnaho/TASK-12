/**
 * Global error handler — MUST be the last middleware in the chain.
 *
 * Security guarantees:
 *   - Stack traces are NEVER returned in responses (any env).
 *   - In production, unknown errors produce a generic message.
 *   - In development, the raw message (but NOT the stack) is forwarded.
 *   - All errors are logged server-side with full detail.
 */
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { AppError as SharedAppError } from '../shared/errors/app-error';
import { logger } from '../logging/logger';
import { env } from '../config/env';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── New-style errors (errors/AppError) ──────────────────────────────
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ requestId: req.id, err }, 'Non-operational error');
    } else {
      logger.warn({
        requestId: req.id,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        message: err.message,
      });
    }

    const body: ErrorResponse = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: (err as AppError & { details?: unknown }).details,
      },
      requestId: req.id,
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Old-style errors (shared/errors/AppError) ───────────────────────
  if (err instanceof SharedAppError) {
    logger.warn({
      requestId: req.id,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
    });

    const body: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: (err as SharedAppError & { issues?: unknown }).issues,
      },
      requestId: req.id,
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Unknown / programmer errors ─────────────────────────────────────
  logger.error({ requestId: req.id, err }, 'Unhandled error');

  const body: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      // Never leak internal details in production
      message:
        env.NODE_ENV === 'development'
          ? err.message
          : 'An unexpected error occurred',
    },
    requestId: req.id,
  };

  res.status(500).json(body);
}
