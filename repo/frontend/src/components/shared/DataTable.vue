<script setup lang="ts">
import { cn } from '@/utils/cn';
import EmptyState from './EmptyState.vue';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

defineProps<{
  columns: DataTableColumn[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  emptyMessage?: string;
}>();
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="cn(
              'px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]',
              col.sortable ? 'cursor-pointer select-none hover:text-[hsl(var(--foreground))]' : ''
            )"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Loading skeleton -->
        <template v-if="loading">
          <tr
            v-for="i in 5"
            :key="'skeleton-' + i"
            class="border-b border-[hsl(var(--border))]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3"
            >
              <div class="h-4 rounded bg-[hsl(var(--muted))] animate-pulse w-3/4" />
            </td>
          </tr>
        </template>

        <!-- Data rows -->
        <template v-else-if="rows.length > 0">
          <tr
            v-for="(row, idx) in rows"
            :key="idx"
            class="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-[hsl(var(--foreground))]"
            >
              <slot
                :name="'cell-' + col.key"
                :row="row"
                :value="row[col.key]"
              >
                {{ row[col.key] ?? '-' }}
              </slot>
            </td>
          </tr>
        </template>

        <!-- Empty state -->
        <tr v-else>
          <td :colspan="columns.length">
            <EmptyState
              :title="emptyMessage ?? 'No data found'"
              description="There are no records to display."
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
