/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { singleton as uiStore } from '../../lib/ui-store';
import { registerAlpine } from '../../lib/alpine';
import { createSettingsApp, buildSettingsLabels } from './settingsApp';
import { t, DATE_LOCALE } from '../../i18n';
import { downloadBlob } from '../../lib/csv-export';

export function registerSettings(): void {
  const LABELS = t();

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error(LABELS.settings.readError));
      reader.readAsText(file);
    });
  }
  registerAlpine('settingsApp', () =>
    createSettingsApp({
      labels: buildSettingsLabels(LABELS),
      clock: {
        now: () => new Date(),
        nowIso: () => new Date().toISOString(),
        locale: () => DATE_LOCALE(),
      },
      ui: {
        notify: (message, kind) => uiStore.notify(message, kind),
        download: downloadBlob,
        readFile,
        openDialog: (id) => uiStore.openDialog(id),
        closeDialog: (id) => uiStore.closeDialog(id),
        pickImportFile: () => {
          const input = document.querySelector<HTMLInputElement>('.set__file-input');
          if (!input) return;
          input.value = '';
          input.click();
        },
      },
    })
  );
}
