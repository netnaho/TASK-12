import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useUiStore = defineStore('ui', () => {
    const sidebarCollapsed = ref(false);
    const mobileDrawerOpen = ref(false);
    function toggleSidebar() {
        sidebarCollapsed.value = !sidebarCollapsed.value;
    }
    function toggleDrawer() {
        mobileDrawerOpen.value = !mobileDrawerOpen.value;
    }
    return {
        sidebarCollapsed,
        mobileDrawerOpen,
        toggleSidebar,
        toggleDrawer,
    };
});
