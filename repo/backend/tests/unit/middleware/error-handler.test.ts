import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError, ZodIssue } from 'zod';

vi.mock('../../../src/config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { errorHandler } from '../../../src/middleware/error-handler.middleware';
import {
  AppError,
  BadRequestError,
  NotFoundError,
  ValidationError,
} from '../../../src/shared/errors';

function mockReq() {
  return { id: 'req-123' } as any;
}

function mockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

const next = vi.fn();

describe('errorHandler middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles AppError with correct status and response', () => {
    const err = new NotFoundError('User not found');
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  });

  it('handles BadRequestError', () => {
    const err = new BadRequestError('Invalid input');
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'BAD_REQUEST' }),
      }),
    );
  });

  it('handles ValidationError and includes issues in details', () => {
    const issues = [{ code: 'invalid_type', path: ['name'], message: 'Required' }] as any;
    const err = new ValidationError(issues);
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: issues,
      },
    });
  });

  it('handles unknown Error with 500', () => {
    const err = new Error('Something went wrong');
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  it('never leaks stack trace in response', () => {
    const err = new Error('secret info');
    err.stack = 'Error: secret info\n    at something.ts:42';
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(JSON.stringify(jsonArg)).not.toContain('secret info');
    expect(JSON.stringify(jsonArg)).not.toContain('something.ts');
  });

  it('handles ZodError by converting to ValidationError', () => {
    const zodIssues: ZodIssue[] = [
      {
        code: 'invalid_type',
        path: ['email'],
        message: 'Expected string, received number',
        expected: 'string',
        received: 'number',
      },
    ];
    const err = new ZodError(zodIssues);
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: zodIssues,
        }),
      }),
    );
  });
});
