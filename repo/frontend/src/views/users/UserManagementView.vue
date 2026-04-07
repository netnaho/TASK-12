<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import DataTable from '@/components/shared/DataTable.vue';
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
import {
  Plus,
  UserPlus,
  Edit3,
  Shield,
  UserX,
  X,
  Search,
  Users,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next';

const { toast } = useToast();
const { page, pageSize, total, totalPages, setTotal } = usePagination(20);

// ── Filters ──────────────────────────────────────────────────────────

const searchQuery = ref('');
const filterRole = ref('');
const filterStatus = ref<'all' | 'active' | 'inactive'>('all');

// ── Users Data ───────────────────────────────────────────────────────

const {
  data: usersRaw,
  loading,
  error,
  refetch,
} = useApiQuery<any>(() =>
  usersApi.getUsers({
    page: page.value,
    pageSize: pageSize.value,
    search: searchQuery.value || undefined,
    role: filterRole.value || undefined,
    isActive: filterStatus.value === 'all' ? undefined : filterStatus.value === 'active',
  }),
);

const users = computed(() => {
  if (!usersRaw.value) return [];
  const raw = usersRaw.value;
  if (raw.meta) setTotal(raw.meta.total ?? 0);
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
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
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

const expandedUserId = ref<string | null>(null);

function toggleExpand(userId: string) {
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
  role: '' as string,
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

const passwordValid = computed(() =>
  Object.values(passwordChecks.value).every(Boolean),
);

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
    const payload: Record<string, any> = {
      username: f.username,
      email: f.email,
      password: f.password,
    };
    if (f.displayName) payload.displayName = f.displayName;
    if (f.employeeId) payload.employeeId = f.employeeId;

    const response = await usersApi.createUser(payload);
    const newUser = response.data?.data ?? response.data;

    // Assign role if selected
    if (f.role && newUser?.id) {
      await usersApi.assignRole(newUser.id, { role: f.role });
    }

    toast.success('User created successfully');
    createDialogOpen.value = false;
    refetch();
  } catch (err: any) {
    toast.error('Failed to create user', err.message);
  } finally {
    createLoading.value = false;
  }
}

// ── Edit User Dialog ─────────────────────────────────────────────────

const editDialogOpen = ref(false);
const editLoading = ref(false);
const editForm = ref({ id: '', displayName: '', email: '', employeeId: '' });

function openEditDialog(user: any) {
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
  } catch (err: any) {
    toast.error('Failed to update user', err.message);
  } finally {
    editLoading.value = false;
  }
}

// ── Assign Role Dialog ───────────────────────────────────────────────

const roleDialogOpen = ref(false);
const roleDialogUserId = ref('');
const roleDialogUserName = ref('');
const roleDialogRole = ref('');
const roleLoading = ref(false);

function openRoleDialog(user: any) {
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
  } catch (err: any) {
    toast.error('Failed to assign role', err.message);
  } finally {
    roleLoading.value = false;
  }
}

// ── Deactivate Confirmation ──────────────────────────────────────────

const deactivateDialogOpen = ref(false);
const deactivateUser = ref<any>(null);

function openDeactivateDialog(user: any) {
  deactivateUser.value = user;
  deactivateDialogOpen.value = true;
}

