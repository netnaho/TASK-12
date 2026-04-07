import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LayoutDashboard, Building2, ClipboardList, BarChart3, LineChart, Users, Settings, FileText, PanelLeftClose, PanelLeftOpen, } from 'lucide-vue-next';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';
const props = defineProps();
const emit = defineEmits();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const NAV_ITEMS = [
    {
        name: 'Dashboard',
        icon: LayoutDashboard,
        route: '/dashboard',
        roles: [Role.Admin, Role.Manager, Role.Proctor, Role.Analyst, Role.User],
    },
    {
        name: 'Test Center',
        icon: Building2,
        route: '/test-center',
        roles: [Role.Admin, Role.Manager, Role.Proctor],
    },
    {
        name: 'Listings',
        icon: ClipboardList,
        route: '/listings',
        roles: [Role.Admin, Role.Manager, Role.User],
    },
    {
        name: 'Lease Metrics',
        icon: BarChart3,
        route: '/lease-metrics',
        roles: [Role.Admin, Role.Manager, Role.Analyst],
    },
    {
        name: 'Analytics',
        icon: LineChart,
        route: '/analytics',
        roles: [Role.Admin, Role.Manager, Role.Analyst],
    },
    {
        name: 'Users',
        icon: Users,
        route: '/users',
        roles: [Role.Admin],
    },
    {
        name: 'Audit Log',
        icon: FileText,
        route: '/audit-log',
        roles: [Role.Admin],
    },
    {
        name: 'Settings',
        icon: Settings,
        route: '/settings',
        roles: [Role.Admin],
    },
];
const filteredItems = computed(() => {
    const userRoles = auth.user?.roles ?? [];
    return NAV_ITEMS.filter((item) => item.roles.some((role) => userRoles.includes(role)));
});
function isActive(itemRoute) {
    return route.path === itemRoute || route.path.startsWith(itemRoute + '/');
}
function navigate(itemRoute) {
    router.push(itemRoute);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: (__VLS_ctx.cn('flex flex-col h-full bg-white border-r border-[hsl(var(--border))]', 'transition-all duration-300 ease-in-out', __VLS_ctx.collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]')) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: (__VLS_ctx.cn('flex items-center h-16 px-4 border-b border-[hsl(var(--border))]', __VLS_ctx.collapsed ? 'justify-center' : 'gap-3')) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-8 w-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center shrink-0" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-white font-bold text-sm" },
});
if (!__VLS_ctx.collapsed) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-lg font-bold text-[hsl(var(--foreground))] whitespace-nowrap" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "flex-1 overflow-y-auto py-4 px-3 space-y-1" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.filteredItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.navigate(item.route);
            } },
        key: (item.route),
        ...{ class: (__VLS_ctx.cn('w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', 'hover:bg-[hsl(var(--accent))]', __VLS_ctx.isActive(item.route)
                ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))]', __VLS_ctx.collapsed ? 'justify-center' : '')) },
        title: (__VLS_ctx.collapsed ? item.name : undefined),
    });
    const __VLS_0 = ((item.icon));
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "h-5 w-5 shrink-0" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-5 w-5 shrink-0" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    if (!__VLS_ctx.collapsed) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "whitespace-nowrap" },
        });
        (item.name);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "border-t border-[hsl(var(--border))] p-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('toggle');
        } },
    ...{ class: (__VLS_ctx.cn('w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium', 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors', __VLS_ctx.collapsed ? 'justify-center' : '')) },
});
if (!__VLS_ctx.collapsed) {
    const __VLS_4 = {}.PanelLeftClose;
    /** @type {[typeof __VLS_components.PanelLeftClose, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ class: "h-5 w-5 shrink-0" },
    }));
    const __VLS_6 = __VLS_5({
        ...{ class: "h-5 w-5 shrink-0" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
else {
    const __VLS_8 = {}.PanelLeftOpen;
    /** @type {[typeof __VLS_components.PanelLeftOpen, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ class: "h-5 w-5 shrink-0" },
    }));
    const __VLS_10 = __VLS_9({
        ...{ class: "h-5 w-5 shrink-0" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
if (!__VLS_ctx.collapsed) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "whitespace-nowrap" },
    });
}
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PanelLeftClose: PanelLeftClose,
            PanelLeftOpen: PanelLeftOpen,
            cn: cn,
            emit: emit,
            filteredItems: filteredItems,
            isActive: isActive,
            navigate: navigate,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
