import { describe, expect, it } from 'vitest';
import { createLocaleApp } from '../localeApp';

const labels = {
  switchToLight: 'Thème clair',
  switchToDark: 'Thème sombre',
  switchLocale: 'Changer de langue',
  langEn: 'English',
  langFr: 'Français',
};

function create(locale: 'en' | 'fr', path: string, search = '', hash = '') {
  const navigated: string[] = [];
  const app = createLocaleApp({
    labels,
    locale: () => locale,
    path: () => path,
    search: () => search,
    hash: () => hash,
    navigate: (href) => navigated.push(href),
  });
  return { app, navigated };
}

describe('createLocaleApp', () => {
  it('affiche le libellé de la langue courante', () => {
    expect(create('fr', '/').app.localeLabel).toBe('Français');
    expect(create('en', '/').app.localeLabel).toBe('English');
  });

  it('ajoute le préfixe /en en passant du français à l’anglais', () => {
    const { app, navigated } = create('fr', '/sessions/quick', '?id=1', '#top');
    app.switchLocale();
    expect(navigated).toEqual(['/en/sessions/quick?id=1#top']);
  });

  it('retire le préfixe /en au retour en français', () => {
    const { app, navigated } = create('en', '/en/settings');
    app.switchLocale();
    expect(navigated).toEqual(['/settings']);
  });

  it('ramène la racine à / quand la locale anglaise est sur /en', () => {
    const { app, navigated } = create('en', '/en');
    app.switchLocale();
    expect(navigated).toEqual(['/']);
  });
});
