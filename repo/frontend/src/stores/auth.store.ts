import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/api/endpoints/auth.api';
import type { Role } from '@/types/roles';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  // The backend returns roles as objects: [{ id, name, description }].
  // Normalize to plain role-name strings so router guards and role checks work.
  function normalizeUser(raw: any): AuthUser {
    return {
      ...raw,
      roles: (raw.roles ?? []).map((r: any) => (typeof r === 'string' ? r : r.name)),
    };
  }

  async function login(username: string, password: string) {
    loading.value = true;
    try {
      const { data } = await apiLogin(username, password);
      user.value = normalizeUser(data.data ?? data);
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await apiLogout();
    } finally {
      user.value = null;
    }
  }

  async function fetchCurrentUser() {
    loading.value = true;
    try {
      const { data } = await getCurrentUser();
      user.value = normalizeUser(data.data ?? data);
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    fetchCurrentUser,
  };
});
