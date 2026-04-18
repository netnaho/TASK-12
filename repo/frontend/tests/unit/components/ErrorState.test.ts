import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ErrorState from '@/components/shared/ErrorState.vue';

describe('components/ErrorState.vue', () => {
  it('renders the standard heading and message', () => {
    const w = mount(ErrorState, { props: { message: 'Something failed' } });
    expect(w.text()).toContain('Something went wrong');
    expect(w.text()).toContain('Something failed');
  });

  it('does not render the retry button when onRetry is absent', () => {
    const w = mount(ErrorState, { props: { message: 'no retry' } });
    expect(w.find('button').exists()).toBe(false);
  });

  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn();
    const w = mount(ErrorState, { props: { message: 'fail', onRetry } });
    const btn = w.find('button');
    expect(btn.exists()).toBe(true);
    await btn.trigger('click');
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(btn.text()).toContain('Try again');
  });
});
