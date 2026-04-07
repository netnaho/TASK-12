<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import DataTable from '@/components/shared/DataTable.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import BaseChart from '@/components/charts/BaseChart.vue';
import { useToast } from '@/composables/useToast';
import { useApiQuery } from '@/composables/useApiQuery';
import * as analyticsApi from '@/api/endpoints/analytics.api';
import * as communitiesApi from '@/api/endpoints/communities.api';
import * as metricsApi from '@/api/endpoints/metrics.api';
import {
  Play,
  Save,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  BarChart3,
  LineChart,
  AlertCircle,
} from 'lucide-vue-next';
import type { EChartsOption } from 'echarts';

const { toast } = useToast();

// ── Configuration State ──────────────────────────────────────────────

const reportName = ref('');

const dimensions = reactive([
  { key: 'region', label: 'Region', checked: false },
  { key: 'community', label: 'Community', checked: false },
  { key: 'property', label: 'Property', checked: false },
  { key: 'metricType', label: 'Metric Type', checked: true },
  { key: 'month', label: 'Month', checked: true },
]);

const measures = reactive([
  { key: 'avg', label: 'Avg Value', checked: true },
  { key: 'sum', label: 'Sum', checked: false },
  { key: 'count', label: 'Count', checked: false },
  { key: 'min', label: 'Min', checked: false },
  { key: 'max', label: 'Max', checked: false },
]);

const filters = reactive({
  regionId: '',
  communityId: '',
  metricType: '',
  dateFrom: '',
  dateTo: '',
});

// ── Dropdown Data ────────────────────────────────────────────────────

const { data: regions } = useApiQuery<any[]>(() => communitiesApi.getRegions());
const { data: communities } = useApiQuery<any[]>(() => communitiesApi.getCommunities());
const { data: metricDefs } = useApiQuery<any[]>(() => metricsApi.getDefinitions());

const regionList = computed(() => regions.value ?? []);
const communityList = computed(() => communities.value ?? []);
const metricTypeList = computed(() => {
  const defs = metricDefs.value;
  if (!Array.isArray(defs)) return [];
  const types = [...new Set(defs.map((d: any) => d.metricType ?? d.name))];
  return types;
});

// ── Query Execution ──────────────────────────────────────────────────

const queryLoading = ref(false);
const queryError = ref<string | null>(null);
const queryResults = ref<any[] | null>(null);
const resultColumns = ref<{ key: string; label: string }[]>([]);

const selectedDimensions = computed(() =>
  dimensions.filter((d) => d.checked).map((d) => d.key),
);
const selectedMeasures = computed(() =>
  measures.filter((m) => m.checked).map((m) => m.key),
);

const hasTimeSeriesDimension = computed(() =>
  dimensions.find((d) => d.key === 'month')?.checked ?? false,
);

async function runQuery() {
  if (selectedDimensions.value.length === 0) {
    toast.warning('Select at least one dimension');
    return;
  }
  if (selectedMeasures.value.length === 0) {
    toast.warning('Select at least one measure');
    return;
  }

  queryLoading.value = true;
  queryError.value = null;
  queryResults.value = null;

  try {
    const payload: Record<string, any> = {
      dimensions: selectedDimensions.value,
      measures: selectedMeasures.value,
    };
    if (filters.regionId) payload.regionId = filters.regionId;
    if (filters.communityId) payload.communityId = filters.communityId;
    if (filters.metricType) payload.metricType = filters.metricType;
    if (filters.dateFrom) payload.dateFrom = filters.dateFrom;
    if (filters.dateTo) payload.dateTo = filters.dateTo;

    const response = await analyticsApi.pivotQuery(payload);
    const data = response.data?.data ?? response.data ?? [];
    queryResults.value = Array.isArray(data) ? data : [];

    // Build columns from first row or dimensions+measures
    if (queryResults.value.length > 0) {
      const keys = Object.keys(queryResults.value[0]);
      resultColumns.value = keys.map((k) => ({
        key: k,
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
      }));
    } else {
      resultColumns.value = [
        ...selectedDimensions.value,
        ...selectedMeasures.value,
      ].map((k) => ({
        key: k,
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
      }));
    }
  } catch (err: any) {
    queryError.value = err.message || 'Query execution failed';
  } finally {
    queryLoading.value = false;
  }
}

