import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants';
import type { PaginationMeta, PaginationParams } from '../domain/types';

export function parsePagination(query: {
  page?: unknown;
  pageSize?: unknown;
  limit?: unknown;
}): PaginationParams {
  const rawPage = Number(query.page ?? 1);
  const rawSize = Number(query.pageSize ?? query.limit ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize = Number.isFinite(rawSize) && rawSize >= 1
    ? Math.min(Math.floor(rawSize), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
