import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getNotifications as fetchNotificationsApi, getUnreadCount as fetchUnreadCountApi, markRead as markReadApi, markAllRead as markAllReadApi, snooze as snoozeApi, } from '@/api/endpoints/notifications.api';
export const useNotificationsStore = defineStore('notifications', () => {
    const notifications = ref([]);
    const unreadCount = ref(0);
    const loading = ref(false);
    let pollingInterval = null;
    async function fetchNotifications(params) {
        loading.value = true;
        try {
            const { data } = await fetchNotificationsApi(params);
            notifications.value = data.data ?? data;
        }
        catch {
            // silently fail for polling
        }
        finally {
            loading.value = false;
        }
    }
    async function fetchUnreadCount() {
        try {
            const { data } = await fetchUnreadCountApi();
            unreadCount.value = data.data?.count ?? data.count ?? 0;
        }
        catch {
            // silently fail
        }
    }
    async function markRead(id) {
        await markReadApi(id);
        const notification = notifications.value.find((n) => n.id === id);
        if (notification) {
            notification.read = true;
            unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
    }
    async function markAllRead() {
        await markAllReadApi();
        notifications.value.forEach((n) => (n.read = true));
        unreadCount.value = 0;
    }
    async function snooze(id, until) {
        await snoozeApi(id, { until });
        const notification = notifications.value.find((n) => n.id === id);
        if (notification) {
            notification.snoozedUntil = until;
        }
    }
    function startPolling(intervalMs = 30000) {
        stopPolling();
        fetchUnreadCount();
        pollingInterval = setInterval(fetchUnreadCount, intervalMs);
    }
    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }
    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markRead,
        markAllRead,
        snooze,
        startPolling,
        stopPolling,
    };
});
