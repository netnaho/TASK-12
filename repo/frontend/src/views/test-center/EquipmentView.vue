<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { Plus, Pencil, Trash2 } from 'lucide-vue-next';
import DataTable from '@/components/shared/DataTable.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getSites,
  getRooms,
} from '@/api/endpoints/test-center.api';

interface Equipment {
  id: string;
  type: string;
  serialNumber: string;
  seatLabel: string;
  roomName: string;
  roomId: string;
  status: string;
}

interface Site { id: string; name: string; }
interface Room { id: string; name: string; siteId: string; }

const { toast } = useToast();

const columns = [
  { key: 'type', label: 'Equipment Type', sortable: true },
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'seatLabel', label: 'Seat' },
  { key: 'roomName', label: 'Room' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
];

const statusFilter = ref('');
const roomFilter = ref('');

const { data: equipment, loading, error, refetch } = useApiQuery<Equipment[]>(
  () => getEquipment({
    ...(statusFilter.value && { status: statusFilter.value }),
    ...(roomFilter.value && { roomId: roomFilter.value }),
  }),
);

const { data: sites } = useApiQuery<Site[]>(() => getSites());
const allRooms = ref<Room[]>([]);

// Load rooms from all sites
watch(sites, async (newSites) => {
  if (!newSites) return;
  const roomPromises = newSites.map((s) => getRooms(s.id).then((res) => {
    const d = res.data?.data ?? res.data ?? res;
    return Array.isArray(d) ? d.map((r: any) => ({ ...r, siteId: s.id })) : [];
  }).catch(() => []));
  const results = await Promise.all(roomPromises);
  allRooms.value = results.flat();
}, { immediate: true });

watch([statusFilter, roomFilter], () => {
  refetch();
});

function equipmentStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    OPERATIONAL: 'success',
    NEEDS_REPAIR: 'warning',
    DECOMMISSIONED: 'error',
  };
  return map[status] ?? 'neutral';
}

// Modal
const showModal = ref(false);
const editingEquipment = ref<Equipment | null>(null);
const form = reactive({
  type: '',
  serialNumber: '',
  roomId: '',
  seatId: '',
  status: 'OPERATIONAL',
});
const saving = ref(false);

function openAdd() {
  editingEquipment.value = null;
  form.type = '';
  form.serialNumber = '';
  form.roomId = '';
  form.seatId = '';
  form.status = 'OPERATIONAL';
  showModal.value = true;
}

function openEdit(eq: Equipment) {
  editingEquipment.value = eq;
  form.type = eq.type;
  form.serialNumber = eq.serialNumber;
  form.roomId = eq.roomId;
  form.seatId = '';
  form.status = eq.status;
  showModal.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingEquipment.value) {
      await updateEquipment(editingEquipment.value.id, { ...form });
      toast.success('Equipment updated');
    } else {
      await createEquipment({ ...form });
      toast.success('Equipment created');
    }
    showModal.value = false;
    refetch();
  } catch {
    toast.error('Failed to save equipment');
  } finally {
    saving.value = false;
  }
}

// Delete
const deleteTarget = ref<Equipment | null>(null);
const showDeleteConfirm = ref(false);

function confirmDelete(eq: Equipment) {
  deleteTarget.value = eq;
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteEquipment(deleteTarget.value.id);
    toast.success('Equipment deleted');
    showDeleteConfirm.value = false;
    refetch();
  } catch {
    toast.error('Failed to delete equipment');
  }
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Equipment</h2>
        <select
          v-model="statusFilter"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        >
          <option value="">All Status</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="NEEDS_REPAIR">Needs Repair</option>
          <option value="DECOMMISSIONED">Decommissioned</option>
        </select>
        <select
          v-model="roomFilter"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        >
          <option value="">All Rooms</option>
          <option v-for="room in allRooms" :key="room.id" :value="room.id">
            {{ room.name }}
          </option>
        </select>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        @click="openAdd"
      >
        <Plus class="h-4 w-4" />
        Add Equipment
      </button>
    </div>

    <ErrorState v-if="error" :message="error" :on-retry="refetch" />

    <DataTable
      v-else
      :columns="columns"
      :rows="(equipment as any[]) ?? []"
      :loading="loading"
      empty-message="No equipment found"
    >
      <template #cell-status="{ value }">
        <StatusChip
          :variant="equipmentStatusVariant(value as string)"
          :label="(value as string)?.replace('_', ' ') ?? 'Unknown'"
        />
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <button
            class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
            title="Edit"
            @click="openEdit(row as unknown as Equipment)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete"
            @click="confirmDelete(row as unknown as Equipment)"
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
              {{ editingEquipment ? 'Edit Equipment' : 'Add Equipment' }}
            </h3>
            <form @submit.prevent="handleSave" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Equipment Type</label>
                <input
                  v-model="form.type"
                  type="text"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  placeholder="e.g. Computer, Monitor, Headset"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Serial Number</label>
                <input
                  v-model="form.serialNumber"
                  type="text"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  placeholder="Serial number"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Room</label>
                <select
                  v-model="form.roomId"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                >
                  <option value="">Select room</option>
                  <option v-for="room in allRooms" :key="room.id" :value="room.id">
                    {{ room.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Status</label>
                <select
                  v-model="form.status"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                >
                  <option value="OPERATIONAL">Operational</option>
                  <option value="NEEDS_REPAIR">Needs Repair</option>
                  <option value="DECOMMISSIONED">Decommissioned</option>
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
                  {{ saving ? 'Saving...' : editingEquipment ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmDialog
      :open="showDeleteConfirm"
      title="Delete Equipment"
      :description="`Are you sure you want to delete '${deleteTarget?.type} (${deleteTarget?.serialNumber})'?`"
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
