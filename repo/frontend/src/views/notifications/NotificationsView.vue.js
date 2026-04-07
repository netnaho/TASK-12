import { ref, computed, watch } from 'vue';
import { Bell, AlertTriangle, Calendar, FileText, Clock, Check, Eye, X, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import { getNotifications, getUnreadCount, markRead, markAllRead, snooze, dismiss, } from '@/api/endpoints/notifications.api';
const { toast } = useToast();
const { page, pageSize, total, totalPages, setTotal } = usePagination(20);
const statusFilter = ref('all');
const categoryFilter = ref('all');
const search = ref('');
const queryParams = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    ...(statusFilter.value !== 'all' && { status: statusFilter.value }),
    ...(categoryFilter.value !== 'all' && { category: categoryFilter.value }),
    ...(search.value && { search: search.value }),
}));
const { data: notifications, loading, error, refetch } = useApiQuery(() => getNotifications(queryParams.value));
const { data: unreadCountData, refetch: refetchUnread } = useApiQuery(() => getUnreadCount());
const unreadCount = computed(() => unreadCountData.value?.count ?? 0);
watch([statusFilter, categoryFilter, search], () => {
    page.value = 1;
    refetch();
});
watch([page, pageSize], () => {
    refetch();
});
const snoozeOpenId = ref(null);
const categoryIcons = {
    system: Bell,
    alert: AlertTriangle,
    schedule: Calendar,
    document: FileText,
};
const statusVariant = {
    unread: 'info',
    read: 'neutral',
    snoozed: 'warning',
};
function relativeTime(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)
        return 'Just now';
    if (diffMin < 60)
        return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24)
        return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30)
        return `${diffDay}d ago`;
    return date.toLocaleDateString();
}
async function handleMarkRead(n) {
    try {
        await markRead(n.id);
        n.status = 'read';
        refetchUnread();
        toast.success('Notification marked as read');
    }
    catch {
        toast.error('Failed to mark notification');
    }
}
async function handleMarkAllRead() {
    try {
        await markAllRead();
        refetch();
        refetchUnread();
        toast.success('All notifications marked as read');
    }
    catch {
        toast.error('Failed to mark all as read');
    }
}
async function handleSnooze(n, hours) {
    const until = new Date(Date.now() + hours * 3600000).toISOString();
    try {
        await snooze(n.id, { until });
        n.status = 'snoozed';
        snoozeOpenId.value = null;
        refetchUnread();
        toast.success(`Snoozed for ${hours >= 24 ? '1 day' : hours + 'h'}`);
    }
    catch {
        toast.error('Failed to snooze notification');
    }
}
async function handleDismiss(n) {
    try {
        await dismiss(n.id);
        refetch();
        refetchUnread();
        toast.success('Notification dismissed');
    }
    catch {
        toast.error('Failed to dismiss notification');
    }
}
function handleNotificationClick(n) {
    if (n.status === 'unread') {
        handleMarkRead(n);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: "Notifications",
}));
const __VLS_1 = __VLS_0({
    title: "Notifications",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    if (__VLS_ctx.unreadCount > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800" },
        });
        (__VLS_ctx.unreadCount);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleMarkAllRead) },
        ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity" },
    });
    const __VLS_3 = {}.Check;
    /** @type {[typeof __VLS_components.Check, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ class: "h-4 w-4" },
    }));
    const __VLS_5 = __VLS_4({
        ...{ class: "h-4 w-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
}
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-6 flex flex-wrap items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.statusFilter),
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "all",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "unread",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "read",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "snoozed",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.categoryFilter),
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "all",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "system",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "alert",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "schedule",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "document",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.search),
    type: "text",
    placeholder: "Search notifications...",
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] w-64" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3" },
    });
    for (const [i] of __VLS_getVForSourceType((5))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "rounded-lg border border-[hsl(var(--border))] p-4 animate-pulse" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-start gap-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-10 w-10 rounded-full bg-[hsl(var(--muted))]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-1 space-y-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-4 w-1/3 rounded bg-[hsl(var(--muted))]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-3 w-2/3 rounded bg-[hsl(var(--muted))]" },
        });
    }
}
else if (__VLS_ctx.error) {
    /** @type {[typeof ErrorState, ]} */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }));
    const __VLS_8 = __VLS_7({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
}
else if (!__VLS_ctx.notifications || __VLS_ctx.notifications.length === 0) {
    /** @type {[typeof EmptyState, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(EmptyState, new EmptyState({
        title: "No notifications",
        description: "You're all caught up! No notifications to display.",
        icon: (__VLS_ctx.Bell),
    }));
    const __VLS_11 = __VLS_10({
        title: "No notifications",
        description: "You're all caught up! No notifications to display.",
        icon: (__VLS_ctx.Bell),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-2" },
    });
    for (const [n] of __VLS_getVForSourceType((__VLS_ctx.notifications))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(!__VLS_ctx.notifications || __VLS_ctx.notifications.length === 0))
                        return;
                    __VLS_ctx.handleNotificationClick(n);
                } },
            key: (n.id),
            ...{ class: "group rounded-lg border border-[hsl(var(--border))] p-4 transition-colors hover:bg-[hsl(var(--muted)/0.5)] cursor-pointer" },
            ...{ class: ({ 'bg-blue-50/50 border-blue-200': n.status === 'unread' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-start gap-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "shrink-0 rounded-full p-2" },
            ...{ class: ({
                    'bg-blue-100': n.category === 'system',
                    'bg-orange-100': n.category === 'alert',
                    'bg-green-100': n.category === 'schedule',
                    'bg-purple-100': n.category === 'document',
                }) },
        });
        const __VLS_13 = ((__VLS_ctx.categoryIcons[n.category] ?? __VLS_ctx.Bell));
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
            ...{ class: "h-5 w-5" },
            ...{ class: ({
                    'text-blue-600': n.category === 'system',
                    'text-orange-600': n.category === 'alert',
                    'text-green-600': n.category === 'schedule',
                    'text-purple-600': n.category === 'document',
                }) },
        }));
        const __VLS_15 = __VLS_14({
            ...{ class: "h-5 w-5" },
            ...{ class: ({
                    'text-blue-600': n.category === 'system',
                    'text-orange-600': n.category === 'alert',
                    'text-green-600': n.category === 'schedule',
                    'text-purple-600': n.category === 'document',
                }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-1 min-w-0" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2 mb-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "font-medium text-[hsl(var(--foreground))]" },
        });
        (n.title);
        /** @type {[typeof StatusChip, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(StatusChip, new StatusChip({
            variant: (__VLS_ctx.statusVariant[n.status] ?? 'neutral'),
            label: (n.status),
        }));
        const __VLS_18 = __VLS_17({
            variant: (__VLS_ctx.statusVariant[n.status] ?? 'neutral'),
            label: (n.status),
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-[hsl(var(--muted-foreground))] line-clamp-2" },
        });
        (n.body);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "mt-1 inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]" },
        });
        const __VLS_20 = {}.Clock;
        /** @type {[typeof __VLS_components.Clock, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            ...{ class: "h-3 w-3" },
        }));
        const __VLS_22 = __VLS_21({
            ...{ class: "h-3 w-3" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        (__VLS_ctx.relativeTime(n.createdAt));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: () => { } },
            ...{ class: "shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" },
        });
        if (n.status === 'unread') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(!__VLS_ctx.notifications || __VLS_ctx.notifications.length === 0))
                            return;
                        if (!(n.status === 'unread'))
                            return;
                        __VLS_ctx.handleMarkRead(n);
                    } },
                ...{ class: "rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors" },
                title: "Mark as read",
            });
            const __VLS_24 = {}.Eye;
            /** @type {[typeof __VLS_components.Eye, ]} */ ;
            // @ts-ignore
            const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
                ...{ class: "h-4 w-4" },
            }));
            const __VLS_26 = __VLS_25({
                ...{ class: "h-4 w-4" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "relative" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(!__VLS_ctx.notifications || __VLS_ctx.notifications.length === 0))
                        return;
                    __VLS_ctx.snoozeOpenId = __VLS_ctx.snoozeOpenId === n.id ? null : n.id;
                } },
            ...{ class: "rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors" },
            title: "Snooze",
        });
        const __VLS_28 = {}.Clock;
        /** @type {[typeof __VLS_components.Clock, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_30 = __VLS_29({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        if (__VLS_ctx.snoozeOpenId === n.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absolute right-0 top-full mt-1 z-10 w-36 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-lg py-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(!__VLS_ctx.notifications || __VLS_ctx.notifications.length === 0))
                            return;
                        if (!(__VLS_ctx.snoozeOpenId === n.id))
                            return;
                        __VLS_ctx.handleSnooze(n, 1);
                    } },
                ...{ class: "w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(!__VLS_ctx.notifications || __VLS_ctx.notifications.length === 0))
                            return;
                        if (!(__VLS_ctx.snoozeOpenId === n.id))
                            return;
                        __VLS_ctx.handleSnooze(n, 4);
                    } },
                ...{ class: "w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(!__VLS_ctx.notifications || __VLS_ctx.notifications.length === 0))
                            return;
                        if (!(__VLS_ctx.snoozeOpenId === n.id))
                            return;
                        __VLS_ctx.handleSnooze(n, 24);
                    } },
                ...{ class: "w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(!__VLS_ctx.notifications || __VLS_ctx.notifications.length === 0))
                        return;
                    __VLS_ctx.handleDismiss(n);
                } },
            ...{ class: "rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-600 transition-colors" },
            title: "Dismiss",
        });
        const __VLS_32 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_34 = __VLS_33({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    }
}
if (__VLS_ctx.notifications && __VLS_ctx.notifications.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-6 flex items-center justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
    });
    (__VLS_ctx.page);
    (__VLS_ctx.totalPages);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.notifications && __VLS_ctx.notifications.length > 0))
                    return;
                __VLS_ctx.page--;
            } },
        disabled: (__VLS_ctx.page <= 1),
        ...{ class: "inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" },
    });
    const __VLS_36 = {}.ChevronLeft;
    /** @type {[typeof __VLS_components.ChevronLeft, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        ...{ class: "h-4 w-4" },
    }));
    const __VLS_38 = __VLS_37({
        ...{ class: "h-4 w-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.notifications && __VLS_ctx.notifications.length > 0))
                    return;
                __VLS_ctx.page++;
            } },
        disabled: (__VLS_ctx.page >= __VLS_ctx.totalPages),
        ...{ class: "inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" },
    });
    const __VLS_40 = {}.ChevronRight;
    /** @type {[typeof __VLS_components.ChevronRight, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        ...{ class: "h-4 w-4" },
    }));
    const __VLS_42 = __VLS_41({
        ...{ class: "h-4 w-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
}
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-100']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-800']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-64']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-2/3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted)/0.5)]']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['top-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-36']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-50']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Bell: Bell,
            Clock: Clock,
            Check: Check,
            Eye: Eye,
            X: X,
            ChevronLeft: ChevronLeft,
            ChevronRight: ChevronRight,
            PageHeader: PageHeader,
            StatusChip: StatusChip,
            EmptyState: EmptyState,
            ErrorState: ErrorState,
            page: page,
            totalPages: totalPages,
            statusFilter: statusFilter,
            categoryFilter: categoryFilter,
            search: search,
            notifications: notifications,
            loading: loading,
            error: error,
            refetch: refetch,
            unreadCount: unreadCount,
            snoozeOpenId: snoozeOpenId,
            categoryIcons: categoryIcons,
            statusVariant: statusVariant,
            relativeTime: relativeTime,
            handleMarkRead: handleMarkRead,
            handleMarkAllRead: handleMarkAllRead,
            handleSnooze: handleSnooze,
            handleDismiss: handleDismiss,
            handleNotificationClick: handleNotificationClick,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
