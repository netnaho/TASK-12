/**
 * AppSidebar tests — verify RBAC-based nav item filtering, active-link
 * highlighting, collapse toggle emit, and router navigation click-through.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';

vi.mock('@/api/endpoints/auth.api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

import AppSidebar from '@/layouts/AppSidebar.vue';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/roles';

function makeRouter() {
  const routes = [
    '/dashboard',
    '/test-center',
    '/listings',
    '/lease-metrics',
    '/analytics',
    '/users',
    '/audit-log',
    '/settings',
  ].map((p) => ({ path: p, name: p.slice(1), component: { template: '<div/>' } }));
  return createRouter({ history: createMemoryHistory(), routes });
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('layouts/AppSidebar.vue', () => {
  it('shows all 8 items for admin role', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = {
      id: 'u', username: 'admin', email: '', firstName: '', lastName: '',
      roles: [Role.Admin] as any,
    };
    const w = mount(AppSidebar, {
      props: { collapsed: false },
      global: { plugins: [router] },
    });
    // Expect 8 nav buttons (top of sidebar) + 1 collapse toggle
    const labels = w.findAll('button').map((b) => b.text().trim()).filter(Boolean);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Users');
    expect(labels).toContain('Analytics');
    expect(labels).toContain('Settings');
    expect(labels).toContain('Audit Log');
    expect(labels).toContain('Test Center');
    expect(labels).toContain('Listings');
    expect(labels).toContain('Lease Metrics');
    expect(labels).toContain('Collapse');
  });

  it('hides admin-only items from a standard user', () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = {
      id: 'u', username: 'agent', email: '', firstName: '', lastName: '',
      roles: [Role.User] as any,
    };
    const w = mount(AppSidebar, {
      props: { collapsed: false },
      global: { plugins: [router] },
    });
    const labels = w.findAll('button').map((b) => b.text().trim()).filter(Boolean);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Listings');
    expect(labels).not.toContain('Users');
    expect(labels).not.toContain('Settings');
    expect(labels).not.toContain('Audit Log');
    expect(labels).not.toContain('Test Center');
    expect(labels).not.toContain('Analytics');
  });

  it('emits toggle when the Collapse button is clicked', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = {
      id: 'u', username: 'admin', email: '', firstName: '', lastName: '',
      roles: [Role.Admin] as any,
    };
    const w = mount(AppSidebar, {
      props: { collapsed: false },
      global: { plugins: [router] },
    });
    const collapseBtn = w.findAll('button').find((b) => b.text().includes('Collapse'));
    expect(collapseBtn).toBeTruthy();
    await collapseBtn!.trigger('click');
    expect(w.emitted('toggle')).toBeTruthy();
  });

  it('navigates via router.push when a nav item is clicked', async () => {
    const router = makeRouter();
    await router.push('/dashboard');
    const pushSpy = vi.spyOn(router, 'push');

    const auth = useAuthStore();
    auth.user = {
      id: 'u', username: 'admin', email: '', firstName: '', lastName: '',
      roles: [Role.Admin] as any,
    };
    const w = mount(AppSidebar, {
      props: { collapsed: false },
      global: { plugins: [router] },
    });
    const listingsBtn = w.findAll('button').find((b) => b.text().includes('Listings'));
    expect(listingsBtn).toBeTruthy();
    await listingsBtn!.trigger('click');
    expect(pushSpy).toHaveBeenCalledWith('/listings');
  });

  it('hides labels when collapsed but keeps icons + titles', async () => {
    const router = makeRouter();
    const auth = useAuthStore();
    auth.user = {
      id: 'u', username: 'admin', email: '', firstName: '', lastName: '',
      roles: [Role.Admin] as any,
    };
    const w = mount(AppSidebar, {
      props: { collapsed: true },
      global: { plugins: [router] },
    });
    // Collapsed → the visible text of the nav buttons should be empty
    // because only the icon is rendered; but the `title=` attribute holds
    // the hover label.
    const navButtons = w.findAll('nav button');
    for (const btn of navButtons) {
      expect(btn.attributes('title')).toBeTruthy();
    }
    // The brand wordmark is also hidden when collapsed
    expect(w.text()).not.toContain('LeaseOps');
  });

  it('marks the active route by CSS class', async () => {
    const router = makeRouter();
    await router.push('/users');

    const auth = useAuthStore();
    auth.user = {
      id: 'u', username: 'admin', email: '', firstName: '', lastName: '',
      roles: [Role.Admin] as any,
    };
    const w = mount(AppSidebar, {
      props: { collapsed: false },
      global: { plugins: [router] },
    });
    const usersBtn = w.findAll('button').find((b) => b.text().includes('Users'));
    expect(usersBtn).toBeTruthy();
    // Active button gets bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]
    expect(usersBtn!.html()).toMatch(/--primary/);
  });
});
