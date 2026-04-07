import { ref, computed, onMounted } from 'vue';
import { Users, Building, CalendarClock, FileText, TrendingUp, DoorOpen, BarChart3, ClipboardList, Monitor, Database, Clock, Bell, ListChecks, Activity, } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';
import { getNotifications } from '@/api/endpoints/notifications.api';
import PageHeader from '@/components/shared/PageHeader.vue';
import KpiCard from './widgets/KpiCard.vue';
const authStore = useAuthStore();
const kpiLoading = ref(true);
const chartLoading = ref(true);
const activityLoading = ref(true);
const notifications = ref([]);
// ---- Role detection ----
function hasRole(role) {
    return authStore.user?.roles?.includes(role) ?? false;
}
const primaryRole = computed(() => {
    if (hasRole(Role.Admin))
        return 'admin';
    if (hasRole(Role.Manager))
        return 'manager';
    if (hasRole(Role.Proctor))
        return 'proctor';
    if (hasRole(Role.Analyst))
        return 'analyst';
    return 'user';
});
const welcomeName = computed(() => authStore.user?.firstName ?? authStore.user?.username ?? 'User');
const kpiData = computed(() => {
    switch (primaryRole.value) {
        case 'admin':
            return [
                { title: 'Total Users', value: 248, change: 12, icon: Users, color: 'blue' },
                { title: 'Active Listings', value: 1034, change: 5.3, icon: Building, color: 'green' },
                { title: 'Upcoming Sessions', value: 18, change: -2.1, icon: CalendarClock, color: 'orange' },
                { title: 'Pending Reports', value: 7, change: 0, icon: FileText, color: 'purple' },
            ];
        case 'manager':
            return [
                { title: 'Active Listings', value: 1034, change: 5.3, icon: Building, color: 'blue' },
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
    }
    catch {
        notifications.value = [];
    }
    finally {
        activityLoading.value = false;
    }
});
function formatTimeAgo(dateStr) {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return 'Just now';
    if (mins < 60)
        return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: "Dashboard",
    description: (`Welcome back, ${__VLS_ctx.welcomeName}`),
}));
const __VLS_1 = __VLS_0({
    title: "Dashboard",
    description: (`Welcome back, ${__VLS_ctx.welcomeName}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6" },
});
for (const [kpi, idx] of __VLS_getVForSourceType((__VLS_ctx.kpiData))) {
    /** @type {[typeof KpiCard, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(KpiCard, new KpiCard({
        key: (idx),
        title: (kpi.title),
        value: (kpi.value),
        change: (kpi.change),
        icon: (kpi.icon),
        color: (kpi.color),
        loading: (__VLS_ctx.kpiLoading),
    }));
    const __VLS_4 = __VLS_3({
        key: (idx),
        title: (kpi.title),
        value: (kpi.value),
        change: (kpi.change),
        icon: (kpi.icon),
        color: (kpi.color),
        loading: (__VLS_ctx.kpiLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-sm font-semibold text-[hsl(var(--foreground))] mb-4" },
});
if (__VLS_ctx.chartLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3" },
    });
    for (const [i] of __VLS_getVForSourceType((4))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "h-4 bg-gray-200 rounded animate-pulse" },
            ...{ style: ({ width: `${60 + Math.random() * 40}%` }) },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-4 bg-gray-200 rounded animate-pulse w-3/4" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative h-48" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 300 140",
        ...{ class: "w-full h-full" },
        preserveAspectRatio: "none",
    });
    for (const [i] of __VLS_getVForSourceType((4))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            key: ('g' + i),
            x1: (0),
            y1: (i * 28),
            x2: (300),
            y2: (i * 28),
            stroke: "hsl(var(--border))",
            'stroke-width': "0.5",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
        points: (__VLS_ctx.listingValues
            .map((v, i) => `${(i / (__VLS_ctx.listingValues.length - 1)) * 280 + 10},${120 - (v / __VLS_ctx.listingMax) * 100}`)
            .join(' ') +
            ` 290,120 10,120`),
        fill: "url(#areaGrad)",
        opacity: "0.15",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
        points: (__VLS_ctx.listingValues
            .map((v, i) => `${(i / (__VLS_ctx.listingValues.length - 1)) * 280 + 10},${120 - (v / __VLS_ctx.listingMax) * 100}`)
            .join(' ')),
        fill: "none",
        stroke: "hsl(221.2, 83.2%, 53.3%)",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    for (const [v, i] of __VLS_getVForSourceType((__VLS_ctx.listingValues))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
            key: ('d' + i),
            cx: ((i / (__VLS_ctx.listingValues.length - 1)) * 280 + 10),
            cy: (120 - (v / __VLS_ctx.listingMax) * 100),
            r: "3",
            fill: "white",
            stroke: "hsl(221.2, 83.2%, 53.3%)",
            'stroke-width': "2",
        });
    }
    for (const [m, i] of __VLS_getVForSourceType((__VLS_ctx.listingMonths))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
            key: ('m' + i),
            x: ((i / (__VLS_ctx.listingMonths.length - 1)) * 280 + 10),
            y: "137",
            'text-anchor': "middle",
            ...{ class: "text-[9px] fill-[hsl(var(--muted-foreground))]" },
        });
        (m);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.linearGradient, __VLS_intrinsicElements.linearGradient)({
        id: "areaGrad",
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "1",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
        offset: "0%",
        'stop-color': "hsl(221.2, 83.2%, 53.3%)",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
        offset: "100%",
        'stop-color': "hsl(221.2, 83.2%, 53.3%)",
        'stop-opacity': "0",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-sm font-semibold text-[hsl(var(--foreground))] mb-4" },
});
if (__VLS_ctx.chartLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3" },
    });
    for (const [i] of __VLS_getVForSourceType((5))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "flex items-center gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-3 w-12 bg-gray-200 rounded animate-pulse" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-6 bg-gray-200 rounded animate-pulse" },
            ...{ style: ({ width: `${40 + Math.random() * 50}%` }) },
        });
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3 h-48 flex flex-col justify-center" },
    });
    for (const [val, i] of __VLS_getVForSourceType((__VLS_ctx.regionValues))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "flex items-center gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-xs text-[hsl(var(--muted-foreground))] w-14 text-right shrink-0" },
        });
        (__VLS_ctx.regionLabels[i]);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-1 bg-[hsl(var(--muted))] rounded-full h-6 overflow-hidden" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-end pr-2 transition-all duration-700" },
            ...{ style: ({ width: `${(val / __VLS_ctx.regionMax) * 100}%` }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-[10px] font-semibold text-white" },
        });
        (val);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-sm font-semibold text-[hsl(var(--foreground))] mb-4" },
});
if (__VLS_ctx.activityLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    for (const [i] of __VLS_getVForSourceType((5))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "flex items-center gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-1 space-y-1.5" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-3.5 bg-gray-200 rounded animate-pulse w-3/4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-3 bg-gray-200 rounded animate-pulse w-1/3" },
        });
    }
}
else if (__VLS_ctx.notifications.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "divide-y divide-[hsl(var(--border))]" },
    });
    for (const [n, idx] of __VLS_getVForSourceType((__VLS_ctx.notifications.slice(0, 5)))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (n.id ?? idx),
            ...{ class: "flex items-start gap-3 py-3 first:pt-0 last:pb-0" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0" },
        });
        const __VLS_6 = {}.Bell;
        /** @type {[typeof __VLS_components.Bell, ]} */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
            ...{ class: "h-4 w-4 text-blue-600" },
        }));
        const __VLS_8 = __VLS_7({
            ...{ class: "h-4 w-4 text-blue-600" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-1 min-w-0" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-[hsl(var(--foreground))] line-clamp-1" },
        });
        (n.title ?? n.message ?? 'Notification');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-xs text-[hsl(var(--muted-foreground))] mt-0.5" },
        });
        (n.createdAt ? __VLS_ctx.formatTimeAgo(n.createdAt) : '');
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-8" },
    });
    const __VLS_10 = {}.Bell;
    /** @type {[typeof __VLS_components.Bell, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
        ...{ class: "h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2 opacity-40" },
    }));
    const __VLS_12 = __VLS_11({
        ...{ class: "h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2 opacity-40" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
    });
}
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-48']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
/** @type {__VLS_StyleScopedClasses['fill-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-48']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-14']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-r']} */ ;
/** @type {__VLS_StyleScopedClasses['from-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['to-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['first:pt-0']} */ ;
/** @type {__VLS_StyleScopedClasses['last:pb-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-100']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-40']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Bell: Bell,
            PageHeader: PageHeader,
            KpiCard: KpiCard,
            kpiLoading: kpiLoading,
            chartLoading: chartLoading,
            activityLoading: activityLoading,
            notifications: notifications,
            welcomeName: welcomeName,
            kpiData: kpiData,
            listingMonths: listingMonths,
            listingValues: listingValues,
            listingMax: listingMax,
            regionLabels: regionLabels,
            regionValues: regionValues,
            regionMax: regionMax,
            formatTimeAgo: formatTimeAgo,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
