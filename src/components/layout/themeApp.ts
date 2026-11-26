/** Thème + accordéons de navigation — factory extraite du shell (ratchet script). */

export interface ThemeAppDeps {
  readTheme(): 'dark' | 'light';
  setThemeAttr(theme: 'dark' | 'light'): void;
  storeTheme(theme: 'dark' | 'light'): void;
  readCollapsed(): string[];
  storeCollapsed(ids: string[]): void;
}

export function createThemeApp(deps: ThemeAppDeps) {
  return {
    theme: 'dark' as 'dark' | 'light',
    collapsed: [] as string[],
    navReady: false,

    init() {
      this.theme = deps.readTheme();
      this.collapsed = deps.readCollapsed();
      // Alpine est la seule source de vérité de l'état des accordéons : on
      // applique l'état restauré puis on affiche la sidebar en une seule
      // passe. Un rAF masquait toute la sidebar à chaque changement de route.
      this.navReady = true;
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      deps.setThemeAttr(this.theme);
      deps.storeTheme(this.theme);
    },

    isDark(): boolean {
      return this.theme === 'dark';
    },

    isExpanded(id: string): boolean {
      return !this.collapsed.includes(id);
    },

    toggleNav(id: string) {
      const i = this.collapsed.indexOf(id);
      if (i >= 0) this.collapsed.splice(i, 1);
      else this.collapsed.push(id);
      deps.storeCollapsed(this.collapsed);
    },
  };
}
