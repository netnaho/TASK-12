<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Plus, Pencil, Trash2 } from 'lucide-vue-next';
import DataTable from '@/components/shared/DataTable.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import {
  getSites,
  createSite,
  updateSite,
  deleteSite,
} from '@/api/endpoints/test-center.api';

interface Site {
  id: string;
  name: string;
  address: string;
  timezone: string;
  roomCount: number;
  status: string;
}

const { toast } = useToast();

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'address', label: 'Address' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'roomCount', label: 'Rooms' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
];

const { data: sites, loading, error, refetch } = useApiQuery<Site[]>(
  () => getSites(),
);

// Modal state
const showModal = ref(false);
const editingSite = ref<Site | null>(null);
const form = reactive({
  name: '',
  address: '',
  timezone: 'America/New_York',
});
const saving = ref(false);

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
];

function openAdd() {
  editingSite.value = null;
  form.name = '';
  form.address = '';
  form.timezone = 'America/New_York';
  showModal.value = true;
}

function openEdit(site: Site) {
  editingSite.value = site;
  form.name = site.name;
  form.address = site.address;
  form.timezone = site.timezone;
  showModal.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingSite.value) {
      await updateSite(editingSite.value.id, { ...form });
      toast.success('Site updated');
    } else {
      await createSite({ ...form });
      toast.success('Site created');
    }
    showModal.value = false;
    refetch();
  } catch {
    toast.error('Failed to save site');
  } finally {
    saving.value = false;
  }
}

// Delete confirmation
const deleteTarget = ref<Site | null>(null);
const showDeleteConfirm = ref(false);

function confirmDelete(site: Site) {
  deleteTarget.value = site;
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteSite(deleteTarget.value.id);
    toast.success('Site deleted');
    showDeleteConfirm.value = false;
    refetch();
  } catch {
    toast.error('Failed to delete site');
  }
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    active: 'success',
    inactive: 'neutral',
    maintenance: 'warning',
  };
  return map[status?.toLowerCase()] ?? 'neutral';
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Sites</h2>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        @click="openAdd"
      >
        <Plus class="h-4 w-4" />
        Add Site
      </button>
    </div>

    <ErrorState v-if="error" :message="error" :on-retry="refetch" />

    <DataTable
      v-else
      :columns="columns"
      :rows="(sites as any[]) ?? []"
      :loading="loading"
      empty-message="No sites found"
    >
      <template #cell-status="{ row }">
        <StatusChip :variant="statusVariant(row.status as string)" :label="(row.status as string) ?? 'Unknown'" />
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <button
            class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
            title="Edit"
            @click="openEdit(row as unknown as Site)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete"
            @click="confirmDelete(row as unknown as Site)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="showModal = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10">
            <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
              {{ editingSite ? 'Edit Site' : 'Add Site' }}
            </h3>
            <form @submit.prevent="handleSave" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  placeholder="Site name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Address</label>
                <input
                  v-model="form.address"
                  type="text"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  placeholder="Full address"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Timezone</label>
                <select
                  v-model="form.timezone"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                >
                  <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
                </select>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                  @click="showModal = false"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {{ saving ? 'Saving...' : editingSite ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :open="showDeleteConfirm"
      title="Delete Site"
      :description="`Are you sure you want to delete '${deleteTarget?.name}'? This action cannot be undone.`"
      confirm-label="Delete"
      variant="danger"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
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
