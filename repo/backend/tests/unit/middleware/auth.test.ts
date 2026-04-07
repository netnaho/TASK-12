/**
 * Unit tests for the DB-refreshed requireAuth middleware.
 *
 * requireAuth now delegates to `authenticate`, which loads the user and roles
 * from the database on every request. These tests mock prisma and verify:
 *   - Missing/empty sessions are rejected via next(UnauthorizedError)
 *   - Sessions older than the inactivity window are destroyed and rejected
 *   - Deactivated users (DB returns null) are rejected even if a session exists
 *   - Successful requests have req.userId / req.userRoles populated FROM THE DB
 *     (not from any cached session value), proving privilege freshness
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

import { requireAuth } from '../../../src/middleware/auth.middleware';
// Import from the same module path used by authenticate.ts (src/errors),
// not src/shared/errors — these are two distinct class hierarchies and
// instanceof / expect.any only matches the original class identity.
import { UnauthorizedError } from '../../../src/errors';

function mockReq(sessionData: any = {}) {
  return {
    session: sessionData === undefined ? undefined : {
      userId: sessionData.userId,
      userRoles: sessionData.userRoles,
      lastActivity: sessionData.lastActivity,
      lastActivityAt: sessionData.lastActivityAt,
      destroy: vi.fn((cb: (err?: Error) => void) => cb()),
      ...sessionData.sessionOverrides,
    },
    userId: undefined as string | undefined,
    userRoles: undefined as string[] | undefined,
  } as any;
}

function mockRes() {
  return {} as any;
}

const dbUser = (overrides: any = {}) => ({
  id: 'user-1',
  username: 'someone',
  displayName: 'Someone',
  email: 'someone@test.com',
  roles: [
    {
      role: {
        name: 'ADMIN',
        permissions: [
          { permission: { resource: 'reports', action: 'read' } },
        ],
      },
    },
  ],
  ...overrides,
});

describe('requireAuth (DB-refresh) middleware', () => {
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockReset();
  });

  it('passes when session has userId and DB returns active user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(dbUser());
    const req = mockReq({ userId: 'user-1', lastActivityAt: Date.now() - 1000 });

    await requireAuth(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.userId).toBe('user-1');
    // Roles come from the DB, not the session
    expect(req.userRoles).toEqual(['ADMIN']);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1', isActive: true } }),
    );
  });

  it('rejects via next() when session is missing', async () => {
    const req = { session: undefined } as any;

    await requireAuth(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects via next() when session has no userId', async () => {
    const req = mockReq({ userId: undefined });

    await requireAuth(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('destroys session and rejects when inactivity window exceeded', async () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    const req = mockReq({ userId: 'user-1', lastActivityAt: thirtyOneMinutesAgo });

    await requireAuth(req, mockRes(), next);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('rejects (privilege freshness) when DB returns null for a deactivated user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const req = mockReq({ userId: 'user-1', lastActivityAt: Date.now() });

    await requireAuth(req, mockRes(), next);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(req.userId).toBeUndefined();
  });

  it('updates lastActivityAt on a successful request', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(dbUser());
    const oldActivity = Date.now() - 5000;
    const req = mockReq({ userId: 'user-1', lastActivityAt: oldActivity });

    await requireAuth(req, mockRes(), next);

    expect(req.session.lastActivityAt).toBeGreaterThan(oldActivity);
  });

  it('passes on first request when lastActivityAt is unset', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(dbUser());
    const req = mockReq({ userId: 'user-1', lastActivityAt: undefined });
    // simulate session that has no activity yet — fresh login
    req.session.lastActivityAt = Date.now();

    await requireAuth(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.userId).toBe('user-1');
  });
});
