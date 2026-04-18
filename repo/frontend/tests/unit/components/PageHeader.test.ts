import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PageHeader from '@/components/shared/PageHeader.vue';

describe('components/PageHeader.vue', () => {
  it('renders the title', () => {
    const w = mount(PageHeader, { props: { title: 'Dashboard' } });
    expect(w.find('h1').text()).toBe('Dashboard');
  });

  it('renders the description when provided', () => {
    const w = mount(PageHeader, {
      props: { title: 'Dashboard', description: 'Overview of activity' },
    });
    expect(w.text()).toContain('Overview of activity');
  });

  it('does not render description paragraph when missing', () => {
    const w = mount(PageHeader, { props: { title: 't' } });
    expect(w.find('p').exists()).toBe(false);
  });

  it('renders actions slot when given', () => {
    const w = mount(PageHeader, {
      props: { title: 't' },
      slots: { actions: '<button class="add-btn">Add</button>' },
    });
    expect(w.find('button.add-btn').exists()).toBe(true);
    expect(w.find('button.add-btn').text()).toBe('Add');
  });

  it('omits action wrapper when no actions slot is given', () => {
    const w = mount(PageHeader, { props: { title: 't' } });
    // The actions wrapper carries "shrink-0" class and is rendered with v-if.
    // When no slot is provided, no element carries that class.
    expect(w.find('.shrink-0').exists()).toBe(false);
  });
});
