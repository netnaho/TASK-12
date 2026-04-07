import { describe, it, expect } from 'vitest';
import { parsePagination, buildMeta } from '../../src/shared/utils/pagination.util';

describe('parsePagination', () => {
  it('returns defaults when no params provided', () => {
    const result = parsePagination({});
    expect(result).toEqual({
      skip: 0,
      take: 20,
      page: 1,
      pageSize: 20,
    });
  });

  it('uses custom page and pageSize', () => {
    const result = parsePagination({ page: '3', pageSize: '50' });
    expect(result).toEqual({
      skip: 100, // (3-1) * 50
      take: 50,
      page: 3,
      pageSize: 50,
    });
  });

  it('accepts numeric values', () => {
    const result = parsePagination({ page: 2, pageSize: 10 });
    expect(result).toEqual({
      skip: 10,
      take: 10,
      page: 2,
      pageSize: 10,
    });
  });

  it('caps pageSize at 100', () => {
    const result = parsePagination({ page: '1', pageSize: '200' });
    expect(result.pageSize).toBe(100);
    expect(result.take).toBe(100);
  });

  it('handles negative page - resets to default', () => {
    const result = parsePagination({ page: '-1', pageSize: '10' });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('handles zero page - resets to default', () => {
    const result = parsePagination({ page: '0', pageSize: '10' });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('handles negative pageSize - resets to default', () => {
    const result = parsePagination({ page: '1', pageSize: '-5' });
    expect(result.pageSize).toBe(20);
  });

  it('handles zero pageSize - resets to default', () => {
    const result = parsePagination({ page: '1', pageSize: '0' });
    expect(result.pageSize).toBe(20);
  });

  it('handles non-numeric strings - resets to defaults', () => {
    const result = parsePagination({ page: 'abc', pageSize: 'xyz' });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});

describe('buildMeta', () => {
  it('calculates totalPages correctly', () => {
    const meta = buildMeta(100, 1, 20);
    expect(meta).toEqual({
      page: 1,
      pageSize: 20,
      total: 100,
      totalPages: 5,
    });
  });

  it('rounds up totalPages', () => {
    const meta = buildMeta(101, 1, 20);
    expect(meta.totalPages).toBe(6); // ceil(101/20)
  });

  it('handles 0 total', () => {
    const meta = buildMeta(0, 1, 20);
    expect(meta.totalPages).toBe(0);
  });

  it('handles single item', () => {
    const meta = buildMeta(1, 1, 20);
    expect(meta.totalPages).toBe(1);
  });

  it('preserves page and pageSize', () => {
    const meta = buildMeta(50, 3, 10);
    expect(meta.page).toBe(3);
    expect(meta.pageSize).toBe(10);
    expect(meta.total).toBe(50);
    expect(meta.totalPages).toBe(5);
  });
});
