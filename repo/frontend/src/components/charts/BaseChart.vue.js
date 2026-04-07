import { ref, watch } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, ToolboxComponent, } from 'echarts/components';
use([
    CanvasRenderer,
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DataZoomComponent,
    ToolboxComponent,
]);
const props = withDefaults(defineProps(), {
    height: '400px',
    loading: false,
});
const chartRef = ref(null);
watch(() => props.option, () => {
    chartRef.value?.setOption(props.option);
}, { deep: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    height: '400px',
    loading: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ height: __VLS_ctx.height }) },
});
const __VLS_0 = {}.VChart;
/** @type {[typeof __VLS_components.VChart, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ref: "chartRef",
    option: (__VLS_ctx.option),
    loading: (__VLS_ctx.loading),
    autoresize: true,
    ...{ class: "w-full h-full" },
}));
const __VLS_2 = __VLS_1({
    ref: "chartRef",
    option: (__VLS_ctx.option),
    loading: (__VLS_ctx.loading),
    autoresize: true,
    ...{ class: "w-full h-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {typeof __VLS_ctx.chartRef} */ ;
var __VLS_4 = {};
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
// @ts-ignore
var __VLS_5 = __VLS_4;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VChart: VChart,
            chartRef: chartRef,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
