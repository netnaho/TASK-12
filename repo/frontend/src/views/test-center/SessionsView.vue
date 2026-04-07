<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { Plus, Table, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-vue-next';
import DataTable from '@/components/shared/DataTable.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import {
  getSessions,
  createSession,
  getSites,
  getRooms,
} from '@/api/endpoints/test-center.api';

interface Session {
  id: string;
  name: string;
  roomId: string;
  roomName: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  enrolledCount: number;
  status: string;
}

interface Site { id: string; name: string; }
interface Room { id: string; name: string; siteId: string; }

const { toast } = useToast();

const viewMode = ref<'table' | 'calendar'>('table');

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'roomName', label: 'Room' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'status', label: 'Status' },
];

const { data: sessions, loading, error, refetch } = useApiQuery<Session[]>(
  () => getSessions(),
);

const { data: sites } = useApiQuery<Site[]>(() => getSites());
const allRooms = ref<Room[]>([]);

watch(sites, async (newSites) => {
  if (!newSites) return;
  const roomPromises = newSites.map((s) =>
    getRooms(s.id).then((res) => {
      const d = res.data?.data ?? res.data ?? res;
      return Array.isArray(d) ? d.map((r: any) => ({ ...r, siteId: s.id })) : [];
    }).catch(() => [])
  );
  const results = await Promise.all(roomPromises);
  allRooms.value = results.flat();
}, { immediate: true });

