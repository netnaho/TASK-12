<script setup lang="ts">
import { ref, watch } from 'vue';
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components';

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

const props = withDefaults(
  defineProps<{
    option: EChartsOption;
    height?: string;
    loading?: boolean;
  }>(),
  {
    height: '400px',
    loading: false,
  }
);

const chartRef = ref<InstanceType<typeof VChart> | null>(null);

watch(
  () => props.option,
  () => {
    chartRef.value?.setOption(props.option);
  },
  { deep: true }
);
</script>

<template>
  <div :style="{ height }">
    <VChart
      ref="chartRef"
      :option="option"
      :loading="loading"
      autoresize
      class="w-full h-full"
    />
  </div>
</template>
