import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginationMeta } from '../../../src/utils/pagination';

describe('parsePagination', () => {
  it('returns defaults when query is empty', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBeGreaterThan(0);
    expect(result.skip).toBe(0);
    expect(result.take).toBeGreaterThan(0);
  });

  it('parses valid page and pageSize', () => {
    const result = parsePagination({ page: 3, pageSize: 10 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.skip).toBe(20);
    expect(result.take).toBe(10);
  });

  it('clamps page to 1 for page=0', () => {
    const result = parsePagination({ page: 0 });
    expect(result.page).toBe(1);
  });

  it('clamps page to 1 for negative page', () => {
    const result = parsePagination({ page: -5 });
    expect(result.page).toBe(1);
  });

  it('clamps pageSize to MAX_PAGE_SIZE when too large', () => {
    const result = parsePagination({ pageSize: 9999 });
    expect(result.pageSize).toBeLessThanOrEqual(200);
  });

  it('falls back to default pageSize when pageSize=0', () => {
    const result = parsePagination({ pageSize: 0 });
    expect(result.pageSize).toBeGreaterThan(0);
  });

  it('accepts string values by coercing to number', () => {
    const result = parsePagination({ page: '2', pageSize: '15' } as any);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(15);
  });

  it('supports limit as alias for pageSize', () => {
    const result = parsePagination({ limit: 5 });
    expect(result.pageSize).toBe(5);
  });

  it('pageSize takes precedence over limit', () => {
    const result = parsePagination({ pageSize: 8, limit: 20 });
    expect(result.pageSize).toBe(8);
  });

  it('calculates skip correctly for page 2 size 25', () => {
    const result = parsePagination({ page: 2, pageSize: 25 });
    expect(result.skip).toBe(25);
  });
});

describe('buildPaginationMeta', () => {
  it('computes totalPages correctly', () => {
    const meta = buildPaginationMeta(50, 1, 10);
    expect(meta.totalPages).toBe(5);
  });

  it('rounds up totalPages for partial last page', () => {
    const meta = buildPaginationMeta(51, 1, 10);
    expect(meta.totalPages).toBe(6);
  });

  it('returns totalPages=1 when total=0', () => {
    const meta = buildPaginationMeta(0, 1, 20);
    expect(meta.totalPages).toBe(1);
  });

  it('hasNextPage is true when not on last page', () => {
    const meta = buildPaginationMeta(100, 1, 20);
    expect(meta.hasNextPage).toBe(true);
  });

  it('hasNextPage is false on last page', () => {
    const meta = buildPaginationMeta(100, 5, 20);
    expect(meta.hasNextPage).toBe(false);
  });

  it('hasPreviousPage is false on first page', () => {
    const meta = buildPaginationMeta(100, 1, 20);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('hasPreviousPage is true on page > 1', () => {
    const meta = buildPaginationMeta(100, 3, 20);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('returns correct total and page values', () => {
    const meta = buildPaginationMeta(42, 2, 15);
    expect(meta.total).toBe(42);
    expect(meta.page).toBe(2);
    expect(meta.pageSize).toBe(15);
  });
});
