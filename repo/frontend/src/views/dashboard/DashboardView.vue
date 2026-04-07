<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Users,
  Building,
  CalendarClock,
  FileText,
  TrendingUp,
  DoorOpen,
  BarChart3,
  ClipboardList,
  Monitor,
  Database,
  Clock,
  Bell,
  ListChecks,
  Activity,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';
import { getNotifications } from '@/api/endpoints/notifications.api';
import PageHeader from '@/components/shared/PageHeader.vue';
import KpiCard from './widgets/KpiCard.vue';

const authStore = useAuthStore();

const kpiLoading = ref(true);
const chartLoading = ref(true);
const activityLoading = ref(true);
const notifications = ref<any[]>([]);

// ---- Role detection ----
function hasRole(role: Role): boolean {
  return authStore.user?.roles?.includes(role) ?? false;
}

const primaryRole = computed(() => {
  if (hasRole(Role.Admin)) return 'admin';
  if (hasRole(Role.Manager)) return 'manager';
  if (hasRole(Role.Proctor)) return 'proctor';
  if (hasRole(Role.Analyst)) return 'analyst';
  return 'user';
});

const welcomeName = computed(
  () => authStore.user?.firstName ?? authStore.user?.username ?? 'User',
);

// ---- KPI definitions per role ----
interface KpiDef {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const kpiData = computed<KpiDef[]>(() => {
  switch (primaryRole.value) {
    case 'admin':
      return [
        { title: 'Total Users', value: 248, change: 12, icon: Users, color: 'blue' },
        { title: 'Active Listings', value: 1_034, change: 5.3, icon: Building, color: 'green' },
        { title: 'Upcoming Sessions', value: 18, change: -2.1, icon: CalendarClock, color: 'orange' },
        { title: 'Pending Reports', value: 7, change: 0, icon: FileText, color: 'purple' },
      ];
    case 'manager':
      return [
        { title: 'Active Listings', value: 1_034, change: 5.3, icon: Building, color: 'blue' },
        { title: 'Avg Rent', value: '$2,140', change: 3.8, icon: TrendingUp, color: 'green' },
        { title: 'Vacancy Rate', value: '4.2%', change: -1.5, icon: DoorOpen, color: 'orange' },
        { title: 'Monthly Reports', value: 12, change: 8, icon: BarChart3, color: 'purple' },
      ];
    case 'proctor':
      return [
        { title: 'Upcoming Sessions', value: 18, change: 6, icon: CalendarClock, color: 'blue' },
        { title: 'Active Rooms', value: 5, change: 0, icon: Monitor, color: 'green' },
        { title: 'Pending Registrations', value: 23, change: 14, icon: ClipboardList, color: 'orange' },
        { title: 'Equipment Status', value: 'OK', icon: Activity, color: 'purple' },
      ];
    case 'analyst':
      return [
        { title: 'Published Reports', value: 34, change: 10, icon: FileText, color: 'blue' },
        { title: 'Metric Definitions', value: 89, change: 2, icon: Database, color: 'green' },
        { title: 'Scheduled Reports', value: 6, change: 0, icon: Clock, color: 'orange' },
        { title: 'Data Points', value: '1.2M', change: 15, icon: BarChart3, color: 'purple' },
      ];
    default:
      return [
        { title: 'My Tasks', value: 12, change: -3, icon: ListChecks, color: 'blue' },
        { title: 'My Sessions', value: 3, change: 0, icon: CalendarClock, color: 'green' },
        { title: 'Active Listings', value: 48, change: 5, icon: Building, color: 'orange' },
        { title: 'Notifications', value: 7, change: 2, icon: Bell, color: 'purple' },
      ];
  }
});

// ---- Chart mock data ----
const listingMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const listingValues = [42, 58, 65, 47, 72, 84];
const listingMax = computed(() => Math.max(...listingValues));

const regionLabels = ['North', 'South', 'East', 'West', 'Central'];
const regionValues = [88, 72, 65, 91, 78];
const regionMax = computed(() => Math.max(...regionValues));

// ---- Fetch data ----
onMounted(async () => {
  // Simulate KPI load
  setTimeout(() => {
    kpiLoading.value = false;
  }, 600);

  setTimeout(() => {
    chartLoading.value = false;
  }, 900);

  try {
    const { data } = await getNotifications({ limit: 5 });
    notifications.value = data.data ?? data ?? [];
  } catch {
    notifications.value = [];
  } finally {
    activityLoading.value = false;
  }
});

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
</script>

<template>
  <div>
    <PageHeader
      title="Dashboard"
      :description="`Welcome back, ${welcomeName}`"
    />

    <!-- KPI Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <KpiCard
        v-for="(kpi, idx) in kpiData"
        :key="idx"
        :title="kpi.title"
        :value="kpi.value"
        :change="kpi.change"
        :icon="kpi.icon"
        :color="kpi.color"
        :loading="kpiLoading"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <!-- Listing Activity Chart -->
      <div
        class="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5"
      >
        <h3 class="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
          Listing Activity
        </h3>

