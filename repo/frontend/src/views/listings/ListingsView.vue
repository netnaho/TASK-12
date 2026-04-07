<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { Plus, ChevronRight, ChevronDown, Building2, MapPin, Home } from 'lucide-vue-next';
import PageHeader from '@/components/shared/PageHeader.vue';
import DataTable from '@/components/shared/DataTable.vue';
import StatusChip from '@/components/shared/StatusChip.vue';
import ErrorState from '@/components/shared/ErrorState.vue';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';
import { useApiQuery } from '@/composables/useApiQuery';
import { useToast } from '@/composables/useToast';
import {
  getListings,
  createListing,
  getListingStats,
} from '@/api/endpoints/listings.api';
import {
  getRegions,
  getCommunities,
  getProperties,
  createRegion,
  createCommunity,
  createProperty,
} from '@/api/endpoints/communities.api';

interface Listing {
  id: string;
  unit: string;
  propertyName: string;
  communityName: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  rent: number;
  status: string;
  listedDate: string;
}

interface ListingStats {
  totalListings: number;
  averageRent: number;
  vacancyRate: number;
  avgDaysOnMarket: number;
}

interface Region {
  id: string;
  name: string;
}

interface Community {
  id: string;
  name: string;
  regionId: string;
}

interface Property {
  id: string;
  name: string;
  communityId: string;
  address: string;
}

const { toast } = useToast();
const activeTab = ref<'listings' | 'communities'>('listings');

// ---- LISTINGS TAB ----
const listingColumns = [
  { key: 'unit', label: 'Unit', sortable: true },
  { key: 'propertyName', label: 'Property' },
  { key: 'communityName', label: 'Community' },
  { key: 'bedrooms', label: 'Beds' },
  { key: 'bathrooms', label: 'Baths' },
  { key: 'sqft', label: 'Sqft' },
  { key: 'rent', label: 'Rent' },
  { key: 'status', label: 'Status' },
  { key: 'listedDate', label: 'Listed' },
];

// Filters
const propertyFilter = ref('');
const communityFilter = ref('');
const bedroomFilter = ref('');
const statusFilterVal = ref('');
const rentMin = ref('');
const rentMax = ref('');

const listingParams = computed(() => ({
  ...(propertyFilter.value && { propertyId: propertyFilter.value }),
  ...(communityFilter.value && { communityId: communityFilter.value }),
  ...(bedroomFilter.value && { bedrooms: bedroomFilter.value }),
  ...(statusFilterVal.value && { status: statusFilterVal.value }),
  ...(rentMin.value && { rentMin: rentMin.value }),
  ...(rentMax.value && { rentMax: rentMax.value }),
}));

const { data: listings, loading: listingsLoading, error: listingsError, refetch: refetchListings } =
  useApiQuery<Listing[]>(() => getListings(listingParams.value));

const { data: stats, refetch: refetchStats } = useApiQuery<ListingStats>(
  () => getListingStats(),
);

watch([propertyFilter, communityFilter, bedroomFilter, statusFilterVal, rentMin, rentMax], () => {
  refetchListings();
});

function listingStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    active: 'success',
    pending: 'warning',
    leased: 'info',
    inactive: 'neutral',
    expired: 'error',
  };
  return map[status?.toLowerCase()] ?? 'neutral';
}

// Add Listing Modal
const showListingModal = ref(false);
const listingForm = reactive({
  unit: '',
  propertyId: '',
  bedrooms: 1,
  bathrooms: 1,
  sqft: 500,
  rent: 1000,
});
const savingListing = ref(false);

function openAddListing() {
  listingForm.unit = '';
  listingForm.propertyId = '';
  listingForm.bedrooms = 1;
  listingForm.bathrooms = 1;
  listingForm.sqft = 500;
  listingForm.rent = 1000;
  showListingModal.value = true;
}

async function handleSaveListing() {
  savingListing.value = true;
  try {
    await createListing({ ...listingForm });
    toast.success('Listing created');
    showListingModal.value = false;
    refetchListings();
    refetchStats();
  } catch {
    toast.error('Failed to create listing');
  } finally {
    savingListing.value = false;
  }
}

// ---- COMMUNITIES TAB ----
const { data: regions, loading: regionsLoading, error: regionsError, refetch: refetchRegions } =
  useApiQuery<Region[]>(() => getRegions());

