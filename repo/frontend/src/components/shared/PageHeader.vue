<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="mt-1 text-sm text-[hsl(var(--muted-foreground))]"
      >
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
