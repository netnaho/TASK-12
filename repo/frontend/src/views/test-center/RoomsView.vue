<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { Plus, Pencil, Trash2 } from 'lucide-vue-next';
import DataTable from '@/components/shared/DataTable.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import {
  getSites,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from '@/api/endpoints/test-center.api';

interface Site {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  capacity: number;
  adaAccessible: boolean;
  seatCount: number;
  sessionCount: number;
}

const { toast } = useToast();

const columns = [
  { key: 'name', label: 'Room Name', sortable: true },
  { key: 'siteName', label: 'Site' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'adaAccessible', label: 'ADA' },
  { key: 'seatCount', label: 'Seats' },
  { key: 'sessionCount', label: 'Sessions' },
  { key: 'actions', label: '' },
];

// Load sites for filter and form
const { data: sites } = useApiQuery<Site[]>(() => getSites());

const selectedSiteId = ref('');

const { data: rooms, loading, error, refetch } = useApiQuery<Room[]>(
  () => getRooms(selectedSiteId.value || '_all'),
);

watch(selectedSiteId, () => {
  refetch();
});

// Modal
const showModal = ref(false);
const editingRoom = ref<Room | null>(null);
const form = reactive({
  name: '',
  siteId: '',
  capacity: 10,
  adaAccessible: false,
});
const saving = ref(false);

function openAdd() {
  editingRoom.value = null;
  form.name = '';
  form.siteId = sites.value?.[0]?.id ?? '';
  form.capacity = 10;
  form.adaAccessible = false;
  showModal.value = true;
}

function openEdit(room: Room) {
  editingRoom.value = room;
  form.name = room.name;
  form.siteId = room.siteId;
  form.capacity = room.capacity;
  form.adaAccessible = room.adaAccessible;
  showModal.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = { name: form.name, capacity: form.capacity, adaAccessible: form.adaAccessible };
    if (editingRoom.value) {
      await updateRoom(editingRoom.value.siteId, editingRoom.value.id, payload);
      toast.success('Room updated');
    } else {
      await createRoom(form.siteId, payload);
      toast.success('Room created');
    }
    showModal.value = false;
    refetch();
  } catch {
    toast.error('Failed to save room');
  } finally {
    saving.value = false;
  }
}

// Delete
const deleteTarget = ref<Room | null>(null);
const showDeleteConfirm = ref(false);

function confirmDelete(room: Room) {
  deleteTarget.value = room;
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteRoom(deleteTarget.value.siteId, deleteTarget.value.id);
    toast.success('Room deleted');
    showDeleteConfirm.value = false;
    refetch();
  } catch {
    toast.error('Failed to delete room');
  }
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Rooms</h2>
        <select
          v-model="selectedSiteId"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        >
          <option value="">All Sites</option>
          <option v-for="site in sites ?? []" :key="site.id" :value="site.id">
            {{ site.name }}
          </option>
        </select>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        @click="openAdd"
      >
        <Plus class="h-4 w-4" />
        Add Room
      </button>
    </div>

    <ErrorState v-if="error" :message="error" :on-retry="refetch" />

    <DataTable
      v-else
      :columns="columns"
      :rows="(rooms as any[]) ?? []"
      :loading="loading"
      empty-message="No rooms found"
    >
      <template #cell-adaAccessible="{ value }">
        <span
          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          :class="value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          {{ value ? 'Yes' : 'No' }}
        </span>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <button
            class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
            title="Edit"
            @click="openEdit(row as unknown as Room)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete"
            @click="confirmDelete(row as unknown as Room)"
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
              {{ editingRoom ? 'Edit Room' : 'Add Room' }}
            </h3>
            <form @submit.prevent="handleSave" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Room Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  placeholder="Room name"
                />
              </div>
              <div v-if="!editingRoom">
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Site</label>
                <select
                  v-model="form.siteId"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                >
                  <option value="" disabled>Select a site</option>
                  <option v-for="site in sites ?? []" :key="site.id" :value="site.id">
                    {{ site.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Capacity</label>
                <input
                  v-model.number="form.capacity"
                  type="number"
                  min="1"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                />
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="form.adaAccessible"
                  type="checkbox"
                  id="ada-checkbox"
                  class="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                />
                <label for="ada-checkbox" class="text-sm font-medium text-[hsl(var(--foreground))]">
                  ADA Accessible
                </label>
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
                  {{ saving ? 'Saving...' : editingRoom ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmDialog
      :open="showDeleteConfirm"
      title="Delete Room"
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