// ── Chart Options ────────────────────────────────────────────────────

const chartOption = computed<EChartsOption>(() => {
  if (!queryResults.value || queryResults.value.length === 0) return {};

  const rows = queryResults.value;
  const firstDim = selectedDimensions.value[0];
  const firstMeasure = selectedMeasures.value[0];
  if (!firstDim || !firstMeasure) return {};

  const labels = rows.map((r: any) => String(r[firstDim] ?? ''));
  const values = rows.map((r: any) => Number(r[firstMeasure] ?? 0));
  const isTimeSeries = hasTimeSeriesDimension.value;

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { rotate: labels.length > 10 ? 45 : 0 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: firstMeasure.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()),
        type: isTimeSeries ? 'line' : 'bar',
        data: values,
        smooth: isTimeSeries,
        itemStyle: { color: 'hsl(221, 83%, 53%)' },
        areaStyle: isTimeSeries ? { opacity: 0.1 } : undefined,
      },
    ],
    toolbox: {
      feature: {
        saveAsImage: {},
        dataView: { readOnly: true },
      },
    },
  };
});

// ── Save / Schedule / Export ─────────────────────────────────────────

const saving = ref(false);

async function saveReport() {
  if (!reportName.value.trim()) {
    toast.warning('Please enter a report name');
    return;
  }

  saving.value = true;
  try {
    await analyticsApi.createDefinition({
      name: reportName.value,
      dimensions: selectedDimensions.value,
      measures: selectedMeasures.value,
      filters,
    });
    toast.success('Report saved successfully');
  } catch (err: any) {
    toast.error('Failed to save report', err.message);
  } finally {
    saving.value = false;
  }
}

async function scheduleReport() {
  if (!reportName.value.trim()) {
    toast.warning('Please enter a report name first');
    return;
  }
  toast.info('Scheduling...', 'Save the report first, then set up a schedule in the Scheduled Reports tab.');
}

