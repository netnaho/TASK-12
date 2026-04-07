import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../src/shared/errors/index';

describe('Error classes', () => {
  describe('AppError', () => {
    it('has correct properties', () => {
      const err = new AppError('test error', 500, 'TEST_ERROR');
      expect(err.message).toBe('test error');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('TEST_ERROR');
      expect(err.isOperational).toBe(true);
    });

    it('isOperational defaults to true', () => {
      const err = new AppError('msg', 500, 'CODE');
      expect(err.isOperational).toBe(true);
    });

    it('isOperational can be set to false', () => {
      const err = new AppError('msg', 500, 'CODE', false);
      expect(err.isOperational).toBe(false);
    });

    it('is an instance of Error', () => {
      const err = new AppError('msg', 500, 'CODE');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('BadRequestError', () => {
    it('has statusCode 400 and code BAD_REQUEST', () => {
      const err = new BadRequestError();
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.message).toBe('Bad request');
    });

    it('accepts custom message', () => {
      const err = new BadRequestError('custom msg');
      expect(err.message).toBe('custom msg');
    });
  });

  describe('UnauthorizedError', () => {
    it('has statusCode 401 and code UNAUTHORIZED', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Unauthorized');
    });
  });

  describe('ForbiddenError', () => {
    it('has statusCode 403 and code FORBIDDEN', () => {
      const err = new ForbiddenError();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toBe('Forbidden');
    });
  });

  describe('NotFoundError', () => {
    it('has statusCode 404 and code NOT_FOUND', () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Not found');
    });
  });

  describe('ConflictError', () => {
    it('has statusCode 409 and code CONFLICT', () => {
      const err = new ConflictError();
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
      expect(err.message).toBe('Conflict');
    });
  });

  describe('ValidationError', () => {
    it('has statusCode 422 and code VALIDATION_ERROR', () => {
      const err = new ValidationError([]);
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.message).toBe('Validation failed');
    });

    it('stores issues', () => {
      const issues = [
        { code: 'invalid_type', path: ['name'], message: 'Required', expected: 'string', received: 'undefined' },
      ] as any;
      const err = new ValidationError(issues);
      expect(err.issues).toBe(issues);
      expect(err.issues).toHaveLength(1);
    });

    it('accepts custom message', () => {
      const err = new ValidationError([], 'Custom validation msg');
      expect(err.message).toBe('Custom validation msg');
    });

    it('is an instance of AppError', () => {
      const err = new ValidationError([]);
      expect(err).toBeInstanceOf(AppError);
    });
  });
});
