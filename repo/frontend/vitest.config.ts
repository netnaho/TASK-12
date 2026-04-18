import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
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
