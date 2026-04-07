<script setup lang="ts">
import { ref, computed } from 'vue';
import DataTable from '@/components/shared/DataTable.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import * as analyticsApi from '@/api/endpoints/analytics.api';
import * as usersApi from '@/api/endpoints/users.api';
import { formatDate } from '@/utils/format';
import {
  Eye,
  Share2,
  Download,
  Archive,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next';

const { toast } = useToast();
const { page, pageSize, total, totalPages, setTotal } = usePagination(20);

// ── Reports Data ─────────────────────────────────────────────────────

const {
  data: reportsData,
  loading,
  error,
  refetch,
} = useApiQuery<any>(() =>
  analyticsApi.getReports({ page: page.value, pageSize: pageSize.value }),
);

const reports = computed(() => {
  if (!reportsData.value) return [];
  const raw = reportsData.value;
  if (raw.meta) setTotal(raw.meta.total ?? 0);
  return raw.data ?? raw ?? [];
});

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'definitionName', label: 'Definition' },
  { key: 'period', label: 'Period' },
  { key: 'status', label: 'Status' },
  { key: 'generatedAt', label: 'Generated At' },
  { key: 'createdByName', label: 'Created By' },
  { key: 'actions', label: '' },
];

function statusVariant(status: string): 'neutral' | 'info' | 'success' | 'error' {
  const map: Record<string, 'neutral' | 'info' | 'success' | 'error'> = {
    DRAFT: 'neutral',
    GENERATING: 'info',
    PUBLISHED: 'success',
    FAILED: 'error',
  };
  return map[status] ?? 'neutral';
}

// ── Share Dialog ─────────────────────────────────────────────────────

const shareDialogOpen = ref(false);
const shareReportId = ref('');
const shareReportName = ref('');
const selectedUserIds = ref<string[]>([]);
const shareLoading = ref(false);

const { data: usersData } = useApiQuery<any>(() => usersApi.getUsers({ pageSize: 100 }));
const usersList = computed(() => {
  if (!usersData.value) return [];
  return usersData.value.data ?? usersData.value ?? [];
});

function openShareDialog(report: any) {
  shareReportId.value = report.id;
  shareReportName.value = report.name ?? 'Report';
  selectedUserIds.value = [];
  shareDialogOpen.value = true;
}

async function submitShare() {
  if (selectedUserIds.value.length === 0) {
    toast.warning('Select at least one user to share with');
    return;
  }
  shareLoading.value = true;
  try {
    for (const userId of selectedUserIds.value) {
      await analyticsApi.shareReport(shareReportId.value, { userId });
    }
    toast.success('Report shared successfully');
    shareDialogOpen.value = false;
  } catch (err: any) {
    toast.error('Failed to share report', err.message);
  } finally {
    shareLoading.value = false;
  }
}

// ── Export Dialog ────────────────────────────────────────────────────

const exportDialogOpen = ref(false);
const exportReportId = ref('');
const exportReportName = ref('');
const exportFormat = ref<'csv' | 'xlsx' | 'pdf'>('csv');
const exportWatermark = ref('CONFIDENTIAL - LeaseOps');
const exportLoading = ref(false);

function openExportDialog(report: any) {
  exportReportId.value = report.id;
  exportReportName.value = report.name ?? 'Report';
  exportFormat.value = 'csv';
  exportDialogOpen.value = true;
}

async function submitExport() {
  exportLoading.value = true;
  try {
    await analyticsApi.exportReport(exportReportId.value, {
      format: exportFormat.value,
      watermark: exportWatermark.value || undefined,
    });
    toast.success(`${exportFormat.value.toUpperCase()} export started. You will be notified when ready.`);
    exportDialogOpen.value = false;
  } catch (err: any) {
    toast.error('Export failed', err.message);
  } finally {
    exportLoading.value = false;
  }
}

// ── View & Archive Actions ───────────────────────────────────────────

function viewReport(report: any) {
  toast.info('Opening report...', report.name);
}

