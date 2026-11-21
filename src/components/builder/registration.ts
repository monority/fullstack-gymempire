/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { singleton as uiStore } from '../../lib/ui-store';
import { registerAlpine } from '../../lib/alpine';
import { createSessionBuilderApp } from './sessionBuilder';
import { pickBuilderLabels } from './builderLabels';
import { exerciseCard } from './exerciseCard';
import { t, localizedPath, DATE_LOCALE } from '../../i18n';

export function registerBuilder(): void {
  const LABELS = t();
  const BUILDER_LABELS = pickBuilderLabels(
    LABELS as unknown as { builder: Record<string, string> }
  );

  type BuilderWindow = Window & {
    __builderSessions?: unknown;
    __builderLabels?: unknown;
    openDialog?: (id: string) => void;
    closeDialog?: (id: string) => void;
  };
  const host = window as BuilderWindow;
  registerAlpine('exerciseCard', (...args: Parameters<typeof exerciseCard>) =>
    exerciseCard(...args)
  );
  registerAlpine('sessionBuilder', () =>
    createSessionBuilderApp({
      labels: BUILDER_LABELS,
      rpeLabels: LABELS.builder as unknown as import('./sessionMeta').SessionMetaLabels,
      search: window.location.search,
      today: () => new Date().toISOString().split('T')[0],
      locale: DATE_LOCALE(),
      localizedPath,
      host: {
        expose: (sessions, labels) => {
          host.__builderSessions = sessions;
          host.__builderLabels = labels;
        },
        onToggle: (listener) => {
          window.addEventListener('builder:exercise-toggled', ((e: CustomEvent) => {
            listener(e.detail.exerciseId, e.detail.expanded);
          }) as EventListener);
        },
        openDialog: (id) => uiStore.openDialog(id),
        closeDialog: (id) => uiStore.closeDialog(id),
        dispatch: (name) => window.dispatchEvent(new CustomEvent(name)),
        confirm: (message) => window.confirm(message),
        navigate: (href) => {
          window.location.href = href;
        },
        focusPickerSearch: () => {
          requestAnimationFrame(() => {
            document.querySelector<HTMLInputElement>('[x-ref="pickerSearch"]')?.focus();
          });
        },
      },
    })
  );
}
