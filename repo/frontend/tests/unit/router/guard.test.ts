import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { routes } from '@/router/routes';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';

// Replicate the guard from src/router/index.ts against an in-memory router so
// we can drive it deterministically without the browser location API.
function makeRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.beforeEach((to, _from, next) => {
    const auth = useAuthStore();
    const isAuthenticated = auth.isAuthenticated;
    const userRoles = auth.user?.roles ?? [];

    if (to.meta.requiresAuth === false) {
      if (isAuthenticated) return next({ name: 'dashboard' });
      return next();
    }

    if (!isAuthenticated) {
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }

    const metaRoles = (to.meta as any).roles as string[] | undefined;
    if (metaRoles && metaRoles.length > 0) {
      const hasAccess = metaRoles.some((role) => userRoles.includes(role as any));
      if (!hasAccess) return next({ name: 'dashboard' });
    }

    next();
  });
  return router;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mock('@/api/endpoints/auth.api', () => ({
    login: vi.fn(), logout: vi.fn(), getCurrentUser: vi.fn(),
  }));
});

describe('router guard', () => {
  it('redirects unauthenticated user from a protected route to /login', async () => {
    const router = makeRouter();
    await router.push('/dashboard');
    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard');
  });

  it('redirects authenticated user away from /login to /dashboard', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = {
      id: 'u1', username: 'admin', email: '', firstName: '', lastName: '',
      roles: [Role.Admin] as any,
    };
    await router.push('/login');
    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('bounces unauthorized user from a role-gated route to dashboard', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = {
      id: 'u1', username: 'user', email: '', firstName: '', lastName: '',
      roles: [Role.User] as any,
    };
    await router.push('/users');
    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('allows admin through /users', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = {
      id: 'u1', username: 'admin', email: '', firstName: '', lastName: '',
      roles: [Role.Admin] as any,
    };
    await router.push('/users');
    expect(router.currentRoute.value.name).toBe('users');
  });
});
