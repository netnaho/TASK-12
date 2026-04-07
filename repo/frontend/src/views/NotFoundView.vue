<script setup lang="ts">
import { FileQuestion } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4">
    <div class="text-center">
      <div class="mb-6 flex justify-center">
        <div class="rounded-full bg-[hsl(var(--muted))] p-6">
          <FileQuestion class="h-12 w-12 text-[hsl(var(--muted-foreground))]" />
        </div>
      </div>
      <h1 class="text-4xl font-bold text-[hsl(var(--foreground))]">404</h1>
      <p class="mt-2 text-lg text-[hsl(var(--muted-foreground))]">
        Page Not Found
      </p>
      <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        The page you are looking for does not exist or has been moved.
      </p>
      <button
        class="mt-6 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        @click="router.push('/dashboard')"
      >
        Back to Dashboard
      </button>
    </div>
  </div>
</template>
