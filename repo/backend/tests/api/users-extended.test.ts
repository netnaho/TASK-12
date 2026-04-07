/**
 * Extended API tests for users: role assignment, deactivation, search,
 * password rules, and edge cases not covered by users.test.ts.
 */
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

// ─── POST /api/v1/users — create ──────────────────────────────────────────────

describe('POST /api/v1/users', () => {
  const validPayload = {
    username: 'newuser',
    password: 'SecurePass123!',
    email: 'new@test.com',
    displayName: 'New User',
    roleName: 'STANDARD_USER',
  };

  it('should return 201 for SYSTEM_ADMIN with valid payload', async () => {
    mockUsersService.create.mockResolvedValue(sampleUser);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/users').send(validPayload);

    assertSuccess(res, 201);
    expect(res.body.data).toHaveProperty('username', 'newuser');
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.post('/api/v1/users').send(validPayload);
    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 403 for ANALYST', async () => {
    const agent = await loginAs('ANALYST');
    const res = await agent.post('/api/v1/users').send(validPayload);
    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 422 when username is missing', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/users')
      .send({ ...validPayload, username: undefined });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 for invalid email format', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/users')
      .send({ ...validPayload, email: 'not-an-email' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 422 when password is too short', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post('/api/v1/users')
      .send({ ...validPayload, password: 'abc' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 409 when username already exists', async () => {
    const { ConflictError } = await import('../../src/shared/errors');
    mockUsersService.create.mockRejectedValue(
      new ConflictError('Username already taken'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.post('/api/v1/users').send(validPayload);

    assertError(res, 409, 'CONFLICT');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().post('/api/v1/users').send(validPayload);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── GET /api/v1/users/:id ────────────────────────────────────────────────────

describe('GET /api/v1/users/:id', () => {
  const userId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for admin', async () => {
    mockUsersService.findById.mockResolvedValue(sampleUser);

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get(`/api/v1/users/${userId}`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('email', 'new@test.com');
  });

  it('should return 404 when user does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockUsersService.findById.mockRejectedValue(new NotFoundError('User not found'));

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.get(`/api/v1/users/${userId}`);

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 403 for STANDARD_USER', async () => {
    const agent = await loginAs('STANDARD_USER');
    const res = await agent.get(`/api/v1/users/${userId}`);
    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── PATCH /api/v1/users/:id ──────────────────────────────────────────────────

describe('PUT /api/v1/users/:id', () => {
  const userId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 when admin updates display name', async () => {
    mockUsersService.update.mockResolvedValue({ ...sampleUser, displayName: 'Updated Name' });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put(`/api/v1/users/${userId}`)
      .send({ displayName: 'Updated Name' });

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('displayName', 'Updated Name');
  });

  it('should return 422 for invalid email in update', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .put(`/api/v1/users/${userId}`)
      .send({ email: 'not-valid' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });
});

// ─── POST /api/v1/users/:id/roles ─────────────────────────────────────────────

describe('POST /api/v1/users/:id/roles', () => {
  const userId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 when admin assigns a valid role', async () => {
    mockUsersService.assignRole.mockResolvedValue({
      ...sampleUser,
      roles: [
        { id: 'r1', name: 'STANDARD_USER', description: 'Standard' },
        { id: 'r2', name: 'ANALYST', description: 'Analyst' },
      ],
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/users/${userId}/roles`)
      .send({ roleName: 'ANALYST' });

    assertSuccess(res, 200);
  });

  it('should return 400 when role is already assigned', async () => {
    const { BadRequestError } = await import('../../src/shared/errors');
    mockUsersService.assignRole.mockRejectedValue(
      new BadRequestError('Role STANDARD_USER is already assigned to this user'),
    );

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/users/${userId}/roles`)
      .send({ roleName: 'STANDARD_USER' });

    assertError(res, 400, 'BAD_REQUEST');
  });

  it('should return 422 for invalid roleName value', async () => {
    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent
      .post(`/api/v1/users/${userId}/roles`)
      .send({ roleName: 'SUPER_ADMIN' });

    assertError(res, 422, 'VALIDATION_ERROR');
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent
      .post(`/api/v1/users/${userId}/roles`)
      .send({ roleName: 'ANALYST' });

    assertError(res, 403, 'FORBIDDEN');
  });
});

// ─── PATCH /api/v1/users/:id/deactivate ──────────────────────────────────────

describe('PATCH /api/v1/users/:id/deactivate', () => {
  const userId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('should return 200 for admin', async () => {
    mockUsersService.deactivate.mockResolvedValue({ ...sampleUser, isActive: false });

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.patch(`/api/v1/users/${userId}/deactivate`);

    assertSuccess(res, 200);
    expect(res.body.data).toHaveProperty('isActive', false);
  });

  it('should return 403 for LEASING_OPS_MANAGER', async () => {
    const agent = await loginAs('LEASING_OPS_MANAGER');
    const res = await agent.patch(`/api/v1/users/${userId}/deactivate`);
    assertError(res, 403, 'FORBIDDEN');
  });

  it('should return 404 when user does not exist', async () => {
    const { NotFoundError } = await import('../../src/shared/errors');
    mockUsersService.deactivate.mockRejectedValue(new NotFoundError('User not found'));

    const agent = await loginAs('SYSTEM_ADMIN');
    const res = await agent.patch(`/api/v1/users/${userId}/deactivate`);

    assertError(res, 404, 'NOT_FOUND');
  });

  it('should return 401 without authentication', async () => {
    const res = await createAgent().patch(`/api/v1/users/${userId}/deactivate`);
    assertError(res, 401, 'UNAUTHORIZED');
  });
});

// ─── GET /api/v1/users with filters ──────────────────────────────────────────

describe('GET /api/v1/users — filtering and pagination', () => {
  it('should filter by role', async () => {
    mockUsersService.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/users?role=ANALYST');

    expect(mockUsersService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ANALYST' }),
    );
  });

  it('should filter inactive users', async () => {
    mockUsersService.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const agent = await loginAs('SYSTEM_ADMIN');
    await agent.get('/api/v1/users?isActive=false');

    expect(mockUsersService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });
});
