import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAgent,
  loginAs,
  assertSuccess,
  assertError,
  assertPaginated,
  mockUsersService,
} from './helpers/setup';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleUser = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  username: 'newuser',
  displayName: 'New User',
  email: 'new@test.com',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  roles: [{ id: 'r1', name: 'STANDARD_USER', description: 'Standard' }],
};

describe('GET /api/v1/users', () => {
  it('should return 200 with paginated users as admin', async () => {
    mockUsersService.findAll.mockResolvedValue({
      data: [sampleUser],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/users');

    assertPaginated(res, 200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('username', 'newuser');
  });

  it('should return 403 as non-admin (STANDARD_USER)', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get('/api/v1/users');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 as ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.get('/api/v1/users');

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().get('/api/v1/users');
    assertError(res, 401, 'UNAUTHORIZED');
  });

  it('should pass search param to service', async () => {
    mockUsersService.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/users?search=john');

    expect(mockUsersService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'john' }),
    );
  });

  it('should pass pagination params to service', async () => {
    mockUsersService.findAll.mockResolvedValue({
      data: [],
      meta: { page: 2, pageSize: 10, total: 15, totalPages: 2 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/users?page=2&pageSize=10');

    expect(mockUsersService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10 }),
    );
  });
});

describe('POST /api/v1/users', () => {
  const validCreatePayload = {
    username: 'newuser',
    email: 'new@test.com',
    password: 'StrongP@ss1',
    displayName: 'New User',
    roleName: 'STANDARD_USER',
  };

  it('should return 201 with created user as admin', async () => {
    mockUsersService.create.mockResolvedValue(sampleUser);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/users').send(validCreatePayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('username', 'newuser');
    expect(mockUsersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'newuser' }),
      expect.any(String),
    );
  });

  it('should return 409 when email is duplicate (service throws ConflictError)', async () => {
    const { ConflictError } = await import('../../src/shared/errors');
    mockUsersService.create.mockRejectedValue(
      new ConflictError('User with this email already exists'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/users').send(validCreatePayload);

    assertError(res, 409, 'CONFLICT');
  });

  it('should return 422 with weak password (no uppercase)', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/users').send({
      ...validCreatePayload,
      password: 'weakpass1!',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with password too short', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/users').send({
      ...validCreatePayload,
      password: 'Sh1!',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with password missing special character', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/users').send({
      ...validCreatePayload,
      password: 'StrongPass1',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with invalid email', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/users').send({
      ...validCreatePayload,
      email: 'not-an-email',
    });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 with missing username', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const { username, ...rest } = validCreatePayload;
    const res = await agent.post('/api/v1/users').send(rest);

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 403 as non-admin', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.post('/api/v1/users').send(validCreatePayload);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().post('/api/v1/users').send(validCreatePayload);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

describe('GET /api/v1/users/:id', () => {
  it('should return 200 with user as admin', async () => {
    mockUsersService.findById.mockResolvedValue(sampleUser);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get(`/api/v1/users/${sampleUser.id}`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('id', sampleUser.id);
  });

  it('should return 404 when user does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockUsersService.findById.mockRejectedValue(new NotFoundError('User not found'));

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get('/api/v1/users/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff');

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 403 as non-admin', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/users/${sampleUser.id}`);

    assertError(res, 403, 'FORBIDDEN');
  });
});

describe('PATCH /api/v1/users/:id/deactivate', () => {
  it('should return 200 when admin deactivates user', async () => {
    mockUsersService.deactivate.mockResolvedValue({
      ...sampleUser,
      isActive: false,
      deactivatedAt: new Date().toISOString(),
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.patch(`/api/v1/users/${sampleUser.id}/deactivate`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('isActive', false);
    expect(mockUsersService.deactivate).toHaveBeenCalledWith(sampleUser.id, expect.any(String));
  });

  it('should return 403 as non-admin', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.patch(`/api/v1/users/${sampleUser.id}/deactivate`);

    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 404 for non-existent user', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockUsersService.deactivate.mockRejectedValue(new NotFoundError('User not found'));

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.patch('/api/v1/users/aaaaaaaa-bbbb-cccc-dddd-ffffffffffff/deactivate');

    assertError(res, 404, 'NOT_FOUND');
  });
});
