import { describe, expect, it } from 'vitest';
import { createThemeApp } from '../themeApp';

function create(initial: 'dark' | 'light' = 'dark', collapsed: string[] = []) {
  let themeAttr = initial;
  const storedTheme: string[] = [];
  const storedCollapsed: string[][] = [];
  const app = createThemeApp({
    readTheme: () => initial,
    setThemeAttr: (t) => (themeAttr = t),
    storeTheme: (t) => storedTheme.push(t),
    readCollapsed: () => collapsed,
    storeCollapsed: (ids) => storedCollapsed.push([...ids]),
  });
  return { app, storedTheme, storedCollapsed, themeAttr: () => themeAttr };
}

describe('createThemeApp', () => {
  it('restaure le thème et les accordéons à l’init', () => {
    const { app } = create('light', ['group-a']);
    app.init();
    expect(app.theme).toBe('light');
    expect(app.navReady).toBe(true);
    expect(app.isExpanded('group-a')).toBe(false);
    expect(app.isExpanded('group-b')).toBe(true);
    expect(app.isDark()).toBe(false);
  });

  it('bascule le thème et le persiste', () => {
    const { app, storedTheme, themeAttr } = create('dark');
    app.init();
    app.toggleTheme();
    expect(app.theme).toBe('light');
    expect(themeAttr()).toBe('light');
    expect(storedTheme).toEqual(['light']);
  });

  it('bascule un accordéon sans toucher aux autres', () => {
    const { app, storedCollapsed } = create('dark', ['a']);
    app.init();
    app.toggleNav('b');
    expect(app.collapsed).toEqual(['a', 'b']);
    app.toggleNav('a');
    expect(app.collapsed).toEqual(['b']);
    expect(storedCollapsed).toEqual([['a', 'b'], ['b']]);
  });
});
