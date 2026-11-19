// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { cssVar, cssVarAlpha } from '../css-var';

describe('cssVarAlpha', () => {
  it('normalise une valeur hsl avec virgules avant d’ajouter l’alpha', () => {
    document.documentElement.style.setProperty('--test-accent', 'hsl(30, 100%, 66%)');
    expect(cssVar('--test-accent')).toBe('hsl(30, 100%, 66%)');
    expect(cssVarAlpha('--test-accent', 0.08)).toBe('hsl(30 100% 66% / 0.08)');
  });

  it('ajoute l’alpha à une valeur hsl déjà normalisée', () => {
    document.documentElement.style.setProperty('--test-accent', 'hsl(30 100% 66%)');
    expect(cssVarAlpha('--test-accent', 0.55)).toBe('hsl(30 100% 66% / 0.55)');
  });

  it('laisse une valeur hex inchangée (pas de slash possible)', () => {
    document.documentElement.style.setProperty('--test-accent', '#f59a3d');
    expect(cssVarAlpha('--test-accent', 0.08)).toBe('#f59a3d');
  });
});
