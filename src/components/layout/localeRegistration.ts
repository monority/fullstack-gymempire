/** Enregistrement Alpine extrait du header (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { t, getLocale } from '../../i18n';
import { createLocaleApp } from './localeApp';

export function registerLocale(): void {
  const L = t(getLocale());
  registerAlpine('localeApp', () =>
    createLocaleApp({
      labels: {
        switchToLight: L.layout.switchToLight,
        switchToDark: L.layout.switchToDark,
        switchLocale: L.layout.switchLocale,
        langEn: L.layout.langEn,
        langFr: L.layout.langFr,
      },
      locale: () => (document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'fr'),
      path: () => window.location.pathname,
      search: () => window.location.search,
      hash: () => window.location.hash,
      navigate: (href) => {
        window.location.href = href;
      },
    })
  );
}
