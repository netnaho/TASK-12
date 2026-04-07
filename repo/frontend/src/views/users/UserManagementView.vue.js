import { ref, computed, watch } from 'vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import * as usersApi from '@/api/endpoints/users.api';
import { Role, roleLabels, roleColors } from '@/types/roles';
import { formatDate } from '@/utils/format';
import { Plus, UserPlus, Edit3, Shield, UserX, X, Search, Users, Eye, EyeOff, Check, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, } from 'lucide-vue-next';
const { toast } = useToast();
const { page, pageSize, total, totalPages, setTotal } = usePagination(20);
// ── Filters ──────────────────────────────────────────────────────────
const searchQuery = ref('');
const filterRole = ref('');
const filterStatus = ref('all');
// ── Users Data ───────────────────────────────────────────────────────
const { data: usersRaw, loading, error, refetch, } = useApiQuery(() => usersApi.getUsers({
    page: page.value,
    pageSize: pageSize.value,
    search: searchQuery.value || undefined,
    role: filterRole.value || undefined,
    isActive: filterStatus.value === 'all' ? undefined : filterStatus.value === 'active',
}));
const users = computed(() => {
    if (!usersRaw.value)
        return [];
    const raw = usersRaw.value;
    if (raw.meta)
        setTotal(raw.meta.total ?? 0);
    return raw.data ?? raw ?? [];
});
const columns = [
    { key: 'username', label: 'Username' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'email', label: 'Email' },
    { key: 'roles', label: 'Role(s)' },
    { key: 'isActive', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    { key: 'actions', label: '' },
];
// Debounced search
let searchTimeout = null;
watch(searchQuery, () => {
    if (searchTimeout)
        clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        page.value = 1;
        refetch();
    }, 400);
});
watch([filterRole, filterStatus], () => {
    page.value = 1;
    refetch();
});
// ── Expanded Row ─────────────────────────────────────────────────────
const expandedUserId = ref(null);
function toggleExpand(userId) {
    expandedUserId.value = expandedUserId.value === userId ? null : userId;
}
// ── Create User Dialog ───────────────────────────────────────────────
const createDialogOpen = ref(false);
const createLoading = ref(false);
const showPassword = ref(false);
const createForm = ref({
    username: '',
    email: '',
    password: '',
    displayName: '',
    employeeId: '',
    role: '',
});
const passwordChecks = computed(() => {
    const p = createForm.value.password;
    return {
        length: p.length >= 8,
        uppercase: /[A-Z]/.test(p),
        lowercase: /[a-z]/.test(p),
        number: /[0-9]/.test(p),
        special: /[^A-Za-z0-9]/.test(p),
    };
});
const passwordValid = computed(() => Object.values(passwordChecks.value).every(Boolean));
function openCreateDialog() {
    createForm.value = {
        username: '',
        email: '',
        password: '',
        displayName: '',
        employeeId: '',
        role: '',
    };
    showPassword.value = false;
    createDialogOpen.value = true;
}
async function submitCreate() {
    const f = createForm.value;
    if (!f.username.trim() || !f.email.trim() || !f.password) {
        toast.warning('Username, email, and password are required');
        return;
    }
    if (!passwordValid.value) {
        toast.warning('Password does not meet requirements');
        return;
    }
    createLoading.value = true;
    try {
        const payload = {
            username: f.username,
            email: f.email,
            password: f.password,
        };
        if (f.displayName)
            payload.displayName = f.displayName;
        if (f.employeeId)
            payload.employeeId = f.employeeId;
        const response = await usersApi.createUser(payload);
        const newUser = response.data?.data ?? response.data;
        // Assign role if selected
        if (f.role && newUser?.id) {
            await usersApi.assignRole(newUser.id, { role: f.role });
        }
        toast.success('User created successfully');
        createDialogOpen.value = false;
        refetch();
    }
    catch (err) {
        toast.error('Failed to create user', err.message);
    }
    finally {
        createLoading.value = false;
    }
}
// ── Edit User Dialog ─────────────────────────────────────────────────
const editDialogOpen = ref(false);
const editLoading = ref(false);
const editForm = ref({ id: '', displayName: '', email: '', employeeId: '' });
function openEditDialog(user) {
    editForm.value = {
        id: user.id,
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        employeeId: user.employeeId ?? '',
    };
    editDialogOpen.value = true;
}
async function submitEdit() {
    editLoading.value = true;
    try {
        await usersApi.updateUser(editForm.value.id, {
            displayName: editForm.value.displayName || undefined,
            email: editForm.value.email || undefined,
            employeeId: editForm.value.employeeId || undefined,
        });
        toast.success('User updated');
        editDialogOpen.value = false;
        refetch();
    }
    catch (err) {
        toast.error('Failed to update user', err.message);
    }
    finally {
        editLoading.value = false;
    }
}
// ── Assign Role Dialog ───────────────────────────────────────────────
const roleDialogOpen = ref(false);
const roleDialogUserId = ref('');
const roleDialogUserName = ref('');
const roleDialogRole = ref('');
const roleLoading = ref(false);
function openRoleDialog(user) {
    roleDialogUserId.value = user.id;
    roleDialogUserName.value = user.displayName || user.username;
    roleDialogRole.value = '';
    roleDialogOpen.value = true;
}
async function submitRole() {
    if (!roleDialogRole.value) {
        toast.warning('Select a role');
        return;
    }
    roleLoading.value = true;
    try {
        await usersApi.assignRole(roleDialogUserId.value, { role: roleDialogRole.value });
        toast.success('Role assigned');
        roleDialogOpen.value = false;
        refetch();
    }
    catch (err) {
        toast.error('Failed to assign role', err.message);
    }
    finally {
        roleLoading.value = false;
    }
}
// ── Deactivate Confirmation ──────────────────────────────────────────
const deactivateDialogOpen = ref(false);
const deactivateUser = ref(null);
function openDeactivateDialog(user) {
    deactivateUser.value = user;
    deactivateDialogOpen.value = true;
}
async function confirmDeactivate() {
    if (!deactivateUser.value)
        return;
    try {
        await usersApi.deactivateUser(deactivateUser.value.id);
        toast.success('User deactivated');
        deactivateDialogOpen.value = false;
        refetch();
    }
    catch (err) {
        toast.error('Failed to deactivate user', err.message);
    }
}
// ── Helpers ──────────────────────────────────────────────────────────
const allRoles = Object.values(Role);
function getRoleLabel(role) {
    return roleLabels[role] ?? role;
}
function getRoleColor(role) {
    return roleColors[role] ?? 'bg-gray-100 text-gray-800';
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
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: "User Management",
    description: "Manage system users, roles, and access.",
}));
const __VLS_1 = __VLS_0({
    title: "User Management",
    description: "Manage system users, roles, and access.",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openCreateDialog) },
        ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity" },
    });
    const __VLS_3 = {}.UserPlus;
    /** @type {[typeof __VLS_components.UserPlus, ]} */ ;
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
    ...{ class: "flex flex-col sm:flex-row gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative flex-1" },
});
const __VLS_7 = {}.Search;
/** @type {[typeof __VLS_components.Search, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
    ...{ class: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" },
}));
const __VLS_9 = __VLS_8({
    ...{ class: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" },
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "Search by name or email...",
    ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filterRole),
    ...{ class: "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [role] of __VLS_getVForSourceType((__VLS_ctx.allRoles))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (role),
        value: (role),
    });
    (__VLS_ctx.getRoleLabel(role));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex rounded-lg border border-[hsl(var(--border))] overflow-hidden" },
});
for (const [status] of __VLS_getVForSourceType(['all', 'active', 'inactive'])) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.filterStatus = status;
            } },
        key: (status),
        ...{ class: ([
                'px-3 py-2 text-sm font-medium transition-colors',
                __VLS_ctx.filterStatus === status
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
            ]) },
    });
    (status.charAt(0).toUpperCase() + status.slice(1));
}
if (__VLS_ctx.loading && !__VLS_ctx.usersRaw) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-12" },
    });
    /** @type {[typeof LoadingSpinner, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
        size: "lg",
    }));
    const __VLS_12 = __VLS_11({
        size: "lg",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
}
else if (__VLS_ctx.error) {
    /** @type {[typeof ErrorState, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(ErrorState, new ErrorState({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }));
    const __VLS_15 = __VLS_14({
        message: (__VLS_ctx.error),
        onRetry: (__VLS_ctx.refetch),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
}
else if (__VLS_ctx.users.length === 0) {
    /** @type {[typeof EmptyState, typeof EmptyState, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(EmptyState, new EmptyState({
        title: "No users found",
        description: "No users match your current filters. Try adjusting your search or create a new user.",
        icon: (__VLS_ctx.Users),
    }));
    const __VLS_18 = __VLS_17({
        title: "No users found",
        description: "No users match your current filters. Try adjusting your search or create a new user.",
        icon: (__VLS_ctx.Users),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    {
        const { action: __VLS_thisSlot } = __VLS_19.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.openCreateDialog) },
            ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity" },
        });
        const __VLS_20 = {}.Plus;
        /** @type {[typeof __VLS_components.Plus, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_22 = __VLS_21({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    }
    var __VLS_19;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overflow-x-auto rounded-lg border border-[hsl(var(--border))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
        ...{ class: "w-full text-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        ...{ class: "border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th)({
        ...{ class: "px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] w-8" },
    });
    for (const [col] of __VLS_getVForSourceType((__VLS_ctx.columns))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
            key: (col.key),
            ...{ class: "px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]" },
        });
        (col.label);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    for (const [user] of __VLS_getVForSourceType((__VLS_ctx.users))) {
        (user.id);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading && !__VLS_ctx.usersRaw))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.users.length === 0))
                        return;
                    __VLS_ctx.toggleExpand(user.id);
                } },
            ...{ class: "border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors cursor-pointer" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-3" },
        });
        if (__VLS_ctx.expandedUserId !== user.id) {
            const __VLS_24 = {}.ChevronDown;
            /** @type {[typeof __VLS_components.ChevronDown, ]} */ ;
            // @ts-ignore
            const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
                ...{ class: "h-4 w-4 text-[hsl(var(--muted-foreground))]" },
            }));
            const __VLS_26 = __VLS_25({
                ...{ class: "h-4 w-4 text-[hsl(var(--muted-foreground))]" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        }
        else {
            const __VLS_28 = {}.ChevronUp;
            /** @type {[typeof __VLS_components.ChevronUp, ]} */ ;
            // @ts-ignore
            const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
                ...{ class: "h-4 w-4 text-[hsl(var(--foreground))]" },
            }));
            const __VLS_30 = __VLS_29({
                ...{ class: "h-4 w-4 text-[hsl(var(--foreground))]" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-3 font-medium text-[hsl(var(--foreground))]" },
        });
        (user.username);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-3 text-[hsl(var(--foreground))]" },
        });
        (user.displayName ?? '--');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-3 text-[hsl(var(--foreground))]" },
        });
        (user.email);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex flex-wrap gap-1" },
        });
        for (const [role] of __VLS_getVForSourceType(((user.roles ?? [])))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: (role),
                ...{ class: ([
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        __VLS_ctx.getRoleColor(role),
                    ]) },
            });
            (__VLS_ctx.getRoleLabel(role));
        }
        if (!user.roles?.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-[hsl(var(--muted-foreground))] text-xs" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-3" },
        });
        /** @type {[typeof StatusChip, ]} */ ;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(StatusChip, new StatusChip({
            variant: (user.isActive !== false ? 'success' : 'neutral'),
            label: (user.isActive !== false ? 'Active' : 'Inactive'),
        }));
        const __VLS_33 = __VLS_32({
            variant: (user.isActive !== false ? 'success' : 'neutral'),
            label: (user.isActive !== false ? 'Active' : 'Inactive'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-3 text-[hsl(var(--foreground))]" },
        });
        (user.createdAt ? __VLS_ctx.formatDate(user.createdAt) : '--');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "px-4 py-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: () => { } },
            ...{ class: "flex items-center gap-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading && !__VLS_ctx.usersRaw))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.users.length === 0))
                        return;
                    __VLS_ctx.openEditDialog(user);
                } },
            ...{ class: "rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors" },
            title: "Edit",
        });
        const __VLS_35 = {}.Edit3;
        /** @type {[typeof __VLS_components.Edit3, ]} */ ;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_37 = __VLS_36({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_36));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading && !__VLS_ctx.usersRaw))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.users.length === 0))
                        return;
                    __VLS_ctx.openRoleDialog(user);
                } },
            ...{ class: "rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors" },
            title: "Assign Role",
        });
        const __VLS_39 = {}.Shield;
        /** @type {[typeof __VLS_components.Shield, ]} */ ;
        // @ts-ignore
        const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_41 = __VLS_40({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_40));
        if (user.isActive !== false) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading && !__VLS_ctx.usersRaw))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.users.length === 0))
                            return;
                        if (!(user.isActive !== false))
                            return;
                        __VLS_ctx.openDeactivateDialog(user);
                    } },
                ...{ class: "rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-red-600 transition-colors" },
                title: "Deactivate",
            });
            const __VLS_43 = {}.UserX;
            /** @type {[typeof __VLS_components.UserX, ]} */ ;
            // @ts-ignore
            const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
                ...{ class: "h-4 w-4" },
            }));
            const __VLS_45 = __VLS_44({
                ...{ class: "h-4 w-4" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        }
        if (__VLS_ctx.expandedUserId === user.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                colspan: (__VLS_ctx.columns.length + 1),
                ...{ class: "bg-[hsl(var(--muted)/0.3)] px-8 py-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-[hsl(var(--foreground))] font-mono text-xs" },
            });
            (user.id);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-[hsl(var(--foreground))]" },
            });
            (user.employeeId ?? '--');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-[hsl(var(--foreground))]" },
            });
            (user.updatedAt ? __VLS_ctx.formatDate(user.updatedAt, 'MMM d, yyyy HH:mm') : '--');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex flex-wrap gap-1" },
            });
            for (const [role] of __VLS_getVForSourceType(((user.roles ?? [])))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (role),
                    ...{ class: ([
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            __VLS_ctx.getRoleColor(role),
                        ]) },
                });
                (__VLS_ctx.getRoleLabel(role));
            }
            if (!user.roles?.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "text-[hsl(var(--muted-foreground))]" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-[hsl(var(--foreground))]" },
            });
            (user.createdAt ? __VLS_ctx.formatDate(user.createdAt, 'MMM d, yyyy HH:mm') : '--');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1" },
            });
            /** @type {[typeof StatusChip, ]} */ ;
            // @ts-ignore
            const __VLS_47 = __VLS_asFunctionalComponent(StatusChip, new StatusChip({
                variant: (user.isActive !== false ? 'success' : 'neutral'),
                label: (user.isActive !== false ? 'Active' : 'Inactive'),
            }));
            const __VLS_48 = __VLS_47({
                variant: (user.isActive !== false ? 'success' : 'neutral'),
                label: (user.isActive !== false ? 'Active' : 'Inactive'),
            }, ...__VLS_functionalComponentArgsRest(__VLS_47));
        }
    }
    if (__VLS_ctx.totalPages > 1) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-between" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-[hsl(var(--muted-foreground))]" },
        });
        (__VLS_ctx.page);
        (__VLS_ctx.totalPages);
        (__VLS_ctx.total);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading && !__VLS_ctx.usersRaw))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.users.length === 0))
                        return;
                    if (!(__VLS_ctx.totalPages > 1))
                        return;
                    __VLS_ctx.page--;
                    __VLS_ctx.refetch();
                } },
            disabled: (__VLS_ctx.page <= 1),
            ...{ class: "inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50" },
        });
        const __VLS_50 = {}.ChevronLeft;
        /** @type {[typeof __VLS_components.ChevronLeft, ]} */ ;
        // @ts-ignore
        const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_52 = __VLS_51({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_51));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading && !__VLS_ctx.usersRaw))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.users.length === 0))
                        return;
                    if (!(__VLS_ctx.totalPages > 1))
                        return;
                    __VLS_ctx.page++;
                    __VLS_ctx.refetch();
                } },
            disabled: (__VLS_ctx.page >= __VLS_ctx.totalPages),
            ...{ class: "inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50" },
        });
        const __VLS_54 = {}.ChevronRight;
        /** @type {[typeof __VLS_components.ChevronRight, ]} */ ;
        // @ts-ignore
        const __VLS_55 = __VLS_asFunctionalComponent(__VLS_54, new __VLS_54({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_56 = __VLS_55({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_55));
    }
}
const __VLS_58 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({
    to: "body",
}));
const __VLS_60 = __VLS_59({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_59));
__VLS_61.slots.default;
const __VLS_62 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_63 = __VLS_asFunctionalComponent(__VLS_62, new __VLS_62({
    name: "modal",
}));
const __VLS_64 = __VLS_63({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_63));
__VLS_65.slots.default;
if (__VLS_ctx.createDialogOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.createDialogOpen))
                    return;
                __VLS_ctx.createDialogOpen = false;
            } },
        ...{ class: "absolute inset-0 bg-black/50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between mb-5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.createDialogOpen))
                    return;
                __VLS_ctx.createDialogOpen = false;
            } },
        ...{ class: "rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    const __VLS_66 = {}.X;
    /** @type {[typeof __VLS_components.X, ]} */ ;
    // @ts-ignore
    const __VLS_67 = __VLS_asFunctionalComponent(__VLS_66, new __VLS_66({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }));
    const __VLS_68 = __VLS_67({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_67));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.createForm.username),
        type: "text",
        placeholder: "jdoe",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.createForm.displayName),
        type: "text",
        placeholder: "John Doe",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "email",
        placeholder: "john.doe@example.com",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    (__VLS_ctx.createForm.email);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: (__VLS_ctx.showPassword ? 'text' : 'password'),
        placeholder: "Secure password",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    (__VLS_ctx.createForm.password);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.createDialogOpen))
                    return;
                __VLS_ctx.showPassword = !__VLS_ctx.showPassword;
            } },
        type: "button",
        ...{ class: "absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" },
    });
    if (__VLS_ctx.showPassword) {
        const __VLS_70 = {}.EyeOff;
        /** @type {[typeof __VLS_components.EyeOff, ]} */ ;
        // @ts-ignore
        const __VLS_71 = __VLS_asFunctionalComponent(__VLS_70, new __VLS_70({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_72 = __VLS_71({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    }
    else {
        const __VLS_74 = {}.Eye;
        /** @type {[typeof __VLS_components.Eye, ]} */ ;
        // @ts-ignore
        const __VLS_75 = __VLS_asFunctionalComponent(__VLS_74, new __VLS_74({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_76 = __VLS_75({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_75));
    }
    if (__VLS_ctx.createForm.password) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-2 space-y-1" },
        });
        for (const [passed, key] of __VLS_getVForSourceType((__VLS_ctx.passwordChecks))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (key),
                ...{ class: "flex items-center gap-1.5 text-xs" },
            });
            if (passed) {
                const __VLS_78 = {}.Check;
                /** @type {[typeof __VLS_components.Check, ]} */ ;
                // @ts-ignore
                const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
                    ...{ class: "h-3.5 w-3.5 text-green-600" },
                }));
                const __VLS_80 = __VLS_79({
                    ...{ class: "h-3.5 w-3.5 text-green-600" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_79));
            }
            else {
                const __VLS_82 = {}.AlertCircle;
                /** @type {[typeof __VLS_components.AlertCircle, ]} */ ;
                // @ts-ignore
                const __VLS_83 = __VLS_asFunctionalComponent(__VLS_82, new __VLS_82({
                    ...{ class: "h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" },
                }));
                const __VLS_84 = __VLS_83({
                    ...{ class: "h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_83));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (passed ? 'text-green-700' : 'text-[hsl(var(--muted-foreground))]') },
            });
            (key === 'length' ? 'At least 8 characters' :
                key === 'uppercase' ? 'One uppercase letter' :
                    key === 'lowercase' ? 'One lowercase letter' :
                        key === 'number' ? 'One number' :
                            'One special character');
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.createForm.employeeId),
        type: "text",
        placeholder: "EMP-001",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.createForm.role),
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [role] of __VLS_getVForSourceType((__VLS_ctx.allRoles))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (role),
            value: (role),
        });
        (__VLS_ctx.getRoleLabel(role));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-6 flex justify-end gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.createDialogOpen))
                    return;
                __VLS_ctx.createDialogOpen = false;
            } },
        ...{ class: "rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.submitCreate) },
        disabled: (__VLS_ctx.createLoading),
        ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
    });
    if (__VLS_ctx.createLoading) {
        /** @type {[typeof LoadingSpinner, ]} */ ;
        // @ts-ignore
        const __VLS_86 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
            size: "sm",
        }));
        const __VLS_87 = __VLS_86({
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    }
    else {
        const __VLS_89 = {}.UserPlus;
        /** @type {[typeof __VLS_components.UserPlus, ]} */ ;
        // @ts-ignore
        const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_91 = __VLS_90({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_90));
    }
}
var __VLS_65;
var __VLS_61;
const __VLS_93 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
    to: "body",
}));
const __VLS_95 = __VLS_94({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_94));
__VLS_96.slots.default;
const __VLS_97 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
    name: "modal",
}));
const __VLS_99 = __VLS_98({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_98));
__VLS_100.slots.default;
if (__VLS_ctx.editDialogOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.editDialogOpen))
                    return;
                __VLS_ctx.editDialogOpen = false;
            } },
        ...{ class: "absolute inset-0 bg-black/50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between mb-5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.editDialogOpen))
                    return;
                __VLS_ctx.editDialogOpen = false;
            } },
        ...{ class: "rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    const __VLS_101 = {}.X;
    /** @type {[typeof __VLS_components.X, ]} */ ;
    // @ts-ignore
    const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }));
    const __VLS_103 = __VLS_102({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_102));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editForm.displayName),
        type: "text",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "email",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    (__VLS_ctx.editForm.email);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-[hsl(var(--foreground))] mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.editForm.employeeId),
        type: "text",
        ...{ class: "w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-6 flex justify-end gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.editDialogOpen))
                    return;
                __VLS_ctx.editDialogOpen = false;
            } },
        ...{ class: "rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.submitEdit) },
        disabled: (__VLS_ctx.editLoading),
        ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
    });
    if (__VLS_ctx.editLoading) {
        /** @type {[typeof LoadingSpinner, ]} */ ;
        // @ts-ignore
        const __VLS_105 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
            size: "sm",
        }));
        const __VLS_106 = __VLS_105({
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    }
}
var __VLS_100;
var __VLS_96;
const __VLS_108 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    to: "body",
}));
const __VLS_110 = __VLS_109({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
const __VLS_112 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    name: "modal",
}));
const __VLS_114 = __VLS_113({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
__VLS_115.slots.default;
if (__VLS_ctx.roleDialogOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.roleDialogOpen))
                    return;
                __VLS_ctx.roleDialogOpen = false;
            } },
        ...{ class: "absolute inset-0 bg-black/50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between mb-5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold text-[hsl(var(--foreground))]" },
    });
    (__VLS_ctx.roleDialogUserName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.roleDialogOpen))
                    return;
                __VLS_ctx.roleDialogOpen = false;
            } },
        ...{ class: "rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    const __VLS_116 = {}.X;
    /** @type {[typeof __VLS_components.X, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }));
    const __VLS_118 = __VLS_117({
        ...{ class: "h-5 w-5 text-[hsl(var(--muted-foreground))]" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-2" },
    });
    for (const [role] of __VLS_getVForSourceType((__VLS_ctx.allRoles))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            key: (role),
            ...{ class: ([
                    'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                    __VLS_ctx.roleDialogRole === role
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]'
                        : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent)/0.5)]',
                ]) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "radio",
            value: (role),
            ...{ class: "h-4 w-4 text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]" },
        });
        (__VLS_ctx.roleDialogRole);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm font-medium text-[hsl(var(--foreground))]" },
        });
        (__VLS_ctx.getRoleLabel(role));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-xs text-[hsl(var(--muted-foreground))]" },
        });
        (role);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-6 flex justify-end gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.roleDialogOpen))
                    return;
                __VLS_ctx.roleDialogOpen = false;
            } },
        ...{ class: "rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.submitRole) },
        disabled: (__VLS_ctx.roleLoading || !__VLS_ctx.roleDialogRole),
        ...{ class: "inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50" },
    });
    if (__VLS_ctx.roleLoading) {
        /** @type {[typeof LoadingSpinner, ]} */ ;
        // @ts-ignore
        const __VLS_120 = __VLS_asFunctionalComponent(LoadingSpinner, new LoadingSpinner({
            size: "sm",
        }));
        const __VLS_121 = __VLS_120({
            size: "sm",
        }, ...__VLS_functionalComponentArgsRest(__VLS_120));
    }
    else {
        const __VLS_123 = {}.Shield;
        /** @type {[typeof __VLS_components.Shield, ]} */ ;
        // @ts-ignore
        const __VLS_124 = __VLS_asFunctionalComponent(__VLS_123, new __VLS_123({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_125 = __VLS_124({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_124));
    }
}
var __VLS_115;
var __VLS_111;
/** @type {[typeof ConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_127 = __VLS_asFunctionalComponent(ConfirmDialog, new ConfirmDialog({
    ...{ 'onConfirm': {} },
    ...{ 'onCancel': {} },
    open: (__VLS_ctx.deactivateDialogOpen),
    title: "Deactivate User",
    description: (`Are you sure you want to deactivate ${__VLS_ctx.deactivateUser?.displayName || __VLS_ctx.deactivateUser?.username || 'this user'}? They will no longer be able to log in.`),
    confirmLabel: "Deactivate",
    variant: "danger",
}));
const __VLS_128 = __VLS_127({
    ...{ 'onConfirm': {} },
    ...{ 'onCancel': {} },
    open: (__VLS_ctx.deactivateDialogOpen),
    title: "Deactivate User",
    description: (`Are you sure you want to deactivate ${__VLS_ctx.deactivateUser?.displayName || __VLS_ctx.deactivateUser?.username || 'this user'}? They will no longer be able to log in.`),
    confirmLabel: "Deactivate",
    variant: "danger",
}, ...__VLS_functionalComponentArgsRest(__VLS_127));
let __VLS_130;
let __VLS_131;
let __VLS_132;
const __VLS_133 = {
    onConfirm: (__VLS_ctx.confirmDeactivate)
};
const __VLS_134 = {
    onCancel: (...[$event]) => {
        __VLS_ctx.deactivateDialogOpen = false;
    }
};
var __VLS_129;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
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
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-3']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-9']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
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
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--muted)/0.5)]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
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
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--muted)/0.3)]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
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
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-[hsl(var(--accent))]']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
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
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
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
/** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-4']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-[90vh]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
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
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[hsl(var(--border))]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[hsl(var(--background))]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['placeholder:text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
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
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
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
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--primary))]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-[hsl(var(--ring))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[hsl(var(--muted-foreground))]']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PageHeader: PageHeader,
            StatusChip: StatusChip,
            LoadingSpinner: LoadingSpinner,
            ErrorState: ErrorState,
            EmptyState: EmptyState,
            ConfirmDialog: ConfirmDialog,
            formatDate: formatDate,
            Plus: Plus,
            UserPlus: UserPlus,
            Edit3: Edit3,
            Shield: Shield,
            UserX: UserX,
            X: X,
            Search: Search,
            Users: Users,
            Eye: Eye,
            EyeOff: EyeOff,
            Check: Check,
            AlertCircle: AlertCircle,
            ChevronLeft: ChevronLeft,
            ChevronRight: ChevronRight,
            ChevronDown: ChevronDown,
            ChevronUp: ChevronUp,
            page: page,
            total: total,
            totalPages: totalPages,
            searchQuery: searchQuery,
            filterRole: filterRole,
            filterStatus: filterStatus,
            usersRaw: usersRaw,
            loading: loading,
            error: error,
            refetch: refetch,
            users: users,
            columns: columns,
            expandedUserId: expandedUserId,
            toggleExpand: toggleExpand,
            createDialogOpen: createDialogOpen,
            createLoading: createLoading,
            showPassword: showPassword,
            createForm: createForm,
            passwordChecks: passwordChecks,
            openCreateDialog: openCreateDialog,
            submitCreate: submitCreate,
            editDialogOpen: editDialogOpen,
            editLoading: editLoading,
            editForm: editForm,
            openEditDialog: openEditDialog,
            submitEdit: submitEdit,
            roleDialogOpen: roleDialogOpen,
            roleDialogUserName: roleDialogUserName,
            roleDialogRole: roleDialogRole,
            roleLoading: roleLoading,
            openRoleDialog: openRoleDialog,
            submitRole: submitRole,
            deactivateDialogOpen: deactivateDialogOpen,
            deactivateUser: deactivateUser,
            openDeactivateDialog: openDeactivateDialog,
            confirmDeactivate: confirmDeactivate,
            allRoles: allRoles,
            getRoleLabel: getRoleLabel,
            getRoleColor: getRoleColor,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
