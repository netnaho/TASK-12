import { ref, reactive, computed, watch } from 'vue';
import { Plus, Table, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-vue-next';
import DataTable from '@/components/shared/DataTable.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import { getSessions, createSession, getSites, getRooms, } from '@/api/endpoints/test-center.api';
const { toast } = useToast();
const viewMode = ref('table');
const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'roomName', label: 'Room' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'status', label: 'Status' },
];
const { data: sessions, loading, error, refetch } = useApiQuery(() => getSessions());
const { data: sites } = useApiQuery(() => getSites());
const allRooms = ref([]);
watch(sites, async (newSites) => {
    if (!newSites)
        return;
    const roomPromises = newSites.map((s) => getRooms(s.id).then((res) => {
        const d = res.data?.data ?? res.data ?? res;
        return Array.isArray(d) ? d.map((r) => ({ ...r, siteId: s.id })) : [];
    }).catch(() => []));
    const results = await Promise.all(roomPromises);
    allRooms.value = results.flat();
}, { immediate: true });
// Table rows with formatted fields
const tableRows = computed(() => {
    if (!sessions.value)
        return [];
    return sessions.value.map((s) => ({
        ...s,
        date: new Date(s.startTime).toLocaleDateString(),
        time: `${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        capacity: `${s.enrolledCount}/${s.maxCapacity}`,
    }));
});
function sessionStatusVariant(status) {
    const map = {
        SCHEDULED: 'info',
        IN_PROGRESS: 'success',
        COMPLETED: 'neutral',
        CANCELLED: 'error',
        FULL: 'warning',
    };
    return map[status] ?? 'neutral';
}
// Create session modal
const showModal = ref(false);
const form = reactive({
    roomId: '',
    name: '',
    startTime: '',
    endTime: '',
    maxCapacity: 20,
});
const saving = ref(false);
function openCreate() {
    form.roomId = '';
    form.name = '';
    form.startTime = '';
    form.endTime = '';
    form.maxCapacity = 20;
    showModal.value = true;
}
async function handleCreate() {
    saving.value = true;
    try {
        await createSession({
            roomId: form.roomId,
            name: form.name,
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
            maxCapacity: form.maxCapacity,
        });
        toast.success('Session created');
        showModal.value = false;
        refetch();
    }
    catch {
        toast.error('Failed to create session');
    }
    finally {
        saving.value = false;
    }
}
// Session detail
const selectedSession = ref(null);
function viewSession(session) {
    selectedSession.value = session;
}
// Calendar
const calendarDate = ref(new Date());
const calendarYear = computed(() => calendarDate.value.getFullYear());
const calendarMonth = computed(() => calendarDate.value.getMonth());
const calendarMonthName = computed(() => calendarDate.value.toLocaleString('default', { month: 'long', year: 'numeric' }));
function prevMonth() {
    const d = new Date(calendarDate.value);
    d.setMonth(d.getMonth() - 1);
    calendarDate.value = d;
}
function nextMonth() {
    const d = new Date(calendarDate.value);
    d.setMonth(d.getMonth() + 1);
    calendarDate.value = d;
}
const calendarDays = computed(() => {
    const year = calendarYear.value;
    const month = calendarMonth.value;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    // Padding
    for (let i = 0; i < firstDay; i++) {
        days.push({ date: null, sessions: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const daySessions = (sessions.value ?? []).filter((s) => {
            return s.startTime.startsWith(dateStr);
        });
        days.push({ date: d, sessions: daySessions });
    }
    return days;
});
const statusColors = {
    SCHEDULED: 'bg-blue-200 text-blue-800',
    IN_PROGRESS: 'bg-green-200 text-green-800',
    COMPLETED: 'bg-gray-200 text-gray-800',
    CANCELLED: 'bg-red-200 text-red-800',
    FULL: 'bg-yellow-200 text-yellow-800',
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-wrap items-center justify-between gap-3 mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center rounded-lg border border-[hsl(var(--border))] overflow-hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'table';
        } },
    ...{ class: "px-3 py-2 text-sm font-medium transition-colors" },
    ...{ class: (__VLS_ctx.viewMode === 'table'
            ? 'bg-[hsl(var(--primary))] text-white'
            : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]') },
});
const __VLS_0 = {}.Table;
/** @type {[typeof __VLS_components.Table, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "h-4 w-4" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "h-4 w-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'calendar';
        } },
    ...{ class: "px-3 py-2 text-sm font-medium transition-colors" },
    ...{ class: (__VLS_ctx.viewMode === 'calendar'
            ? 'bg-[hsl(var(--primary))] text-white'
            : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]') },
});
const __VLS_4 = {}.CalendarDays;
/** @type {[typeof __VLS_components.CalendarDays, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "h-4 w-4" },
}));
const __VLS_6 = __VLS_5({
    ...{ class: "h-4 w-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openCreate) },
    ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity" },
});
const __VLS_8 = {}.Plus;
/** @type {[typeof __VLS_components.Plus, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ class: "h-4 w-4" },
}));
const __VLS_10 = __VLS_9({
    ...{ class: "h-4 w-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
if (__VLS_ctx.error) {
    /** @type {[typeof ErrorState, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }));
    const __VLS_13 = __VLS_12({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
}
else if (__VLS_ctx.viewMode === 'table') {
    /** @type {[typeof DataTable, typeof DataTable, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(DataTable, new DataTable({
        columns: (__VLS_ctx.columns),
        rows: __VLS_ctx.tableRows,
        loading: (__VLS_ctx.loading),
        emptyMessage: "No sessions found",
    }));
    const __VLS_16 = __VLS_15({
        columns: (__VLS_ctx.columns),
        rows: __VLS_ctx.tableRows,
        loading: (__VLS_ctx.loading),
        emptyMessage: "No sessions found",
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    __VLS_17.slots.default;
    {
        const { 'cell-capacity': __VLS_thisSlot } = __VLS_17.slots;
        const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "font-mono text-sm" },
        });
        (row.capacity);
    }
    {
        const { 'cell-status': __VLS_thisSlot } = __VLS_17.slots;
        const [{ value }] = __VLS_getSlotParams(__VLS_thisSlot);
        /** @type {[typeof StatusChip, ]} */ ;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent(StatusChip, new StatusChip({
            variant: (__VLS_ctx.sessionStatusVariant(value)),
            label: (value?.replace('_', ' ') ?? 'Unknown'),
        }));
        const __VLS_19 = __VLS_18({
            variant: (__VLS_ctx.sessionStatusVariant(value)),
            label: (value?.replace('_', ' ') ?? 'Unknown'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    }
    var __VLS_17;
}
else {
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center py-12" },
        });
        /** @type {[typeof LoadingSpinner, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({}));
        const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
    }
    else if (!__VLS_ctx.sessions || __VLS_ctx.sessions.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        /** @type {[typeof EmptyState, ]} */ ;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent(EmptyState, new EmptyState({
            title: "No sessions",
            description: "No sessions scheduled.",
            icon: (__VLS_ctx.CalendarDays),
        }));
        const __VLS_25 = __VLS_24({
            title: "No sessions",
            description: "No sessions scheduled.",
            icon: (__VLS_ctx.CalendarDays),
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-between mb-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.prevMonth) },
            ...{ class: "rounded-lg p-2 hover:bg-[hsl(var(--muted))] transition-colors" },
        });
        const __VLS_27 = {}.ChevronLeft;
        /** @type {[typeof __VLS_components.ChevronLeft, ]} */ ;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
            ...{ class: "h-5 w-5 text-[hsl(var(--foreground))]" },
        }));
        const __VLS_29 = __VLS_28({
            ...{ class: "h-5 w-5 text-[hsl(var(--foreground))]" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
        });
        (__VLS_ctx.calendarMonthName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.nextMonth) },
            ...{ class: "rounded-lg p-2 hover:bg-[hsl(var(--muted))] transition-colors" },
        });
        const __VLS_31 = {}.ChevronRight;
        /** @type {[typeof __VLS_components.ChevronRight, ]} */ ;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
            ...{ class: "h-5 w-5 text-[hsl(var(--foreground))]" },
        }));
        const __VLS_33 = __VLS_32({
            ...{ class: "h-5 w-5 text-[hsl(var(--foreground))]" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid grid-cols-7 border border-[hsl(var(--border))] rounded-lg overflow-hidden" },
        });
        for (const [day] of __VLS_getVForSourceType((['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (day),
                ...{ class: "px-2 py-2 text-center text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]" },
            });
            (day);
        }
        for (const [cell, idx] of __VLS_getVForSourceType((__VLS_ctx.calendarDays))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (idx),
                ...{ class: "min-h-[100px] border-b border-r border-[hsl(var(--border))] p-1" },
                ...{ class: ({ 'bg-[hsl(var(--muted)/0.3)]': !cell.date }) },
            });
            if (cell.date) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
                });
                (cell.date);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "space-y-1" },
            });
            for (const [s] of __VLS_getVForSourceType((cell.sessions.slice(0, 3)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.error))
                                return;
                            if (!!(__VLS_ctx.viewMode === 'table'))
                                return;
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(!__VLS_ctx.sessions || __VLS_ctx.sessions.length === 0))
                                return;
                            __VLS_ctx.viewSession(s);
                        } },
                    key: (s.id),
                    ...{ class: "w-full text-left rounded px-1 py-0.5 text-xs truncate" },
                    ...{ class: (__VLS_ctx.statusColors[s.status] ?? 'bg-gray-200 text-gray-800') },
                });
                (s.name);
            }
            if (cell.sessions.length > 3) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "text-xs text-[hsl(var(--muted-foreground))] px-1" },
                });
                (cell.sessions.length - 3);
            }
        }
    }
}
const __VLS_35 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
    to: "body",
}));
const __VLS_37 = __VLS_36({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
__VLS_38.slots.default;
const __VLS_39 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    name: "dialog",
}));
const __VLS_41 = __VLS_40({
    name: "dialog",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
__VLS_42.slots.default;
if (__VLS_ctx.selectedSession) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedSession))
                    return;
                __VLS_ctx.selectedSession = null;
            } },
        ...{ class: "absolute inset-0 bg-black/50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
    });
    (__VLS_ctx.selectedSession.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedSession))
                    return;
                __VLS_ctx.selectedSession = null;
            } },
        ...{ class: "rounded-lg p-1 hover:bg-[hsl(var(--muted))] transition-colors" },
    });
    const __VLS_43 = {}.X;
    /** @type {[typeof __VLS_components.X, ]} */ ;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }));
    const __VLS_45 = __VLS_44({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dl, __VLS_intrinsicElements.dl)({
        ...{ class: "space-y-3 text-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({
        ...{ class: "text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
        ...{ class: "font-medium text-[hsl(var(--foreground))]" },
    });
    (__VLS_ctx.selectedSession.roomName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({
        ...{ class: "text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
        ...{ class: "font-medium text-[hsl(var(--foreground))]" },
    });
    (new Date(__VLS_ctx.selectedSession.startTime).toLocaleDateString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({
        ...{ class: "text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
        ...{ class: "font-medium text-[hsl(var(--foreground))]" },
    });
    (new Date(__VLS_ctx.selectedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    (new Date(__VLS_ctx.selectedSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({
        ...{ class: "text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
        ...{ class: "font-medium text-[hsl(var(--foreground))]" },
    });
    (__VLS_ctx.selectedSession.enrolledCount);
    (__VLS_ctx.selectedSession.maxCapacity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({
        ...{ class: "text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
    /** @type {[typeof StatusChip, ]} */ ;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent(StatusChip, new StatusChip({
        variant: (__VLS_ctx.sessionStatusVariant(__VLS_ctx.selectedSession.status)),
        label: (__VLS_ctx.selectedSession.status.replace('_', ' ')),
    }));
    const __VLS_48 = __VLS_47({
        variant: (__VLS_ctx.sessionStatusVariant(__VLS_ctx.selectedSession.status)),
        label: (__VLS_ctx.selectedSession.status.replace('_', ' ')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
}
var __VLS_42;
var __VLS_38;
const __VLS_50 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
    to: "body",
}));
const __VLS_52 = __VLS_51({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
__VLS_53.slots.default;
const __VLS_54 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent(__VLS_54, new __VLS_54({
    name: "dialog",
}));
const __VLS_56 = __VLS_55({
    name: "dialog",
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
__VLS_57.slots.default;
if (__VLS_ctx.showModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showModal))
                    return;
                __VLS_ctx.showModal = false;
            } },
        ...{ class: "absolute inset-0 bg-black/50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))] mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.handleCreate) },
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.form.name),
        type: "text",
        required: true,
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
        placeholder: "Session name",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.form.roomId),
        required: true,
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
        disabled: true,
    });
    for (const [room] of __VLS_getVForSourceType((__VLS_ctx.allRooms))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (room.id),
            value: (room.id),
        });
        (room.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 gap-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "datetime-local",
        required: true,
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
    });
    (__VLS_ctx.form.startTime);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "datetime-local",
        required: true,
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
    });
    (__VLS_ctx.form.endTime);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "number",
        min: "1",
        required: true,
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
    });
    (__VLS_ctx.form.maxCapacity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end gap-3 pt-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showModal))
                    return;
                __VLS_ctx.showModal = false;
            } },
        type: "button",
        ...{ class: "rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        disabled: (__VLS_ctx.saving),
        ...{ class: "rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
    });
    (__VLS_ctx.saving ? 'Creating...' : 'Create');
}
var __VLS_57;
var __VLS_53;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
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
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-7']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-[100px]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-r']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/50']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-4']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/50']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-4']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Plus: Plus,
            Table: Table,
            CalendarDays: CalendarDays,
            ChevronLeft: ChevronLeft,
            ChevronRight: ChevronRight,
            X: X,
            DataTable: DataTable,
            StatusChip: StatusChip,
            ErrorState: ErrorState,
            EmptyState: EmptyState,
            LoadingSpinner: LoadingSpinner,
            viewMode: viewMode,
            columns: columns,
            sessions: sessions,
            loading: loading,
            error: error,
            refetch: refetch,
            allRooms: allRooms,
            tableRows: tableRows,
            sessionStatusVariant: sessionStatusVariant,
            showModal: showModal,
            form: form,
            saving: saving,
            openCreate: openCreate,
            handleCreate: handleCreate,
            selectedSession: selectedSession,
            viewSession: viewSession,
            calendarMonthName: calendarMonthName,
            prevMonth: prevMonth,
            nextMonth: nextMonth,
            calendarDays: calendarDays,
            statusColors: statusColors,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
