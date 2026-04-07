<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  BarChart3,
  LineChart,
  Users,
  Settings,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-vue-next';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';
import type { Component } from 'vue';

const props = defineProps<{
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

interface SidebarNavItem {
  name: string;
  icon: Component;
  route: string;
  roles: Role[];
}

const NAV_ITEMS: SidebarNavItem[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    route: '/dashboard',
    roles: [Role.Admin, Role.Manager, Role.Proctor, Role.Analyst, Role.User],
  },
  {
    name: 'Test Center',
    icon: Building2,
    route: '/test-center',
    roles: [Role.Admin, Role.Manager, Role.Proctor],
  },
  {
    name: 'Listings',
    icon: ClipboardList,
    route: '/listings',
    roles: [Role.Admin, Role.Manager, Role.User],
  },
  {
    name: 'Lease Metrics',
    icon: BarChart3,
    route: '/lease-metrics',
    roles: [Role.Admin, Role.Manager, Role.Analyst],
  },
  {
    name: 'Analytics',
    icon: LineChart,
    route: '/analytics',
    roles: [Role.Admin, Role.Manager, Role.Analyst],
  },
  {
    name: 'Users',
    icon: Users,
    route: '/users',
    roles: [Role.Admin],
  },
  {
    name: 'Audit Log',
    icon: FileText,
    route: '/audit-log',
    roles: [Role.Admin],
  },
  {
    name: 'Settings',
    icon: Settings,
    route: '/settings',
    roles: [Role.Admin],
  },
];

const filteredItems = computed(() => {
  const userRoles = auth.user?.roles ?? [];
  return NAV_ITEMS.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );
});

function isActive(itemRoute: string): boolean {
  return route.path === itemRoute || route.path.startsWith(itemRoute + '/');
}

function navigate(itemRoute: string) {
  router.push(itemRoute);
}
</script>

<template>
  <aside
    :class="cn(
      'flex flex-col h-full bg-white border-r border-[hsl(var(--border))]',
      'transition-all duration-300 ease-in-out',
      collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]'
    )"
  >
    <!-- Logo -->
    <div
      :class="cn(
        'flex items-center h-16 px-4 border-b border-[hsl(var(--border))]',
        collapsed ? 'justify-center' : 'gap-3'
      )"
    >
      <div
        class="h-8 w-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center shrink-0"
      >
        <span class="text-white font-bold text-sm">L</span>
      </div>
      <span
        v-if="!collapsed"
        class="text-lg font-bold text-[hsl(var(--foreground))] whitespace-nowrap"
      >
        LeaseOps
      </span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      <button
        v-for="item in filteredItems"
        :key="item.route"
        :class="cn(
          'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          'hover:bg-[hsl(var(--accent))]',
          isActive(item.route)
            ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
            : 'text-[hsl(var(--muted-foreground))]',
          collapsed ? 'justify-center' : ''
        )"
        :title="collapsed ? item.name : undefined"
        @click="navigate(item.route)"
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed" class="whitespace-nowrap">{{ item.name }}</span>
      </button>
    </nav>

    <!-- Collapse toggle -->
    <div class="border-t border-[hsl(var(--border))] p-3">
      <button
        :class="cn(
          'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
          'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors',
          collapsed ? 'justify-center' : ''
        )"
        @click="emit('toggle')"
      >
        <PanelLeftClose v-if="!collapsed" class="h-5 w-5 shrink-0" />
        <PanelLeftOpen v-else class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed" class="whitespace-nowrap">Collapse</span>
      </button>
    </div>
  </aside>
</template>
