/**
 * Endpoint-client tests — verify each API wrapper calls the right HTTP
 * method + URL + payload against the shared axios client. These tests run
 * fast (no network), but protect against accidental URL/method drift.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted to the top of the file — any identifiers the factory
// closes over must be declared via vi.hoisted() so they move with it.
const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the default-export axios client used by every wrapper.
vi.mock('@/api/client', () => ({ default: apiMock }));

import * as auth from '@/api/endpoints/auth.api';
import * as users from '@/api/endpoints/users.api';
import * as notifications from '@/api/endpoints/notifications.api';
import * as listings from '@/api/endpoints/listings.api';
import * as testCenter from '@/api/endpoints/test-center.api';
import * as analytics from '@/api/endpoints/analytics.api';
import * as messaging from '@/api/endpoints/messaging.api';

beforeEach(() => {
  Object.values(apiMock).forEach((m) => m.mockReset());
  Object.values(apiMock).forEach((m) => m.mockResolvedValue({ data: { success: true } }));
});

describe('api/endpoints/auth.api', () => {
  it('login POSTs /v1/auth/login with credentials', async () => {
    await auth.login('admin', 'pw');
    expect(apiMock.post).toHaveBeenCalledWith('/v1/auth/login', {
      username: 'admin',
      password: 'pw',
    });
  });

  it('logout POSTs /v1/auth/logout', async () => {
    await auth.logout();
    expect(apiMock.post).toHaveBeenCalledWith('/v1/auth/logout');
  });

  it('getCurrentUser GETs /v1/auth/me', async () => {
    await auth.getCurrentUser();
    expect(apiMock.get).toHaveBeenCalledWith('/v1/auth/me');
  });
});

describe('api/endpoints/users.api', () => {
  it('getUsers GETs /v1/users with query params', async () => {
    await users.getUsers({ page: 2 });
    expect(apiMock.get).toHaveBeenCalledWith('/v1/users', { params: { page: 2 } });
  });

  it('getUser GETs /v1/users/:id', async () => {
    await users.getUser('u1');
    expect(apiMock.get).toHaveBeenCalledWith('/v1/users/u1');
  });

  it('createUser POSTs /v1/users with body', async () => {
    await users.createUser({ username: 'x' });
    expect(apiMock.post).toHaveBeenCalledWith('/v1/users', { username: 'x' });
  });

  it('updateUser PATCHes /v1/users/:id with body', async () => {
    await users.updateUser('u1', { displayName: 'A' });
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/users/u1', { displayName: 'A' });
  });

  it('assignRole POSTs /v1/users/:id/roles', async () => {
    await users.assignRole('u1', { role: 'ANALYST' });
    expect(apiMock.post).toHaveBeenCalledWith('/v1/users/u1/roles', { role: 'ANALYST' });
  });

  it('removeRole DELETEs /v1/users/:id/roles/:roleName', async () => {
    await users.removeRole('u1', 'ANALYST');
    expect(apiMock.delete).toHaveBeenCalledWith('/v1/users/u1/roles/ANALYST');
  });

  it('deactivateUser PATCHes /v1/users/:id/deactivate', async () => {
    await users.deactivateUser('u1');
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/users/u1/deactivate');
  });
});

describe('api/endpoints/notifications.api', () => {
  it('getUnreadCount GETs the unread-count resource', async () => {
    await (notifications as any).getUnreadCount();
    const urls = apiMock.get.mock.calls.map((c: any[]) => c[0]);
    expect(urls.some((u: string) => u.includes('unread-count'))).toBe(true);
  });

  it('markRead issues a PATCH to /:id/read', async () => {
    await (notifications as any).markRead('n1');
    const urls = apiMock.patch.mock.calls.map((c: any[]) => c[0]);
    expect(urls.some((u: string) => u.includes('/n1/read'))).toBe(true);
  });
});

describe('api/endpoints/listings.api', () => {
  it('getListings GETs /v1/listings with query params', async () => {
    await (listings as any).getListings({ page: 3 });
    expect(apiMock.get).toHaveBeenCalledWith('/v1/listings', { params: { page: 3 } });
  });

  it('getListing GETs /v1/listings/:id', async () => {
    await (listings as any).getListing('l1');
    expect(apiMock.get).toHaveBeenCalledWith('/v1/listings/l1');
  });

  it('createListing POSTs /v1/listings with body', async () => {
    await (listings as any).createListing({ title: 'x' });
    expect(apiMock.post).toHaveBeenCalledWith('/v1/listings', { title: 'x' });
  });

  it('updateListing PATCHes /v1/listings/:id', async () => {
    await (listings as any).updateListing('l1', { rentPrice: 1000 });
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/listings/l1', { rentPrice: 1000 });
  });

  it('getListingStats GETs /v1/listings/stats', async () => {
    await (listings as any).getListingStats();
    expect(apiMock.get).toHaveBeenCalledWith('/v1/listings/stats', { params: undefined });
  });
});

describe('api/endpoints/notifications.api (deep)', () => {
  it('markAllRead PATCHes /v1/notifications/read-all', async () => {
    await (notifications as any).markAllRead();
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/notifications/read-all');
  });

  it('snooze PATCHes /v1/notifications/:id/snooze with body', async () => {
    await (notifications as any).snooze('n1', { until: '2099-01-01' });
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/notifications/n1/snooze', { until: '2099-01-01' });
  });

  it('dismiss PATCHes /v1/notifications/:id/dismiss', async () => {
    await (notifications as any).dismiss('n1');
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/notifications/n1/dismiss');
  });

  it('template CRUD maps to /v1/notifications/templates/* endpoints', async () => {
    await (notifications as any).getTemplates();
    await (notifications as any).getTemplate('t1');
    await (notifications as any).createTemplate({ slug: 'x' });
    await (notifications as any).updateTemplate('t1', { name: 'Y' });
    await (notifications as any).deleteTemplate('t1');
    await (notifications as any).previewTemplate({ templateId: 't1', variables: {} });

    expect(apiMock.get).toHaveBeenCalledWith('/v1/notifications/templates', { params: undefined });
    expect(apiMock.get).toHaveBeenCalledWith('/v1/notifications/templates/t1');
    expect(apiMock.post).toHaveBeenCalledWith('/v1/notifications/templates', { slug: 'x' });
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/notifications/templates/t1', { name: 'Y' });
    expect(apiMock.delete).toHaveBeenCalledWith('/v1/notifications/templates/t1');
    expect(apiMock.post).toHaveBeenCalledWith(
      '/v1/notifications/templates/preview',
      { templateId: 't1', variables: {} },
    );
  });
});

describe('api/endpoints/test-center.api', () => {
  it('exports at least one function', () => {
    expect(Object.values(testCenter).filter((v) => typeof v === 'function').length).toBeGreaterThan(0);
  });
});

describe('api/endpoints/analytics.api', () => {
  it('exports at least one function', () => {
    expect(Object.values(analytics).filter((v) => typeof v === 'function').length).toBeGreaterThan(0);
  });
});

describe('api/endpoints/messaging.api', () => {
  it('exports at least one function', () => {
    expect(Object.values(messaging).filter((v) => typeof v === 'function').length).toBeGreaterThan(0);
  });
});
