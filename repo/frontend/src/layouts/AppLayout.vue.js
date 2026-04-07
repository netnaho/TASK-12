import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';
const sidebarCollapsed = ref(false);
const mobileMenuOpen = ref(false);
function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
}
function openMobileMenu() {
    mobileMenuOpen.value = true;
}
function closeMobileMenu() {
    mobileMenuOpen.value = false;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-screen flex overflow-hidden bg-[hsl(var(--background))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hidden lg:flex" },
});
/** @type {[typeof AppSidebar, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppSidebar, new AppSidebar({
    ...{ 'onToggle': {} },
    collapsed: (__VLS_ctx.sidebarCollapsed),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onToggle': {} },
    collapsed: (__VLS_ctx.sidebarCollapsed),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onToggle: (__VLS_ctx.toggleSidebar)
};
var __VLS_2;
const __VLS_7 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
    to: "body",
}));
const __VLS_9 = __VLS_8({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_10.slots.default;
const __VLS_11 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    name: "fade",
}));
const __VLS_13 = __VLS_12({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
__VLS_14.slots.default;
if (__VLS_ctx.mobileMenuOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeMobileMenu) },
        ...{ class: "fixed inset-0 z-40 bg-black/50 lg:hidden" },
    });
}
var __VLS_14;
var __VLS_10;
const __VLS_15 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    to: "body",
}));
const __VLS_17 = __VLS_16({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
__VLS_18.slots.default;
const __VLS_19 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    name: "slide",
}));
const __VLS_21 = __VLS_20({
    name: "slide",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_22.slots.default;
if (__VLS_ctx.mobileMenuOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-y-0 left-0 z-50 lg:hidden w-[var(--sidebar-width)]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative h-full" },
    });
    /** @type {[typeof AppSidebar, ]} */ ;
    // @ts-ignore
    const __VLS_23 = __VLS_asFunctionalComponent(AppSidebar, new AppSidebar({
        ...{ 'onToggle': {} },
        collapsed: (false),
    }));
    const __VLS_24 = __VLS_23({
        ...{ 'onToggle': {} },
        collapsed: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_23));
    let __VLS_26;
    let __VLS_27;
    let __VLS_28;
    const __VLS_29 = {
        onToggle: (__VLS_ctx.closeMobileMenu)
    };
    var __VLS_25;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeMobileMenu) },
        ...{ class: "absolute top-4 right-[-40px] p-2 rounded-full bg-white shadow-lg text-[hsl(var(--muted-foreground))]" },
    });
    const __VLS_30 = {}.X;
    /** @type {[typeof __VLS_components.X, ]} */ ;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({
        ...{ class: "h-4 w-4" },
    }));
    const __VLS_32 = __VLS_31({
        ...{ class: "h-4 w-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
}
var __VLS_22;
var __VLS_18;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 flex flex-col min-w-0" },
});
/** @type {[typeof AppTopbar, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(AppTopbar, new AppTopbar({
    ...{ 'onOpenMobileMenu': {} },
}));
const __VLS_35 = __VLS_34({
    ...{ 'onOpenMobileMenu': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
let __VLS_37;
let __VLS_38;
let __VLS_39;
const __VLS_40 = {
    onOpenMobileMenu: (__VLS_ctx.openMobileMenu)
};
var __VLS_36;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "flex-1 overflow-y-auto p-4 lg:p-6" },
});
const __VLS_41 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({}));
const __VLS_43 = __VLS_42({}, ...__VLS_functionalComponentArgsRest(__VLS_42));
/** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-40']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/50']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['w-[var(--sidebar-width)]']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-4']} */ ;
/** @type {__VLS_StyleScopedClasses['right-[-40px]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:p-6']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            X: X,
            AppSidebar: AppSidebar,
            AppTopbar: AppTopbar,
            sidebarCollapsed: sidebarCollapsed,
            mobileMenuOpen: mobileMenuOpen,
            toggleSidebar: toggleSidebar,
            openMobileMenu: openMobileMenu,
            closeMobileMenu: closeMobileMenu,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
