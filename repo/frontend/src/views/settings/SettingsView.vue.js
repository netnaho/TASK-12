import { ref, computed, reactive } from 'vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import * as notificationsApi from '@/api/endpoints/notifications.api';
import * as messagingApi from '@/api/endpoints/messaging.api';
import { FileText, Moon, ShieldBan, Edit3, Save, X, Plus, Trash2, Eye, Mail, Bell, MessageSquare, } from 'lucide-vue-next';
const { toast } = useToast();
// ── Active Tab ───────────────────────────────────────────────────────
const activeSection = ref('templates');
const sections = [
    { key: 'templates', label: 'Templates', icon: FileText },
    { key: 'quiet-hours', label: 'Quiet Hours', icon: Moon },
    { key: 'blacklist', label: 'Blacklist', icon: ShieldBan },
];
// ═══════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════
const { data: templatesRaw, loading: templatesLoading, error: templatesError, refetch: refetchTemplates, } = useApiQuery(() => notificationsApi.getTemplates());
const templates = computed(() => {
    if (!templatesRaw.value)
        return [];
    const raw = templatesRaw.value;
    return raw.data ?? raw ?? [];
});
// Edit template
const editingTemplateId = ref(null);
const editTemplateLoading = ref(false);
const editTemplateForm = reactive({
    slug: '',
    name: '',
    subjectTpl: '',
    bodyTpl: '',
    channel: 'email',
});
function startEditTemplate(tpl) {
    editingTemplateId.value = tpl.id;
    editTemplateForm.slug = tpl.slug ?? '';
    editTemplateForm.name = tpl.name ?? '';
    editTemplateForm.subjectTpl = tpl.subjectTpl ?? tpl.subject ?? '';
    editTemplateForm.bodyTpl = tpl.bodyTpl ?? tpl.body ?? '';
    editTemplateForm.channel = tpl.channel ?? 'email';
}
function cancelEditTemplate() {
    editingTemplateId.value = null;
}
async function saveTemplate() {
    if (!editingTemplateId.value)
        return;
    editTemplateLoading.value = true;
    try {
        await notificationsApi.updateTemplate(editingTemplateId.value, {
            name: editTemplateForm.name,
            subjectTpl: editTemplateForm.subjectTpl,
            bodyTpl: editTemplateForm.bodyTpl,
            channel: editTemplateForm.channel,
        });
        toast.success('Template updated');
        editingTemplateId.value = null;
        refetchTemplates();
    }
    catch (err) {
        toast.error('Failed to update template', err.message);
    }
    finally {
        editTemplateLoading.value = false;
    }
}
// Template Preview
const previewTemplateId = ref(null);
const previewVars = ref('{}');
const previewResult = ref(null);
const previewLoading = ref(false);
function openPreview(tpl) {
    previewTemplateId.value = tpl.id;
    previewVars.value = '{\n  "displayName": "John Doe",\n  "communityName": "Sunset Ridge"\n}';
    previewResult.value = null;
}
function closePreview() {
    previewTemplateId.value = null;
    previewResult.value = null;
}
async function renderPreview() {
    if (!previewTemplateId.value)
        return;
    previewLoading.value = true;
    try {
        let vars = {};
        try {
            vars = JSON.parse(previewVars.value);
        }
        catch {
            toast.warning('Invalid JSON for variables');
            previewLoading.value = false;
            return;
        }
        const response = await notificationsApi.previewTemplate({
            templateId: previewTemplateId.value,
            variables: vars,
        });
        previewResult.value = response.data?.data ?? response.data;
    }
    catch (err) {
        toast.error('Preview failed', err.message);
    }
    finally {
        previewLoading.value = false;
    }
}
function channelIcon(channel) {
    const map = {
        email: Mail,
        push: Bell,
        sms: MessageSquare,
    };
    return map[channel] ?? Bell;
}
// ═══════════════════════════════════════════════════════════════════════
// QUIET HOURS
// ═══════════════════════════════════════════════════════════════════════
const { data: quietHoursRaw, loading: quietHoursLoading, error: quietHoursError, refetch: refetchQuietHours, } = useApiQuery(() => messagingApi.getQuietHours());
const quietHours = computed(() => quietHoursRaw.value ?? null);
const editingQuietHours = ref(false);
const quietHoursForm = reactive({
    startHour: 22,
    endHour: 7,
    timezone: 'America/New_York',
});
const quietHoursSaving = ref(false);
function startEditQuietHours() {
    if (quietHours.value) {
        quietHoursForm.startHour = quietHours.value.startHour ?? 22;
        quietHoursForm.endHour = quietHours.value.endHour ?? 7;
        quietHoursForm.timezone = quietHours.value.timezone ?? 'America/New_York';
    }
    editingQuietHours.value = true;
}
async function saveQuietHours() {
    quietHoursSaving.value = true;
    try {
        await messagingApi.updateQuietHours({
            startHour: quietHoursForm.startHour,
            endHour: quietHoursForm.endHour,
            timezone: quietHoursForm.timezone,
        });
        toast.success('Quiet hours updated');
        editingQuietHours.value = false;
        refetchQuietHours();
    }
    catch (err) {
        toast.error('Failed to update quiet hours', err.message);
    }
    finally {
        quietHoursSaving.value = false;
    }
}
const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Pacific/Honolulu',
    'UTC',
];
function formatHour(h) {
    if (h === 0)
        return '12:00 AM';
    if (h === 12)
        return '12:00 PM';
    if (h < 12)
        return `${h}:00 AM`;
    return `${h - 12}:00 PM`;
}
// ═══════════════════════════════════════════════════════════════════════
// BLACKLIST
// ═══════════════════════════════════════════════════════════════════════
const { data: blacklistRaw, loading: blacklistLoading, error: blacklistError, refetch: refetchBlacklist, } = useApiQuery(() => messagingApi.getBlacklist());
const blacklist = computed(() => {
    if (!blacklistRaw.value)
        return [];
    const raw = blacklistRaw.value;
    return raw.data ?? raw ?? [];
});
const newBlacklistAddress = ref('');
const addingBlacklist = ref(false);
async function addToBlacklist() {
    const addr = newBlacklistAddress.value.trim();
    if (!addr) {
        toast.warning('Enter an address to blacklist');
        return;
    }
    addingBlacklist.value = true;
    try {
        await messagingApi.addToBlacklist({ address: addr });
        toast.success('Address added to blacklist');
        newBlacklistAddress.value = '';
        refetchBlacklist();
    }
    catch (err) {
        toast.error('Failed to add to blacklist', err.message);
    }
    finally {
        addingBlacklist.value = false;
    }
}
async function removeFromBlacklist(item) {
    try {
        await messagingApi.removeFromBlacklist(item.id);
        toast.success('Address removed from blacklist');
        refetchBlacklist();
    }
    catch (err) {
        toast.error('Failed to remove', err.message);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-6" },
});
/** @type {[typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: "System Settings",
    description: "Manage notification templates, quiet hours, and messaging blacklist.",
}));
const __VLS_1 = __VLS_0({
    title: "System Settings",
    description: "Manage notification templates, quiet hours, and messaging blacklist.",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "border-b border-[hsl(var(--border))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "-mb-px flex space-x-8" },
});
for (const [section] of __VLS_getVForSourceType((__VLS_ctx.sections))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activeSection = section.key;
            } },
        key: (section.key),
        ...{ class: ([
                'group inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                __VLS_ctx.activeSection === section.key
                    ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]',
            ]) },
    });
    const __VLS_3 = ((section.icon));
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ class: ([
                'h-4 w-4',
                __VLS_ctx.activeSection === section.key
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]',
            ]) },
    }));
    const __VLS_5 = __VLS_4({
        ...{ class: ([
                'h-4 w-4',
                __VLS_ctx.activeSection === section.key
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]',
            ]) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    (section.label);
}
if (__VLS_ctx.activeSection === 'templates') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    if (__VLS_ctx.templatesLoading && !__VLS_ctx.templatesRaw) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "py-12" },
        });
        /** @type {[typeof LoadingSpinner, ]} */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
            size: "lg",
        }));
        const __VLS_8 = __VLS_7({
            size: "lg",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    }
    else if (__VLS_ctx.templatesError) {
        /** @type {[typeof ErrorState, ]} */ ;
        // @ts-ignore
        const __VLS_10 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
            message: (__VLS_ctx.templatesError),
            onRetry: (__VLS_ctx.refetchTemplates),
        }));
        const __VLS_11 = __VLS_10({
            message: (__VLS_ctx.templatesError),
            onRetry: (__VLS_ctx.refetchTemplates),
        }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    }
    else if (__VLS_ctx.templates.length === 0) {
        /** @type {[typeof EmptyState, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(EmptyState, new EmptyState({
            title: "No templates",
            description: "No notification templates have been configured yet.",
            icon: (__VLS_ctx.FileText),
        }));
        const __VLS_14 = __VLS_13({
            title: "No templates",
            description: "No notification templates have been configured yet.",
            icon: (__VLS_ctx.FileText),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-4" },
        });
        for (const [tpl] of __VLS_getVForSourceType((__VLS_ctx.templates))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (tpl.id),
                ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center justify-between px-5 py-3 bg-[hsl(var(--muted)/0.5)]" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center gap-3" },
            });
            const __VLS_16 = ((__VLS_ctx.channelIcon(tpl.channel)));
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                ...{ class: "h-4 w-4 text-[hsl(var(--muted-foreground))]" },
            }));
            const __VLS_18 = __VLS_17({
                ...{ class: "h-4 w-4 text-[hsl(var(--muted-foreground))]" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
                ...{ class: "text-sm font-medium text-[hsl(var(--foreground))]" },
            });
            (tpl.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs text-[hsl(var(--muted-foreground))] font-mono" },
            });
            (tpl.slug);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center gap-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "inline-flex items-center rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]" },
            });
            (tpl.channel);
            if (__VLS_ctx.editingTemplateId !== tpl.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.activeSection === 'templates'))
                                return;
                            if (!!(__VLS_ctx.templatesLoading && !__VLS_ctx.templatesRaw))
                                return;
                            if (!!(__VLS_ctx.templatesError))
                                return;
                            if (!!(__VLS_ctx.templates.length === 0))
                                return;
                            if (!(__VLS_ctx.editingTemplateId !== tpl.id))
                                return;
                            __VLS_ctx.startEditTemplate(tpl);
                        } },
                    ...{ class: "rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors" },
                    title: "Edit",
                });
                const __VLS_20 = {}.Edit3;
                /** @type {[typeof __VLS_components.Edit3, ]} */ ;
                // @ts-ignore
                const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                    ...{ class: "h-4 w-4" },
                }));
                const __VLS_22 = __VLS_21({
                    ...{ class: "h-4 w-4" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            }
            if (__VLS_ctx.editingTemplateId !== tpl.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.activeSection === 'templates'))
                                return;
                            if (!!(__VLS_ctx.templatesLoading && !__VLS_ctx.templatesRaw))
                                return;
                            if (!!(__VLS_ctx.templatesError))
                                return;
                            if (!!(__VLS_ctx.templates.length === 0))
                                return;
                            if (!(__VLS_ctx.editingTemplateId !== tpl.id))
                                return;
                            __VLS_ctx.openPreview(tpl);
                        } },
                    ...{ class: "rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors" },
                    title: "Preview",
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
            if (__VLS_ctx.editingTemplateId === tpl.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "p-5 space-y-4" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    value: (__VLS_ctx.editTemplateForm.slug),
                    type: "text",
                    disabled: true,
                    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] cursor-not-allowed" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    value: (__VLS_ctx.editTemplateForm.name),
                    type: "text",
                    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    value: (__VLS_ctx.editTemplateForm.subjectTpl),
                    type: "text",
                    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                    value: (__VLS_ctx.editTemplateForm.bodyTpl),
                    rows: "6",
                    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-y" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.editTemplateForm.channel),
                    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "email",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "push",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "sms",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "in_app",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "flex justify-end gap-3" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.cancelEditTemplate) },
                    ...{ class: "rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.saveTemplate) },
                    disabled: (__VLS_ctx.editTemplateLoading),
                    ...{ class: "inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
                });
                if (__VLS_ctx.editTemplateLoading) {
                    /** @type {[typeof LoadingSpinner, ]} */ ;
                    // @ts-ignore
                    const __VLS_28 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
                        size: "sm",
                    }));
                    const __VLS_29 = __VLS_28({
                        size: "sm",
                    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
                }
                else {
                    const __VLS_31 = {}.Save;
                    /** @type {[typeof __VLS_components.Save, ]} */ ;
                    // @ts-ignore
                    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
                        ...{ class: "h-3.5 w-3.5" },
                    }));
                    const __VLS_33 = __VLS_32({
                        ...{ class: "h-3.5 w-3.5" },
                    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
                }
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "px-5 py-3 text-sm text-[hsl(var(--muted-foreground))]" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "truncate" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "font-medium text-[hsl(var(--foreground))]" },
                });
                (tpl.subjectTpl ?? tpl.subject ?? '--');
            }
        }
    }
}
if (__VLS_ctx.activeSection === 'quiet-hours') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    if (__VLS_ctx.quietHoursLoading && !__VLS_ctx.quietHoursRaw) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "py-12" },
        });
        /** @type {[typeof LoadingSpinner, ]} */ ;
        // @ts-ignore
        const __VLS_35 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
            size: "lg",
        }));
        const __VLS_36 = __VLS_35({
            size: "lg",
        }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    }
    else if (__VLS_ctx.quietHoursError) {
        /** @type {[typeof ErrorState, ]} */ ;
        // @ts-ignore
        const __VLS_38 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
            message: (__VLS_ctx.quietHoursError),
            onRetry: (__VLS_ctx.refetchQuietHours),
        }));
        const __VLS_39 = __VLS_38({
            message: (__VLS_ctx.quietHoursError),
            onRetry: (__VLS_ctx.refetchQuietHours),
        }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "px-5 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-full bg-indigo-100 p-2" },
        });
        const __VLS_41 = {}.Moon;
        /** @type {[typeof __VLS_components.Moon, ]} */ ;
        // @ts-ignore
        const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
            ...{ class: "h-5 w-5 text-indigo-600" },
        }));
        const __VLS_43 = __VLS_42({
            ...{ class: "h-5 w-5 text-indigo-600" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_42));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-sm font-semibold text-[hsl(var(--foreground))]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-xs text-[hsl(var(--muted-foreground))]" },
        });
        if (!__VLS_ctx.editingQuietHours) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.startEditQuietHours) },
                ...{ class: "inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
            });
            const __VLS_45 = {}.Edit3;
            /** @type {[typeof __VLS_components.Edit3, ]} */ ;
            // @ts-ignore
            const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
                ...{ class: "h-3.5 w-3.5" },
            }));
            const __VLS_47 = __VLS_46({
                ...{ class: "h-3.5 w-3.5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_46));
        }
        if (!__VLS_ctx.editingQuietHours) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "p-5" },
            });
            if (__VLS_ctx.quietHours) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "grid grid-cols-1 sm:grid-cols-3 gap-6" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
                });
                (__VLS_ctx.formatHour(__VLS_ctx.quietHours.startHour ?? 22));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
                });
                (__VLS_ctx.formatHour(__VLS_ctx.quietHours.endHour ?? 7));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
                });
                (__VLS_ctx.quietHours.timezone ?? 'Not set');
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
                });
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "p-5 space-y-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "grid grid-cols-1 sm:grid-cols-3 gap-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.quietHoursForm.startHour),
                ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
            });
            for (const [h] of __VLS_getVForSourceType((24))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (h - 1),
                    value: (h - 1),
                });
                (__VLS_ctx.formatHour(h - 1));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.quietHoursForm.endHour),
                ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
            });
            for (const [h] of __VLS_getVForSourceType((24))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (h - 1),
                    value: (h - 1),
                });
                (__VLS_ctx.formatHour(h - 1));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.quietHoursForm.timezone),
                ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
            });
            for (const [tz] of __VLS_getVForSourceType((__VLS_ctx.timezones))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (tz),
                    value: (tz),
                });
                (tz);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex justify-end gap-3" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeSection === 'quiet-hours'))
                            return;
                        if (!!(__VLS_ctx.quietHoursLoading && !__VLS_ctx.quietHoursRaw))
                            return;
                        if (!!(__VLS_ctx.quietHoursError))
                            return;
                        if (!!(!__VLS_ctx.editingQuietHours))
                            return;
                        __VLS_ctx.editingQuietHours = false;
                    } },
                ...{ class: "rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.saveQuietHours) },
                disabled: (__VLS_ctx.quietHoursSaving),
                ...{ class: "inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
            });
            if (__VLS_ctx.quietHoursSaving) {
                /** @type {[typeof LoadingSpinner, ]} */ ;
                // @ts-ignore
                const __VLS_49 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
                    size: "sm",
                }));
                const __VLS_50 = __VLS_49({
                    size: "sm",
                }, ...__VLS_functionalComponentArgsRest(__VLS_49));
            }
            else {
                const __VLS_52 = {}.Save;
                /** @type {[typeof __VLS_components.Save, ]} */ ;
                // @ts-ignore
                const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
                    ...{ class: "h-3.5 w-3.5" },
                }));
                const __VLS_54 = __VLS_53({
                    ...{ class: "h-3.5 w-3.5" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            }
        }
    }
}
if (__VLS_ctx.activeSection === 'blacklist') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    if (__VLS_ctx.blacklistLoading && !__VLS_ctx.blacklistRaw) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "py-12" },
        });
        /** @type {[typeof LoadingSpinner, ]} */ ;
        // @ts-ignore
        const __VLS_56 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
            size: "lg",
        }));
        const __VLS_57 = __VLS_56({
            size: "lg",
        }, ...__VLS_functionalComponentArgsRest(__VLS_56));
    }
    else if (__VLS_ctx.blacklistError) {
        /** @type {[typeof ErrorState, ]} */ ;
        // @ts-ignore
        const __VLS_59 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
            message: (__VLS_ctx.blacklistError),
            onRetry: (__VLS_ctx.refetchBlacklist),
        }));
        const __VLS_60 = __VLS_59({
            message: (__VLS_ctx.blacklistError),
            onRetry: (__VLS_ctx.refetchBlacklist),
        }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-sm font-semibold text-[hsl(var(--foreground))] mb-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onKeyup: (__VLS_ctx.addToBlacklist) },
            value: (__VLS_ctx.newBlacklistAddress),
            type: "text",
            placeholder: "email@example.com or phone number",
            ...{ class: "flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.addToBlacklist) },
            disabled: (__VLS_ctx.addingBlacklist || !__VLS_ctx.newBlacklistAddress.trim()),
            ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
        });
        if (__VLS_ctx.addingBlacklist) {
            /** @type {[typeof LoadingSpinner, ]} */ ;
            // @ts-ignore
            const __VLS_62 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
                size: "sm",
            }));
            const __VLS_63 = __VLS_62({
                size: "sm",
            }, ...__VLS_functionalComponentArgsRest(__VLS_62));
        }
        else {
            const __VLS_65 = {}.Plus;
            /** @type {[typeof __VLS_components.Plus, ]} */ ;
            // @ts-ignore
            const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
                ...{ class: "h-4 w-4" },
            }));
            const __VLS_67 = __VLS_66({
                ...{ class: "h-4 w-4" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_66));
        }
        if (__VLS_ctx.blacklist.length === 0) {
            /** @type {[typeof EmptyState, ]} */ ;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent(EmptyState, new EmptyState({
                title: "Blacklist is empty",
                description: "No addresses are currently blacklisted. Add an address above to prevent messages from being sent to it.",
                icon: (__VLS_ctx.ShieldBan),
            }));
            const __VLS_70 = __VLS_69({
                title: "Blacklist is empty",
                description: "No addresses are currently blacklisted. Add an address above to prevent messages from being sent to it.",
                icon: (__VLS_ctx.ShieldBan),
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "rounded-lg border border-[hsl(var(--border))] divide-y divide-[hsl(var(--border))]" },
            });
            for (const [item] of __VLS_getVForSourceType((__VLS_ctx.blacklist))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (item.id),
                    ...{ class: "flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--muted)/0.5)] transition-colors" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-sm font-medium text-[hsl(var(--foreground))]" },
                });
                (item.address ?? item.email ?? item.value);
                if (item.reason) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "text-xs text-[hsl(var(--muted-foreground))]" },
                    });
                    (item.reason);
                }
                if (item.createdAt) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                        ...{ class: "text-xs text-[hsl(var(--muted-foreground))]" },
                    });
                    (item.createdAt);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.activeSection === 'blacklist'))
                                return;
                            if (!!(__VLS_ctx.blacklistLoading && !__VLS_ctx.blacklistRaw))
                                return;
                            if (!!(__VLS_ctx.blacklistError))
                                return;
                            if (!!(__VLS_ctx.blacklist.length === 0))
                                return;
                            __VLS_ctx.removeFromBlacklist(item);
                        } },
                    ...{ class: "rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-red-100 hover:text-red-600 transition-colors" },
                    title: "Remove from blacklist",
                });
                const __VLS_72 = {}.Trash2;
                /** @type {[typeof __VLS_components.Trash2, ]} */ ;
                // @ts-ignore
                const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
                    ...{ class: "h-4 w-4" },
                }));
                const __VLS_74 = __VLS_73({
                    ...{ class: "h-4 w-4" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_73));
            }
        }
    }
}
const __VLS_76 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    to: "body",
}));
const __VLS_78 = __VLS_77({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    name: "modal",
}));
const __VLS_82 = __VLS_81({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
if (__VLS_ctx.previewTemplateId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closePreview) },
        ...{ class: "absolute inset-0 bg-black/50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 z-10 max-h-[80vh] overflow-y-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between mb-5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closePreview) },
        ...{ class: "rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    const __VLS_84 = {}.X;
    /** @type {[typeof __VLS_components.X, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }));
    const __VLS_86 = __VLS_85({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.previewVars),
        rows: "4",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-y" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.renderPreview) },
        disabled: (__VLS_ctx.previewLoading),
        ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
    });
    if (__VLS_ctx.previewLoading) {
        /** @type {[typeof LoadingSpinner, ]} */ ;
        // @ts-ignore
        const __VLS_88 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
            size: "sm",
        }));
        const __VLS_89 = __VLS_88({
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_88));
    }
    else {
        const __VLS_91 = {}.Eye;
        /** @type {[typeof __VLS_components.Eye, ]} */ ;
        // @ts-ignore
        const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_93 = __VLS_92({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_92));
    }
    if (__VLS_ctx.previewResult) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] p-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-[hsl(var(--foreground))]" },
        });
        (__VLS_ctx.previewResult.subject ?? __VLS_ctx.previewResult.subjectTpl ?? '--');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] p-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
            ...{ class: "text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap font-sans" },
        });
        (__VLS_ctx.previewResult.body ?? __VLS_ctx.previewResult.bodyTpl ?? '--');
    }
}
var __VLS_83;
var __VLS_79;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['-mb-px']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-8']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['px-5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted)/0.5)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-y']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['px-5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--card))]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted)/0.5)]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-100']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
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
/** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-4']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-[80vh]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-y']} */ ;
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
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted)/0.5)]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted)/0.5)]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-pre-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PageHeader: PageHeader,
            LoadingSpinner: LoadingSpinner,
            ErrorState: ErrorState,
            EmptyState: EmptyState,
            FileText: FileText,
            Moon: Moon,
            ShieldBan: ShieldBan,
            Edit3: Edit3,
            Save: Save,
            X: X,
            Plus: Plus,
            Trash2: Trash2,
            Eye: Eye,
            activeSection: activeSection,
            sections: sections,
            templatesRaw: templatesRaw,
            templatesLoading: templatesLoading,
            templatesError: templatesError,
            refetchTemplates: refetchTemplates,
            templates: templates,
            editingTemplateId: editingTemplateId,
            editTemplateLoading: editTemplateLoading,
            editTemplateForm: editTemplateForm,
            startEditTemplate: startEditTemplate,
            cancelEditTemplate: cancelEditTemplate,
            saveTemplate: saveTemplate,
            previewTemplateId: previewTemplateId,
            previewVars: previewVars,
            previewResult: previewResult,
            previewLoading: previewLoading,
            openPreview: openPreview,
            closePreview: closePreview,
            renderPreview: renderPreview,
            channelIcon: channelIcon,
            quietHoursRaw: quietHoursRaw,
            quietHoursLoading: quietHoursLoading,
            quietHoursError: quietHoursError,
            refetchQuietHours: refetchQuietHours,
            quietHours: quietHours,
            editingQuietHours: editingQuietHours,
            quietHoursForm: quietHoursForm,
            quietHoursSaving: quietHoursSaving,
            startEditQuietHours: startEditQuietHours,
            saveQuietHours: saveQuietHours,
            timezones: timezones,
            formatHour: formatHour,
            blacklistRaw: blacklistRaw,
            blacklistLoading: blacklistLoading,
            blacklistError: blacklistError,
            refetchBlacklist: refetchBlacklist,
            blacklist: blacklist,
            newBlacklistAddress: newBlacklistAddress,
            addingBlacklist: addingBlacklist,
            addToBlacklist: addToBlacklist,
            removeFromBlacklist: removeFromBlacklist,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
