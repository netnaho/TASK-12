import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmptyState from '@/components/shared/EmptyState.vue';

describe('components/EmptyState.vue', () => {
  it('renders the title', () => {
    const w = mount(EmptyState, { props: { title: 'Nothing here' } });
    expect(w.text()).toContain('Nothing here');
  });

  it('renders the description when provided', () => {
    const w = mount(EmptyState, {
      props: { title: 't', description: 'Create one to get started' },
    });
    expect(w.text()).toContain('Create one to get started');
  });

  it('does not render description paragraph when missing', () => {
    const w = mount(EmptyState, { props: { title: 't' } });
    expect(w.find('p').exists()).toBe(false);
  });

  it('renders the action slot', () => {
    const w = mount(EmptyState, {
      props: { title: 't' },
      slots: { action: '<button>Add</button>' },
    });
    expect(w.find('button').exists()).toBe(true);
    expect(w.find('button').text()).toBe('Add');
  });
});
