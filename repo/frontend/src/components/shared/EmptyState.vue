<script setup lang="ts">
import type { Component } from 'vue';
import { Inbox } from 'lucide-vue-next';

defineProps<{
  title: string;
  description?: string;
  icon?: Component;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="mb-4 rounded-full bg-[hsl(var(--muted))] p-4">
      <component
        :is="icon ?? Inbox"
        class="h-8 w-8 text-[hsl(var(--muted-foreground))]"
      />
    </div>
    <h3 class="text-lg font-medium text-[hsl(var(--foreground))]">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-1 text-sm text-[hsl(var(--muted-foreground))] max-w-sm"
    >
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
