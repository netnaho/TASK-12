import type { Response } from 'express';
import type { PaginationMeta } from '../domain/types';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
): void {
  res.status(statusCode).json({ success: true, data } satisfies ApiSuccessResponse<T>);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
): void {
  res
    .status(200)
    .json({ success: true, data, meta } satisfies ApiSuccessResponse<T[]>);
}
