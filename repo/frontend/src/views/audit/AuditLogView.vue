<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { usePagination } from '@/composables/usePagination';
import * as auditApi from '@/api/endpoints/audit.api';
import { formatDate } from '@/utils/format';
import {
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
} from 'lucide-vue-next';

const { page, pageSize, total, totalPages, setTotal } = usePagination(25);

// ── Filters ──────────────────────────────────────────────────────────

const filterAction = ref('');
const filterEntityType = ref('');
const filterActor = ref('');
const filterDateFrom = ref('');
const filterDateTo = ref('');

const actionTypes = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'ASSIGN_ROLE',
  'REMOVE_ROLE',
  'DEACTIVATE',
  'EXPORT',
  'SHARE',
];

const entityTypes = [
  'User',
  'Region',
  'Community',
  'Property',
  'Listing',
  'TestSite',
  'TestRoom',
  'TestSession',
  'Equipment',
  'MetricDefinition',
  'MetricValue',
  'ReportDefinition',
  'Report',
  'Notification',
  'NotificationTemplate',
];

// ── Audit Log Data ───────────────────────────────────────────────────

const {
  data: auditRaw,
  loading,
  error,
  refetch,
} = useApiQuery<any>(() =>
  auditApi.getAuditLogs({
    page: page.value,
    pageSize: pageSize.value,
    action: filterAction.value || undefined,
    entityType: filterEntityType.value || undefined,
    actor: filterActor.value || undefined,
    dateFrom: filterDateFrom.value || undefined,
    dateTo: filterDateTo.value || undefined,
  }),
);

const logs = computed(() => {
  if (!auditRaw.value) return [];
  const raw = auditRaw.value;
  if (raw.meta) setTotal(raw.meta.total ?? 0);
  return raw.data ?? raw ?? [];
});

// Debounced filter refetch
let filterTimeout: ReturnType<typeof setTimeout> | null = null;
watch([filterAction, filterEntityType, filterActor, filterDateFrom, filterDateTo], () => {
  if (filterTimeout) clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    page.value = 1;
    refetch();
  }, 300);
});

// ── Expanded Row ─────────────────────────────────────────────────────

const expandedLogId = ref<string | null>(null);

function toggleExpand(logId: string) {
  expandedLogId.value = expandedLogId.value === logId ? null : logId;
}

// ── Changes Summary ──────────────────────────────────────────────────

function changesSummary(log: any): string {
  const changes = log.changes ?? log.diff ?? log.payload;
  if (!changes) return '--';
  if (typeof changes === 'string') {
    try {
      const parsed = JSON.parse(changes);
      const keys = Object.keys(parsed);
      if (keys.length === 0) return 'No changes';
      return keys.slice(0, 3).join(', ') + (keys.length > 3 ? ` +${keys.length - 3} more` : '');
    } catch {
      return changes.slice(0, 50);
    }
  }
  if (typeof changes === 'object') {
    const keys = Object.keys(changes);
    if (keys.length === 0) return 'No changes';
    return keys.slice(0, 3).join(', ') + (keys.length > 3 ? ` +${keys.length - 3} more` : '');
  }
  return '--';
}

// ── JSON Syntax Highlighting ─────────────────────────────────────────

function formatJson(value: any): string {
  if (!value) return 'null';
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return escapeHtml(value);
    }
  }
  return syntaxHighlight(JSON.stringify(value, null, 2));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match: string) => {
      let cls = 'text-emerald-600'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-600 font-medium'; // key
          match = match.replace(/:$/, '');
          return `<span class="${cls}">${escapeHtml(match)}</span>:`;
        } else {
          cls = 'text-amber-600'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-600'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-gray-400'; // null
      }
      return `<span class="${cls}">${escapeHtml(match)}</span>`;
    },
  );
}

// ── Action Color ─────────────────────────────────────────────────────

