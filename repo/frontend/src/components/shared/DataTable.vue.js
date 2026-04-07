import { cn } from '@/utils/cn';
import EmptyState from './EmptyState.vue';
const __VLS_props = defineProps();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "overflow-x-auto rounded-lg border border-[hsl(var(--border))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "w-full text-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
    ...{ class: "border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]" },
});
for (const [col] of __VLS_getVForSourceType((__VLS_ctx.columns))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        key: (col.key),
        ...{ class: (__VLS_ctx.cn('px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]', col.sortable ? 'cursor-pointer select-none hover:text-[hsl(var(--foreground))]' : '')) },
    });
    (col.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
if (__VLS_ctx.loading) {
    for (const [i] of __VLS_getVForSourceType((5))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            key: ('skeleton-' + i),
            ...{ class: "border-b border-[hsl(var(--border))]" },
        });
        for (const [col] of __VLS_getVForSourceType((__VLS_ctx.columns))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                key: (col.key),
                ...{ class: "px-4 py-3" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "h-4 rounded bg-[hsl(var(--muted))] animate-pulse w-3/4" },
            });
        }
    }
}
else if (__VLS_ctx.rows.length > 0) {
    for (const [row, idx] of __VLS_getVForSourceType((__VLS_ctx.rows))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            key: (idx),
            ...{ class: "border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors" },
        });
        for (const [col] of __VLS_getVForSourceType((__VLS_ctx.columns))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                key: (col.key),
                ...{ class: "px-4 py-3 text-[hsl(var(--foreground))]" },
            });
            var __VLS_0 = {
                row: (row),
                value: (row[col.key]),
            };
            var __VLS_1 = __VLS_tryAsConstant('cell-' + col.key);
            (row[col.key] ?? '-');
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        colspan: (__VLS_ctx.columns.length),
    });
    /** @type {[typeof EmptyState, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(EmptyState, new EmptyState({
        title: (__VLS_ctx.emptyMessage ?? 'No data found'),
        description: "There are no records to display.",
    }));
    const __VLS_5 = __VLS_4({
        title: (__VLS_ctx.emptyMessage ?? 'No data found'),
        description: "There are no records to display.",
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
}
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted)/0.5)]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
// @ts-ignore
var __VLS_2 = __VLS_1, __VLS_3 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            cn: cn,
            EmptyState: EmptyState,
        };
    },
    __typeProps: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
