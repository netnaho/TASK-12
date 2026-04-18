import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue';

describe('components/LoadingSpinner.vue', () => {
  it('renders an svg with animate-spin by default', () => {
    const wrapper = mount(LoadingSpinner);
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.classes()).toContain('animate-spin');
    // default md size
    expect(svg.classes()).toContain('h-8');
  });

  it('small size reduces the rendered dimension', () => {
    const wrapper = mount(LoadingSpinner, { props: { size: 'sm' } });
    expect(wrapper.find('svg').classes()).toContain('h-4');
  });

  it('large size increases the rendered dimension', () => {
    const wrapper = mount(LoadingSpinner, { props: { size: 'lg' } });
    expect(wrapper.find('svg').classes()).toContain('h-12');
  });
});
