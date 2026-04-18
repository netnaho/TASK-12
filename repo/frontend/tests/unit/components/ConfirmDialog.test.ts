import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';

describe('components/ConfirmDialog.vue', () => {
  it('does not render content when open=false', () => {
    const w = mount(ConfirmDialog, {
      props: { open: false, title: 'Delete?', description: 'Are you sure?' },
      attachTo: document.body,
    });
    // Teleport places content in body; still verify the title is not rendered
    expect(document.body.textContent).not.toContain('Are you sure?');
    w.unmount();
  });

  it('renders title and description when open=true', () => {
    const w = mount(ConfirmDialog, {
      props: { open: true, title: 'Delete region?', description: 'This action is permanent.' },
      attachTo: document.body,
    });
    expect(document.body.textContent).toContain('Delete region?');
    expect(document.body.textContent).toContain('This action is permanent.');
    w.unmount();
  });

  it('honors custom confirmLabel and cancelLabel', () => {
    const w = mount(ConfirmDialog, {
      props: {
        open: true,
        title: 't',
        description: 'd',
        confirmLabel: 'Yes, delete it',
        cancelLabel: 'Keep it',
      },
      attachTo: document.body,
    });
    expect(document.body.textContent).toContain('Yes, delete it');
    expect(document.body.textContent).toContain('Keep it');
    w.unmount();
  });

  it('emits confirm when the primary button is clicked', async () => {
    const w = mount(ConfirmDialog, {
      props: { open: true, title: 't', description: 'd' },
      attachTo: document.body,
    });
    const buttons = Array.from(document.body.querySelectorAll('button'));
    const confirmBtn = buttons.find((b) => b.textContent?.trim() === 'Confirm');
    expect(confirmBtn).toBeTruthy();
    confirmBtn!.click();
    expect(w.emitted('confirm')).toBeTruthy();
    w.unmount();
  });

  it('emits cancel when the cancel button is clicked', async () => {
    const w = mount(ConfirmDialog, {
      props: { open: true, title: 't', description: 'd' },
      attachTo: document.body,
    });
    const buttons = Array.from(document.body.querySelectorAll('button'));
    const cancelBtn = buttons.find((b) => b.textContent?.trim() === 'Cancel');
    expect(cancelBtn).toBeTruthy();
    cancelBtn!.click();
    expect(w.emitted('cancel')).toBeTruthy();
    w.unmount();
  });

  it('shows the warning icon when variant=danger', () => {
    const w = mount(ConfirmDialog, {
      props: { open: true, title: 't', description: 'd', variant: 'danger' },
      attachTo: document.body,
    });
    // The danger variant renders a lucide <svg> for AlertTriangle
    expect(document.body.querySelectorAll('svg').length).toBeGreaterThan(0);
    // Confirm button gets red-600 class on danger
    const buttons = Array.from(document.body.querySelectorAll('button'));
    const confirm = buttons.find((b) => b.textContent?.trim() === 'Confirm');
    expect(confirm?.className).toMatch(/bg-red-600/);
    w.unmount();
  });
});
