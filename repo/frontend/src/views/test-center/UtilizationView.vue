<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { BarChart3, TrendingUp, Calendar, Activity } from 'lucide-vue-next';
import PageHeader from '@/components/shared/PageHeader.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import BaseChart from '@/components/charts/BaseChart.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import {
  getSites,
  getRooms,
  getUtilization,
} from '@/api/endpoints/test-center.api';
import type { EChartsOption } from 'echarts';

interface Site { id: string; name: string; }
interface Room { id: string; name: string; siteId: string; }
interface UtilizationData {
  date: string;
  value: number;
}
interface UtilizationResponse {
  data: UtilizationData[];
  summary: {
    averageUtilization: number;
    peakDay: string;
    totalSessions: number;
  };
}

const selectedSiteId = ref('');
const selectedRoomId = ref('');
const dateFrom = ref(getDefaultDateFrom());
const dateTo = ref(getDefaultDateTo());

function getDefaultDateFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
}

function getDefaultDateTo(): string {
  return new Date().toISOString().split('T')[0];
}

const { data: sites } = useApiQuery<Site[]>(() => getSites());

const rooms = ref<Room[]>([]);

watch(selectedSiteId, async (siteId) => {
  selectedRoomId.value = '';
  if (!siteId) {
    rooms.value = [];
    return;
  }
  try {
    const res = await getRooms(siteId);
    const d = res.data?.data ?? res.data ?? res;
    rooms.value = Array.isArray(d) ? d : [];
  } catch {
    rooms.value = [];
  }
});

const queryParams = computed(() => ({
  ...(selectedSiteId.value && { siteId: selectedSiteId.value }),
  ...(selectedRoomId.value && { roomId: selectedRoomId.value }),
  from: dateFrom.value,
  to: dateTo.value,
}));

const { data: utilization, loading, error, refetch } = useApiQuery<UtilizationResponse>(
  () => getUtilization(queryParams.value),
);

watch([selectedSiteId, selectedRoomId, dateFrom, dateTo], () => {
  refetch();
});

const summary = computed(() => utilization.value?.summary ?? {
  averageUtilization: 0,
  peakDay: '-',
  totalSessions: 0,
});

const utilizationItems = computed(() => utilization.value?.data ?? []);

// ECharts heatmap calendar option
const chartOption = computed<EChartsOption>(() => {
  const items = utilizationItems.value;
  if (!items.length) {
    return {
      title: { text: 'No utilization data', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } },
    };
  }

  const calData = items.map((d) => [d.date, d.value]);
  const year = dateFrom.value.substring(0, 4);

  return {
    tooltip: {
      formatter(params: any) {
        const p = Array.isArray(params) ? params[0] : params;
        return `${p.value[0]}: ${p.value[1]}%`;
      },
    },
    visualMap: {
      min: 0,
      max: 100,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      top: 10,
      pieces: [
        { min: 0, max: 25, label: '0-25%', color: '#ebedf0' },
        { min: 25, max: 50, label: '25-50%', color: '#9be9a8' },
        { min: 50, max: 75, label: '50-75%', color: '#40c463' },
        { min: 75, max: 100, label: '75-100%', color: '#216e39' },
      ],
    },
    calendar: {
      top: 80,
      left: 40,
      right: 40,
      cellSize: ['auto', 16],
      range: [dateFrom.value, dateTo.value],
      itemStyle: {
        borderWidth: 3,
        borderColor: '#fff',
      },
      yearLabel: { show: true },
      dayLabel: { show: true, nameMap: 'en' },
      monthLabel: { show: true },
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: calData,
    }],
  };
});

const statCards = computed(() => [
  {
    label: 'Average Utilization',
    value: `${summary.value.averageUtilization?.toFixed(1) ?? 0}%`,
    icon: Activity,
    color: 'text-blue-600 bg-blue-100',
  },
  {
    label: 'Peak Usage Day',
    value: summary.value.peakDay
      ? new Date(summary.value.peakDay).toLocaleDateString()
      : '-',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-100',
  },
  {
    label: 'Total Sessions',
    value: String(summary.value.totalSessions ?? 0),
    icon: Calendar,
    color: 'text-purple-600 bg-purple-100',
  },
]);
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Utilization</h2>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <select
        v-model="selectedSiteId"
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
      >
        <option value="">All Sites</option>
        <option v-for="site in sites ?? []" :key="site.id" :value="site.id">
          {{ site.name }}
        </option>
      </select>

      <select
        v-model="selectedRoomId"
        :disabled="!selectedSiteId"
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] disabled:opacity-50"
      >
        <option value="">All Rooms</option>
        <option v-for="room in rooms" :key="room.id" :value="room.id">
          {{ room.name }}
        </option>
      </select>

      <div class="flex items-center gap-2">
        <input
          v-model="dateFrom"
          type="date"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        />
        <span class="text-sm text-[hsl(var(--muted-foreground))]">to</span>
        <input
          v-model="dateTo"
          type="date"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        />
      </div>
    </div>

    <!-- Stats summary -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-lg border border-[hsl(var(--border))] p-4 flex items-center gap-4"
      >
        <div class="shrink-0 rounded-full p-3" :class="card.color">
          <component :is="card.icon" class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">{{ card.label }}</p>
          <p class="text-xl font-bold text-[hsl(var(--foreground))]">{{ card.value }}</p>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>
    <ErrorState v-else-if="error" :message="error" :on-retry="refetch" />
    <div v-else class="rounded-lg border border-[hsl(var(--border))] p-4">
      <BaseChart :option="chartOption" height="300px" />
    </div>
  </div>
</template>
