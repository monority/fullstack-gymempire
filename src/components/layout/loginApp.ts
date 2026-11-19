/**
 * logique Alpine de la page de connexion (faux gate local).
 * Le DOM, localStorage et la navigation sont injectés.
 */

import { setAuth, isAuthenticated } from '../../lib/auth';
import { loginWithDemoAccount } from '../../lib/demo-account';
import { icons } from '../../lib/icons';

export interface LoginAppDeps {
  labels: {
    defaultPseudo: string;
    submit: string;
    loading: string;
    showPassword: string;
    hidePassword: string;
    signupMessage: string;
    switchToLight: string;
    switchToDark: string;
    switchLocaleAria: string;
    errors: {
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
    };
  };
  locale(): 'fr' | 'en';
  localizedPath(path: string): string;
  host: {
    theme(): 'dark' | 'light';
    setTheme(theme: 'dark' | 'light'): void;
    storeTheme(theme: 'dark' | 'light'): void;
    navigate(href: string): void;
    schedule(fn: () => void, ms: number): void;
    search(): string;
    hash(): string;
  };
}

export function nameFromEmail(email: string, fallback: string): string {
  const local = email.split('@')[0] ?? '';
  const formatted = local
    .split(/[._\-+]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
  return formatted || fallback;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export interface LoginApp {
  email: string;
  password: string;
  error: string;
  showPassword: boolean;
  showSignupMessage: boolean;
  loading: boolean;
  theme: 'dark' | 'light';
  locale: 'fr' | 'en';
  switchToLight: string;
  switchToDark: string;
  switchLocaleAria: string;
  icons: { eye: () => string; eyeOff: () => string };
  labels: LoginAppDeps['labels'];
  init(): void;
  toggleTheme(): void;
  isDark(): boolean;
  langTarget: string;
  toggleLocale(): void;
  submit(): void;
  devLogin(): void;
  demoLogin(): void;
}

export function createLoginApp(deps: LoginAppDeps): LoginApp {
  const { labels, host } = deps;

  return {
    email: '',
    password: '',
    error: '',
    showPassword: false,
    showSignupMessage: false,
    loading: false,
    theme: 'dark',
    locale: deps.locale(),
    switchToLight: labels.switchToLight,
    switchToDark: labels.switchToDark,
    switchLocaleAria: labels.switchLocaleAria,
    // Le template appelle icons.eye() / icons.eyeOff() : on expose les fonctions.
    icons: { eye: icons.eye, eyeOff: icons.eyeOff },
    labels,

    init() {
      this.theme = host.theme();
      if (isAuthenticated()) host.navigate(deps.localizedPath('/'));
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      host.setTheme(this.theme);
      try {
        host.storeTheme(this.theme);
      } catch {
        // Mode privé / quota dépassé : le thème reste appliqué en mémoire.
      }
    },
    isDark() {
      return this.theme === 'dark';
    },
    get langTarget() {
      return this.locale === 'en' ? 'FR' : 'EN';
    },
    toggleLocale() {
      const target = this.locale === 'en' ? 'fr' : 'en';
      const path = target === 'fr' ? '/login' : '/en/login';
      host.navigate(path + host.search() + host.hash());
    },

    submit() {
      this.error = '';
      const email = this.email.trim();
      const password = this.password;

      if (!email) {
        this.error = labels.errors.emailRequired;
        return;
      }
      if (!isValidEmail(email)) {
        this.error = labels.errors.emailInvalid;
        return;
      }
      if (!password) {
        this.error = labels.errors.passwordRequired;
        return;
      }

      this.loading = true;
      setAuth(email, nameFromEmail(email, labels.defaultPseudo));
      host.schedule(() => host.navigate(deps.localizedPath('/')), 240);
    },

    devLogin() {
      this.error = '';
      this.loading = true;
      setAuth('dev@muscu.app', 'Dev User');
      host.navigate(deps.localizedPath('/'));
    },

    demoLogin() {
      this.error = '';
      this.loading = true;
      loginWithDemoAccount();
      host.navigate(deps.localizedPath('/'));
    },
  };
}
