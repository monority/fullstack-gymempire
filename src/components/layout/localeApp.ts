/** Bascule de langue du shell — logique extraite du template (ratchet script). */

export interface LocaleAppLabels {
  switchToLight: string;
  switchToDark: string;
  switchLocale: string;
  langEn: string;
  langFr: string;
}

export interface LocaleAppDeps {
  labels: LocaleAppLabels;
  locale(): 'en' | 'fr';
  path(): string;
  search(): string;
  hash(): string;
  navigate(href: string): void;
}

export function createLocaleApp(deps: LocaleAppDeps) {
  return {
    get locale(): string {
      return deps.locale();
    },
    switchToLight: deps.labels.switchToLight,
    switchToDark: deps.labels.switchToDark,
    switchLocaleAria: deps.labels.switchLocale,

    get localeLabel(): string {
      return this.locale === 'en' ? deps.labels.langEn : deps.labels.langFr;
    },

    switchLocale() {
      const path = deps.path();
      let target: string;
      if (this.locale === 'en') {
        target = path.startsWith('/en') ? path.slice(3) : path;
        if (!target) target = '/';
      } else {
        target = '/en' + (path === '/' ? '' : path);
      }
      deps.navigate(target + deps.search() + deps.hash());
    },
  };
}
