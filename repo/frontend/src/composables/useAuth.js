import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
export function useAuth() {
    const store = useAuthStore();
    const user = computed(() => store.user);
    const isAuthenticated = computed(() => store.isAuthenticated);
    async function login(username, password) {
        await store.login(username, password);
    }
    async function logout() {
        await store.logout();
    }
    function hasRole(role) {
        return store.user?.roles?.includes(role) ?? false;
    }
    function hasAnyRole(roles) {
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
