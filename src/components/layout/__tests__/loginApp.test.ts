import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setAuth: vi.fn(),
  isAuthenticated: vi.fn(),
  loginWithDemoAccount: vi.fn(),
}));
vi.mock('../../../lib/auth', () => ({
  setAuth: mocks.setAuth,
  isAuthenticated: mocks.isAuthenticated,
}));
vi.mock('../../../lib/demo-account', () => ({
  loginWithDemoAccount: mocks.loginWithDemoAccount,
}));

import { createLoginApp, isValidEmail, nameFromEmail } from '../loginApp';

const labels = {
  defaultPseudo: 'Athlète',
  submit: 'Connexion',
  loading: 'Connexion…',
  showPassword: 'Afficher',
  hidePassword: 'Masquer',
  signupMessage: 'Bienvenue',
  switchToLight: 'Mode clair',
  switchToDark: 'Mode sombre',
  switchLocaleAria: 'Changer de langue',
  errors: {
    emailRequired: 'Email requis',
    emailInvalid: 'Email invalide',
    passwordRequired: 'Mot de passe requis',
  },
};

function create(locale: 'fr' | 'en' = 'fr') {
  const navigated: string[] = [];
  const scheduled: Array<{ fn: () => void; ms: number }> = [];
  const stored: string[] = [];
  const app = createLoginApp({
    labels,
    locale: () => locale,
    localizedPath: (p) => p,
    host: {
      theme: () => 'dark',
      setTheme: vi.fn(),
      storeTheme: (theme) => stored.push(theme),
      navigate: (href) => navigated.push(href),
      schedule: (fn, ms) => scheduled.push({ fn, ms }),
      search: () => '?from=test',
      hash: () => '#top',
    },
  });
  return { app, navigated, scheduled, stored };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.isAuthenticated.mockReturnValue(false);
});

describe('login pure helpers', () => {
  it('derives a pseudo from the email', () => {
    expect(nameFromEmail('jean.dupont@example.com', 'Athlète')).toBe('Jean Dupont');
    expect(nameFromEmail('', 'Athlète')).toBe('Athlète');
  });

  it('validates email shape', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
  });
});

describe('createLoginApp', () => {
  it('redirects when already authenticated', () => {
    mocks.isAuthenticated.mockReturnValue(true);
    const { app, navigated } = create();
    app.init();
    expect(navigated).toEqual(['/']);
  });

  it('validates fields in order without calling auth', () => {
    const { app } = create();
    app.submit();
    expect(app.error).toBe('Email requis');
    app.email = 'nope';
    app.submit();
    expect(app.error).toBe('Email invalide');
    app.email = 'a@b.com';
    app.submit();
    expect(app.error).toBe('Mot de passe requis');
    expect(mocks.setAuth).not.toHaveBeenCalled();
  });

  it('authenticates and schedules the redirect', () => {
    const { app, scheduled } = create();
    app.email = 'jean.dupont@example.com';
    app.password = 'secret';
    app.submit();
    expect(mocks.setAuth).toHaveBeenCalledWith('jean.dupont@example.com', 'Jean Dupont');
    expect(app.loading).toBe(true);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].ms).toBe(240);
  });

  it('toggles theme and persists it through the host', () => {
    const { app, stored } = create();
    app.init();
    expect(app.isDark()).toBe(true);
    app.toggleTheme();
    expect(app.isDark()).toBe(false);
    expect(stored).toEqual(['light']);
  });

  it('toggles locale while preserving query and hash', () => {
    const fr = create('fr');
    fr.app.toggleLocale();
    expect(fr.navigated).toEqual(['/en/login?from=test#top']);
    expect(fr.app.langTarget).toBe('EN');
    const en = create('en');
    en.app.toggleLocale();
    expect(en.navigated).toEqual(['/login?from=test#top']);
    expect(en.app.langTarget).toBe('FR');
  });

  it('supports the dev login shortcut', () => {
    const { app, navigated } = create();
    app.devLogin();
    expect(mocks.setAuth).toHaveBeenCalledWith('dev@muscu.app', 'Dev User');
    expect(navigated).toEqual(['/']);
  });

  it('seeds the demo profile and navigates to the dashboard', () => {
    const { app, navigated } = create();
    app.demoLogin();
    expect(mocks.loginWithDemoAccount).toHaveBeenCalledOnce();
    expect(app.loading).toBe(true);
    expect(navigated).toEqual(['/']);
  });
});
