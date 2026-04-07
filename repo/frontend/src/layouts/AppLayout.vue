<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import { cn } from '@/utils/cn';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const sidebarCollapsed = ref(false);
const mobileMenuOpen = ref(false);

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function openMobileMenu() {
  mobileMenuOpen.value = true;
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}
</script>

<template>
  <div class="h-screen flex overflow-hidden bg-[hsl(var(--background))]">
    <!-- Desktop sidebar -->
    <div class="hidden lg:flex">
      <AppSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    </div>

    <!-- Mobile sidebar overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-40 bg-black/50 lg:hidden"
          @click="closeMobileMenu"
        />
      </Transition>
    </Teleport>

    <!-- Mobile sidebar drawer -->
    <Teleport to="body">
      <Transition name="slide">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-y-0 left-0 z-50 lg:hidden w-[var(--sidebar-width)]"
        >
          <div class="relative h-full">
            <AppSidebar :collapsed="false" @toggle="closeMobileMenu" />
            <button
              class="absolute top-4 right-[-40px] p-2 rounded-full bg-white shadow-lg text-[hsl(var(--muted-foreground))]"
              @click="closeMobileMenu"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <AppTopbar @open-mobile-menu="openMobileMenu" />

      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
