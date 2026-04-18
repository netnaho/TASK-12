import { describe, it, expect } from 'vitest';
import { routes } from '@/router/routes';
import { Role } from '@/types/roles';

function flatten(rs: any[], acc: any[] = []): any[] {
  for (const r of rs) {
    acc.push(r);
    if (r.children) flatten(r.children, acc);
  }
  return acc;
}

describe('router/routes', () => {
  const all = flatten(routes);

  it('contains the public /login route and it does not require auth', () => {
    const login = all.find((r: any) => r.path === '/login' || r.name === 'login');
    expect(login).toBeTruthy();
    expect(login.meta?.requiresAuth).toBe(false);
  });

  it('contains the dashboard, notifications, and test-center routes', () => {
    const names = all.map((r: any) => r.name).filter(Boolean);
    expect(names).toContain('dashboard');
    expect(names).toContain('notifications');
    expect(names).toContain('test-center');
  });

  it('test-center route is gated to Admin/Manager/Proctor only', () => {
    const tc = all.find((r: any) => r.name === 'test-center');
    expect(tc).toBeTruthy();
    expect(tc.meta.roles).toContain(Role.Admin);
    expect(tc.meta.roles).toContain(Role.Manager);
    expect(tc.meta.roles).toContain(Role.Proctor);
    expect(tc.meta.roles).not.toContain(Role.User);
  });

  it('authenticated routes declare requiresAuth=true', () => {
    const dashboard = all.find((r: any) => r.name === 'dashboard');
    expect(dashboard?.meta?.requiresAuth).toBe(true);
  });
});
