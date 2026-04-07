<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Plus, ChevronDown, ChevronRight, Lock, RefreshCw, Clock } from 'lucide-vue-next';
import PageHeader from '@/components/shared/PageHeader.vue';
import DataTable from '@/components/shared/DataTable.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import {
  getDefinitions,
  createDefinition,
  createVersion,
  triggerRecalc,
  getCalcJobs,
} from '@/api/endpoints/metrics.api';

interface MetricVersion {
  id: string;
  version: number;
  formula: string;
  effectiveFrom: string;
  createdAt: string;
}

interface MetricDefinition {
  id: string;
  name: string;
  type: string;
  currentVersion: number;
  effectiveFrom: string;
  isLocked: boolean;
  versions?: MetricVersion[];
}

interface CalcJob {
  id: string;
  status: string;
  definitionName: string;
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  error?: string;
}

const { toast } = useToast();

const columns = [
  { key: 'expand', label: '' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'currentVersion', label: 'Version' },
  { key: 'effectiveFrom', label: 'Effective From' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
];

const { data: definitions, loading, error, refetch } = useApiQuery<MetricDefinition[]>(
  () => getDefinitions(),
);

const { data: calcJobs, loading: jobsLoading, refetch: refetchJobs } = useApiQuery<CalcJob[]>(
  () => getCalcJobs({ limit: 10 }),
);

const expandedDefs = ref<Set<string>>(new Set());

function toggleExpand(id: string) {
  if (expandedDefs.value.has(id)) {
    expandedDefs.value.delete(id);
  } else {
    expandedDefs.value.add(id);
  }
}

const tableRows = computed(() => {
  return (definitions.value ?? []).map((d) => ({
    ...d,
    effectiveFrom: d.effectiveFrom ? new Date(d.effectiveFrom).toLocaleDateString() : '-',
  }));
});

// Create Definition Modal
const showDefModal = ref(false);
const defForm = reactive({
  name: '',
  type: 'PERCENTAGE',
  description: '',
});
const savingDef = ref(false);

function openCreateDef() {
  defForm.name = '';
  defForm.type = 'PERCENTAGE';
  defForm.description = '';
  showDefModal.value = true;
}

async function handleCreateDef() {
  savingDef.value = true;
  try {
    await createDefinition({ ...defForm });
    toast.success('Definition created');
    showDefModal.value = false;
    refetch();
  } catch {
    toast.error('Failed to create definition');
  } finally {
    savingDef.value = false;
  }
}

// Add Version Modal
const showVersionModal = ref(false);
const versionTargetId = ref('');
const versionForm = reactive({
  formula: '{}',
  effectiveFrom: '',
});
const savingVersion = ref(false);

function openAddVersion(defId: string) {
  versionTargetId.value = defId;
  versionForm.formula = '{\n  "type": "simple",\n  "expression": ""\n}';
  versionForm.effectiveFrom = new Date().toISOString().split('T')[0];
  showVersionModal.value = true;
}

async function handleCreateVersion() {
  savingVersion.value = true;
  try {
    let formulaObj: any;
    try {
      formulaObj = JSON.parse(versionForm.formula);
    } catch {
      toast.error('Invalid JSON in formula');
      savingVersion.value = false;
      return;
    }
    await createVersion(versionTargetId.value, {
      formula: formulaObj,
      effectiveFrom: versionForm.effectiveFrom,
    });
    toast.success('Version created');
    showVersionModal.value = false;
    refetch();
  } catch {
    toast.error('Failed to create version');
  } finally {
    savingVersion.value = false;
  }
}

// Recalculation
const showRecalcConfirm = ref(false);
const recalculating = ref(false);

async function handleRecalc() {
  recalculating.value = true;
  try {
    await triggerRecalc({});
    toast.success('Recalculation triggered');
    showRecalcConfirm.value = false;
    refetchJobs();
  } catch {
    toast.error('Failed to trigger recalculation');
  } finally {
    recalculating.value = false;
  }
}

function jobStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    completed: 'success',
    running: 'info',
    pending: 'warning',
    failed: 'error',
  };
  return map[status?.toLowerCase()] ?? 'neutral';
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return '-';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
</script>

