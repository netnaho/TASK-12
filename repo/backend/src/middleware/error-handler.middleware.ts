import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../logging/logger';
import {
  AppError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../shared/errors';
import { ApiErrorResponse } from '../shared/types/response.types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ZodError -> ValidationError
  if (err instanceof ZodError) {
    const validationError = new ValidationError(err.issues);
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: validationError.code,
        message: validationError.message,
        details: validationError.issues,
      },
    };

    logger.warn(
      { requestId: req.id, code: validationError.code, issues: err.issues },
      validationError.message,
    );

    res.status(validationError.statusCode).json(response);
    return;
  }

  // Prisma unique constraint violation
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  ) {
    const conflictError = new ConflictError('Resource already exists');
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: conflictError.code,
        message: conflictError.message,
      },
    };

    logger.warn(
      { requestId: req.id, code: conflictError.code, prismaCode: err.code },
      conflictError.message,
    );

    res.status(conflictError.statusCode).json(response);
    return;
  }

  // Prisma record not found
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2025'
  ) {
    const notFoundError = new NotFoundError('Resource not found');
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: notFoundError.code,
        message: notFoundError.message,
      },
    };

    logger.warn(
      { requestId: req.id, code: notFoundError.code, prismaCode: err.code },
      notFoundError.message,
    );

    res.status(notFoundError.statusCode).json(response);
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError
          ? { details: err.issues }
          : {}),
      },
    };

    logger.warn(
      { requestId: req.id, code: err.code, statusCode: err.statusCode },
      err.message,
    );

    res.status(err.statusCode).json(response);
    return;
  }

  // Unknown / unexpected errors
  logger.error(
    { requestId: req.id, err },
    'Unhandled error',
  );

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  res.status(500).json(response);
}
