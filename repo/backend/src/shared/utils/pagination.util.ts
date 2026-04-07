import { PaginatedMeta } from '../types/response.types';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}

export function parsePagination(query: {
  page?: string | number;
  pageSize?: string | number;
}): PaginationParams {
  let page = Number(query.page) || DEFAULT_PAGE;
  let pageSize = Number(query.pageSize) || DEFAULT_PAGE_SIZE;

  if (page < 1) page = DEFAULT_PAGE;
  if (pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

export function buildMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginatedMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