async function archiveReport(report: any) {
  try {
    await analyticsApi.updateDefinition(report.definitionId ?? report.id, { status: 'ARCHIVED' });
    toast.success('Report archived');
    refetch();
  } catch (err: any) {
    toast.error('Failed to archive', err.message);
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Loading -->
    <div v-if="loading && !reportsData" class="py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error -->
    <ErrorState v-else-if="error" :message="error" :on-retry="refetch" />

    <!-- Empty -->
    <EmptyState
      v-else-if="reports.length === 0"
      title="No saved reports"
      description="Run a query in the Report Builder and save it to see it here."
      :icon="FileText"
    />

    <!-- Data Table -->
    <template v-else>
      <DataTable :columns="columns" :rows="reports" :loading="loading">
        <template #cell-status="{ value }">
          <StatusChip
            :variant="statusVariant(String(value))"
            :label="String(value)"
          />
        </template>

        <template #cell-generatedAt="{ value }">
          {{ value ? formatDate(String(value), 'MMM d, yyyy HH:mm') : '--' }}
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
              title="View"
              @click.stop="viewReport(row)"
            >
              <Eye class="h-4 w-4" />
            </button>
            <button
              class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
              title="Share"
              @click.stop="openShareDialog(row)"
            >
              <Share2 class="h-4 w-4" />
            </button>
            <button
              class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
              title="Export"
              @click.stop="openExportDialog(row)"
            >
              <Download class="h-4 w-4" />
            </button>
            <button
              class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-red-600 transition-colors"
              title="Archive"
              @click.stop="archiveReport(row)"
            >
              <Archive class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Page {{ page }} of {{ totalPages }} ({{ total }} total)
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="page <= 1"
            class="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50"
            @click="page--; refetch()"
          >
            <ChevronLeft class="h-4 w-4" />
            Previous
          </button>
          <button
            :disabled="page >= totalPages"
            class="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50"
            @click="page++; refetch()"
          >
            Next
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </template>

    <!-- Share Dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="shareDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="shareDialogOpen = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">
                Share "{{ shareReportName }}"
              </h3>
              <button
                class="rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors"
                @click="shareDialogOpen = false"
              >
                <X class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>

            <p class="text-sm text-[hsl(var(--muted-foreground))] mb-3">
              Select users to share this report with. Only users with the <code class="bg-[hsl(var(--muted))] px-1 rounded text-xs">report:read</code> permission will be able to view it.
            </p>

            <div class="max-h-60 overflow-y-auto border border-[hsl(var(--border))] rounded-lg divide-y divide-[hsl(var(--border))]">
              <label
                v-for="user in usersList"
                :key="user.id"
                class="flex items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--accent)/0.5)] cursor-pointer transition-colors"
              >
                <input
                  v-model="selectedUserIds"
                  type="checkbox"
                  :value="user.id"
                  class="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                    {{ user.displayName || user.username }}
                  </p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))] truncate">
                    {{ user.email }}
                  </p>
                </div>
                <span
                  v-if="user.roles?.length"
                  class="shrink-0 inline-flex items-center rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]"
                >
                  {{ user.roles[0] }}
                </span>
              </label>
              <div v-if="usersList.length === 0" class="px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No users found
              </div>
            </div>

            <div class="mt-4 flex justify-end gap-3">
              <button
                class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                @click="shareDialogOpen = false"
              >
                Cancel
              </button>
              <button
                :disabled="shareLoading || selectedUserIds.length === 0"
                class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                @click="submitShare"
              >
                <LoadingSpinner v-if="shareLoading" size="sm" />
                <Share2 v-else class="h-4 w-4" />
                Share with {{ selectedUserIds.length }} user{{ selectedUserIds.length !== 1 ? 's' : '' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Export Dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="exportDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="exportDialogOpen = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">
                Export "{{ exportReportName }}"
              </h3>
              <button
                class="rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors"
                @click="exportDialogOpen = false"
              >
                <X class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Format</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="fmt in (['csv', 'xlsx', 'pdf'] as const)"
                    :key="fmt"
                    :class="[
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      exportFormat === fmt
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] text-[hsl(var(--primary))]'
                        : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
                    ]"
                    @click="exportFormat = fmt"
                  >
                    {{ fmt.toUpperCase() }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Watermark Text
                </label>
                <input
                  v-model="exportWatermark"
                  type="text"
                  placeholder="CONFIDENTIAL"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
                <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Preview: <span class="italic opacity-50">{{ exportWatermark || 'No watermark' }}</span>
                </p>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                @click="exportDialogOpen = false"
              >
                Cancel
              </button>
              <button
                :disabled="exportLoading"
                class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                @click="submitExport"
              >
                <LoadingSpinner v-if="exportLoading" size="sm" />
                <Download v-else class="h-4 w-4" />
                Export {{ exportFormat.toUpperCase() }}
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
