import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthLayout from '@/layouts/AuthLayout.vue';

describe('layouts/AuthLayout.vue', () => {
  it('renders the LeaseOps brand wordmark', () => {
    const w = mount(AuthLayout);
    expect(w.text()).toContain('LeaseOps');
  });

  it('renders slotted content inside the card', () => {
    const w = mount(AuthLayout, {
      slots: { default: '<section class="child-slot">slotted-form</section>' },
    });
    const child = w.find('.child-slot');
    expect(child.exists()).toBe(true);
    expect(child.text()).toBe('slotted-form');
  });

  it('applies the gradient background root class', () => {
    const w = mount(AuthLayout);
    expect(w.html()).toMatch(/from-blue-600/);
    expect(w.html()).toMatch(/to-indigo-800/);
  });
});
