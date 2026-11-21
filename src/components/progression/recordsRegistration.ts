/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { createRecordsApp } from './recordsApp';
import { t, localizedPath, getLocale } from '../../i18n';

export function registerRecords(): void {
  const LABELS = t();

  registerAlpine('recordsApp', () =>
    createRecordsApp({
      labels: {
        on: LABELS.records.on,
        exercisesTracked: LABELS.records.exercisesTracked,
        exerciseTracked: LABELS.records.exerciseTracked,
        kg: LABELS.common.kg,
        viewHistoryAriaPrefix: LABELS.records.viewHistoryAriaPrefix,
      },
      today: () => new Date(),
      locale: getLocale(),
      localizedPath,
    })
  );
}
