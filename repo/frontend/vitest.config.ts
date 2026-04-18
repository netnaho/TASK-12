import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    // Force `.ts` and `.vue` to win over any stale `.js` sibling files left
    // in the source tree by earlier builds. Without this, vite's default
    // extension order resolves `@/stores/auth.store` to `auth.store.js`
    // (which lacks newer code paths like normalizeUser) instead of the
    // `.ts` source of truth.
    extensions: ['.ts', '.tsx', '.vue', '.mjs', '.js', '.jsx', '.json'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.d.ts',
        'src/main.ts',
        'src/App.vue',
        'src/assets/**',
        'src/types/**',
      ],
    },
  },
});