const { data: communities, refetch: refetchCommunities } =
  useApiQuery<Community[]>(() => getCommunities());

const { data: properties, refetch: refetchProperties } =
  useApiQuery<Property[]>(() => getProperties());

const expandedRegions = ref<Set<string>>(new Set());
const expandedCommunities = ref<Set<string>>(new Set());

function toggleRegion(id: string) {
  if (expandedRegions.value.has(id)) {
    expandedRegions.value.delete(id);
  } else {
    expandedRegions.value.add(id);
  }
}

function toggleCommunity(id: string) {
  if (expandedCommunities.value.has(id)) {
    expandedCommunities.value.delete(id);
  } else {
    expandedCommunities.value.add(id);
  }
}

function communitiesForRegion(regionId: string) {
  return (communities.value ?? []).filter((c) => c.regionId === regionId);
}

function propertiesForCommunity(communityId: string) {
  return (properties.value ?? []).filter((p) => p.communityId === communityId);
}

// Add Region Modal
const showRegionModal = ref(false);
const regionForm = reactive({ name: '' });
const savingRegion = ref(false);

async function handleSaveRegion() {
  savingRegion.value = true;
  try {
    await createRegion({ name: regionForm.name });
    toast.success('Region created');
    showRegionModal.value = false;
    refetchRegions();
  } catch {
    toast.error('Failed to create region');
  } finally {
    savingRegion.value = false;
  }
}

// Add Community Modal
const showCommunityModal = ref(false);
const communityForm = reactive({ name: '', regionId: '' });
const savingCommunity = ref(false);

function openAddCommunity(regionId?: string) {
  communityForm.name = '';
  communityForm.regionId = regionId ?? '';
  showCommunityModal.value = true;
}

async function handleSaveCommunity() {
  savingCommunity.value = true;
  try {
    await createCommunity({ ...communityForm });
    toast.success('Community created');
    showCommunityModal.value = false;
    refetchCommunities();
  } catch {
    toast.error('Failed to create community');
  } finally {
    savingCommunity.value = false;
  }
}

// Add Property Modal
const showPropertyModal = ref(false);
const propertyForm = reactive({ name: '', communityId: '', address: '' });
const savingProperty = ref(false);

function openAddProperty(communityId?: string) {
  propertyForm.name = '';
  propertyForm.communityId = communityId ?? '';
  propertyForm.address = '';
  showPropertyModal.value = true;
}

async function handleSaveProperty() {
  savingProperty.value = true;
  try {
    await createProperty({ ...propertyForm });
    toast.success('Property created');
    showPropertyModal.value = false;
    refetchProperties();
  } catch {
    toast.error('Failed to create property');
  } finally {
    savingProperty.value = false;
  }
}

const formattedListings = computed(() => {
  return (listings.value ?? []).map((l) => ({
    ...l,
    rent: `$${l.rent?.toLocaleString() ?? 0}`,
    listedDate: l.listedDate ? new Date(l.listedDate).toLocaleDateString() : '-',
  }));
});
</script>

