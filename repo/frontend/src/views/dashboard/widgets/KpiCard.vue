<script setup lang="ts">
import { computed, type Component } from 'vue';
import { TrendingUp, TrendingDown } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    title: string;
    value: string | number;
    change?: number;
    icon: Component;
    loading?: boolean;
    color?: 'blue' | 'green' | 'orange' | 'purple';
  }>(),
  {
    loading: false,
    color: 'blue',
    change: undefined,
  },
);

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

const colors = computed(() => colorMap[props.color] ?? colorMap.blue);

const changePositive = computed(() =>
  props.change !== undefined ? props.change >= 0 : null,
);
</script>

<template>
  <div
    class="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 transition-shadow hover:shadow-md"
  >
    <!-- Skeleton State -->
    <template v-if="loading">
      <div class="flex items-start gap-4">
        <div class="w-11 h-11 rounded-lg bg-gray-200 animate-pulse shrink-0" />
        <div class="flex-1 space-y-2.5">
          <div class="h-3.5 w-24 bg-gray-200 rounded animate-pulse" />
          <div class="h-7 w-16 bg-gray-200 rounded animate-pulse" />
          <div class="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </template>

    <!-- Loaded State -->
    <template v-else>
      <div class="flex items-start gap-4">
        <div
          :class="[colors.bg, 'w-11 h-11 rounded-lg flex items-center justify-center shrink-0']"
        >
          <component :is="icon" :class="[colors.text, 'h-5 w-5']" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-[hsl(var(--muted-foreground))] truncate">
            {{ title }}
          </p>
          <p class="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">
            {{ value }}
          </p>
          <div
            v-if="change !== undefined"
            class="mt-1 flex items-center gap-1 text-xs font-medium"
            :class="changePositive ? 'text-emerald-600' : 'text-red-500'"
          >
            <TrendingUp v-if="changePositive" class="h-3.5 w-3.5" />
            <TrendingDown v-else class="h-3.5 w-3.5" />
            <span>{{ changePositive ? '+' : '' }}{{ change }}%</span>
            <span class="text-[hsl(var(--muted-foreground))] font-normal ml-0.5">vs last month</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
