<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';

defineProps<{
  message: string;
  onRetry?: () => void;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="mb-4 rounded-full bg-red-100 p-4">
      <AlertTriangle class="h-8 w-8 text-red-600" />
    </div>
    <h3 class="text-lg font-medium text-[hsl(var(--foreground))]">
      Something went wrong
    </h3>
    <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
      {{ message }}
    </p>
    <button
      v-if="onRetry"
      class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      @click="onRetry"
    >
      Try again
    </button>
  </div>
</template>