async function exportAs(format: 'csv' | 'xlsx' | 'pdf') {
  if (!queryResults.value || queryResults.value.length === 0) {
    toast.warning('Run a query first before exporting');
    return;
  }

  try {
    // If we have a saved report, use the export API
    toast.info(`Exporting as ${format.toUpperCase()}...`);
    // Build a CSV client-side for immediate export
    if (format === 'csv') {
      const headers = resultColumns.value.map((c) => c.label);
      const csvRows = [
        headers.join(','),
        ...queryResults.value.map((row: any) =>
          resultColumns.value.map((c) => `"${String(row[c.key] ?? '')}"`).join(','),
        ),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName.value || 'report'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } else {
      toast.info(`${format.toUpperCase()} export will be generated server-side.`);
    }
  } catch (err: any) {
    toast.error('Export failed', err.message);
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Left Panel: Configuration -->
    <div class="lg:col-span-4 xl:col-span-3 space-y-5">
      <!-- Report Name -->
      <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-4">
        <h3 class="text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
          Report Configuration
        </h3>
        <div>
          <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
            Report Name
          </label>
          <input
            v-model="reportName"
            type="text"
            placeholder="My Custom Report"
            class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>

        <!-- Dimensions -->
        <div>
          <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
            Dimensions
          </label>
          <div class="space-y-2">
            <label
              v-for="dim in dimensions"
              :key="dim.key"
              class="flex items-center gap-2 text-sm text-[hsl(var(--foreground))] cursor-pointer"
            >
              <input
                v-model="dim.checked"
                type="checkbox"
                class="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
              />
              {{ dim.label }}
            </label>
          </div>
        </div>

        <!-- Measures -->
        <div>
          <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
            Measures
          </label>
          <div class="space-y-2">
            <label
              v-for="m in measures"
              :key="m.key"
              class="flex items-center gap-2 text-sm text-[hsl(var(--foreground))] cursor-pointer"
            >
              <input
                v-model="m.checked"
                type="checkbox"
                class="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
              />
              {{ m.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-4">
        <h3 class="text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
          Filters
        </h3>

        <div>
          <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Region</label>
          <select
            v-model="filters.regionId"
            class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            <option value="">All Regions</option>
            <option v-for="r in regionList" :key="r.id" :value="r.id">
              {{ r.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Community</label>
          <select
            v-model="filters.communityId"
            class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            <option value="">All Communities</option>
            <option v-for="c in communityList" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Metric Type</label>
          <select
            v-model="filters.metricType"
            class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            <option value="">All Types</option>
            <option v-for="mt in metricTypeList" :key="mt" :value="mt">
              {{ mt }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">From</label>
            <input
              v-model="filters.dateFrom"
              type="date"
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">To</label>
            <input
              v-model="filters.dateTo"
              type="date"
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>
        </div>
      </div>

      <!-- Run Button -->
      <button
        :disabled="queryLoading"
        class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        @click="runQuery"
      >
        <Play v-if="!queryLoading" class="h-4 w-4" />
        <LoadingSpinner v-else size="sm" />
        {{ queryLoading ? 'Running...' : 'Run Query' }}
      </button>
    </div>

    <!-- Right Panel: Results -->
    <div class="lg:col-span-8 xl:col-span-9 space-y-5">
      <!-- Loading State -->
      <div
        v-if="queryLoading"
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12"
      >
        <div class="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Executing query...</p>
        </div>
      </div>

      <!-- Error State -->
      <ErrorState
        v-else-if="queryError"
        :message="queryError"
        :on-retry="runQuery"
      />

      <!-- Empty / Initial State -->
      <div
        v-else-if="!queryResults"
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12"
      >
        <EmptyState
          title="Configure and run your report"
          description="Select dimensions, measures, and filters in the left panel, then click Run Query to see results."
          :icon="BarChart3"
        />
      </div>

      <!-- Results -->
      <template v-else>
        <!-- Action Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            {{ queryResults.length }} row{{ queryResults.length !== 1 ? 's' : '' }} returned
          </p>
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              @click="exportAs('csv')"
            >
              <Download class="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              @click="exportAs('xlsx')"
            >
              <FileSpreadsheet class="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              @click="exportAs('pdf')"
            >
              <FileText class="h-3.5 w-3.5" />
              PDF
            </button>
            <div class="w-px h-6 bg-[hsl(var(--border))]" />
            <button
              :disabled="saving"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              @click="saveReport"
            >
              <Save class="h-3.5 w-3.5" />
              Save Report
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
              @click="scheduleReport"
            >
              <Clock class="h-3.5 w-3.5" />
              Schedule
            </button>
          </div>
        </div>

        <!-- Data Table -->
        <DataTable
          v-if="queryResults.length > 0"
          :columns="resultColumns"
          :rows="queryResults"
        />
        <EmptyState
          v-else
          title="No results"
          description="The query returned no data. Try adjusting your dimensions or filters."
          :icon="AlertCircle"
        />

        <!-- Chart Visualization -->
        <div
          v-if="queryResults.length > 0"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
        >
          <div class="flex items-center gap-2 mb-3">
            <component
              :is="hasTimeSeriesDimension ? LineChart : BarChart3"
              class="h-4 w-4 text-[hsl(var(--muted-foreground))]"
            />
            <h4 class="text-sm font-medium text-[hsl(var(--foreground))]">
              {{ hasTimeSeriesDimension ? 'Time Series' : 'Categorical' }} Visualization
            </h4>
          </div>
          <BaseChart :option="chartOption" height="360px" />
        </div>
      </template>
    </div>
  </div>
</template>
