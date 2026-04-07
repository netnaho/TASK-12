import { ref, onMounted } from 'vue';
export function useApiQuery(fetcher, options = {}) {
    const { immediate = true } = options;
    const data = ref(null);
    const loading = ref(false);
    const error = ref(null);
    async function refetch() {
        loading.value = true;
        error.value = null;
        try {
            const response = await fetcher();
            data.value = response.data?.data ?? response.data ?? response;
        }
        catch (err) {
            error.value = err.message || 'An error occurred';
        }
        finally {
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
