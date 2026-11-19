// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { singleton as uiStore } from '../ui-store';

describe('ui store', () => {
  beforeEach(() => {
    uiStore.toasts = [];
    uiStore.duration = 3000;
  });

  it('ajoute puis retire un toast', () => {
    vi.useFakeTimers();
    uiStore.notify('Sauvegardé', 'success');
    expect(uiStore.toasts).toHaveLength(1);
    expect(uiStore.toasts[0]).toMatchObject({ message: 'Sauvegardé', variant: 'success' });

    vi.advanceTimersByTime(3000);
    expect(uiStore.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('délègue l’ouverture et la fermeture des dialogs à l’adaptateur', () => {
    const open = vi.fn();
    const close = vi.fn();
    uiStore.setDialogAdapter({ open, close });

    uiStore.openDialog('mon-dialog');
    uiStore.closeDialog('mon-dialog');

    expect(open).toHaveBeenCalledWith('mon-dialog');
    expect(close).toHaveBeenCalledOnce();
  });

  it('ne jette pas sans adaptateur', () => {
    uiStore.setDialogAdapter({ open: () => {}, close: () => {} });
    expect(() => uiStore.openDialog('x')).not.toThrow();
  });
});
