<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import * as notificationsApi from '@/api/endpoints/notifications.api';
import * as messagingApi from '@/api/endpoints/messaging.api';
import {
  FileText,
  Moon,
  ShieldBan,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  Mail,
  Bell,
  MessageSquare,
} from 'lucide-vue-next';

const { toast } = useToast();

// ── Active Tab ───────────────────────────────────────────────────────

const activeSection = ref<'templates' | 'quiet-hours' | 'blacklist'>('templates');

const sections = [
  { key: 'templates' as const, label: 'Templates', icon: FileText },
  { key: 'quiet-hours' as const, label: 'Quiet Hours', icon: Moon },
  { key: 'blacklist' as const, label: 'Blacklist', icon: ShieldBan },
];

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

const {
  data: templatesRaw,
  loading: templatesLoading,
  error: templatesError,
  refetch: refetchTemplates,
} = useApiQuery<any>(() => notificationsApi.getTemplates());

const templates = computed(() => {
  if (!templatesRaw.value) return [];
  const raw = templatesRaw.value;
  return raw.data ?? raw ?? [];
});

// Edit template
const editingTemplateId = ref<string | null>(null);
const editTemplateLoading = ref(false);
const editTemplateForm = reactive({
  slug: '',
  name: '',
  subjectTpl: '',
  bodyTpl: '',
  channel: 'email' as string,
});

function startEditTemplate(tpl: any) {
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
  if (!editingTemplateId.value) return;
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
  } catch (err: any) {
    toast.error('Failed to update template', err.message);
  } finally {
    editTemplateLoading.value = false;
  }
}

// Template Preview
const previewTemplateId = ref<string | null>(null);
const previewVars = ref('{}');
const previewResult = ref<any>(null);
const previewLoading = ref(false);

function openPreview(tpl: any) {
  previewTemplateId.value = tpl.id;
  previewVars.value = '{\n  "displayName": "John Doe",\n  "communityName": "Sunset Ridge"\n}';
  previewResult.value = null;
}

function closePreview() {
  previewTemplateId.value = null;
  previewResult.value = null;
}

async function renderPreview() {
  if (!previewTemplateId.value) return;
  previewLoading.value = true;
  try {
    let vars: Record<string, any> = {};
    try {
      vars = JSON.parse(previewVars.value);
    } catch {
      toast.warning('Invalid JSON for variables');
      previewLoading.value = false;
      return;
    }
    const response = await notificationsApi.previewTemplate({
      templateId: previewTemplateId.value,
      variables: vars,
    });
    previewResult.value = response.data?.data ?? response.data;
  } catch (err: any) {
    toast.error('Preview failed', err.message);
  } finally {
    previewLoading.value = false;
  }
}

function channelIcon(channel: string) {
  const map: Record<string, any> = {
    email: Mail,
    push: Bell,
    sms: MessageSquare,
  };
  return map[channel] ?? Bell;
}

// ═══════════════════════════════════════════════════════════════════════
// QUIET HOURS
// ═══════════════════════════════════════════════════════════════════════