<template>
  <div>
    <PageHeader title="Listings" description="Manage property listings and community hierarchy." />

    <!-- Tabs -->
    <div class="border-b border-[hsl(var(--border))] mb-6">
      <nav class="-mb-px flex gap-6">
        <button
          class="whitespace-nowrap border-b-2 pb-3 px-1 text-sm font-medium transition-colors"
          :class="activeTab === 'listings'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'"
          @click="activeTab = 'listings'"
        >
          Listings
        </button>
        <button
          class="whitespace-nowrap border-b-2 pb-3 px-1 text-sm font-medium transition-colors"
          :class="activeTab === 'communities'
            ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'"
          @click="activeTab = 'communities'"
        >
          Communities
        </button>
      </nav>
    </div>

    <!-- ======== LISTINGS TAB ======== -->
    <div v-if="activeTab === 'listings'">
      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="rounded-lg border border-[hsl(var(--border))] p-4">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Listings</p>
          <p class="text-2xl font-bold text-[hsl(var(--foreground))]">{{ stats?.totalListings ?? 0 }}</p>
        </div>
        <div class="rounded-lg border border-[hsl(var(--border))] p-4">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Average Rent</p>
          <p class="text-2xl font-bold text-[hsl(var(--foreground))]">${{ stats?.averageRent?.toLocaleString() ?? 0 }}</p>
        </div>
        <div class="rounded-lg border border-[hsl(var(--border))] p-4">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Vacancy Rate</p>
          <p class="text-2xl font-bold text-[hsl(var(--foreground))]">{{ stats?.vacancyRate?.toFixed(1) ?? 0 }}%</p>
        </div>
        <div class="rounded-lg border border-[hsl(var(--border))] p-4">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Avg Days on Market</p>
          <p class="text-2xl font-bold text-[hsl(var(--foreground))]">{{ stats?.avgDaysOnMarket ?? 0 }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <select
          v-model="communityFilter"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        >
          <option value="">All Communities</option>
          <option v-for="c in communities ?? []" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select
          v-model="bedroomFilter"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        >
          <option value="">All Bedrooms</option>
          <option v-for="b in [1,2,3,4,5]" :key="b" :value="b">{{ b }} BR</option>
        </select>
        <input
          v-model="rentMin"
          type="number"
          placeholder="Min rent"
          class="w-28 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        />
        <input
          v-model="rentMax"
          type="number"
          placeholder="Max rent"
          class="w-28 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        />
        <select
          v-model="statusFilterVal"
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="leased">Leased</option>
          <option value="inactive">Inactive</option>
        </select>
        <div class="ml-auto">
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            @click="openAddListing"
          >
            <Plus class="h-4 w-4" />
            Add Listing
          </button>
        </div>
      </div>

      <ErrorState v-if="listingsError" :message="listingsError" :on-retry="refetchListings" />
      <DataTable
        v-else
        :columns="listingColumns"
        :rows="(formattedListings as any[])"
        :loading="listingsLoading"
        empty-message="No listings found"
      >
        <template #cell-status="{ row }">
          <StatusChip
            :variant="listingStatusVariant(row.status as string)"
            :label="(row.status as string) ?? 'Unknown'"
          />
        </template>
      </DataTable>
    </div>

    <!-- ======== COMMUNITIES TAB ======== -->
    <div v-if="activeTab === 'communities'">
      <div class="flex items-center gap-2 mb-4">
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          @click="showRegionModal = true; regionForm.name = ''"
        >
          <Plus class="h-4 w-4" />
          Add Region
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          @click="openAddCommunity()"
        >
          <Plus class="h-4 w-4" />
          Add Community
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          @click="openAddProperty()"
        >
          <Plus class="h-4 w-4" />
          Add Property
        </button>
      </div>

      <div v-if="regionsLoading" class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
      <ErrorState v-else-if="regionsError" :message="regionsError" :on-retry="refetchRegions" />
      <div v-else class="space-y-2">
        <div
          v-for="region in regions ?? []"
          :key="region.id"
          class="rounded-lg border border-[hsl(var(--border))] overflow-hidden"
        >
          <!-- Region row -->
          <button
            class="w-full flex items-center gap-3 px-4 py-3 bg-[hsl(var(--muted)/0.5)] hover:bg-[hsl(var(--muted))] transition-colors text-left"
            @click="toggleRegion(region.id)"
          >
            <component
              :is="expandedRegions.has(region.id) ? ChevronDown : ChevronRight"
              class="h-4 w-4 text-[hsl(var(--muted-foreground))]"
            />
            <MapPin class="h-4 w-4 text-[hsl(var(--primary))]" />
            <span class="font-medium text-[hsl(var(--foreground))]">{{ region.name }}</span>
            <span class="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
              {{ communitiesForRegion(region.id).length }} communities
            </span>
          </button>

          <!-- Communities under region -->
          <div v-if="expandedRegions.has(region.id)" class="border-t border-[hsl(var(--border))]">
            <div
              v-for="community in communitiesForRegion(region.id)"
              :key="community.id"
              class="border-b border-[hsl(var(--border))] last:border-b-0"
            >
              <button
                class="w-full flex items-center gap-3 px-4 py-2 pl-10 hover:bg-[hsl(var(--muted)/0.3)] transition-colors text-left"
                @click="toggleCommunity(community.id)"
              >
                <component
                  :is="expandedCommunities.has(community.id) ? ChevronDown : ChevronRight"
                  class="h-4 w-4 text-[hsl(var(--muted-foreground))]"
                />
                <Building2 class="h-4 w-4 text-blue-500" />
                <span class="text-sm font-medium text-[hsl(var(--foreground))]">{{ community.name }}</span>
                <span class="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                  {{ propertiesForCommunity(community.id).length }} properties
                </span>
              </button>

              <!-- Properties under community -->
              <div v-if="expandedCommunities.has(community.id)">
                <div
                  v-for="prop in propertiesForCommunity(community.id)"
                  :key="prop.id"
                  class="flex items-center gap-3 px-4 py-2 pl-20 border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.2)] transition-colors"
                >
                  <Home class="h-4 w-4 text-green-500" />
                  <div>
                    <span class="text-sm text-[hsl(var(--foreground))]">{{ prop.name }}</span>
                    <span v-if="prop.address" class="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                      {{ prop.address }}
                    </span>
                  </div>
                </div>
                <div
                  v-if="propertiesForCommunity(community.id).length === 0"
                  class="px-4 py-3 pl-20 text-sm text-[hsl(var(--muted-foreground))] italic"
                >
                  No properties
                </div>
              </div>
            </div>

            <div
              v-if="communitiesForRegion(region.id).length === 0"
              class="px-4 py-3 pl-10 text-sm text-[hsl(var(--muted-foreground))] italic"
            >
              No communities in this region
            </div>
          </div>
        </div>

        <div
          v-if="!regions || regions.length === 0"
          class="text-center py-12 text-[hsl(var(--muted-foreground))]"
        >
          No regions configured. Add a region to get started.
        </div>
      </div>
    </div>

    <!-- ======== MODALS ======== -->

    <!-- Add Listing Modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showListingModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showListingModal = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-10">
            <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Add Listing</h3>
            <form @submit.prevent="handleSaveListing" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Unit</label>
                <input v-model="listingForm.unit" type="text" required class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" placeholder="Unit number" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Property</label>
                <select v-model="listingForm.propertyId" required class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]">
                  <option value="" disabled>Select property</option>
                  <option v-for="p in properties ?? []" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Bedrooms</label>
                  <input v-model.number="listingForm.bedrooms" type="number" min="0" class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Bathrooms</label>
                  <input v-model.number="listingForm.bathrooms" type="number" min="0" step="0.5" class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Sqft</label>
                  <input v-model.number="listingForm.sqft" type="number" min="1" class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Rent ($)</label>
                  <input v-model.number="listingForm.rent" type="number" min="0" class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" />
                </div>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" @click="showListingModal = false">Cancel</button>
                <button type="submit" :disabled="savingListing" class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                  {{ savingListing ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add Region Modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showRegionModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showRegionModal = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
            <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Add Region</h3>
            <form @submit.prevent="handleSaveRegion" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Region Name</label>
                <input v-model="regionForm.name" type="text" required class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" placeholder="Region name" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" @click="showRegionModal = false">Cancel</button>
                <button type="submit" :disabled="savingRegion" class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                  {{ savingRegion ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add Community Modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showCommunityModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showCommunityModal = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
            <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Add Community</h3>
            <form @submit.prevent="handleSaveCommunity" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Community Name</label>
                <input v-model="communityForm.name" type="text" required class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" placeholder="Community name" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Region</label>
                <select v-model="communityForm.regionId" required class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]">
                  <option value="" disabled>Select region</option>
                  <option v-for="r in regions ?? []" :key="r.id" :value="r.id">{{ r.name }}</option>
                </select>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" @click="showCommunityModal = false">Cancel</button>
                <button type="submit" :disabled="savingCommunity" class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                  {{ savingCommunity ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add Property Modal -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showPropertyModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showPropertyModal = false" />
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
            <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Add Property</h3>
            <form @submit.prevent="handleSaveProperty" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Property Name</label>
                <input v-model="propertyForm.name" type="text" required class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" placeholder="Property name" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Community</label>
                <select v-model="propertyForm.communityId" required class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]">
                  <option value="" disabled>Select community</option>
                  <option v-for="c in communities ?? []" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Address</label>
                <input v-model="propertyForm.address" type="text" required class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]" placeholder="Full address" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors" @click="showPropertyModal = false">Cancel</button>
                <button type="submit" :disabled="savingProperty" class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                  {{ savingProperty ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
