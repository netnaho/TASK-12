import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusChip from '@/components/shared/StatusChip.vue';

describe('components/StatusChip.vue', () => {
  it('renders the label', () => {
    const wrapper = mount(StatusChip, {
      props: { variant: 'success', label: 'Active' },
    });
    expect(wrapper.text()).toContain('Active');
  });

  it('applies the success variant classes', () => {
    const wrapper = mount(StatusChip, {
      props: { variant: 'success', label: 'ok' },
    });
    const html = wrapper.html();
    expect(html).toContain('bg-green-100');
    expect(html).toContain('text-green-800');
  });

  it('applies the error variant classes', () => {
    const wrapper = mount(StatusChip, {
      props: { variant: 'error', label: 'Failed' },
    });
    expect(wrapper.html()).toContain('bg-red-100');
    expect(wrapper.html()).toContain('text-red-800');
  });

  it('renders each variant without throwing', () => {
    const variants: Array<'success' | 'warning' | 'error' | 'info' | 'neutral'> = [
      'success', 'warning', 'error', 'info', 'neutral',
    ];
    for (const v of variants) {
      const w = mount(StatusChip, { props: { variant: v, label: v } });
      expect(w.text()).toContain(v);
    }
  });
});
