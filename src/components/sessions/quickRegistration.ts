/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { t, getLocale, localizedPath } from '../../i18n';
import { getSessions, saveSession, updateSession } from '../../lib/storage/sessions';
import { getSettings } from '../../lib/storage/settings';
import { getRestTime } from '../../lib/rest-times';
import { createQuickSession } from './quickSession';
import { registerAlpine } from '../../lib/alpine';

export function registerQuick(): void {
  const LABELS = t(getLocale());

  registerAlpine('quickSessionApp', () =>
    createQuickSession({
      labels: LABELS.rapide,
      storage: { getSessions, saveSession, updateSession },
      defaultRestSeconds: () => getSettings().defaultRestTime,
      restSecondsFor: (name, fallback) => getRestTime(name, fallback),
      unit: () => getSettings().unit,
      confirm: (message) => window.confirm(message),
      navigate: (href) => (window.location.href = href),
      sessionsHref: localizedPath('/sessions'),
      detailHref: (id) => localizedPath('/sessions/detail?id=' + encodeURIComponent(id || '')),
    })
  );
}
