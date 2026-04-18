import { describe, it, expect, vi } from 'vitest';
import { useApiQuery } from '@/composables/useApiQuery';

describe('composables/useApiQuery', () => {
  it('does not auto-fetch when immediate=false', () => {
    const fetcher = vi.fn();
    const q = useApiQuery(fetcher, { immediate: false });
    expect(fetcher).not.toHaveBeenCalled();
    expect(q.loading.value).toBe(false);
    expect(q.data.value).toBeNull();
    expect(q.error.value).toBeNull();
  });

  it('refetch resolves data from response.data.data', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: { data: { ok: true } } });
    const q = useApiQuery<{ ok: boolean }>(fetcher, { immediate: false });
    await q.refetch();
    expect(q.data.value).toEqual({ ok: true });
    expect(q.error.value).toBeNull();
    expect(q.loading.value).toBe(false);
  });

  it('refetch surfaces error messages', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
    const q = useApiQuery(fetcher, { immediate: false });
    await q.refetch();
    expect(q.error.value).toBe('boom');
    expect(q.data.value).toBeNull();
    expect(q.loading.value).toBe(false);
  });

  it('retry is an alias for refetch', async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: 'plain' });
    const q = useApiQuery(fetcher, { immediate: false });
    await q.retry();
    expect(q.data.value).toBe('plain');
  });
});