// Table rows with formatted fields
const tableRows = computed(() => {
  if (!sessions.value) return [];
  return sessions.value.map((s) => ({
    ...s,
    date: new Date(s.startTime).toLocaleDateString(),
    time: `${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    capacity: `${s.enrolledCount}/${s.maxCapacity}`,
  }));
});

function sessionStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    SCHEDULED: 'info',
    IN_PROGRESS: 'success',
    COMPLETED: 'neutral',
    CANCELLED: 'error',
    FULL: 'warning',
  };
  return map[status] ?? 'neutral';
}

// Create session modal
const showModal = ref(false);
const form = reactive({
  roomId: '',
  name: '',
  startTime: '',
  endTime: '',
  maxCapacity: 20,
});
const saving = ref(false);

function openCreate() {
  form.roomId = '';
  form.name = '';
  form.startTime = '';
  form.endTime = '';
  form.maxCapacity = 20;
  showModal.value = true;
}

async function handleCreate() {
  saving.value = true;
  try {
    await createSession({
      roomId: form.roomId,
      name: form.name,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      maxCapacity: form.maxCapacity,
    });
    toast.success('Session created');
    showModal.value = false;
    refetch();
  } catch {
    toast.error('Failed to create session');
  } finally {
    saving.value = false;
  }
}

// Session detail
const selectedSession = ref<Session | null>(null);

function viewSession(session: Session) {
  selectedSession.value = session;
}

// Calendar
const calendarDate = ref(new Date());

const calendarYear = computed(() => calendarDate.value.getFullYear());
const calendarMonth = computed(() => calendarDate.value.getMonth());
const calendarMonthName = computed(() =>
  calendarDate.value.toLocaleString('default', { month: 'long', year: 'numeric' })
);

function prevMonth() {
  const d = new Date(calendarDate.value);
  d.setMonth(d.getMonth() - 1);
  calendarDate.value = d;
}

function nextMonth() {
  const d = new Date(calendarDate.value);
  d.setMonth(d.getMonth() + 1);
  calendarDate.value = d;
}

const calendarDays = computed(() => {
  const year = calendarYear.value;
  const month = calendarMonth.value;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<{ date: number | null; sessions: Session[] }> = [];

  // Padding
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: null, sessions: [] });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const daySessions = (sessions.value ?? []).filter((s) => {
      return s.startTime.startsWith(dateStr);
    });
    days.push({ date: d, sessions: daySessions });
  }

  return days;
});

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-200 text-blue-800',
  IN_PROGRESS: 'bg-green-200 text-green-800',
  COMPLETED: 'bg-gray-200 text-gray-800',
  CANCELLED: 'bg-red-200 text-red-800',
  FULL: 'bg-yellow-200 text-yellow-800',
};
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Sessions</h2>
        <div class="flex items-center rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <button
            class="px-3 py-2 text-sm font-medium transition-colors"
            :class="viewMode === 'table'
              ? 'bg-[hsl(var(--primary))] text-white'
              : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'"
            @click="viewMode = 'table'"
          >
            <Table class="h-4 w-4" />
          </button>
          <button
            class="px-3 py-2 text-sm font-medium transition-colors"
            :class="viewMode === 'calendar'
              ? 'bg-[hsl(var(--primary))] text-white'
              : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'"
            @click="viewMode = 'calendar'"
          >
            <CalendarDays class="h-4 w-4" />
          </button>
        </div>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Create Session
      </button>
    </div>

    <ErrorState v-if="error" :message="error" :on-retry="refetch" />

    <!-- Table mode -->
    <template v-else-if="viewMode === 'table'">
      <DataTable
        :columns="columns"
        :rows="(tableRows as any[])"
        :loading="loading"
        empty-message="No sessions found"
      >
        <template #cell-capacity="{ row }">
          <span class="font-mono text-sm">{{ row.capacity }}</span>
        </template>
        <template #cell-status="{ value }">
          <StatusChip
            :variant="sessionStatusVariant(value as string)"
            :label="(value as string)?.replace('_', ' ') ?? 'Unknown'"
          />
        </template>
      </DataTable>
    </template>

    <!-- Calendar mode -->
    <template v-else>
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
      <div v-else-if="!sessions || sessions.length === 0">
        <EmptyState title="No sessions" description="No sessions scheduled." :icon="CalendarDays" />
      </div>
      <div v-else>
        <!-- Calendar header -->
        <div class="flex items-center justify-between mb-4">
          <button
            class="rounded-lg p-2 hover:bg-[hsl(var(--muted))] transition-colors"
            @click="prevMonth"
          >
            <ChevronLeft class="h-5 w-5 text-[hsl(var(--foreground))]" />
          </button>
          <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">
            {{ calendarMonthName }}
          </h3>
          <button
            class="rounded-lg p-2 hover:bg-[hsl(var(--muted))] transition-colors"
            @click="nextMonth"
          >
            <ChevronRight class="h-5 w-5 text-[hsl(var(--foreground))]" />
          </button>
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 border border-[hsl(var(--border))] rounded-lg overflow-hidden">
          <!-- Day headers -->
          <div
            v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
            :key="day"
            class="px-2 py-2 text-center text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]"
          >
            {{ day }}
          </div>

          <!-- Day cells -->
          <div
            v-for="(cell, idx) in calendarDays"
            :key="idx"
            class="min-h-[100px] border-b border-r border-[hsl(var(--border))] p-1"
            :class="{ 'bg-[hsl(var(--muted)/0.3)]': !cell.date }"
          >
            <div v-if="cell.date" class="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
              {{ cell.date }}
            </div>
            <div class="space-y-1">
              <button
                v-for="s in cell.sessions.slice(0, 3)"
                :key="s.id"
                class="w-full text-left rounded px-1 py-0.5 text-xs truncate"
                :class="statusColors[s.status] ?? 'bg-gray-200 text-gray-800'"
                @click="viewSession(s)"
              >
                {{ s.name }}
              </button>
              <div
                v-if="cell.sessions.length > 3"
                class="text-xs text-[hsl(var(--muted-foreground))] px-1"
              >
                +{{ cell.sessions.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Session detail modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="selectedSession"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="selectedSession = null" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">
                {{ selectedSession.name }}
              </h3>
              <button
                class="rounded-lg p-1 hover:bg-[hsl(var(--muted))] transition-colors"
                @click="selectedSession = null"
              >
                <X class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-[hsl(var(--muted-foreground))]">Room</dt>
                <dd class="font-medium text-[hsl(var(--foreground))]">{{ selectedSession.roomName }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-[hsl(var(--muted-foreground))]">Date</dt>
                <dd class="font-medium text-[hsl(var(--foreground))]">{{ new Date(selectedSession.startTime).toLocaleDateString() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-[hsl(var(--muted-foreground))]">Time</dt>
                <dd class="font-medium text-[hsl(var(--foreground))]">
                  {{ new Date(selectedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} -
                  {{ new Date(selectedSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-[hsl(var(--muted-foreground))]">Capacity</dt>
                <dd class="font-medium text-[hsl(var(--foreground))]">{{ selectedSession.enrolledCount }} / {{ selectedSession.maxCapacity }}</dd>
              </div>
              <div class="flex justify-between items-center">
                <dt class="text-[hsl(var(--muted-foreground))]">Status</dt>
                <dd>
                  <StatusChip
                    :variant="sessionStatusVariant(selectedSession.status)"
                    :label="selectedSession.status.replace('_', ' ')"
                  />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Create session modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="showModal = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10">
            <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
              Create Session
            </h3>
            <form @submit.prevent="handleCreate" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Session Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  placeholder="Session name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Room</label>
                <select
                  v-model="form.roomId"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                >
                  <option value="" disabled>Select room</option>
                  <option v-for="room in allRooms" :key="room.id" :value="room.id">
                    {{ room.name }}
                  </option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Start Date/Time</label>
                  <input
                    v-model="form.startTime"
                    type="datetime-local"
                    required
                    class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">End Date/Time</label>
                  <input
                    v-model="form.endTime"
                    type="datetime-local"
                    required
                    class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Max Capacity</label>
                <input
                  v-model.number="form.maxCapacity"
                  type="number"
                  min="1"
                  required
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                />
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
                  {{ saving ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
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
