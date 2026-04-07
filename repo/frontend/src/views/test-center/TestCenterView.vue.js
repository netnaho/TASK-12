import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/shared/PageHeader.vue';
const route = useRoute();
const router = useRouter();
const tabs = [
    { key: 'sites', label: 'Sites', route: '/test-center/sites' },
    { key: 'rooms', label: 'Rooms', route: '/test-center/rooms' },
    { key: 'equipment', label: 'Equipment', route: '/test-center/equipment' },
    { key: 'sessions', label: 'Sessions', route: '/test-center/sessions' },
    { key: 'utilization', label: 'Utilization', route: '/test-center/utilization' },
];
const activeTab = computed(() => {
    const path = route.path;
    const tab = tabs.find((t) => path.startsWith(t.route));
    return tab?.key ?? 'sites';
});
function navigate(tab) {
    router.push(tab.route);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: "Test Center & Resource Management",
    description: "Manage testing sites, rooms, equipment, sessions, and utilization.",
}));
const __VLS_1 = __VLS_0({
    title: "Test Center & Resource Management",
    description: "Manage testing sites, rooms, equipment, sessions, and utilization.",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "border-b border-[hsl(var(--border))] mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "-mb-px flex gap-6" },
    'aria-label': "Tabs",
});
for (const [tab] of __VLS_getVForSourceType((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.navigate(tab);
            } },
        key: (tab.key),
        ...{ class: "whitespace-nowrap border-b-2 pb-3 px-1 text-sm font-medium transition-colors" },
        ...{ class: (__VLS_ctx.activeTab === tab.key
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]') },
    });
    (tab.label);
}
const __VLS_3 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({}));
const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['-mb-px']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PageHeader: PageHeader,
            tabs: tabs,
            activeTab: activeTab,
            navigate: navigate,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
