// Frontend test setup — runs before all tests
import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Stub router-link / router-view so components that use them render cleanly.
config.global.stubs = {
  'router-link': true,
  'router-view': true,
};

// jsdom does not provide matchMedia — stub for components that query it.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// jsdom lacks IntersectionObserver; tests that use it can override.
if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
  (globalThis as any).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}
