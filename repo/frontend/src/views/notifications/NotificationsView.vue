<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Bell, AlertTriangle, Calendar, FileText, Clock, Check, Eye, EyeOff, X, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  snooze,
  dismiss,
} from '@/api/endpoints/notifications.api';

interface Notification {
  id: string;
  title: string;
  body: string;
  category: 'system' | 'alert' | 'schedule' | 'document';
  status: 'unread' | 'read' | 'snoozed';
  createdAt: string;
  snoozedUntil?: string;
}

const { toast } = useToast();
const { page, pageSize, total, totalPages, setTotal } = usePagination(20);

const statusFilter = ref('all');
const categoryFilter = ref('all');
const search = ref('');

const queryParams = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  ...(statusFilter.value !== 'all' && { status: statusFilter.value }),
  ...(categoryFilter.value !== 'all' && { category: categoryFilter.value }),
  ...(search.value && { search: search.value }),
}));

const { data: notifications, loading, error, refetch } = useApiQuery<Notification[]>(
  () => getNotifications(queryParams.value),
);

const { data: unreadCountData, refetch: refetchUnread } = useApiQuery<{ count: number }>(
  () => getUnreadCount(),
);

const unreadCount = computed(() => unreadCountData.value?.count ?? 0);

watch([statusFilter, categoryFilter, search], () => {
  page.value = 1;
  refetch();
});

watch([page, pageSize], () => {
  refetch();
});

const snoozeOpenId = ref<string | null>(null);

const categoryIcons: Record<string, any> = {
  system: Bell,
  alert: AlertTriangle,
  schedule: Calendar,
  document: FileText,
};

const statusVariant: Record<string, 'info' | 'neutral' | 'warning'> = {
  unread: 'info',
  read: 'neutral',
  snoozed: 'warning',
};

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

async function handleMarkRead(n: Notification) {
  try {
    await markRead(n.id);
    n.status = 'read';
    refetchUnread();
    toast.success('Notification marked as read');
  } catch {
    toast.error('Failed to mark notification');
  }
}

async function handleMarkAllRead() {
  try {
    await markAllRead();
    refetch();
    refetchUnread();
    toast.success('All notifications marked as read');
  } catch {
    toast.error('Failed to mark all as read');
  }
}

async function handleSnooze(n: Notification, hours: number) {
  const until = new Date(Date.now() + hours * 3600000).toISOString();
  try {
    await snooze(n.id, { until });
    n.status = 'snoozed';
    snoozeOpenId.value = null;
    refetchUnread();
    toast.success(`Snoozed for ${hours >= 24 ? '1 day' : hours + 'h'}`);
  } catch {
    toast.error('Failed to snooze notification');
  }
}

async function handleDismiss(n: Notification) {
  try {
    await dismiss(n.id);
    refetch();
    refetchUnread();
    toast.success('Notification dismissed');
  } catch {
    toast.error('Failed to dismiss notification');
  }
}

function handleNotificationClick(n: Notification) {
  if (n.status === 'unread') {
    handleMarkRead(n);
  }
}
</script>

<template>
  <div>
    <PageHeader title="Notifications">
      <template #actions>
        <span
          v-if="unreadCount > 0"
          class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
        >
          {{ unreadCount }} unread
        </span>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          @click="handleMarkAllRead"
        >
          <Check class="h-4 w-4" />
          Mark All Read
        </button>
      </template>
    </PageHeader>

    <!-- Filter bar -->
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <select
        v-model="statusFilter"
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
      >
        <option value="all">All Status</option>
        <option value="unread">Unread</option>
        <option value="read">Read</option>
        <option value="snoozed">Snoozed</option>
      </select>

      <select
        v-model="categoryFilter"
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
      >
        <option value="all">All Categories</option>
        <option value="system">System</option>
        <option value="alert">Alert</option>
        <option value="schedule">Schedule</option>
        <option value="document">Document</option>
      </select>

      <input
        v-model="search"
        type="text"
        placeholder="Search notifications..."
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] w-64"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="rounded-lg border border-[hsl(var(--border))] p-4 animate-pulse"
      >
        <div class="flex items-start gap-4">
          <div class="h-10 w-10 rounded-full bg-[hsl(var(--muted))]" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-1/3 rounded bg-[hsl(var(--muted))]" />
            <div class="h-3 w-2/3 rounded bg-[hsl(var(--muted))]" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <ErrorState
      v-else-if="error"
      :message="error"
      :on-retry="refetch"
    />

    <!-- Empty -->
    <EmptyState
      v-else-if="!notifications || notifications.length === 0"
      title="No notifications"
      description="You're all caught up! No notifications to display."
      :icon="Bell"
    />

    <!-- Notification list -->
    <div v-else class="space-y-2">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="group rounded-lg border border-[hsl(var(--border))] p-4 transition-colors hover:bg-[hsl(var(--muted)/0.5)] cursor-pointer"
        :class="{ 'bg-blue-50/50 border-blue-200': n.status === 'unread' }"
        @click="handleNotificationClick(n)"
      >
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div
            class="shrink-0 rounded-full p-2"
            :class="{
              'bg-blue-100': n.category === 'system',
              'bg-orange-100': n.category === 'alert',
              'bg-green-100': n.category === 'schedule',
              'bg-purple-100': n.category === 'document',
            }"
          >
            <component
              :is="categoryIcons[n.category] ?? Bell"
              class="h-5 w-5"
              :class="{
                'text-blue-600': n.category === 'system',
                'text-orange-600': n.category === 'alert',
                'text-green-600': n.category === 'schedule',
                'text-purple-600': n.category === 'document',
              }"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-[hsl(var(--foreground))]">
                {{ n.title }}
              </span>
              <StatusChip
                :variant="statusVariant[n.status] ?? 'neutral'"
                :label="n.status"
              />
            </div>
            <p class="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
              {{ n.body }}
            </p>
            <span class="mt-1 inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
              <Clock class="h-3 w-3" />
              {{ relativeTime(n.createdAt) }}
            </span>
          </div>

          <!-- Actions -->
          <div
            class="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop
          >
            <button
              v-if="n.status === 'unread'"
              class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
              title="Mark as read"
              @click="handleMarkRead(n)"
            >
              <Eye class="h-4 w-4" />
            </button>

            <!-- Snooze dropdown -->
            <div class="relative">
              <button
                class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                title="Snooze"
                @click="snoozeOpenId = snoozeOpenId === n.id ? null : n.id"
              >
                <Clock class="h-4 w-4" />
              </button>
              <div
                v-if="snoozeOpenId === n.id"
                class="absolute right-0 top-full mt-1 z-10 w-36 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-lg py-1"
              >
                <button
                  class="w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                  @click="handleSnooze(n, 1)"
                >
                  1 hour
                </button>
                <button
                  class="w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                  @click="handleSnooze(n, 4)"
                >
                  4 hours
                </button>
                <button
                  class="w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                  @click="handleSnooze(n, 24)"
                >
                  1 day
                </button>
              </div>
            </div>

            <button
              class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Dismiss"
              @click="handleDismiss(n)"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="notifications && notifications.length > 0"
      class="mt-6 flex items-center justify-between"
    >
      <p class="text-sm text-[hsl(var(--muted-foreground))]">
        Page {{ page }} of {{ totalPages }}
      </p>
      <div class="flex items-center gap-2">
        <button
          :disabled="page <= 1"
          class="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="page--"
        >
          <ChevronLeft class="h-4 w-4" />
          Previous
        </button>
        <button
          :disabled="page >= totalPages"
          class="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="page++"
        >
          Next
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
