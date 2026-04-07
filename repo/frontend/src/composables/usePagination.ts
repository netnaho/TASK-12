import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function usePagination(defaultPageSize: number = 20) {
  const route = useRoute();
  const router = useRouter();

  const page = ref(Number(route.query.page) || 1);
  const pageSize = ref(Number(route.query.pageSize) || defaultPageSize);
  const total = ref(0);

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value)),
  );

  function setTotal(value: number) {
    total.value = value;
  }

  // Sync page/pageSize to URL query params
  watch([page, pageSize], ([newPage, newPageSize]) => {
    const query = { ...route.query };
    if (newPage > 1) {
      query.page = String(newPage);
    } else {
      delete query.page;
    }
    if (newPageSize !== defaultPageSize) {
      query.pageSize = String(newPageSize);
    } else {
      delete query.pageSize;
    }
    router.replace({ query });
  });

  // Sync from URL changes (e.g., back/forward navigation)
  watch(
    () => route.query,
    (query) => {
      const queryPage = Number(query.page) || 1;
      const queryPageSize = Number(query.pageSize) || defaultPageSize;
      if (queryPage !== page.value) page.value = queryPage;
      if (queryPageSize !== pageSize.value) pageSize.value = queryPageSize;
    },
  );

  return {
    page,
    pageSize,
    total,
    totalPages,
    setTotal,
  };
}
