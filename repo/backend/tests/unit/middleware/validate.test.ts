import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../../../src/middleware/validate.middleware';
import { ValidationError } from '../../../src/shared/errors';

function mockReq(overrides: any = {}) {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as any;
}

function mockRes() {
  return {} as any;
}

describe('validate middleware', () => {
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('body validation', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('passes through when body is valid', () => {
      const req = mockReq({ body: { name: 'John', age: 30 } });
      const middleware = validate({ body: schema });

      middleware(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
    });

    it('throws ValidationError when body is invalid', () => {
      const req = mockReq({ body: { name: 123 } });
      const middleware = validate({ body: schema });

      expect(() => middleware(req, mockRes(), next)).toThrow(ValidationError);
      expect(next).not.toHaveBeenCalled();
    });

    it('replaces req.body with validated data (strips unknown fields)', () => {
      const req = mockReq({ body: { name: 'John', age: 30, extra: 'field' } });
      const middleware = validate({ body: schema });

      middleware(req, mockRes(), next);

      expect(req.body).toEqual({ name: 'John', age: 30 });
      expect(req.body.extra).toBeUndefined();
    });
  });

  describe('query validation', () => {
    const querySchema = z.object({
      search: z.string().optional(),
      page: z.string().optional(),
    });

    it('passes through when query is valid', () => {
      const req = mockReq({ query: { search: 'test', page: '1' } });
      const middleware = validate({ query: querySchema });

      middleware(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
    });

    it('throws ValidationError when query is invalid', () => {
      const strictQuerySchema = z.object({
        page: z.coerce.number().min(1),
      });
      const req = mockReq({ query: { page: 'not-a-number' } });
      const middleware = validate({ query: strictQuerySchema });

      expect(() => middleware(req, mockRes(), next)).toThrow(ValidationError);
    });

    it('replaces req.query with validated data', () => {
      const req = mockReq({ query: { search: 'test', unknown: 'value' } });
      const middleware = validate({ query: querySchema });

      middleware(req, mockRes(), next);

      expect(req.query).toEqual({ search: 'test' });
    });
  });

  describe('params validation', () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    it('passes through when params are valid', () => {
      const req = mockReq({ params: { id: '550e8400-e29b-41d4-a716-446655440000' } });
      const middleware = validate({ params: paramsSchema });

      middleware(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
    });

    it('throws ValidationError when params are invalid', () => {
      const req = mockReq({ params: { id: 'not-a-uuid' } });
      const middleware = validate({ params: paramsSchema });

      expect(() => middleware(req, mockRes(), next)).toThrow(ValidationError);
    });
  });

  describe('no schemas', () => {
    it('passes through when no schemas are provided', () => {
      const req = mockReq({ body: { anything: true } });
      const middleware = validate({});

      middleware(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