        <!-- Skeleton -->
        <div v-if="chartLoading" class="space-y-3">
          <div
            v-for="i in 4"
            :key="i"
            class="h-4 bg-gray-200 rounded animate-pulse"
            :style="{ width: `${60 + Math.random() * 40}%` }"
          />
          <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>

        <!-- SVG Line Chart -->
        <div v-else class="relative h-48">
          <svg viewBox="0 0 300 140" class="w-full h-full" preserveAspectRatio="none">
            <!-- Grid lines -->
            <line
              v-for="i in 4"
              :key="'g' + i"
              :x1="0"
              :y1="i * 28"
              :x2="300"
              :y2="i * 28"
              stroke="hsl(var(--border))"
              stroke-width="0.5"
            />
            <!-- Area fill -->
            <polygon
              :points="
                listingValues
                  .map(
                    (v, i) =>
                      `${(i / (listingValues.length - 1)) * 280 + 10},${
                        120 - (v / listingMax) * 100
                      }`,
                  )
                  .join(' ') +
                ` 290,120 10,120`
              "
              fill="url(#areaGrad)"
              opacity="0.15"
            />
            <!-- Line -->
            <polyline
              :points="
                listingValues
                  .map(
                    (v, i) =>
                      `${(i / (listingValues.length - 1)) * 280 + 10},${
                        120 - (v / listingMax) * 100
                      }`,
                  )
                  .join(' ')
              "
              fill="none"
              stroke="hsl(221.2, 83.2%, 53.3%)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- Dots -->
            <circle
              v-for="(v, i) in listingValues"
              :key="'d' + i"
              :cx="(i / (listingValues.length - 1)) * 280 + 10"
              :cy="120 - (v / listingMax) * 100"
              r="3"
              fill="white"
              stroke="hsl(221.2, 83.2%, 53.3%)"
              stroke-width="2"
            />
            <!-- Month labels -->
            <text
              v-for="(m, i) in listingMonths"
              :key="'m' + i"
              :x="(i / (listingMonths.length - 1)) * 280 + 10"
              y="137"
              text-anchor="middle"
              class="text-[9px] fill-[hsl(var(--muted-foreground))]"
            >
              {{ m }}
            </text>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="hsl(221.2, 83.2%, 53.3%)" />
                <stop offset="100%" stop-color="hsl(221.2, 83.2%, 53.3%)" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <!-- Occupancy by Region Chart -->
      <div
        class="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5"
      >
        <h3 class="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
          Occupancy by Region
        </h3>

        <!-- Skeleton -->
        <div v-if="chartLoading" class="space-y-3">
          <div
            v-for="i in 5"
            :key="i"
            class="flex items-center gap-3"
          >
            <div class="h-3 w-12 bg-gray-200 rounded animate-pulse" />
            <div
              class="h-6 bg-gray-200 rounded animate-pulse"
              :style="{ width: `${40 + Math.random() * 50}%` }"
            />
          </div>
        </div>

        <!-- Horizontal Bar Chart -->
        <div v-else class="space-y-3 h-48 flex flex-col justify-center">
          <div
            v-for="(val, i) in regionValues"
            :key="i"
            class="flex items-center gap-3"
          >
            <span class="text-xs text-[hsl(var(--muted-foreground))] w-14 text-right shrink-0">
              {{ regionLabels[i] }}
            </span>
            <div class="flex-1 bg-[hsl(var(--muted))] rounded-full h-6 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-end pr-2 transition-all duration-700"
                :style="{ width: `${(val / regionMax) * 100}%` }"
              >
                <span class="text-[10px] font-semibold text-white">{{ val }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div
      class="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5"
    >
      <h3 class="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
        Recent Activity
      </h3>

      <!-- Skeleton -->
      <div v-if="activityLoading" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3.5 bg-gray-200 rounded animate-pulse w-3/4" />
            <div class="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
          </div>
        </div>
      </div>

      <!-- Loaded -->
      <div v-else-if="notifications.length" class="divide-y divide-[hsl(var(--border))]">
        <div
          v-for="(n, idx) in notifications.slice(0, 5)"
          :key="n.id ?? idx"
          class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div
            class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0"
          >
            <Bell class="h-4 w-4 text-blue-600" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-[hsl(var(--foreground))] line-clamp-1">
              {{ n.title ?? n.message ?? 'Notification' }}
            </p>
            <p class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              {{ n.createdAt ? formatTimeAgo(n.createdAt) : '' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <Bell class="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2 opacity-40" />
        <p class="text-sm text-[hsl(var(--muted-foreground))]">No recent activity</p>
      </div>
    </div>
  </div>
</template>
