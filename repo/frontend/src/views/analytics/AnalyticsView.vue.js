import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/shared/PageHeader.vue';
import { BarChart3, FileText, Clock } from 'lucide-vue-next';
const route = useRoute();
const router = useRouter();
const tabs = [
    { name: 'Report Builder', route: 'report-builder', icon: BarChart3 },
    { name: 'Saved Reports', route: 'saved-reports', icon: FileText },
    { name: 'Scheduled Reports', route: 'scheduled-reports', icon: Clock },
];
const activeTab = computed(() => route.name);
function navigateTab(tabRoute) {
    router.push({ name: tabRoute });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-6" },
});
/** @type {[typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: "Analytics & Reporting Hub",
    description: "Build reports, analyze lease metrics, and schedule automated report delivery.",
}));
const __VLS_1 = __VLS_0({
    title: "Analytics & Reporting Hub",
    description: "Build reports, analyze lease metrics, and schedule automated report delivery.",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "border-b border-[hsl(var(--border))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "-mb-px flex space-x-8" },
    'aria-label': "Analytics tabs",
});
for (const [tab] of __VLS_getVForSourceType((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.navigateTab(tab.route);
            } },
        key: (tab.route),
        ...{ class: ([
                'group inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                __VLS_ctx.activeTab === tab.route
                    ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]',
            ]) },
    });
    const __VLS_3 = ((tab.icon));
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ class: ([
                'h-4 w-4',
                __VLS_ctx.activeTab === tab.route
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]',
            ]) },
    }));
    const __VLS_5 = __VLS_4({
        ...{ class: ([
                'h-4 w-4',
                __VLS_ctx.activeTab === tab.route
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]',
            ]) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    (tab.name);
}
const __VLS_7 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['-mb-px']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-8']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PageHeader: PageHeader,
            tabs: tabs,
            activeTab: activeTab,
            navigateTab: navigateTab,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
