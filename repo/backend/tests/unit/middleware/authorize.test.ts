/**
 * Tests for the authorize middleware — requireRole, requirePermission, requireAnyPermission.
 */
import { describe, it, expect, vi } from 'vitest';
import { requireRole, requirePermission, requireAnyPermission } from '../../../src/middleware/authorize';
import type { Request, Response, NextFunction } from 'express';

function makeReq(user?: { roles: string[]; permissions: string[] }): Request {
  return { user } as unknown as Request;
}

const mockRes = {} as Response;

describe('requireRole', () => {
  it('calls next() when user has the required role', () => {
    const next = vi.fn();
    const middleware = requireRole('SYSTEM_ADMIN' as any);
    middleware(makeReq({ roles: ['SYSTEM_ADMIN'], permissions: [] }), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when user lacks the role', () => {
    const next = vi.fn();
    const middleware = requireRole('SYSTEM_ADMIN' as any);
    middleware(makeReq({ roles: ['ANALYST'], permissions: [] }), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('calls next(UnauthorizedError) when req.user is absent', () => {
    const next = vi.fn();
    const middleware = requireRole('SYSTEM_ADMIN' as any);
    middleware(makeReq(undefined), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('accepts any of multiple roles', () => {
    const next = vi.fn();
    const middleware = requireRole('SYSTEM_ADMIN' as any, 'ANALYST' as any);
    middleware(makeReq({ roles: ['ANALYST'], permissions: [] }), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('requirePermission', () => {
  it('calls next() when user has all required permissions', () => {
    const next = vi.fn();
    const middleware = requirePermission('reports:read' as any, 'reports:export' as any);
    middleware(
      makeReq({ roles: [], permissions: ['reports:read', 'reports:export'] }),
      mockRes,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when user lacks one permission', () => {
    const next = vi.fn();
    const middleware = requirePermission('reports:read' as any, 'reports:export' as any);
    middleware(makeReq({ roles: [], permissions: ['reports:read'] }), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('calls next(UnauthorizedError) when req.user is absent', () => {
    const next = vi.fn();
    const middleware = requirePermission('reports:read' as any);
    middleware(makeReq(undefined), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('requireAnyPermission', () => {
  it('calls next() when user has at least one permission', () => {
    const next = vi.fn();
    const middleware = requireAnyPermission('reports:read' as any, 'reports:export' as any);
    middleware(makeReq({ roles: [], permissions: ['reports:read'] }), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when user has none of the permissions', () => {
    const next = vi.fn();
    const middleware = requireAnyPermission('reports:read' as any);
    middleware(makeReq({ roles: [], permissions: [] }), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('calls next(UnauthorizedError) when req.user is absent', () => {
    const next = vi.fn();
    const middleware = requireAnyPermission('reports:read' as any);
    middleware(makeReq(undefined), mockRes, next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
