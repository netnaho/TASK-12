<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/shared/PageHeader.vue';
import { BarChart3, FileText, Clock } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const tabs = [
  { name: 'Report Builder', route: 'report-builder', icon: BarChart3 },
  { name: 'Saved Reports', route: 'saved-reports', icon: FileText },
  { name: 'Scheduled Reports', route: 'scheduled-reports', icon: Clock },
];

const activeTab = computed(() => route.name as string);

function navigateTab(tabRoute: string) {
  router.push({ name: tabRoute });
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Analytics & Reporting Hub"
      description="Build reports, analyze lease metrics, and schedule automated report delivery."
    />

    <!-- Tab Navigation -->
    <div class="border-b border-[hsl(var(--border))]">
      <nav class="-mb-px flex space-x-8" aria-label="Analytics tabs">
        <button
          v-for="tab in tabs"
          :key="tab.route"
          :class="[
            'group inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeTab === tab.route
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]',
          ]"
          @click="navigateTab(tab.route)"
        >
          <component
            :is="tab.icon"
            :class="[
              'h-4 w-4',
              activeTab === tab.route
                ? 'text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]',
            ]"
          />
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Child route content -->
    <router-view />
  </div>
</template>
