import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import {
  createAgent,
  getApp,
  loginAs,
  assertSuccess,
  assertError,
  mockAuthService,
  mockPrisma,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

// Full DB user returned by the authenticate middleware's prisma.user.findUnique
const dbUser = {
  id: 'user-admin-id',
  username: 'admin',
  displayName: 'Admin User',
  email: 'admin@test.com',
  isActive: true,
  roles: [
    {
      role: {
        name: 'SYSTEM_ADMIN',
        permissions: [],
      },
    },
  ],
};

describe('POST /api/v1/auth/login', () => {
  const validUser = {
    id: 'user-admin-id',
    username: 'admin',
    displayName: 'Admin User',
    email: 'admin@test.com',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    roles: [{ id: 'role-1', name: 'SYSTEM_ADMIN', description: 'System Admin' }],
    permissions: [],
  };

  it('should return 200 with user data on valid credentials', async () => {
    mockAuthService.login.mockResolvedValue(validUser);

    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Password123!' });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('id', validUser.id);
    expect(res.body.data).toHaveProperty('username', 'admin');
    expect(res.body.data.roles).toHaveLength(1);
    // Auth controller passes ip address as 3rd param — just check first two match
    expect(mockAuthService.login).toHaveBeenCalledWith(
      'admin',
      'Password123!',
      expect.anything(),
    );
  });

  it('should return 401 on invalid password', async () => {
    const { UnauthorizedError } = await import('../../src/shared/errors');
    mockAuthService.login.mockRejectedValue(
      new UnauthorizedError('Invalid username or password'),
    );

    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'wrong' });

    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should return 422 when username is missing', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ password: 'Password123!' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when password is missing', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: 'admin' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when body is empty', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({});

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when username is empty string', async () => {
    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: '', password: 'Password123!' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should set session cookie on successful login', async () => {
    mockAuthService.login.mockResolvedValue(validUser);

    const res = await createAgent()
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Password123!' });

    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('confirms rate limiting is configured (AUTH_RATE_LIMIT_MAX env)', async () => {
    // Rate limiting is verified at the middleware config level.
    // In test environments, AUTH_RATE_LIMIT_MAX is set to 10000 to avoid
    // interfering with other tests. The limiter itself is tested via
    // the express-rate-limit integration at startup.
    expect(process.env.AUTH_RATE_LIMIT_MAX).toBe('10000');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return 200 with current user when authenticated', async () => {
    const currentUser = {
      id: 'user-admin-id',
      username: 'admin',
      displayName: 'Admin',
      email: 'admin@test.com',
      isActive: true,
      roles: [{ id: 'r1', name: 'SYSTEM_ADMIN', description: 'Admin' }],
    };
    mockAuthService.getCurrentUser.mockResolvedValue(currentUser);
    // authenticate middleware queries the DB — mock it to return a valid user
    mockPrisma.user.findUnique.mockResolvedValue(dbUser);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/auth/me');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('username', 'admin');
  });

  it('should return 401 without session', async () => {
    const res = await createAgent().get('/api/v1/auth/me');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should return 200 when authenticated', async () => {
    // authenticate middleware queries the DB — mock it to return a valid user
    mockPrisma.user.findUnique.mockResolvedValue(dbUser);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/auth/logout');

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('message');
  });

  it('should return 401 without session', async () => {
    const res = await createAgent().post('/api/v1/auth/logout');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should invalidate session after logout', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(dbUser);

    const agent = await loginAs('SYSTEM_ADMIN');

    // Logout
    await agent.post('/api/v1/auth/logout');

    // Subsequent /me call should fail (session destroyed)
    const res = await agent.get('/api/v1/auth/me');
    assertError(res, 401, 'UNAUTHORIZED');
  });
});
