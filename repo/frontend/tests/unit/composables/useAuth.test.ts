import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@/api/endpoints/auth.api', () => ({
  login: vi.fn().mockResolvedValue({
    data: {
      data: {
        id: 'u1', username: 'admin', email: '', firstName: '', lastName: '',
        roles: [{ id: 'r1', name: 'SYSTEM_ADMIN' }],
      },
    },
  }),
  logout: vi.fn().mockResolvedValue({}),
  getCurrentUser: vi.fn(),
}));

import { useAuth } from '@/composables/useAuth';
import { Role } from '@/types/roles';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('composables/useAuth', () => {
  it('isAuthenticated flips after login and flips back after logout', async () => {
    const auth = useAuth();
    expect(auth.isAuthenticated.value).toBe(false);

    await auth.login('admin', 'Password123!');
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.user.value?.username).toBe('admin');

    await auth.logout();
    expect(auth.isAuthenticated.value).toBe(false);
  });

  it('hasRole returns true for roles the user has', async () => {
    const auth = useAuth();
    await auth.login('admin', 'Password123!');
    expect(auth.hasRole(Role.Admin)).toBe(true);
    expect(auth.hasRole(Role.Analyst)).toBe(false);
  });

  it('hasAnyRole returns true iff any role matches', async () => {
    const auth = useAuth();
    await auth.login('admin', 'Password123!');
    expect(auth.hasAnyRole([Role.Analyst, Role.Admin])).toBe(true);
    expect(auth.hasAnyRole([Role.Analyst, Role.Manager])).toBe(false);
  });

  it('hasRole is false when user is null', () => {
    const auth = useAuth();
    expect(auth.hasRole(Role.Admin)).toBe(false);
    expect(auth.hasAnyRole([Role.Admin, Role.User])).toBe(false);
  });
});
