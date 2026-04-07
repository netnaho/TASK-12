<script setup lang="ts">
import { Toaster } from 'vue-sonner';
</script>

<template>
  <Suspense>
    <router-view />
  </Suspense>
  <Toaster position="top-right" :duration="4000" rich-colors close-button />
</template>
