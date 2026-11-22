// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { FOCUSABLE_SELECTOR, getFocusable } from '../focus';

/** Monte du HTML et simule `offsetParent` (toujours null dans jsdom). */
function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  const visible = {} as HTMLElement;
  document.body.querySelectorAll<HTMLElement>('*').forEach((el) => {
    Object.defineProperty(el, 'offsetParent', {
      configurable: true,
      get: () => {
        let node: HTMLElement | null = el;
        while (node && node !== document.body) {
          if (node.hasAttribute('hidden')) return null;
          node = node.parentElement;
        }
        return visible;
      },
    });
  });
  return document.body.firstElementChild as HTMLElement;
}

describe('getFocusable', () => {
  it('ne retourne que les éléments focalisables visibles', () => {
    const root = mount(`
      <div>
        <a href="/a">A</a>
        <button>B</button>
        <button disabled>Disabled</button>
        <input type="hidden" />
        <div hidden><a href="/hidden">Hidden</a></div>
        <a href="/skip" tabindex="-1">Skip</a>
      </div>
    `);
    const items = getFocusable(root);
    expect(items.map((el) => el.textContent?.trim())).toEqual(['A', 'B']);
    expect(FOCUSABLE_SELECTOR).toContain('a[href]');
  });

  it('retourne un tableau vide pour un conteneur sans élément focalisable', () => {
    const root = mount('<div><p>Texte</p><span sans-focus></span></div>');
    expect(getFocusable(root)).toEqual([]);
  });
});