async function confirmDeactivate() {
  if (!deactivateUser.value) return;
  try {
    await usersApi.deactivateUser(deactivateUser.value.id);
    toast.success('User deactivated');
    deactivateDialogOpen.value = false;
    refetch();
  } catch (err: any) {
    toast.error('Failed to deactivate user', err.message);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

const allRoles = Object.values(Role);

function getRoleLabel(role: string): string {
  return roleLabels[role as Role] ?? role;
}

function getRoleColor(role: string): string {
  return roleColors[role as Role] ?? 'bg-gray-100 text-gray-800';
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="User Management"
      description="Manage system users, roles, and access."
    >
      <template #actions>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          @click="openCreateDialog"
        >
          <UserPlus class="h-4 w-4" />
          Create User
        </button>
      </template>
    </PageHeader>

    <!-- Filters Row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email..."
          class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
        />
      </div>
      <select
        v-model="filterRole"
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      >
        <option value="">All Roles</option>
        <option v-for="role in allRoles" :key="role" :value="role">
          {{ getRoleLabel(role) }}
        </option>
      </select>
      <div class="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <button
          v-for="status in (['all', 'active', 'inactive'] as const)"
          :key="status"
          :class="[
            'px-3 py-2 text-sm font-medium transition-colors',
            filterStatus === status
              ? 'bg-[hsl(var(--primary))] text-white'
              : 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
          ]"
          @click="filterStatus = status"
        >
          {{ status.charAt(0).toUpperCase() + status.slice(1) }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !usersRaw" class="py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error -->
    <ErrorState v-else-if="error" :message="error" :on-retry="refetch" />

    <!-- Empty -->
    <EmptyState
      v-else-if="users.length === 0"
      title="No users found"
      description="No users match your current filters. Try adjusting your search or create a new user."
      :icon="Users"
    >
      <template #action>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          @click="openCreateDialog"
        >
          <Plus class="h-4 w-4" />
          Create User
        </button>
      </template>
    </EmptyState>

    <!-- Data Table -->
    <template v-else>
      <div class="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
              <th class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] w-8" />
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="user in users" :key="user.id">
              <tr
                class="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors cursor-pointer"
                @click="toggleExpand(user.id)"
              >
                <td class="px-4 py-3">
                  <ChevronDown
                    v-if="expandedUserId !== user.id"
                    class="h-4 w-4 text-[hsl(var(--muted-foreground))]"
                  />
                  <ChevronUp
                    v-else
                    class="h-4 w-4 text-[hsl(var(--foreground))]"
                  />
                </td>
                <td class="px-4 py-3 font-medium text-[hsl(var(--foreground))]">
                  {{ user.username }}
                </td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">
                  {{ user.displayName ?? '--' }}
                </td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">
                  {{ user.email }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="role in (user.roles ?? [])"
                      :key="role"
                      :class="[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        getRoleColor(role),
                      ]"
                    >
                      {{ getRoleLabel(role) }}
                    </span>
                    <span
                      v-if="!user.roles?.length"
                      class="text-[hsl(var(--muted-foreground))] text-xs"
                    >
                      No role
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <StatusChip
                    :variant="user.isActive !== false ? 'success' : 'neutral'"
                    :label="user.isActive !== false ? 'Active' : 'Inactive'"
                  />
                </td>
                <td class="px-4 py-3 text-[hsl(var(--foreground))]">
                  {{ user.createdAt ? formatDate(user.createdAt) : '--' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1" @click.stop>
                    <button
                      class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                      title="Edit"
                      @click="openEditDialog(user)"
                    >
                      <Edit3 class="h-4 w-4" />
                    </button>
                    <button
                      class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                      title="Assign Role"
                      @click="openRoleDialog(user)"
                    >
                      <Shield class="h-4 w-4" />
                    </button>
                    <button
                      v-if="user.isActive !== false"
                      class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-red-600 transition-colors"
                      title="Deactivate"
                      @click="openDeactivateDialog(user)"
                    >
                      <UserX class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Expanded Detail Panel -->
              <tr v-if="expandedUserId === user.id">
                <td :colspan="columns.length + 1" class="bg-[hsl(var(--muted)/0.3)] px-8 py-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                        User ID
                      </p>
                      <p class="text-[hsl(var(--foreground))] font-mono text-xs">{{ user.id }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                        Employee ID
                      </p>
                      <p class="text-[hsl(var(--foreground))]">{{ user.employeeId ?? '--' }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                        Last Updated
                      </p>
                      <p class="text-[hsl(var(--foreground))]">
                        {{ user.updatedAt ? formatDate(user.updatedAt, 'MMM d, yyyy HH:mm') : '--' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                        Roles
                      </p>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="role in (user.roles ?? [])"
                          :key="role"
                          :class="[
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getRoleColor(role),
                          ]"
                        >
                          {{ getRoleLabel(role) }}
                        </span>
                        <span v-if="!user.roles?.length" class="text-[hsl(var(--muted-foreground))]">None assigned</span>
                      </div>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                        Created
                      </p>
                      <p class="text-[hsl(var(--foreground))]">
                        {{ user.createdAt ? formatDate(user.createdAt, 'MMM d, yyyy HH:mm') : '--' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                        Status
                      </p>
                      <StatusChip
                        :variant="user.isActive !== false ? 'success' : 'neutral'"
                        :label="user.isActive !== false ? 'Active' : 'Inactive'"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Page {{ page }} of {{ totalPages }} ({{ total }} total)
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="page <= 1"
            class="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50"
            @click="page--; refetch()"
          >
            <ChevronLeft class="h-4 w-4" />
            Previous
          </button>
          <button
            :disabled="page >= totalPages"
            class="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50"
            @click="page++; refetch()"
          >
            Next
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </template>

    <!-- Create User Dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="createDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="createDialogOpen = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">Create User</h3>
              <button
                class="rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors"
                @click="createDialogOpen = false"
              >
                <X class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Username *</label>
                  <input
                    v-model="createForm.username"
                    type="text"
                    placeholder="jdoe"
                    class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Display Name</label>
                  <input
                    v-model="createForm.displayName"
                    type="text"
                    placeholder="John Doe"
                    class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Email *</label>
                <input
                  v-model="createForm.email"
                  type="email"
                  placeholder="john.doe@example.com"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Password *</label>
                <div class="relative">
                  <input
                    v-model="createForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Secure password"
                    class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOff v-if="showPassword" class="h-4 w-4" />
                    <Eye v-else class="h-4 w-4" />
                  </button>
                </div>

                <!-- Password Requirements -->
                <div v-if="createForm.password" class="mt-2 space-y-1">
                  <div
                    v-for="(passed, key) in passwordChecks"
                    :key="key"
                    class="flex items-center gap-1.5 text-xs"
                  >
                    <Check
                      v-if="passed"
                      class="h-3.5 w-3.5 text-green-600"
                    />
                    <AlertCircle
                      v-else
                      class="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]"
                    />
                    <span :class="passed ? 'text-green-700' : 'text-[hsl(var(--muted-foreground))]'">
                      {{
                        key === 'length' ? 'At least 8 characters' :
                        key === 'uppercase' ? 'One uppercase letter' :
                        key === 'lowercase' ? 'One lowercase letter' :
                        key === 'number' ? 'One number' :
                        'One special character'
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Employee ID</label>
                <input
                  v-model="createForm.employeeId"
                  type="text"
                  placeholder="EMP-001"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Role</label>
                <select
                  v-model="createForm.role"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                >
                  <option value="">No role (assign later)</option>
                  <option v-for="role in allRoles" :key="role" :value="role">
                    {{ getRoleLabel(role) }}
                  </option>
                </select>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                @click="createDialogOpen = false"
              >
                Cancel
              </button>
              <button
                :disabled="createLoading"
                class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                @click="submitCreate"
              >
                <LoadingSpinner v-if="createLoading" size="sm" />
                <UserPlus v-else class="h-4 w-4" />
                Create User
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit User Dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="editDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="editDialogOpen = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">Edit User</h3>
              <button
                class="rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors"
                @click="editDialogOpen = false"
              >
                <X class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Display Name</label>
                <input
                  v-model="editForm.displayName"
                  type="text"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Email</label>
                <input
                  v-model="editForm.email"
                  type="email"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Employee ID</label>
                <input
                  v-model="editForm.employeeId"
                  type="text"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                @click="editDialogOpen = false"
              >
                Cancel
              </button>
              <button
                :disabled="editLoading"
                class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                @click="submitEdit"
              >
                <LoadingSpinner v-if="editLoading" size="sm" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Assign Role Dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="roleDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="roleDialogOpen = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">
                Assign Role to {{ roleDialogUserName }}
              </h3>
              <button
                class="rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors"
                @click="roleDialogOpen = false"
              >
                <X class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>

            <div class="space-y-2">
              <label
                v-for="role in allRoles"
                :key="role"
                :class="[
                  'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                  roleDialogRole === role
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]'
                    : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent)/0.5)]',
                ]"
              >
                <input
                  v-model="roleDialogRole"
                  type="radio"
                  :value="role"
                  class="h-4 w-4 text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
                />
                <div>
                  <p class="text-sm font-medium text-[hsl(var(--foreground))]">
                    {{ getRoleLabel(role) }}
                  </p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ role }}</p>
                </div>
              </label>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button
                class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                @click="roleDialogOpen = false"
              >
                Cancel
              </button>
              <button
                :disabled="roleLoading || !roleDialogRole"
                class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                @click="submitRole"
              >
                <LoadingSpinner v-if="roleLoading" size="sm" />
                <Shield v-else class="h-4 w-4" />
                Assign Role
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Deactivate Confirmation -->
    <ConfirmDialog
      :open="deactivateDialogOpen"
      title="Deactivate User"
      :description="`Are you sure you want to deactivate ${deactivateUser?.displayName || deactivateUser?.username || 'this user'}? They will no longer be able to log in.`"
      confirm-label="Deactivate"
      variant="danger"
      @confirm="confirmDeactivate"
      @cancel="deactivateDialogOpen = false"
    />
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
