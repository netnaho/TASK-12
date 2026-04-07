/**
 * Tests for HTTP error classes — verify status codes, error codes, and messages.
 */
import { describe, it, expect } from 'vitest';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableError,
  TooManyRequestsError,
  InternalError,
} from '../../../src/errors/HttpErrors';

describe('BadRequestError', () => {
  it('has statusCode 400 and default code BAD_REQUEST', () => {
    const err = new BadRequestError('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('BAD_REQUEST');
    expect(err.message).toBe('Invalid input');
  });

  it('accepts custom error code', () => {
    const err = new BadRequestError('Oops', 'CUSTOM_CODE');
    expect(err.errorCode).toBe('CUSTOM_CODE');
  });
});

describe('UnauthorizedError', () => {
  it('has statusCode 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.errorCode).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Authentication required');
  });

  it('accepts custom message', () => {
    const err = new UnauthorizedError('Please log in');
    expect(err.message).toBe('Please log in');
  });
});

describe('ForbiddenError', () => {
  it('has statusCode 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.errorCode).toBe('FORBIDDEN');
    expect(err.message).toBe('Insufficient permissions');
  });

  it('accepts custom message', () => {
    const err = new ForbiddenError('Admin only');
    expect(err.message).toBe('Admin only');
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404 with resource name only', () => {
    const err = new NotFoundError('User');
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
    expect(err.message).toBe('User not found');
  });

  it('includes identifier in message when provided', () => {
    const err = new NotFoundError('User', '123');
    expect(err.message).toBe("User with identifier '123' not found");
  });
});

describe('ConflictError', () => {
  it('has statusCode 409 and default code CONFLICT', () => {
    const err = new ConflictError('Already exists');
    expect(err.statusCode).toBe(409);
    expect(err.errorCode).toBe('CONFLICT');
  });

  it('accepts custom code', () => {
    const err = new ConflictError('Dup', 'DUPLICATE_EMAIL');
    expect(err.errorCode).toBe('DUPLICATE_EMAIL');
  });
});

describe('UnprocessableError', () => {
  it('has statusCode 422', () => {
    const err = new UnprocessableError('Validation failed');
    expect(err.statusCode).toBe(422);
    expect(err.errorCode).toBe('UNPROCESSABLE');
  });
});

describe('TooManyRequestsError', () => {
  it('has statusCode 429', () => {
    const err = new TooManyRequestsError();
    expect(err.statusCode).toBe(429);
    expect(err.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    expect(err.message).toBe('Too many requests');
  });

  it('accepts custom message', () => {
    const err = new TooManyRequestsError('Slow down');
    expect(err.message).toBe('Slow down');
  });
});

describe('InternalError', () => {
  it('has statusCode 500 and isOperational false', () => {
    const err = new InternalError();
    expect(err.statusCode).toBe(500);
    expect(err.errorCode).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(false);
    expect(err.message).toBe('An unexpected error occurred');
  });

  it('accepts custom message', () => {
    const err = new InternalError('Something went wrong');
    expect(err.message).toBe('Something went wrong');
  });
});
