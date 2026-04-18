import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import NotFoundView from '@/views/NotFoundView.vue';

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/404', name: 'not-found', component: NotFoundView },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
    ],
  });
}

describe('views/NotFoundView.vue', () => {
  it('renders the 404 heading and description', () => {
    const router = makeRouter();
    const w = mount(NotFoundView, { global: { plugins: [router] } });
    expect(w.text()).toContain('404');
    expect(w.text()).toContain('Page Not Found');
    expect(w.text()).toMatch(/does not exist/i);
  });

  it('navigates to /dashboard when the "Back to Dashboard" button is clicked', async () => {
    const router = makeRouter();
    await router.push('/404');
    const spy = vi.spyOn(router, 'push');

    const w = mount(NotFoundView, { global: { plugins: [router] } });
    await w.find('button').trigger('click');
    expect(spy).toHaveBeenCalledWith('/dashboard');
  });
});