<template>
  <div>
    <PageHeader title="Lease Metrics" description="Configure metric definitions and manage calculation versions.">
      <template #actions>
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          @click="showRecalcConfirm = true"
        >
          <RefreshCw class="h-4 w-4" />
          Trigger Recalculation
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          @click="openCreateDef"
        >
          <Plus class="h-4 w-4" />
          Create Definition
        </button>
      </template>
    </PageHeader>

    <!-- Definitions table -->
    <ErrorState v-if="error" :message="error" :on-retry="refetch" />

    <div v-else class="overflow-x-auto rounded-lg border border-[hsl(var(--border))] mb-8">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
            <th class="px-2 py-3 w-10"></th>
            <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Name</th>
            <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Type</th>
            <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Version</th>
            <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Effective From</th>
            <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Status</th>
            <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]"></th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="i in 5" :key="'skeleton-' + i" class="border-b border-[hsl(var(--border))]">
              <td v-for="j in 7" :key="j" class="px-4 py-3">
                <div class="h-4 rounded bg-[hsl(var(--muted))] animate-pulse w-3/4" />
              </td>
            </tr>
          </template>

          <template v-else-if="(definitions ?? []).length === 0">
            <tr>
              <td colspan="7" class="px-4 py-12 text-center text-[hsl(var(--muted-foreground))]">
                No metric definitions found. Create one to get started.
              </td>
            </tr>
          </template>

          <template v-else>
            <template v-for="def in definitions ?? []" :key="def.id">
              <!-- Main row -->
              <tr class="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                <td class="px-2 py-3 text-center">
                  <button
                    class="rounded p-1 hover:bg-[hsl(var(--muted))] transition-colors"
                    @click="toggleExpand(def.id)"
                  >
                    <component
                      :is="expandedDefs.has(def.id) ? ChevronDown : ChevronRight"
                      class="h-4 w-4 text-[hsl(var(--muted-foreground))]"
                    />
                  </button>
                </td>
                <td class="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{{ def.name }}</td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">{{ def.type }}</td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">v{{ def.currentVersion }}</td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">
                  {{ def.effectiveFrom ? new Date(def.effectiveFrom).toLocaleDateString() : '-' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <StatusChip
                      :variant="def.isLocked ? 'warning' : 'success'"
                      :label="def.isLocked ? 'Locked' : 'Active'"
                    />
                    <Lock v-if="def.isLocked" class="h-3.5 w-3.5 text-yellow-600" />
                  </div>
                </td>
                <td class="px-4 py-3">
                  <button
                    class="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                    @click="openAddVersion(def.id)"
                  >
                    <Plus class="h-3 w-3" />
                    Add Version
                  </button>
                </td>
              </tr>

              <!-- Expanded version history -->
              <tr v-if="expandedDefs.has(def.id)">
                <td colspan="7" class="bg-[hsl(var(--muted)/0.3)] px-4 py-3">
                  <div class="ml-8">
                    <h4 class="text-sm font-medium text-[hsl(var(--foreground))] mb-2">Version History</h4>
                    <div v-if="!def.versions || def.versions.length === 0" class="text-sm text-[hsl(var(--muted-foreground))] italic">
                      No version history available
                    </div>
                    <div v-else class="space-y-2">
                      <div
                        v-for="ver in def.versions"
                        :key="ver.id"
                        class="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2"
                      >
                        <div class="flex items-center gap-4">
                          <span class="text-sm font-medium text-[hsl(var(--foreground))]">v{{ ver.version }}</span>
                          <span class="text-xs text-[hsl(var(--muted-foreground))]">
                            Effective: {{ new Date(ver.effectiveFrom).toLocaleDateString() }}
                          </span>
                        </div>
                        <span class="text-xs text-[hsl(var(--muted-foreground))]">
                          Created {{ new Date(ver.createdAt).toLocaleDateString() }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Recent Calculation Jobs -->
    <div class="mt-8">
      <h2 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
        <Clock class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
        Recent Calculation Jobs
      </h2>

      <div v-if="jobsLoading" class="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>

      <div v-else-if="!calcJobs || calcJobs.length === 0" class="text-center py-8 text-[hsl(var(--muted-foreground))]">
        No recent calculation jobs.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="job in calcJobs"
          :key="job.id"
          class="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-4 py-3"
        >
          <div class="flex items-center gap-4">
            <StatusChip
              :variant="jobStatusVariant(job.status)"
              :label="job.status"
            />
            <span class="text-sm font-medium text-[hsl(var(--foreground))]">
              {{ job.definitionName ?? 'All Metrics' }}
            </span>
            <span class="text-sm text-[hsl(var(--muted-foreground))]">
              {{ job.recordsProcessed }} records processed
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="job.error" class="text-xs text-red-600">{{ job.error }}</span>
            <span class="text-xs text-[hsl(var(--muted-foreground))]">
              {{ relativeTime(job.startedAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Definition Modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showDefModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showDefModal = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10">
            <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Create Metric Definition</h3>
            <form @submit.prevent="handleCreateDef" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Name</label>
                <input
                  v-model="defForm.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  placeholder="e.g. Occupancy Rate"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Type</label>
                <select
                  v-model="defForm.type"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="CURRENCY">Currency</option>
                  <option value="COUNT">Count</option>
                  <option value="RATIO">Ratio</option>
                  <option value="DURATION">Duration</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Description</label>
                <input
                  v-model="defForm.description"
                  type="text"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  placeholder="Optional description"
                />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" @click="showDefModal = false">Cancel</button>
                <button type="submit" :disabled="savingDef" class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                  {{ savingDef ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add Version Modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showVersionModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showVersionModal = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10">
            <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Add Version</h3>
            <form @submit.prevent="handleCreateVersion" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Effective From</label>
                <input
                  v-model="versionForm.effectiveFrom"
                  type="date"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Formula (JSON)</label>
                <textarea
                  v-model="versionForm.formula"
                  rows="8"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))]"
                  placeholder='{ "type": "simple", "expression": "" }'
                />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" @click="showVersionModal = false">Cancel</button>
                <button type="submit" :disabled="savingVersion" class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                  {{ savingVersion ? 'Creating...' : 'Create Version' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Recalculation Confirmation -->
    <ConfirmDialog
      :open="showRecalcConfirm"
      title="Trigger Recalculation"
      description="This will recalculate all metric values based on the latest definitions. This may take some time depending on the data volume."
      :confirm-label="recalculating ? 'Processing...' : 'Recalculate'"
      @confirm="handleRecalc"
      @cancel="showRecalcConfirm = false"
    />
  </div>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
