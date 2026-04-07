<script setup lang="ts">
import { cn } from '@/utils/cn';
</script>

<template>
  <div
    :class="cn(
      'min-h-screen flex items-center justify-center',
      'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
      'px-4 py-8'
    )"
  >
    <div class="w-full max-w-md">
      <div class="flex justify-center mb-8">
        <div class="flex items-center gap-2">
          <div
            class="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center"
          >
            <span class="text-white font-bold text-xl">L</span>
          </div>
          <span class="text-2xl font-bold text-white">LeaseOps</span>
        </div>
      </div>

      <div
        :class="cn(
          'bg-white rounded-xl shadow-2xl',
          'p-8',
          'border border-white/20'
        )"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
