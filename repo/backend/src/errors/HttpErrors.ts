import { ZodError, type ZodIssue } from 'zod';
import { AppError } from './AppError';

export class BadRequestError extends AppError {
  readonly statusCode = 400;
  readonly errorCode: string;

  constructor(message: string, code = 'BAD_REQUEST') {
    super(message);
    this.errorCode = code;
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'UNAUTHORIZED';

  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'FORBIDDEN';

  constructor(message = 'Insufficient permissions') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode: string;

  constructor(resource: string, identifier?: string) {
    const msg = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(msg);
    this.errorCode = 'NOT_FOUND';
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode: string;

  constructor(message: string, code = 'CONFLICT') {
    super(message);
    this.errorCode = code;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'VALIDATION_ERROR';
  readonly issues: ZodIssue[];

  constructor(zodError: ZodError) {
    super('Validation failed');
    this.issues = zodError.issues;
  }
}

export class UnprocessableError extends AppError {
  readonly statusCode = 422;
  readonly errorCode: string;

  constructor(message: string, code = 'UNPROCESSABLE') {
    super(message);
    this.errorCode = code;
  }
}

export class TooManyRequestsError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_EXCEEDED';

  constructor(message = 'Too many requests') {
    super(message);
  }
}

export class InternalError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_ERROR';
  readonly isOperational = false;

  constructor(message = 'An unexpected error occurred') {
    super(message);
  }
}