function actionColor(action: string): string {
  const map: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN: 'bg-indigo-100 text-indigo-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
    ASSIGN_ROLE: 'bg-purple-100 text-purple-800',
    REMOVE_ROLE: 'bg-yellow-100 text-yellow-800',
    DEACTIVATE: 'bg-orange-100 text-orange-800',
    EXPORT: 'bg-cyan-100 text-cyan-800',
    SHARE: 'bg-pink-100 text-pink-800',
  };
  return map[action] ?? 'bg-gray-100 text-gray-800';
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Audit Log"
      description="Track all system actions with full change history."
    >
      <template #actions>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
          <Shield class="h-3.5 w-3.5" />
          7-Year Retention
        </span>
      </template>
    </PageHeader>

    <!-- Filters Row -->
    <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Action</label>
          <select
            v-model="filterAction"
            class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            <option value="">All Actions</option>
            <option v-for="a in actionTypes" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Entity Type</label>
          <select
            v-model="filterEntityType"
            class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            <option value="">All Types</option>
            <option v-for="e in entityTypes" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Actor</label>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <input
              v-model="filterActor"
              type="text"
              placeholder="Search by username..."
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-8 pr-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">From</label>
          <input
            v-model="filterDateFrom"
            type="date"
            class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">To</label>
          <input
            v-model="filterDateTo"
            type="date"
            class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !auditRaw" class="py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error -->
    <ErrorState v-else-if="error" :message="error" :on-retry="refetch" />

    <!-- Empty -->
    <EmptyState
      v-else-if="logs.length === 0"
      title="No audit entries found"
      description="No audit log entries match your current filters. Try adjusting your search criteria."
      :icon="ScrollText"
    />

    <!-- Audit Table -->
    <template v-else>
      <div class="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
              <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] w-8" />
              <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Timestamp</th>
              <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Action</th>
              <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Actor</th>
              <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Entity Type</th>
              <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Entity ID</th>
              <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Changes</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="log in logs" :key="log.id">
              <tr
                class="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors cursor-pointer"
                @click="toggleExpand(log.id)"
              >
                <td class="px-4 py-3">
                  <ChevronDown
                    v-if="expandedLogId !== log.id"
                    class="h-4 w-4 text-[hsl(var(--muted-foreground))]"
                  />
                  <ChevronUp
                    v-else
                    class="h-4 w-4 text-[hsl(var(--foreground))]"
                  />
                </td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))] whitespace-nowrap">
                  {{ log.createdAt ? formatDate(log.createdAt, 'MMM d, yyyy HH:mm:ss') : '--' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      actionColor(log.action),
                    ]"
                  >
                    {{ log.action }}
                  </span>
                </td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">
                  {{ log.actorName ?? log.actorUsername ?? log.actorId ?? '--' }}
                </td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">
                  {{ log.entityType ?? '--' }}
                </td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">
                  <span class="font-mono text-xs">
                    {{ log.entityId ? log.entityId.slice(0, 8) + '...' : '--' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-[hsl(var(--muted-foreground))] max-w-[200px] truncate">
                  {{ changesSummary(log) }}
                </td>
              </tr>

              <!-- Expanded Detail -->
              <tr v-if="expandedLogId === log.id">
                <td colspan="7" class="bg-[hsl(var(--muted)/0.2)] px-6 py-5">
                  <div class="space-y-4">
                    <!-- Metadata -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Log ID</p>
                        <p class="font-mono text-xs text-[hsl(var(--foreground))]">{{ log.id }}</p>
                      </div>
                      <div>
                        <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Full Entity ID</p>
                        <p class="font-mono text-xs text-[hsl(var(--foreground))]">{{ log.entityId ?? '--' }}</p>
                      </div>
                      <div>
                        <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">IP Address</p>
                        <p class="font-mono text-xs text-[hsl(var(--foreground))]">{{ log.ipAddress ?? log.ip ?? '--' }}</p>
                      </div>
                      <div>
                        <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">User Agent</p>
                        <p class="text-xs text-[hsl(var(--foreground))] truncate" :title="log.userAgent">
                          {{ log.userAgent ?? '--' }}
                        </p>
                      </div>
                    </div>

                    <!-- Before / After JSON -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                          Before
                        </h4>
                        <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 max-h-64 overflow-auto">
                          <pre
                            class="text-xs font-mono leading-relaxed whitespace-pre-wrap"
                            v-html="formatJson(log.before ?? log.oldValue ?? null)"
                          />
                        </div>
                      </div>
                      <div>
                        <h4 class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                          After
                        </h4>
                        <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 max-h-64 overflow-auto">
                          <pre
                            class="text-xs font-mono leading-relaxed whitespace-pre-wrap"
                            v-html="formatJson(log.after ?? log.newValue ?? log.changes ?? null)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Page {{ page }} of {{ totalPages }} ({{ total }} total entries)
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
  </div>
</template>
