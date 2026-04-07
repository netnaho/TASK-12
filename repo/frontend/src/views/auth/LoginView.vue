<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Lock, Eye, EyeOff, Building2, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const touched = ref({ username: false, password: false });

const usernameError = computed(() =>
  touched.value.username && !username.value.trim() ? 'Username is required' : '',
);
const passwordError = computed(() =>
  touched.value.password && !password.value ? 'Password is required' : '',
);
const isFormValid = computed(
  () => username.value.trim() !== '' && password.value !== '',
);

function togglePassword() {
  showPassword.value = !showPassword.value;
}

async function handleSubmit() {
  touched.value = { username: true, password: true };
  if (!isFormValid.value) return;

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    await authStore.login(username.value.trim(), password.value);
    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ??
      err?.message ??
      'Invalid credentials. Please try again.';
    errorMessage.value = msg;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-12"
  >
    <div class="w-full max-w-md">
      <!-- Logo / Brand -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm mb-4"
        >
          <Building2 class="h-8 w-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">LeaseOps</h1>
        <p class="mt-1 text-blue-200 text-sm">Leasing Operations Platform</p>
      </div>

      <!-- Login Card -->
      <form
        class="bg-white rounded-2xl shadow-2xl p-8 space-y-6"
        @submit.prevent="handleSubmit"
        novalidate
      >
        <div class="text-center">
          <h2 class="text-xl font-semibold text-gray-900">Welcome back</h2>
          <p class="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        <!-- Error Banner -->
        <Transition name="fade">
          <div
            v-if="errorMessage"
            class="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          >
            <span class="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-red-200 flex items-center justify-center text-red-600 text-xs font-bold">!</span>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>

        <!-- Username -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1.5">
            Username
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User class="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="Enter your username"
              class="block w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              :class="[
                usernameError
                  ? 'border-red-300 bg-red-50/50'
                  : 'border-gray-300 bg-white',
              ]"
              @blur="touched.username = true"
            />
          </div>
          <p v-if="usernameError" class="mt-1 text-xs text-red-600">{{ usernameError }}</p>
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock class="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Enter your password"
              class="block w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              :class="[
                passwordError
                  ? 'border-red-300 bg-red-50/50'
                  : 'border-gray-300 bg-white',
              ]"
              @blur="touched.password = true"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              tabindex="-1"
              @click="togglePassword"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
          <p v-if="passwordError" class="mt-1 text-xs text-red-600">{{ passwordError }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          <span>{{ isSubmitting ? 'Signing in...' : 'Sign In' }}</span>
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-blue-200/70">
        &copy; {{ new Date().getFullYear() }} LeaseOps. All rights reserved.
      </p>
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
</style>
