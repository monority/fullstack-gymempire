// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { icons } from '../icons';

describe('registre d’icônes', () => {
  it('le bouton de fermeture du menu dessine une croix visible', () => {
    const svg = icons.closeCross(20, 20);
    expect(svg).toContain('<path');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('stroke-width=');
  });

  it('aucune icône du registre n’est rendue sans trait ni remplissage', () => {
    for (const [name, render] of Object.entries(icons)) {
      if (typeof render !== 'function') continue;
      const svg = (render as (w?: number, h?: number) => string)();
      // Les icônes sont des traits : sans stroke explicite sur le <svg> ni
      // sur un enfant, elles sont invisibles (ex. closeCross).
      const hasStroke = /stroke=/.test(svg);
      const hasFill = /fill="(?!none)/.test(svg);
      expect(hasStroke || hasFill, `${name} n’a ni trait ni remplissage`).toBe(true);
    }
  });
});
