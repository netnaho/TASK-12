<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/shared/PageHeader.vue';

const route = useRoute();
const router = useRouter();

const tabs = [
  { key: 'sites', label: 'Sites', route: '/test-center/sites' },
  { key: 'rooms', label: 'Rooms', route: '/test-center/rooms' },
  { key: 'equipment', label: 'Equipment', route: '/test-center/equipment' },
  { key: 'sessions', label: 'Sessions', route: '/test-center/sessions' },
  { key: 'utilization', label: 'Utilization', route: '/test-center/utilization' },
];

const activeTab = computed(() => {
  const path = route.path;
  const tab = tabs.find((t) => path.startsWith(t.route));
  return tab?.key ?? 'sites';
});

function navigate(tab: (typeof tabs)[number]) {
  router.push(tab.route);
}
</script>

<template>
  <div>
    <PageHeader
      title="Test Center & Resource Management"
      description="Manage testing sites, rooms, equipment, sessions, and utilization."
    />

    <!-- Tab navigation -->
    <div class="border-b border-[hsl(var(--border))] mb-6">
      <nav class="-mb-px flex gap-6" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="whitespace-nowrap border-b-2 pb-3 px-1 text-sm font-medium transition-colors"
          :class="
            activeTab === tab.key
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'
          "
          @click="navigate(tab)"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Child route content -->
    <router-view />
  </div>
</template>
