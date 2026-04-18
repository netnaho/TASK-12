import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@/api/endpoints/notifications.api', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  snooze: vi.fn(),
}));

import { useNotificationsStore } from '@/stores/notifications.store';
import * as api from '@/api/endpoints/notifications.api';

const getNotifications = api.getNotifications as unknown as ReturnType<typeof vi.fn>;
const getUnreadCount = api.getUnreadCount as unknown as ReturnType<typeof vi.fn>;
const markRead = api.markRead as unknown as ReturnType<typeof vi.fn>;
const markAllRead = api.markAllRead as unknown as ReturnType<typeof vi.fn>;
const snooze = api.snooze as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('stores/notifications.store', () => {
  it('fetchNotifications populates the list', async () => {
    getNotifications.mockResolvedValue({
      data: { data: [{ id: '1', title: 't', body: 'b', type: 'INFO', read: false, createdAt: '2024-01-01' }] },
    });
    const store = useNotificationsStore();
    await store.fetchNotifications();
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0].title).toBe('t');
    expect(store.loading).toBe(false);
  });

  it('fetchUnreadCount stores the count and tolerates errors silently', async () => {
    getUnreadCount.mockResolvedValue({ data: { data: { count: 7 } } });
    const store = useNotificationsStore();
    await store.fetchUnreadCount();
    expect(store.unreadCount).toBe(7);

    getUnreadCount.mockRejectedValueOnce({ statusCode: 500 });
    await expect(store.fetchUnreadCount()).resolves.toBeUndefined();
    // Previous value remains
    expect(store.unreadCount).toBe(7);
  });

  it('markRead flips read flag and decrements the unread count', async () => {
    markRead.mockResolvedValue({});
    const store = useNotificationsStore();
    store.notifications.push({
      id: 'n1', title: 't', body: 'b', type: 'INFO', read: false, createdAt: '2024-01-01',
    });
    store.unreadCount = 3;

    await store.markRead('n1');
    expect(markRead).toHaveBeenCalledWith('n1');
    expect(store.notifications[0].read).toBe(true);
    expect(store.unreadCount).toBe(2);
  });

  it('markAllRead flips every row and zeroes the counter', async () => {
    markAllRead.mockResolvedValue({});
    const store = useNotificationsStore();
    store.notifications.push(
      { id: '1', title: '', body: '', type: '', read: false, createdAt: '' },
      { id: '2', title: '', body: '', type: '', read: false, createdAt: '' },
    );
    store.unreadCount = 2;

    await store.markAllRead();
    expect(store.notifications.every((n) => n.read)).toBe(true);
    expect(store.unreadCount).toBe(0);
  });

  it('snooze stores snoozedUntil on the targeted row', async () => {
    snooze.mockResolvedValue({});
    const store = useNotificationsStore();
    store.notifications.push({
      id: 'n1', title: '', body: '', type: '', read: false, createdAt: '',
    });
    await store.snooze('n1', '2099-01-01T00:00:00Z');
    expect(snooze).toHaveBeenCalledWith('n1', { until: '2099-01-01T00:00:00Z' });
    expect(store.notifications[0].snoozedUntil).toBe('2099-01-01T00:00:00Z');
  });

  it('startPolling sets up an interval; stopPolling clears it', async () => {
    vi.useFakeTimers();
    getUnreadCount.mockResolvedValue({ data: { data: { count: 1 } } });

    const store = useNotificationsStore();
    store.startPolling(1000);
    // immediate fetch + one tick
    await Promise.resolve();
    expect(getUnreadCount).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(getUnreadCount).toHaveBeenCalledTimes(2);

    store.stopPolling();
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(getUnreadCount).toHaveBeenCalledTimes(2);
  });
});
