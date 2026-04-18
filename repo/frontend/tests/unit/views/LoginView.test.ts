import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';

// Router needs a 'dashboard' and 'login' route. We don't care about real
// components — just that push() lands where we can assert.
vi.mock('@/api/endpoints/auth.api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

import LoginView from '@/views/auth/LoginView.vue';
import * as authApi from '@/api/endpoints/auth.api';

const mockedLogin = authApi.login as unknown as ReturnType<typeof vi.fn>;

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div/>' } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/other', name: 'other', component: { template: '<div>Other</div>' } },
    ],
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  mockedLogin.mockReset();
});

describe('views/auth/LoginView.vue', () => {
  it('renders the LeaseOps heading, fields, and submit button', () => {
    const router = makeRouter();
    const w = mount(LoginView, { global: { plugins: [router] } });
    expect(w.text()).toContain('LeaseOps');
    expect(w.text()).toContain('Welcome back');
    expect(w.find('input#username').exists()).toBe(true);
    expect(w.find('input#password').exists()).toBe(true);
    expect(w.find('button[type="submit"]').exists()).toBe(true);
  });

  it('shows validation errors when submitting an empty form', async () => {
    const router = makeRouter();
    const w = mount(LoginView, { global: { plugins: [router] } });
    await w.find('form').trigger('submit.prevent');
    await flushPromises();
    expect(w.text()).toContain('Username is required');
    expect(w.text()).toContain('Password is required');
    // login API must NOT have been called
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('toggles password visibility on eye-icon click', async () => {
    const router = makeRouter();
    const w = mount(LoginView, { global: { plugins: [router] } });
    const pwd = w.find('input#password');
    expect(pwd.attributes('type')).toBe('password');
    // The visibility toggle is the only type=button inside the password row.
    const toggleBtn = w.findAll('button[type="button"]')[0];
    await toggleBtn.trigger('click');
    expect(pwd.attributes('type')).toBe('text');
    await toggleBtn.trigger('click');
    expect(pwd.attributes('type')).toBe('password');
  });

  it('calls auth API and redirects to /dashboard on success', async () => {
    mockedLogin.mockResolvedValueOnce({
      data: {
        data: {
          id: 'u1',
          username: 'admin',
          email: 'a@test.com',
          firstName: '',
          lastName: '',
          roles: [{ id: 'r1', name: 'SYSTEM_ADMIN' }],
        },
      },
    });
    const router = makeRouter();
    await router.push('/login');
    const spy = vi.spyOn(router, 'push');

    const w = mount(LoginView, { global: { plugins: [router] } });
    await w.find('input#username').setValue('admin');
    await w.find('input#password').setValue('Password123!');
    await w.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(mockedLogin).toHaveBeenCalledWith('admin', 'Password123!');
    expect(spy).toHaveBeenCalled();
    const last = spy.mock.calls.at(-1)?.[0];
    expect(last).toBe('/dashboard');
  });

  it('honors ?redirect=... query on success', async () => {
    mockedLogin.mockResolvedValueOnce({
      data: {
        data: {
          id: 'u1', username: 'admin', email: 'a@test.com', firstName: '', lastName: '',
          roles: [],
        },
      },
    });
    const router = makeRouter();
    await router.push({ path: '/login', query: { redirect: '/other' } });
    const spy = vi.spyOn(router, 'push');

    const w = mount(LoginView, { global: { plugins: [router] } });
    await w.find('input#username').setValue('admin');
    await w.find('input#password').setValue('Password123!');
    await w.find('form').trigger('submit.prevent');
    await flushPromises();

    const last = spy.mock.calls.at(-1)?.[0];
    expect(last).toBe('/other');
  });

  it('surfaces the server error message on failure', async () => {
    mockedLogin.mockRejectedValueOnce({
      response: { data: { message: 'Invalid username or password' } },
    });
    const router = makeRouter();
    const w = mount(LoginView, { global: { plugins: [router] } });

    await w.find('input#username').setValue('admin');
    await w.find('input#password').setValue('wrong');
    await w.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(w.text()).toContain('Invalid username or password');
  });

  it('falls back to a generic message when no server message is present', async () => {
    mockedLogin.mockRejectedValueOnce({});
    const router = makeRouter();
    const w = mount(LoginView, { global: { plugins: [router] } });

    await w.find('input#username').setValue('admin');
    await w.find('input#password').setValue('x');
    await w.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(w.text()).toMatch(/Invalid credentials|An error occurred/i);
  });

  it('disables the submit button while a request is in flight', async () => {
    let resolve!: (v: unknown) => void;
    mockedLogin.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const router = makeRouter();
    const w = mount(LoginView, { global: { plugins: [router] } });

    await w.find('input#username').setValue('admin');
    await w.find('input#password').setValue('Password123!');
    const submit = w.find('button[type="submit"]');
    await w.find('form').trigger('submit.prevent');

    expect(submit.attributes('disabled')).toBeDefined();
    expect(w.text()).toMatch(/Signing in/i);

    resolve({ data: { data: { id: 'u', username: 'admin', email: '', firstName: '', lastName: '', roles: [] } } });
    await flushPromises();
  });
});
