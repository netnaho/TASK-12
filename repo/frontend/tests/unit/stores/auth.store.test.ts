import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock the auth API module BEFORE importing the store so the store picks up
// the mocked versions of login/logout/getCurrentUser.
vi.mock('@/api/endpoints/auth.api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

import { useAuthStore } from '@/stores/auth.store';
import * as authApi from '@/api/endpoints/auth.api';

const mockedLogin = authApi.login as unknown as ReturnType<typeof vi.fn>;
const mockedLogout = authApi.logout as unknown as ReturnType<typeof vi.fn>;
const mockedGetCurrentUser = authApi.getCurrentUser as unknown as ReturnType<typeof vi.fn>;

describe('stores/auth.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('starts unauthenticated', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('login populates user and normalizes role objects to strings', async () => {
    mockedLogin.mockResolvedValue({
      data: {
        data: {
          id: 'u1',
          username: 'admin',
          email: 'admin@test.com',
          firstName: 'Ad',
          lastName: 'Min',
          roles: [{ id: 'r1', name: 'SYSTEM_ADMIN' }, { id: 'r2', name: 'ANALYST' }],
        },
      },
    });

    const store = useAuthStore();
    await store.login('admin', 'Password123!');

    expect(mockedLogin).toHaveBeenCalledWith('admin', 'Password123!');
    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.username).toBe('admin');
    expect(store.user?.roles).toEqual(['SYSTEM_ADMIN', 'ANALYST']);
  });

  it('login surfaces errors from the API and keeps user null', async () => {
    mockedLogin.mockRejectedValue(new Error('Invalid credentials'));

    const store = useAuthStore();
    await expect(store.login('bad', 'creds')).rejects.toThrow(/Invalid credentials/);
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    // loading flag must reset even after a failure
    expect(store.loading).toBe(false);
  });

  it('logout clears the user even if the API throws', async () => {
    mockedLogin.mockResolvedValue({
      data: { data: { id: 'u1', username: 'admin', email: '', firstName: '', lastName: '', roles: [] } },
    });
    mockedLogout.mockRejectedValue(new Error('offline'));

    const store = useAuthStore();
    await store.login('admin', 'x');
    expect(store.isAuthenticated).toBe(true);

    await store.logout();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('fetchCurrentUser refreshes the profile from /auth/me', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      data: {
        data: {
          id: 'u1',
          username: 'analyst',
          email: 'analyst@test.com',
          firstName: '',
          lastName: '',
          roles: ['ANALYST'],
        },
      },
    });

    const store = useAuthStore();
    await store.fetchCurrentUser();
    expect(store.user?.username).toBe('analyst');
    expect(store.user?.roles).toEqual(['ANALYST']);
  });

  it('fetchCurrentUser clears user on failure', async () => {
    mockedGetCurrentUser.mockRejectedValue({ statusCode: 401 });

    const store = useAuthStore();
    await store.fetchCurrentUser();
    expect(store.user).toBeNull();
    expect(store.loading).toBe(false);
  });
});
