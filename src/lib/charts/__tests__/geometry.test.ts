// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { gridLine, plotArea, svgRoot } from '../geometry';

describe('plotArea', () => {
  it('dérive la zone de tracé des dimensions et des marges', () => {
    const area = plotArea(1000, 260, { left: 50, right: 30, top: 30, bottom: 50 });
    expect(area).toEqual({
      width: 920,
      height: 180,
      left: 50,
      top: 30,
      right: 970,
      bottom: 210,
      baselineY: 210,
    });
    // baselineY = top + height = H - bottom.
    expect(area.baselineY).toBe(area.top + area.height);
    expect(area.baselineY).toBe(260 - 50);
  });
});

describe('svgRoot', () => {
  it('produit la balise commune avec la classe et le libellé', () => {
    expect(svgRoot(480, 280, 'stats__chart', 'Fréquence')).toBe(
      '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="stats__chart" role="img" aria-label="Fréquence">'
    );
  });
});

describe('gridLine', () => {
  it('trace une ligne horizontale sur toute la zone de tracé', () => {
    const area = plotArea(1000, 260, { left: 50, right: 30, top: 30, bottom: 50 });
    expect(gridLine(area, 120.04, 'var(--color-border)')).toBe(
      '<line x1="50" y1="120.0" x2="970" y2="120.0" stroke="var(--color-border)" stroke-width="1"/>'
    );
  });
});
