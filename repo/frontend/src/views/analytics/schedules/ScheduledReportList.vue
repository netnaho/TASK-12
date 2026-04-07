<script setup lang="ts">
import { ref, computed } from 'vue';
import DataTable from '@/components/shared/DataTable.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import * as analyticsApi from '@/api/endpoints/analytics.api';
import { formatDate } from '@/utils/format';
import {
  Plus,
  Clock,
  X,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-vue-next';

const { toast } = useToast();

// ── Schedules Data ───────────────────────────────────────────────────

const {
  data: schedulesRaw,
  loading,
  error,
  refetch,
} = useApiQuery<any>(() => analyticsApi.getSchedules());

const schedules = computed(() => {
  if (!schedulesRaw.value) return [];
  const raw = schedulesRaw.value;
  return raw.data ?? raw ?? [];
});

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'lastRunAt', label: 'Last Run' },
  { key: 'nextRunAt', label: 'Next Run' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: '' },
];

// ── Definitions for Select ───────────────────────────────────────────

const { data: definitionsRaw } = useApiQuery<any>(() => analyticsApi.getDefinitions());
const definitions = computed(() => {
  if (!definitionsRaw.value) return [];
  const raw = definitionsRaw.value;
  return raw.data ?? raw ?? [];
});

// ── Create Schedule Dialog ───────────────────────────────────────────

const createDialogOpen = ref(false);
const createLoading = ref(false);
const createForm = ref({
  name: '',
  frequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
  definitionId: '',
  filters: {
    regionId: '',
    communityId: '',
    metricType: '',
  },
});

function openCreateDialog() {
  createForm.value = {
    name: '',
    frequency: 'WEEKLY',
    definitionId: '',
    filters: { regionId: '', communityId: '', metricType: '' },
  };
  createDialogOpen.value = true;
}

async function submitCreate() {
  if (!createForm.value.name.trim()) {
    toast.warning('Enter a schedule name');
    return;
  }
  if (!createForm.value.definitionId) {
    toast.warning('Select a report definition');
    return;
  }

  createLoading.value = true;
  try {
    const payload: Record<string, any> = {
      name: createForm.value.name,
      frequency: createForm.value.frequency,
      definitionId: createForm.value.definitionId,
    };
    // Only include non-empty filters
    const f = createForm.value.filters;
    if (f.regionId || f.communityId || f.metricType) {
      payload.filters = {};
      if (f.regionId) payload.filters.regionId = f.regionId;
      if (f.communityId) payload.filters.communityId = f.communityId;
      if (f.metricType) payload.filters.metricType = f.metricType;
    }

    await analyticsApi.createSchedule(payload);
    toast.success('Schedule created');
    createDialogOpen.value = false;
    refetch();
  } catch (err: any) {
    toast.error('Failed to create schedule', err.message);
  } finally {
    createLoading.value = false;
  }
}

// ── Toggle Active / Delete ───────────────────────────────────────────

async function toggleActive(schedule: any) {
  try {
    await analyticsApi.updateSchedule(schedule.id, {
      isActive: !schedule.isActive,
    });
    toast.success(schedule.isActive ? 'Schedule deactivated' : 'Schedule activated');
    refetch();
  } catch (err: any) {
    toast.error('Failed to update schedule', err.message);
  }
}

async function deleteSchedule(schedule: any) {
  try {
    await analyticsApi.deleteSchedule(schedule.id);
    toast.success('Schedule deleted');
    refetch();
  } catch (err: any) {
    toast.error('Failed to delete schedule', err.message);
  }
}

function frequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
  };
  return map[freq] ?? freq;
}
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-[hsl(var(--muted-foreground))]">
        Manage automated report generation schedules.
      </p>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        @click="openCreateDialog"
      >
        <Plus class="h-4 w-4" />
        Create Schedule
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !schedulesRaw" class="py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error -->
    <ErrorState v-else-if="error" :message="error" :on-retry="refetch" />

    <!-- Empty -->
    <EmptyState
      v-else-if="schedules.length === 0"
      title="No scheduled reports"
      description="Create a schedule to automatically generate reports on a recurring basis."
      :icon="Clock"
    >
      <template #action>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          @click="openCreateDialog"
        >
          <Plus class="h-4 w-4" />
          Create Schedule
        </button>
      </template>
    </EmptyState>

    <!-- Data Table -->
    <template v-else>
      <DataTable :columns="columns" :rows="schedules" :loading="loading">
        <template #cell-frequency="{ value }">
          <span class="inline-flex items-center gap-1.5 text-sm">
            <Clock class="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            {{ frequencyLabel(String(value)) }}
          </span>
        </template>

        <template #cell-lastRunAt="{ value }">
          {{ value ? formatDate(String(value), 'MMM d, yyyy HH:mm') : 'Never' }}
        </template>

        <template #cell-nextRunAt="{ value }">
          {{ value ? formatDate(String(value), 'MMM d, yyyy HH:mm') : '--' }}
        </template>

        <template #cell-isActive="{ value }">
          <StatusChip
            :variant="value ? 'success' : 'neutral'"
            :label="value ? 'Active' : 'Inactive'"
          />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
              :title="row.isActive ? 'Deactivate' : 'Activate'"
              @click.stop="toggleActive(row)"
            >
              <ToggleRight v-if="row.isActive" class="h-4 w-4 text-green-600" />
              <ToggleLeft v-else class="h-4 w-4" />
            </button>
            <button
              class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-red-600 transition-colors"
              title="Delete"
              @click.stop="deleteSchedule(row)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </template>

    <!-- Create Schedule Dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="createDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="createDialogOpen = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">
                Create Schedule
              </h3>
              <button
                class="rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors"
                @click="createDialogOpen = false"
              >
                <X class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Schedule Name
                </label>
                <input
                  v-model="createForm.name"
                  type="text"
                  placeholder="Weekly Regional Summary"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Frequency
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="freq in (['DAILY', 'WEEKLY', 'MONTHLY'] as const)"
                    :key="freq"
                    :class="[
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      createForm.frequency === freq
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] text-[hsl(var(--primary))]'
                        : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
                    ]"
                    @click="createForm.frequency = freq"
                  >
                    {{ frequencyLabel(freq) }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Report Definition
                </label>
                <select
                  v-model="createForm.definitionId"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                >
                  <option value="" disabled>Select a definition...</option>
                  <option
                    v-for="def in definitions"
                    :key="def.id"
                    :value="def.id"
                  >
                    {{ def.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Filters (Optional)
                </label>
                <div class="space-y-2">
                  <input
                    v-model="createForm.filters.regionId"
                    type="text"
                    placeholder="Region ID filter"
                    class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                  <input
                    v-model="createForm.filters.communityId"
                    type="text"
                    placeholder="Community ID filter"
                    class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                  <input
                    v-model="createForm.filters.metricType"
                    type="text"
                    placeholder="Metric type filter"
                    class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                @click="createDialogOpen = false"
              >
                Cancel
              </button>
              <button
                :disabled="createLoading"
                class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                @click="submitCreate"
              >
                <LoadingSpinner v-if="createLoading" size="sm" />
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
