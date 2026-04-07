import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';

export function useAuth() {
  const store = useAuthStore();

  const user = computed(() => store.user);
  const isAuthenticated = computed(() => store.isAuthenticated);

  async function login(username: string, password: string) {
    await store.login(username, password);
  }

  async function logout() {
    await store.logout();
  }

  function hasRole(role: Role): boolean {
    return store.user?.roles?.includes(role) ?? false;
  }

  function hasAnyRole(roles: Role[]): boolean {
    return roles.some((role) => hasRole(role));
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };
}
