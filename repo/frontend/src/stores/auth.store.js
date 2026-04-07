import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/api/endpoints/auth.api';
export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const loading = ref(false);
    const isAuthenticated = computed(() => !!user.value);
    async function login(username, password) {
        loading.value = true;
        try {
            const { data } = await apiLogin(username, password);
            user.value = data.data ?? data;
        }
        finally {
            loading.value = false;
        }
    }
    async function logout() {
        try {
            await apiLogout();
        }
        finally {
            user.value = null;
        }
    }
    async function fetchCurrentUser() {
        loading.value = true;
        try {
            const { data } = await getCurrentUser();
            user.value = data.data ?? data;
        }
        catch {
            user.value = null;
        }
        finally {
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
