// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAlpine, registerAlpine, registerStore } from '../alpine';

afterEach(() => {
  delete window.Alpine;
});

describe('pont Alpine', () => {
  it('retourne null quand Alpine n’est pas chargé', () => {
    expect(getAlpine()).toBeNull();
  });

  it('enregistre immédiatement un composant si Alpine est déjà présent', () => {
    const data = vi.fn();
    window.Alpine = { data, store: vi.fn(), initTree: vi.fn() } as never;

    registerAlpine('xApp', () => ({ value: 1 }));

    expect(data).toHaveBeenCalledWith('xApp', expect.any(Function));
  });

  it('enregistre le store fourni', () => {
    const store = vi.fn();
    window.Alpine = { data: vi.fn(), store, initTree: vi.fn() } as never;

    registerStore('ui', { toasts: [] });
    registerStore('ui', { toasts: [] });

    expect(store).toHaveBeenCalledTimes(2); // deux appels explicites = deux stores distincts
  });
});
