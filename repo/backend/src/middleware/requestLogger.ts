import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startAt) / 1e6;
    const level =
      res.statusCode >= 500
        ? 'error'
        : res.statusCode >= 400
          ? 'warn'
          : 'info';

    logger[level]({
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  });

  next();
}
