import { ref, computed, watch } from 'vue';
import { TrendingUp, Calendar, Activity } from 'lucide-vue-next';
import ErrorState from '@/components/shared/ErrorState.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import BaseChart from '@/components/charts/BaseChart.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { getSites, getRooms, getUtilization, } from '@/api/endpoints/test-center.api';
const selectedSiteId = ref('');
const selectedRoomId = ref('');
const dateFrom = ref(getDefaultDateFrom());
const dateTo = ref(getDefaultDateTo());
function getDefaultDateFrom() {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
}
function getDefaultDateTo() {
    return new Date().toISOString().split('T')[0];
}
const { data: sites } = useApiQuery(() => getSites());
const rooms = ref([]);
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
    }
    catch {
        rooms.value = [];
    }
});
const queryParams = computed(() => ({
    ...(selectedSiteId.value && { siteId: selectedSiteId.value }),
    ...(selectedRoomId.value && { roomId: selectedRoomId.value }),
    from: dateFrom.value,
    to: dateTo.value,
}));
const { data: utilization, loading, error, refetch } = useApiQuery(() => getUtilization(queryParams.value));
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
const chartOption = computed(() => {
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
            formatter(params) {
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))] mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-wrap items-center gap-3 mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.selectedSiteId),
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [site] of __VLS_getVForSourceType((__VLS_ctx.sites ?? []))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (site.id),
        value: (site.id),
    });
    (site.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.selectedRoomId),
    disabled: (!__VLS_ctx.selectedSiteId),
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] disabled:opacity-50" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [room] of __VLS_getVForSourceType((__VLS_ctx.rooms))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (room.id),
        value: (room.id),
    });
    (room.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "date",
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
});
(__VLS_ctx.dateFrom);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "date",
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
});
(__VLS_ctx.dateTo);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" },
});
for (const [card] of __VLS_getVForSourceType((__VLS_ctx.statCards))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (card.label),
        ...{ class: "rounded-lg border border-[hsl(var(--border))] p-4 flex items-center gap-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "shrink-0 rounded-full p-3" },
        ...{ class: (card.color) },
    });
    const __VLS_0 = ((card.icon));
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "h-5 w-5" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-5 w-5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
    });
    (card.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xl font-bold text-[hsl(var(--foreground))]" },
    });
    (card.value);
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center py-12" },
    });
    /** @type {[typeof LoadingSpinner, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({}));
    const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
}
else if (__VLS_ctx.error) {
    /** @type {[typeof ErrorState, ]} */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }));
    const __VLS_8 = __VLS_7({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-lg border border-[hsl(var(--border))] p-4" },
    });
    /** @type {[typeof BaseChart, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(BaseChart, new BaseChart({
        option: (__VLS_ctx.chartOption),
        height: "300px",
    }));
    const __VLS_11 = __VLS_10({
        option: (__VLS_ctx.chartOption),
        height: "300px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
}
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ErrorState: ErrorState,
            LoadingSpinner: LoadingSpinner,
            BaseChart: BaseChart,
            selectedSiteId: selectedSiteId,
            selectedRoomId: selectedRoomId,
            dateFrom: dateFrom,
            dateTo: dateTo,
            sites: sites,
            rooms: rooms,
            loading: loading,
            error: error,
            refetch: refetch,
            chartOption: chartOption,
            statCards: statCards,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