const {
  data: quietHoursRaw,
  loading: quietHoursLoading,
  error: quietHoursError,
  refetch: refetchQuietHours,
} = useApiQuery<any>(() => messagingApi.getQuietHours());

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
  } catch (err: any) {
    toast.error('Failed to update quiet hours', err.message);
  } finally {
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

function formatHour(h: number): string {
  if (h === 0) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

// ═══════════════════════════════════════════════════════════════════════
// BLACKLIST
// ═══════════════════════════════════════════════════════════════════════

const {
  data: blacklistRaw,
  loading: blacklistLoading,
  error: blacklistError,
  refetch: refetchBlacklist,
} = useApiQuery<any>(() => messagingApi.getBlacklist());

const blacklist = computed(() => {
  if (!blacklistRaw.value) return [];
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
  } catch (err: any) {
    toast.error('Failed to add to blacklist', err.message);
  } finally {
    addingBlacklist.value = false;
  }
}

async function removeFromBlacklist(item: any) {
  try {
    await messagingApi.removeFromBlacklist(item.id);
    toast.success('Address removed from blacklist');
    refetchBlacklist();
  } catch (err: any) {
    toast.error('Failed to remove', err.message);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="System Settings"
      description="Manage notification templates, quiet hours, and messaging blacklist."
    />

    <!-- Section Tabs -->
    <div class="border-b border-[hsl(var(--border))]">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="section in sections"
          :key="section.key"
          :class="[
            'group inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
            activeSection === section.key
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]',
          ]"
          @click="activeSection = section.key"
        >
          <component
            :is="section.icon"
            :class="[
              'h-4 w-4',
              activeSection === section.key
                ? 'text-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]',
            ]"
          />
          {{ section.label }}
        </button>
      </nav>
    </div>

    <!-- ─── Templates Section ──────────────────────────────────────── -->
    <div v-if="activeSection === 'templates'" class="space-y-4">
      <div v-if="templatesLoading && !templatesRaw" class="py-12">
        <LoadingSpinner size="lg" />
      </div>
      <ErrorState v-else-if="templatesError" :message="templatesError" :on-retry="refetchTemplates" />
      <EmptyState
        v-else-if="templates.length === 0"
        title="No templates"
        description="No notification templates have been configured yet."
        :icon="FileText"
      />

      <div v-else class="space-y-4">
        <div
          v-for="tpl in templates"
          :key="tpl.id"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
        >
          <!-- Template Header -->
          <div class="flex items-center justify-between px-5 py-3 bg-[hsl(var(--muted)/0.5)]">
            <div class="flex items-center gap-3">
              <component
                :is="channelIcon(tpl.channel)"
                class="h-4 w-4 text-[hsl(var(--muted-foreground))]"
              />
              <div>
                <h4 class="text-sm font-medium text-[hsl(var(--foreground))]">
                  {{ tpl.name }}
                </h4>
                <p class="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                  {{ tpl.slug }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                {{ tpl.channel }}
              </span>
              <button
                v-if="editingTemplateId !== tpl.id"
                class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                title="Edit"
                @click="startEditTemplate(tpl)"
              >
                <Edit3 class="h-4 w-4" />
              </button>
              <button
                v-if="editingTemplateId !== tpl.id"
                class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                title="Preview"
                @click="openPreview(tpl)"
              >
                <Eye class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Edit Form -->
          <div v-if="editingTemplateId === tpl.id" class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Slug (readonly)</label>
              <input
                :value="editTemplateForm.slug"
                type="text"
                disabled
                class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] cursor-not-allowed"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Name</label>
              <input
                v-model="editTemplateForm.name"
                type="text"
                class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Subject Template</label>
              <input
                v-model="editTemplateForm.subjectTpl"
                type="text"
                class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Body Template</label>
              <textarea
                v-model="editTemplateForm.bodyTpl"
                rows="6"
                class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-y"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Channel</label>
              <select
                v-model="editTemplateForm.channel"
                class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App</option>
              </select>
            </div>
            <div class="flex justify-end gap-3">
              <button
                class="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                @click="cancelEditTemplate"
              >
                Cancel
              </button>
              <button
                :disabled="editTemplateLoading"
                class="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                @click="saveTemplate"
              >
                <LoadingSpinner v-if="editTemplateLoading" size="sm" />
                <Save v-else class="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>

          <!-- View Mode (collapsed) -->
          <div v-else class="px-5 py-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p class="truncate"><span class="font-medium text-[hsl(var(--foreground))]">Subject:</span> {{ tpl.subjectTpl ?? tpl.subject ?? '--' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Quiet Hours Section ────────────────────────────────────── -->
    <div v-if="activeSection === 'quiet-hours'" class="space-y-4">
      <div v-if="quietHoursLoading && !quietHoursRaw" class="py-12">
        <LoadingSpinner size="lg" />
      </div>
      <ErrorState v-else-if="quietHoursError" :message="quietHoursError" :on-retry="refetchQuietHours" />

      <div v-else class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div class="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-indigo-100 p-2">
              <Moon class="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-[hsl(var(--foreground))]">Quiet Hours Configuration</h3>
              <p class="text-xs text-[hsl(var(--muted-foreground))]">
                Notifications will not be sent during quiet hours.
              </p>
            </div>
          </div>
          <button
            v-if="!editingQuietHours"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
            @click="startEditQuietHours"
          >
            <Edit3 class="h-3.5 w-3.5" />
            Edit
          </button>
        </div>

        <!-- View Mode -->
        <div v-if="!editingQuietHours" class="p-5">
          <div v-if="quietHours" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Start</p>
              <p class="text-lg font-semibold text-[hsl(var(--foreground))]">
                {{ formatHour(quietHours.startHour ?? 22) }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">End</p>
              <p class="text-lg font-semibold text-[hsl(var(--foreground))]">
                {{ formatHour(quietHours.endHour ?? 7) }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Timezone</p>
              <p class="text-lg font-semibold text-[hsl(var(--foreground))]">
                {{ quietHours.timezone ?? 'Not set' }}
              </p>
            </div>
          </div>
          <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
            No quiet hours configured. Click Edit to set up.
          </p>
        </div>

        <!-- Edit Mode -->
        <div v-else class="p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Start Hour</label>
              <select
                v-model.number="quietHoursForm.startHour"
                class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                <option v-for="h in 24" :key="h - 1" :value="h - 1">
                  {{ formatHour(h - 1) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">End Hour</label>
              <select
                v-model.number="quietHoursForm.endHour"
                class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                <option v-for="h in 24" :key="h - 1" :value="h - 1">
                  {{ formatHour(h - 1) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Timezone</label>
              <select
                v-model="quietHoursForm.timezone"
                class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <button
              class="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              @click="editingQuietHours = false"
            >
              Cancel
            </button>
            <button
              :disabled="quietHoursSaving"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              @click="saveQuietHours"
            >
              <LoadingSpinner v-if="quietHoursSaving" size="sm" />
              <Save v-else class="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Blacklist Section ──────────────────────────────────────── -->
    <div v-if="activeSection === 'blacklist'" class="space-y-4">
      <div v-if="blacklistLoading && !blacklistRaw" class="py-12">
        <LoadingSpinner size="lg" />
      </div>
      <ErrorState v-else-if="blacklistError" :message="blacklistError" :on-retry="refetchBlacklist" />

      <template v-else>
        <!-- Add form -->
        <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <h3 class="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Add Address to Blacklist</h3>
          <div class="flex gap-3">
            <input
              v-model="newBlacklistAddress"
              type="text"
              placeholder="email@example.com or phone number"
              class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              @keyup.enter="addToBlacklist"
            />
            <button
              :disabled="addingBlacklist || !newBlacklistAddress.trim()"
              class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              @click="addToBlacklist"
            >
              <LoadingSpinner v-if="addingBlacklist" size="sm" />
              <Plus v-else class="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <!-- Blacklist entries -->
        <EmptyState
          v-if="blacklist.length === 0"
          title="Blacklist is empty"
          description="No addresses are currently blacklisted. Add an address above to prevent messages from being sent to it."
          :icon="ShieldBan"
        />

        <div v-else class="rounded-lg border border-[hsl(var(--border))] divide-y divide-[hsl(var(--border))]">
          <div
            v-for="item in blacklist"
            :key="item.id"
            class="flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--muted)/0.5)] transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-[hsl(var(--foreground))]">{{ item.address ?? item.email ?? item.value }}</p>
              <p v-if="item.reason" class="text-xs text-[hsl(var(--muted-foreground))]">{{ item.reason }}</p>
              <p v-if="item.createdAt" class="text-xs text-[hsl(var(--muted-foreground))]">
                Added {{ item.createdAt }}
              </p>
            </div>
            <button
              class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Remove from blacklist"
              @click="removeFromBlacklist(item)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Template Preview Dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="previewTemplateId"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/50" @click="closePreview" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 z-10 max-h-[80vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">Template Preview</h3>
              <button
                class="rounded p-1 hover:bg-[hsl(var(--accent))] transition-colors"
                @click="closePreview"
              >
                <X class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
                  Variables (JSON)
                </label>
                <textarea
                  v-model="previewVars"
                  rows="4"
                  class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-y"
                />
              </div>

              <button
                :disabled="previewLoading"
                class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                @click="renderPreview"
              >
                <LoadingSpinner v-if="previewLoading" size="sm" />
                <Eye v-else class="h-4 w-4" />
                Render Preview
              </button>

              <div v-if="previewResult" class="space-y-3">
                <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] p-4">
                  <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                    Subject
                  </p>
                  <p class="text-sm text-[hsl(var(--foreground))]">
                    {{ previewResult.subject ?? previewResult.subjectTpl ?? '--' }}
                  </p>
                </div>
                <div class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] p-4">
                  <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                    Body
                  </p>
                  <pre class="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap font-sans">{{ previewResult.body ?? previewResult.bodyTpl ?? '--' }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
