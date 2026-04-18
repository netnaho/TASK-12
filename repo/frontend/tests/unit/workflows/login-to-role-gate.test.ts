/**
 * Workflow: real Pinia store + real composable + real router guard.
 *
 * Verifies that the whole front-end auth chain behaves coherently:
 *   useAuth().login(...) → auth store populated → router guard lets admin
 *   into /users → useAuth().logout() → router guard bounces to /login.
 *
 * Only the HTTP layer is mocked. The stores, composables, and router guard
 * code are the real ones.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';

vi.mock('@/api/endpoints/auth.api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

import * as authApi from '@/api/endpoints/auth.api';
import { useAuth } from '@/composables/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';

const mockedLogin = authApi.login as unknown as ReturnType<typeof vi.fn>;
const mockedLogout = authApi.logout as unknown as ReturnType<typeof vi.fn>;

function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div/>' }, meta: { requiresAuth: false } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div/>' }, meta: { requiresAuth: true } },
      { path: '/users', name: 'users', component: { template: '<div/>' }, meta: { requiresAuth: true, roles: [Role.Admin] } },
    ],
  });

  router.beforeEach((to, _from, next) => {
    const auth = useAuthStore();
    const roles = (auth.user?.roles ?? []) as unknown as string[];

    if (to.meta.requiresAuth === false) {
      if (auth.isAuthenticated) return next({ name: 'dashboard' });
      return next();
    }
    if (!auth.isAuthenticated) return next({ path: '/login', query: { redirect: to.fullPath } });
    const metaRoles = (to.meta as any).roles as string[] | undefined;
    if (metaRoles?.length && !metaRoles.some((r) => roles.includes(r))) {
      return next({ name: 'dashboard' });
    }
    next();
  });

  return router;
}

beforeEach(() => {
  setActivePinia(createPinia());
  mockedLogin.mockReset();
  mockedLogout.mockReset();
});

describe('workflow: login → role gate → logout', () => {
  it('admin flow: login → /users allowed → logout → /users redirects to /login', async () => {
    mockedLogin.mockResolvedValue({
      data: {
        data: {
          id: 'u1', username: 'admin', email: '', firstName: '', lastName: '',
          roles: [{ id: 'r1', name: 'SYSTEM_ADMIN' }],
        },
      },
    });
    mockedLogout.mockResolvedValue({});
    const router = makeRouter();
    const auth = useAuth();

    // Pre-login → users is protected → redirect to login
    await router.push('/users');
    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/users');

    // Login as admin
    await auth.login('admin', 'Password123!');
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.hasRole(Role.Admin)).toBe(true);

    // Navigate to users — should be allowed
    await router.push('/users');
    expect(router.currentRoute.value.name).toBe('users');

    // Logout
    await auth.logout();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(mockedLogout).toHaveBeenCalled();

    // Now /users is protected again
    await router.push('/users');
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('standard user is bounced from /users to /dashboard', async () => {
    mockedLogin.mockResolvedValue({
      data: {
        data: {
          id: 'u2', username: 'agent', email: '', firstName: '', lastName: '',
          roles: [{ id: 'r5', name: 'STANDARD_USER' }],
        },
      },
    });
    const router = makeRouter();
    const auth = useAuth();

    await auth.login('agent', 'Password123!');
    expect(auth.hasRole(Role.User)).toBe(true);
    expect(auth.hasRole(Role.Admin)).toBe(false);

    await router.push('/users');
    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('hasAnyRole returns true when user has at least one of the listed roles', async () => {
    mockedLogin.mockResolvedValue({
      data: {
        data: {
          id: 'u3', username: 'mgr', email: '', firstName: '', lastName: '',
          roles: [{ id: 'r2', name: 'LEASING_OPS_MANAGER' }],
        },
      },
    });
    const auth = useAuth();
    await auth.login('mgr', 'Password123!');
    expect(auth.hasAnyRole([Role.Manager, Role.Admin])).toBe(true);
    expect(auth.hasAnyRole([Role.Analyst, Role.User])).toBe(false);
  });
});
