<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Menu, Bell, LogOut, User, ChevronRight } from 'lucide-vue-next';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationsStore } from '@/stores/notifications.store';

const emit = defineEmits<{
  openMobileMenu: [];
}>();

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notifications = useNotificationsStore();
const userMenuOpen = ref(false);

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean);
  return segments.map((segment, index) => ({
    label: segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    path: '/' + segments.slice(0, index + 1).join('/'),
    isLast: index === segments.length - 1,
  }));
});

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
}

function closeUserMenu() {
  userMenuOpen.value = false;
}

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>

<template>
  <header
    class="h-16 border-b border-[hsl(var(--border))] bg-white flex items-center justify-between px-4 lg:px-6"
  >
    <!-- Left side -->
    <div class="flex items-center gap-4">
      <!-- Mobile hamburger -->
      <button
        class="lg:hidden p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
        @click="emit('openMobileMenu')"
      >
        <Menu class="h-5 w-5" />
      </button>

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-1 text-sm">
        <template v-for="(crumb, idx) in breadcrumbs" :key="crumb.path">
          <ChevronRight
            v-if="idx > 0"
            class="h-4 w-4 text-[hsl(var(--muted-foreground))]"
          />
          <span
            :class="cn(
              crumb.isLast
                ? 'text-[hsl(var(--foreground))] font-medium'
                : 'text-[hsl(var(--muted-foreground))]'
            )"
          >
            {{ crumb.label }}
          </span>
        </template>
      </nav>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-2">
      <!-- Notification bell -->
      <button
        class="relative p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
        @click="router.push('/notifications')"
      >
        <Bell class="h-5 w-5" />
        <span
          v-if="notifications.unreadCount > 0"
          class="absolute top-1 right-1 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold"
        >
          {{ notifications.unreadCount > 99 ? '99+' : notifications.unreadCount }}
        </span>
      </button>

      <!-- User menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
          @click="toggleUserMenu"
        >
          <div
            class="h-8 w-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center"
          >
            <span class="text-white text-sm font-medium">
              {{ auth.user?.firstName?.charAt(0)?.toUpperCase() ?? 'U' }}
            </span>
          </div>
          <span class="hidden sm:block text-sm font-medium text-[hsl(var(--foreground))]">
            {{ auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : 'User' }}
          </span>
        </button>

        <!-- Dropdown -->
        <Teleport to="body">
          <div
            v-if="userMenuOpen"
            class="fixed inset-0 z-40"
            @click="closeUserMenu"
          />
        </Teleport>
        <div
          v-if="userMenuOpen"
          class="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-[hsl(var(--border))] bg-white shadow-lg py-1"
        >
          <div class="px-4 py-3 border-b border-[hsl(var(--border))]">
            <p class="text-sm font-medium text-[hsl(var(--foreground))]">
              {{ auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : '' }}
            </p>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">
              {{ auth.user?.email }}
            </p>
          </div>
          <button
            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            @click="closeUserMenu(); router.push('/settings')"
          >
            <User class="h-4 w-4" />
            Profile
          </button>
          <button
            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            @click="closeUserMenu(); handleLogout()"
          >
            <LogOut class="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
