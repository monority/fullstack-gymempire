import { expect, test } from '@playwright/test';

/**
 * Le widget est injecté dans un <style> non layeré depuis une feuille CSS
 * gouvernée. Ces assertions protègent la cascade (thèmes, états [hidden]).
 */
for (const [theme, background] of [
  ['dark', 'rgb(15, 23, 42)'],
  ['light', 'rgb(245, 247, 245)'],
] as const) {
  test(`timer/pop: widget styles are intact in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => {
      localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
      localStorage.setItem('muscu-theme', value);
    }, theme);
    await page.goto('/timer/pop');

    const widget = page.locator('.tw');
    await expect(widget).toBeVisible();

    const countdown = await page.evaluate(() => {
      const css = (selector: string) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        return el ? getComputedStyle(el) : null;
      };
      return {
        bg: css('.tw')?.backgroundColor,
        color: css('.tw')?.color,
        clockSize: css('.tw__clock')?.fontSize,
        activeTab: css('.tw__tab.is-active')?.fontWeight,
      };
    });

    expect(countdown.bg).toBe(background);
    expect(countdown.color).not.toBe('');
    expect(Number.parseFloat(countdown.clockSize ?? '0')).toBeGreaterThan(20);
    expect(Number(countdown.activeTab)).toBeGreaterThanOrEqual(600);

    // Le widget pilote ces états via l'attribut `hidden`. Un autre onglet
    // timer peut envoyer un état sur le canal pendant ce test : on pose
    // l'attribut nous-mêmes pour vérifier la règle CSS extraite, sans dépendre
    // du mode courant.
    const hiddenStates = await page.evaluate(() => {
      const display = (selector: string, hidden: boolean) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (!el) return null;
        if (hidden) el.setAttribute('hidden', '');
        else el.removeAttribute('hidden');
        return getComputedStyle(el).display;
      };
      return {
        presetsHidden: display('.tw__presets', true),
        ringHidden: display('.tw__ring', true),
        lapsHidden: display('.tw__laps', true),
        presetsShown: display('.tw__presets', false),
        lapsShown: display('.tw__laps', false),
      };
    });
    expect(hiddenStates.presetsHidden).toBe('none');
    expect(hiddenStates.ringHidden).toBe('none');
    expect(hiddenStates.lapsHidden).toBe('none');
    expect(hiddenStates.presetsShown).not.toBe('none');
    expect(hiddenStates.lapsShown).not.toBe('none');
  });
}
