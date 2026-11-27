/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { createLoginApp } from './loginApp';
import { t, getLocale, localizedPath } from '../../i18n';

export function registerLogin(): void {
  const LABELS = t(getLocale());

  registerAlpine('loginApp', () =>
    createLoginApp({
      labels: {
        defaultPseudo: LABELS.login.defaultPseudo,
        submit: LABELS.login.submit,
        loading: LABELS.login.loading,
        showPassword: LABELS.login.showPassword,
        hidePassword: LABELS.login.hidePassword,
        signupMessage: LABELS.login.signupMessage,
        switchToLight: LABELS.layout.switchToLight,
        switchToDark: LABELS.layout.switchToDark,
        switchLocaleAria: LABELS.layout.switchLocale,
        errors: LABELS.login.errors,
      },
      locale: () => (getLocale() === 'en' ? 'en' : 'fr'),
      localizedPath,
      host: {
        theme: () =>
          document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
        setTheme: (theme) => document.documentElement.setAttribute('data-theme', theme),
        storeTheme: (theme) => window.localStorage.setItem('muscu-theme', theme),
        navigate: (href) => {
          window.location.href = href;
        },
        schedule: (fn, ms) => window.setTimeout(fn, ms),
        search: () => window.location.search,
        hash: () => window.location.hash,
      },
    })
  );
}
