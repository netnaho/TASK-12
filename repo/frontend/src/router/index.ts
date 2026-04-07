import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { useAuthStore } from '@/stores/auth.store';
import type { Role } from '@/types/roles';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: Role[];
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  const isAuthenticated = auth.isAuthenticated;
  const userRoles = auth.user?.roles ?? [];

  // Public routes: if already authenticated, redirect to dashboard
  if (to.meta.requiresAuth === false) {
    if (isAuthenticated) {
      return next({ name: 'dashboard' });
    }
    return next();
  }

  // Protected routes: if not authenticated, redirect to login
  if (!isAuthenticated) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }

  // Role check: if route specifies roles and user has none of them
  if (to.meta.roles && to.meta.roles.length > 0) {
    const hasAccess = to.meta.roles.some((role) => userRoles.includes(role));
    if (!hasAccess) {
      return next({ name: 'dashboard' });
    }
  }

  next();
});

export default router;
