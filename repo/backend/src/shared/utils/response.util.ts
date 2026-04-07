import { ApiResponse, PaginatedMeta } from '../types/response.types';

export function success<T>(data: T, meta?: PaginatedMeta): ApiResponse<T> {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

export function created<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function paginated<T>(data: T, meta: PaginatedMeta): ApiResponse<T> {
  return { success: true, data, meta };
}
