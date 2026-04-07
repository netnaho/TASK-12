<script setup lang="ts">
import { cn } from '@/utils/cn';
import { AlertTriangle } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
  }>(),
  {
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
  }
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="emit('cancel')"
        />

        <!-- Dialog -->
        <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
          <div class="flex items-start gap-4">
            <div
              v-if="variant === 'danger'"
              class="shrink-0 rounded-full bg-red-100 p-2"
            >
              <AlertTriangle class="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">
                {{ title }}
              </h3>
              <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                {{ description }}
              </p>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              @click="emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              :class="cn(
                'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[hsl(var(--primary))] hover:opacity-90'
              )"
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
