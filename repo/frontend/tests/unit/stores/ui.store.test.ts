import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '@/stores/ui.store';

describe('stores/ui.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('has sensible defaults', () => {
    const ui = useUiStore();
    expect(ui.sidebarCollapsed).toBe(false);
    expect(ui.mobileDrawerOpen).toBe(false);
  });

  it('toggleSidebar flips sidebarCollapsed', () => {
    const ui = useUiStore();
    ui.toggleSidebar();
    expect(ui.sidebarCollapsed).toBe(true);
    ui.toggleSidebar();
    expect(ui.sidebarCollapsed).toBe(false);
  });

  it('toggleDrawer flips mobileDrawerOpen independently of sidebar', () => {
    const ui = useUiStore();
    ui.toggleDrawer();
    expect(ui.mobileDrawerOpen).toBe(true);
    expect(ui.sidebarCollapsed).toBe(false);
    ui.toggleDrawer();
    expect(ui.mobileDrawerOpen).toBe(false);
  });
});
