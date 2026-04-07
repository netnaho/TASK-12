import { ref, reactive, computed } from 'vue';
import { Plus, ChevronDown, ChevronRight, Lock, RefreshCw, Clock } from 'lucide-vue-next';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import { getDefinitions, createDefinition, createVersion, triggerRecalc, getCalcJobs, } from '@/api/endpoints/metrics.api';
const { toast } = useToast();
const columns = [
    { key: 'expand', label: '' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type' },
    { key: 'currentVersion', label: 'Version' },
    { key: 'effectiveFrom', label: 'Effective From' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '' },
];
const { data: definitions, loading, error, refetch } = useApiQuery(() => getDefinitions());
const { data: calcJobs, loading: jobsLoading, refetch: refetchJobs } = useApiQuery(() => getCalcJobs({ limit: 10 }));
const expandedDefs = ref(new Set());
function toggleExpand(id) {
    if (expandedDefs.value.has(id)) {
        expandedDefs.value.delete(id);
    }
    else {
        expandedDefs.value.add(id);
    }
}
const tableRows = computed(() => {
    return (definitions.value ?? []).map((d) => ({
        ...d,
        effectiveFrom: d.effectiveFrom ? new Date(d.effectiveFrom).toLocaleDateString() : '-',
    }));
});
// Create Definition Modal
const showDefModal = ref(false);
const defForm = reactive({
    name: '',
    type: 'PERCENTAGE',
    description: '',
});
const savingDef = ref(false);
function openCreateDef() {
    defForm.name = '';
    defForm.type = 'PERCENTAGE';
    defForm.description = '';
    showDefModal.value = true;
}
async function handleCreateDef() {
    savingDef.value = true;
    try {
        await createDefinition({ ...defForm });
        toast.success('Definition created');
        showDefModal.value = false;
        refetch();
    }
    catch {
        toast.error('Failed to create definition');
    }
    finally {
        savingDef.value = false;
    }
}
// Add Version Modal
const showVersionModal = ref(false);
const versionTargetId = ref('');
const versionForm = reactive({
    formula: '{}',
    effectiveFrom: '',
});
const savingVersion = ref(false);
function openAddVersion(defId) {
    versionTargetId.value = defId;
    versionForm.formula = '{\n  "type": "simple",\n  "expression": ""\n}';
    versionForm.effectiveFrom = new Date().toISOString().split('T')[0];
    showVersionModal.value = true;
}
async function handleCreateVersion() {
    savingVersion.value = true;
    try {
        let formulaObj;
        try {
            formulaObj = JSON.parse(versionForm.formula);
        }
        catch {
            toast.error('Invalid JSON in formula');
            savingVersion.value = false;
            return;
        }
        await createVersion(versionTargetId.value, {
            formula: formulaObj,
            effectiveFrom: versionForm.effectiveFrom,
        });
        toast.success('Version created');
        showVersionModal.value = false;
        refetch();
    }
    catch {
        toast.error('Failed to create version');
    }
    finally {
        savingVersion.value = false;
    }
}
// Recalculation
const showRecalcConfirm = ref(false);
const recalculating = ref(false);
async function handleRecalc() {
    recalculating.value = true;
    try {
        await triggerRecalc({});
        toast.success('Recalculation triggered');
        showRecalcConfirm.value = false;
        refetchJobs();
    }
    catch {
        toast.error('Failed to trigger recalculation');
    }
    finally {
        recalculating.value = false;
    }
}
function jobStatusVariant(status) {
    const map = {
        completed: 'success',
        running: 'info',
        pending: 'warning',
        failed: 'error',
    };
    return map[status?.toLowerCase()] ?? 'neutral';
}
function relativeTime(dateStr) {
    if (!dateStr)
        return '-';
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
    return `${diffDay}d ago`;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: "Lease Metrics",
    description: "Configure metric definitions and manage calculation versions.",
}));
const __VLS_1 = __VLS_0({
    title: "Lease Metrics",
    description: "Configure metric definitions and manage calculation versions.",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.showRecalcConfirm = true;
            } },
        ...{ class: "inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors" },
    });
    const __VLS_3 = {}.RefreshCw;
    /** @type {[typeof __VLS_components.RefreshCw, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ class: "h-4 w-4" },
    }));
    const __VLS_5 = __VLS_4({
        ...{ class: "h-4 w-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openCreateDef) },
        ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity" },
    });
    const __VLS_7 = {}.Plus;
    /** @type {[typeof __VLS_components.Plus, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        ...{ class: "h-4 w-4" },
    }));
    const __VLS_9 = __VLS_8({
        ...{ class: "h-4 w-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
var __VLS_2;
if (__VLS_ctx.error) {
    /** @type {[typeof ErrorState, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }));
    const __VLS_12 = __VLS_11({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overflow-x-auto rounded-lg border border-[hsl(var(--border))] mb-8" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
        ...{ class: "w-full text-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        ...{ class: "border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-2 py-3 w-10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    if (__VLS_ctx.loading) {
        for (const [i] of __VLS_getVForSourceType((5))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                key: ('skeleton-' + i),
                ...{ class: "border-b border-[hsl(var(--border))]" },
            });
            for (const [j] of __VLS_getVForSourceType((7))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    key: (j),
                    ...{ class: "px-4 py-3" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                    ...{ class: "h-4 rounded bg-[hsl(var(--muted))] animate-pulse w-3/4" },
                });
            }
        }
    }
    else if ((__VLS_ctx.definitions ?? []).length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            colspan: "7",
            ...{ class: "px-4 py-12 text-center text-[hsl(var(--muted-foreground))]" },
        });
    }
    else {
        for (const [def] of __VLS_getVForSourceType((__VLS_ctx.definitions ?? []))) {
            (def.id);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                ...{ class: "border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "px-2 py-3 text-center" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!((__VLS_ctx.definitions ?? []).length === 0))
                            return;
                        __VLS_ctx.toggleExpand(def.id);
                    } },
                ...{ class: "rounded p-1 hover:bg-[hsl(var(--muted))] transition-colors" },
            });
            const __VLS_14 = ((__VLS_ctx.expandedDefs.has(def.id) ? __VLS_ctx.ChevronDown : __VLS_ctx.ChevronRight));
            // @ts-ignore
            const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
                ...{ class: "h-4 w-4 text-[hsl(var(--muted-foreground))]" },
            }));
            const __VLS_16 = __VLS_15({
                ...{ class: "h-4 w-4 text-[hsl(var(--muted-foreground))]" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_15));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "px-4 py-3 font-medium text-[hsl(var(--foreground))]" },
            });
            (def.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "px-4 py-3 text-[hsl(var(--foreground))]" },
            });
            (def.type);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "px-4 py-3 text-[hsl(var(--foreground))]" },
            });
            (def.currentVersion);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "px-4 py-3 text-[hsl(var(--foreground))]" },
            });
            (def.effectiveFrom ? new Date(def.effectiveFrom).toLocaleDateString() : '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "px-4 py-3" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center gap-1" },
            });
            /** @type {[typeof StatusChip, ]} */ ;
            // @ts-ignore
            const __VLS_18 = __VLS_asFunctionalComponent(StatusChip, new StatusChip({
                variant: (def.isLocked ? 'warning' : 'success'),
                label: (def.isLocked ? 'Locked' : 'Active'),
            }));
            const __VLS_19 = __VLS_18({
                variant: (def.isLocked ? 'warning' : 'success'),
                label: (def.isLocked ? 'Locked' : 'Active'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_18));
            if (def.isLocked) {
                const __VLS_21 = {}.Lock;
                /** @type {[typeof __VLS_components.Lock, ]} */ ;
                // @ts-ignore
                const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
                    ...{ class: "h-3.5 w-3.5 text-yellow-600" },
                }));
                const __VLS_23 = __VLS_22({
                    ...{ class: "h-3.5 w-3.5 text-yellow-600" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_22));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "px-4 py-3" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!((__VLS_ctx.definitions ?? []).length === 0))
                            return;
                        __VLS_ctx.openAddVersion(def.id);
                    } },
                ...{ class: "inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors" },
            });
            const __VLS_25 = {}.Plus;
            /** @type {[typeof __VLS_components.Plus, ]} */ ;
            // @ts-ignore
            const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
                ...{ class: "h-3 w-3" },
            }));
            const __VLS_27 = __VLS_26({
                ...{ class: "h-3 w-3" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_26));
            if (__VLS_ctx.expandedDefs.has(def.id)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    colspan: "7",
                    ...{ class: "bg-[hsl(var(--muted)/0.3)] px-4 py-3" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "ml-8" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
                    ...{ class: "text-sm font-medium text-[hsl(var(--foreground))] mb-2" },
                });
                if (!def.versions || def.versions.length === 0) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "text-sm text-[hsl(var(--muted-foreground))] italic" },
                    });
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "space-y-2" },
                    });
                    for (const [ver] of __VLS_getVForSourceType((def.versions))) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            key: (ver.id),
                            ...{ class: "flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: "flex items-center gap-4" },
                        });
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "text-sm font-medium text-[hsl(var(--foreground))]" },
                        });
                        (ver.version);
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "text-xs text-[hsl(var(--muted-foreground))]" },
                        });
                        (new Date(ver.effectiveFrom).toLocaleDateString());
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "text-xs text-[hsl(var(--muted-foreground))]" },
                        });
                        (new Date(ver.createdAt).toLocaleDateString());
                    }
                }
            }
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2" },
});
const __VLS_29 = {}.Clock;
/** @type {[typeof __VLS_components.Clock, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
}));
const __VLS_31 = __VLS_30({
    ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
if (__VLS_ctx.jobsLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center py-8" },
    });
    /** @type {[typeof LoadingSpinner, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({}));
    const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
}
else if (!__VLS_ctx.calcJobs || __VLS_ctx.calcJobs.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-8 text-[hsl(var(--muted-foreground))]" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-2" },
    });
    for (const [job] of __VLS_getVForSourceType((__VLS_ctx.calcJobs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (job.id),
            ...{ class: "flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-4 py-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-4" },
        });
        /** @type {[typeof StatusChip, ]} */ ;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent(StatusChip, new StatusChip({
            variant: (__VLS_ctx.jobStatusVariant(job.status)),
            label: (job.status),
        }));
        const __VLS_37 = __VLS_36({
            variant: (__VLS_ctx.jobStatusVariant(job.status)),
            label: (job.status),
        }, ...__VLS_functionalComponentArgsRest(__VLS_36));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-sm font-medium text-[hsl(var(--foreground))]" },
        });
        (job.definitionName ?? 'All Metrics');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
        });
        (job.recordsProcessed);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-3" },
        });
        if (job.error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-xs text-red-600" },
            });
            (job.error);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-xs text-[hsl(var(--muted-foreground))]" },
        });
        (__VLS_ctx.relativeTime(job.startedAt));
    }
}
const __VLS_39 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    to: "body",
}));
const __VLS_41 = __VLS_40({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
__VLS_42.slots.default;
const __VLS_43 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
    name: "dialog",
}));
const __VLS_45 = __VLS_44({
    name: "dialog",
}, ...__VLS_functionalComponentArgsRest(__VLS_44));
__VLS_46.slots.default;
if (__VLS_ctx.showDefModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDefModal))
                    return;
                __VLS_ctx.showDefModal = false;
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
        ...{ onSubmit: (__VLS_ctx.handleCreateDef) },
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.defForm.name),
        type: "text",
        required: true,
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
        placeholder: "e.g. Occupancy Rate",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.defForm.type),
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "PERCENTAGE",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "CURRENCY",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "COUNT",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "RATIO",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "DURATION",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.defForm.description),
        type: "text",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
        placeholder: "Optional description",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end gap-3 pt-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDefModal))
                    return;
                __VLS_ctx.showDefModal = false;
            } },
        type: "button",
        ...{ class: "rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        disabled: (__VLS_ctx.savingDef),
        ...{ class: "rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
    });
    (__VLS_ctx.savingDef ? 'Creating...' : 'Create');
}
var __VLS_46;
var __VLS_42;
const __VLS_47 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
    to: "body",
}));
const __VLS_49 = __VLS_48({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
__VLS_50.slots.default;
const __VLS_51 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
    name: "dialog",
}));
const __VLS_53 = __VLS_52({
    name: "dialog",
}, ...__VLS_functionalComponentArgsRest(__VLS_52));
__VLS_54.slots.default;
if (__VLS_ctx.showVersionModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showVersionModal))
                    return;
                __VLS_ctx.showVersionModal = false;
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
        ...{ onSubmit: (__VLS_ctx.handleCreateVersion) },
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "date",
        required: true,
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" },
    });
    (__VLS_ctx.versionForm.effectiveFrom);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.versionForm.formula),
        rows: "8",
        required: true,
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))]" },
        placeholder: '{ "type": "simple", "expression": "" }',
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end gap-3 pt-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showVersionModal))
                    return;
                __VLS_ctx.showVersionModal = false;
            } },
        type: "button",
        ...{ class: "rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        disabled: (__VLS_ctx.savingVersion),
        ...{ class: "rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
    });
    (__VLS_ctx.savingVersion ? 'Creating...' : 'Create Version');
}
var __VLS_54;
var __VLS_50;
/** @type {[typeof ConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent(ConfirmDialog, new ConfirmDialog({
    ...{ 'onConfirm': {} },
    ...{ 'onCancel': {} },
    open: (__VLS_ctx.showRecalcConfirm),
    title: "Trigger Recalculation",
    description: "This will recalculate all metric values based on the latest definitions. This may take some time depending on the data volume.",
    confirmLabel: (__VLS_ctx.recalculating ? 'Processing...' : 'Recalculate'),
}));
const __VLS_56 = __VLS_55({
    ...{ 'onConfirm': {} },
    ...{ 'onCancel': {} },
    open: (__VLS_ctx.showRecalcConfirm),
    title: "Trigger Recalculation",
    description: "This will recalculate all metric values based on the latest definitions. This may take some time depending on the data volume.",
    confirmLabel: (__VLS_ctx.recalculating ? 'Processing...' : 'Recalculate'),
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
let __VLS_58;
let __VLS_59;
let __VLS_60;
const __VLS_61 = {
    onConfirm: (__VLS_ctx.handleRecalc)
};
const __VLS_62 = {
    onCancel: (...[$event]) => {
        __VLS_ctx.showRecalcConfirm = false;
    }
};
var __VLS_57;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted)/0.5)]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-600']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted)/0.3)]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['italic']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
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
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
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
            ChevronDown: ChevronDown,
            ChevronRight: ChevronRight,
            Lock: Lock,
            RefreshCw: RefreshCw,
            Clock: Clock,
            PageHeader: PageHeader,
            StatusChip: StatusChip,
            ErrorState: ErrorState,
            LoadingSpinner: LoadingSpinner,
            ConfirmDialog: ConfirmDialog,
            definitions: definitions,
            loading: loading,
            error: error,
            refetch: refetch,
            calcJobs: calcJobs,
            jobsLoading: jobsLoading,
            expandedDefs: expandedDefs,
            toggleExpand: toggleExpand,
            showDefModal: showDefModal,
            defForm: defForm,
            savingDef: savingDef,
            openCreateDef: openCreateDef,
            handleCreateDef: handleCreateDef,
            showVersionModal: showVersionModal,
            versionForm: versionForm,
            savingVersion: savingVersion,
            openAddVersion: openAddVersion,
            handleCreateVersion: handleCreateVersion,
            showRecalcConfirm: showRecalcConfirm,
            recalculating: recalculating,
            handleRecalc: handleRecalc,
            jobStatusVariant: jobStatusVariant,
            relativeTime: relativeTime,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
