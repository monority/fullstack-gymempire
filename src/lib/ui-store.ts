/**
 * État UI global (toasts + dialog) — remplace les globals `window.showToast`
 * et `window.openDialog`. Enregistré comme store Alpine dans AppLayout.
 */
import { getAlpine } from './alpine';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface DialogAdapter {
  open(id: string): void;
  close(): void;
}

export interface UiStore {
  toasts: ToastItem[];
  duration: number;
  notify(message: string, variant?: string): void;
  dismiss(id: number): void;
  openDialog(id: string): void;
  closeDialog(id?: string): void;
  setDialogAdapter(adapter: DialogAdapter): void;
}

let counter = 0;
let dialogAdapter: DialogAdapter | null = null;

/** Retourne l'instance réactive Alpine si elle existe, sinon le singleton nu. */
function instance(): UiStore {
  const reactive = getAlpine()?.store('ui') as UiStore | undefined;
  return reactive ?? singleton;
}

export const singleton: UiStore = {
  toasts: [],
  duration: 3000,

  notify(message, variant: string = 'info') {
    const store = instance();
    const id = ++counter;
    store.toasts.push({ id, message, variant: variant as ToastVariant });
    window.setTimeout(() => store.dismiss(id), store.duration);
  },

  dismiss(id) {
    const store = instance();
    store.toasts = store.toasts.filter((toast) => toast.id !== id);
  },

  openDialog(id) {
    dialogAdapter?.open(id);
  },

  closeDialog(_id?: string) {
    dialogAdapter?.close();
  },

  setDialogAdapter(adapter) {
    dialogAdapter = adapter;
  },
};
