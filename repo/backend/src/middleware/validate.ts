import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, type ZodSchema } from 'zod';
import { ValidationError } from '../errors';

interface ValidateSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidateSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new ValidationError(err));
      } else {
        next(err);
      }
    }
  };
}
