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
import { Play, Save, Clock, Download, FileSpreadsheet, FileText, BarChart3, LineChart, AlertCircle, } from 'lucide-vue-next';
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
const { data: regions } = useApiQuery(() => communitiesApi.getRegions());
const { data: communities } = useApiQuery(() => communitiesApi.getCommunities());
const { data: metricDefs } = useApiQuery(() => metricsApi.getDefinitions());
const regionList = computed(() => regions.value ?? []);
const communityList = computed(() => communities.value ?? []);
const metricTypeList = computed(() => {
    const defs = metricDefs.value;
    if (!Array.isArray(defs))
        return [];
    const types = [...new Set(defs.map((d) => d.metricType ?? d.name))];
    return types;
});
// ── Query Execution ──────────────────────────────────────────────────
const queryLoading = ref(false);
const queryError = ref(null);
const queryResults = ref(null);
const resultColumns = ref([]);
const selectedDimensions = computed(() => dimensions.filter((d) => d.checked).map((d) => d.key));
const selectedMeasures = computed(() => measures.filter((m) => m.checked).map((m) => m.key));
const hasTimeSeriesDimension = computed(() => dimensions.find((d) => d.key === 'month')?.checked ?? false);
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
        const payload = {
            dimensions: selectedDimensions.value,
            measures: selectedMeasures.value,
        };
        if (filters.regionId)
            payload.regionId = filters.regionId;
        if (filters.communityId)
            payload.communityId = filters.communityId;
        if (filters.metricType)
            payload.metricType = filters.metricType;
        if (filters.dateFrom)
            payload.dateFrom = filters.dateFrom;
        if (filters.dateTo)
            payload.dateTo = filters.dateTo;
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
        }
        else {
            resultColumns.value = [
                ...selectedDimensions.value,
                ...selectedMeasures.value,
            ].map((k) => ({
                key: k,
                label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
            }));
        }
    }
    catch (err) {
        queryError.value = err.message || 'Query execution failed';
    }
    finally {
        queryLoading.value = false;
    }
}
// ── Chart Options ────────────────────────────────────────────────────
const chartOption = computed(() => {
    if (!queryResults.value || queryResults.value.length === 0)
        return {};
    const rows = queryResults.value;
    const firstDim = selectedDimensions.value[0];
    const firstMeasure = selectedMeasures.value[0];
    if (!firstDim || !firstMeasure)
        return {};
    const labels = rows.map((r) => String(r[firstDim] ?? ''));
    const values = rows.map((r) => Number(r[firstMeasure] ?? 0));
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
                name: firstMeasure.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
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
    }
    catch (err) {
        toast.error('Failed to save report', err.message);
    }
    finally {
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
async function exportAs(format) {
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
                ...queryResults.value.map((row) => resultColumns.value.map((c) => `"${String(row[c.key] ?? '')}"`).join(',')),
            ];
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportName.value || 'report'}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('CSV downloaded');
        }
        else {
            toast.info(`${format.toUpperCase()} export will be generated server-side.`);
        }
    }
    catch (err) {
        toast.error('Export failed', err.message);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 lg:grid-cols-12 gap-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "lg:col-span-4 xl:col-span-3 space-y-5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.reportName),
    type: "text",
    placeholder: "My Custom Report",
    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
for (const [dim] of __VLS_getVForSourceType((__VLS_ctx.dimensions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        key: (dim.key),
        ...{ class: "flex items-center gap-2 text-sm text-[hsl(var(--foreground))] cursor-pointer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
        ...{ class: "h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]" },
    });
    (dim.checked);
    (dim.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
for (const [m] of __VLS_getVForSourceType((__VLS_ctx.measures))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        key: (m.key),
        ...{ class: "flex items-center gap-2 text-sm text-[hsl(var(--foreground))] cursor-pointer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
        ...{ class: "h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]" },
    });
    (m.checked);
    (m.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-sm font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filters.regionId),
    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [r] of __VLS_getVForSourceType((__VLS_ctx.regionList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (r.id),
        value: (r.id),
    });
    (r.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filters.communityId),
    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.communityList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (c.id),
        value: (c.id),
    });
    (c.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filters.metricType),
    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [mt] of __VLS_getVForSourceType((__VLS_ctx.metricTypeList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (mt),
        value: (mt),
    });
    (mt);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-2 gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "date",
    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
});
(__VLS_ctx.filters.dateFrom);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "date",
    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
});
(__VLS_ctx.filters.dateTo);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.runQuery) },
    disabled: (__VLS_ctx.queryLoading),
    ...{ class: "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
});
if (!__VLS_ctx.queryLoading) {
    const __VLS_0 = {}.Play;
    /** @type {[typeof __VLS_components.Play, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "h-4 w-4" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-4 w-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
else {
    /** @type {[typeof LoadingSpinner, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
        size: "sm",
    }));
    const __VLS_5 = __VLS_4({
        size: "sm",
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
}
(__VLS_ctx.queryLoading ? 'Running...' : 'Run Query');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "lg:col-span-8 xl:col-span-9 space-y-5" },
});
if (__VLS_ctx.queryLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col items-center gap-3" },
    });
    /** @type {[typeof LoadingSpinner, ]} */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
        size: "lg",
    }));
    const __VLS_8 = __VLS_7({
        size: "lg",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
    });
}
else if (__VLS_ctx.queryError) {
    /** @type {[typeof ErrorState, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
        message: (__VLS_ctx.queryError),
        onRetry: (__VLS_ctx.runQuery),
    }));
    const __VLS_11 = __VLS_10({
        message: (__VLS_ctx.queryError),
        onRetry: (__VLS_ctx.runQuery),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
}
else if (!__VLS_ctx.queryResults) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12" },
    });
    /** @type {[typeof EmptyState, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(EmptyState, new EmptyState({
        title: "Configure and run your report",
        description: "Select dimensions, measures, and filters in the left panel, then click Run Query to see results.",
        icon: (__VLS_ctx.BarChart3),
    }));
    const __VLS_14 = __VLS_13({
        title: "Configure and run your report",
        description: "Select dimensions, measures, and filters in the left panel, then click Run Query to see results.",
        icon: (__VLS_ctx.BarChart3),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-wrap items-center justify-between gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
    });
    (__VLS_ctx.queryResults.length);
    (__VLS_ctx.queryResults.length !== 1 ? 's' : '');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.queryLoading))
                    return;
                if (!!(__VLS_ctx.queryError))
                    return;
                if (!!(!__VLS_ctx.queryResults))
                    return;
                __VLS_ctx.exportAs('csv');
            } },
        ...{ class: "inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    const __VLS_16 = {}.Download;
    /** @type {[typeof __VLS_components.Download, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ class: "h-3.5 w-3.5" },
    }));
    const __VLS_18 = __VLS_17({
        ...{ class: "h-3.5 w-3.5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.queryLoading))
                    return;
                if (!!(__VLS_ctx.queryError))
                    return;
                if (!!(!__VLS_ctx.queryResults))
                    return;
                __VLS_ctx.exportAs('xlsx');
            } },
        ...{ class: "inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    const __VLS_20 = {}.FileSpreadsheet;
    /** @type {[typeof __VLS_components.FileSpreadsheet, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ class: "h-3.5 w-3.5" },
    }));
    const __VLS_22 = __VLS_21({
        ...{ class: "h-3.5 w-3.5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.queryLoading))
                    return;
                if (!!(__VLS_ctx.queryError))
                    return;
                if (!!(!__VLS_ctx.queryResults))
                    return;
                __VLS_ctx.exportAs('pdf');
            } },
        ...{ class: "inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    const __VLS_24 = {}.FileText;
    /** @type {[typeof __VLS_components.FileText, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ class: "h-3.5 w-3.5" },
    }));
    const __VLS_26 = __VLS_25({
        ...{ class: "h-3.5 w-3.5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "w-px h-6 bg-[hsl(var(--border))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.saveReport) },
        disabled: (__VLS_ctx.saving),
        ...{ class: "inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
    });
    const __VLS_28 = {}.Save;
    /** @type {[typeof __VLS_components.Save, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        ...{ class: "h-3.5 w-3.5" },
    }));
    const __VLS_30 = __VLS_29({
        ...{ class: "h-3.5 w-3.5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.scheduleReport) },
        ...{ class: "inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors" },
    });
    const __VLS_32 = {}.Clock;
    /** @type {[typeof __VLS_components.Clock, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        ...{ class: "h-3.5 w-3.5" },
    }));
    const __VLS_34 = __VLS_33({
        ...{ class: "h-3.5 w-3.5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    if (__VLS_ctx.queryResults.length > 0) {
        /** @type {[typeof DataTable, ]} */ ;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent(DataTable, new DataTable({
            columns: (__VLS_ctx.resultColumns),
            rows: (__VLS_ctx.queryResults),
        }));
        const __VLS_37 = __VLS_36({
            columns: (__VLS_ctx.resultColumns),
            rows: (__VLS_ctx.queryResults),
        }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    }
    else {
        /** @type {[typeof EmptyState, ]} */ ;
        // @ts-ignore
        const __VLS_39 = __VLS_asFunctionalComponent(EmptyState, new EmptyState({
            title: "No results",
            description: "The query returned no data. Try adjusting your dimensions or filters.",
            icon: (__VLS_ctx.AlertCircle),
        }));
        const __VLS_40 = __VLS_39({
            title: "No results",
            description: "The query returned no data. Try adjusting your dimensions or filters.",
            icon: (__VLS_ctx.AlertCircle),
        }, ...__VLS_functionalComponentArgsRest(__VLS_39));
    }
    if (__VLS_ctx.queryResults.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2 mb-3" },
        });
        const __VLS_42 = ((__VLS_ctx.hasTimeSeriesDimension ? __VLS_ctx.LineChart : __VLS_ctx.BarChart3));
        // @ts-ignore
        const __VLS_43 = __VLS_asFunctionalComponent(__VLS_42, new __VLS_42({
            ...{ class: "h-4 w-4 text-[hsl(var(--muted-foreground))]" },
        }));
        const __VLS_44 = __VLS_43({
            ...{ class: "h-4 w-4 text-[hsl(var(--muted-foreground))]" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_43));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
            ...{ class: "text-sm font-medium text-[hsl(var(--foreground))]" },
        });
        (__VLS_ctx.hasTimeSeriesDimension ? 'Time Series' : 'Categorical');
        /** @type {[typeof BaseChart, ]} */ ;
        // @ts-ignore
        const __VLS_46 = __VLS_asFunctionalComponent(BaseChart, new BaseChart({
            option: (__VLS_ctx.chartOption),
            height: "360px",
        }));
        const __VLS_47 = __VLS_46({
            option: (__VLS_ctx.chartOption),
            height: "360px",
        }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    }
}
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-12']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:col-span-4']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:col-span-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:col-span-8']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:col-span-9']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-12']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-12']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-px']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            DataTable: DataTable,
            LoadingSpinner: LoadingSpinner,
            ErrorState: ErrorState,
            EmptyState: EmptyState,
            BaseChart: BaseChart,
            Play: Play,
            Save: Save,
            Clock: Clock,
            Download: Download,
            FileSpreadsheet: FileSpreadsheet,
            FileText: FileText,
            BarChart3: BarChart3,
            LineChart: LineChart,
            AlertCircle: AlertCircle,
            reportName: reportName,
            dimensions: dimensions,
            measures: measures,
            filters: filters,
            regionList: regionList,
            communityList: communityList,
            metricTypeList: metricTypeList,
            queryLoading: queryLoading,
            queryError: queryError,
            queryResults: queryResults,
            resultColumns: resultColumns,
            hasTimeSeriesDimension: hasTimeSeriesDimension,
            runQuery: runQuery,
            chartOption: chartOption,
            saving: saving,
            saveReport: saveReport,
            scheduleReport: scheduleReport,
            exportAs: exportAs,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
