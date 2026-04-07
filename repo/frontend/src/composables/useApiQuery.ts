import { ref, onMounted, type Ref } from 'vue';

interface UseApiQueryOptions {
  immediate?: boolean;
}

interface UseApiQueryReturn<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  refetch: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useApiQuery<T>(
  fetcher: () => Promise<any>,
  options: UseApiQueryOptions = {},
): UseApiQueryReturn<T> {
  const { immediate = true } = options;

  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function refetch() {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetcher();
      data.value = response.data?.data ?? response.data ?? response;
    } catch (err: any) {
      error.value = err.message || 'An error occurred';
    } finally {
      loading.value = false;
    }
  }

  const retry = refetch;

  if (immediate) {
    onMounted(refetch);
  }

  return {
    data,
    loading,
    error,
    refetch,
    retry,
  };
}
