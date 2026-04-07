import { computed } from 'vue';
import { cn } from '@/utils/cn';
const props = defineProps();
const variantClasses = computed(() => {
    const map = {
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        neutral: 'bg-gray-100 text-gray-800',
    };
    return map[props.variant];
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: (__VLS_ctx.cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', __VLS_ctx.variantClasses)) },
});
(__VLS_ctx.label);
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            cn: cn,
            variantClasses: variantClasses,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
