import { describe, it, expect } from 'vitest';
import { createPlateCalculator, type CalculatorLabels } from '../plateCalculator';

const LABELS: CalculatorLabels = {
  invalidTarget: 'Cible invalide',
  targetBelowBar: 'Cible sous la barre ({target} < {bar})',
  targetBelowDumbbellBar: 'Cible sous la barre haltère',
  invalidBarWeight: 'Barre invalide',
  formulaBar: 'Barre',
  formulaPlates: 'Disques',
  perSideTitle: 'Par côté',
  dumbbellsToUse: 'Haltères à utiliser',
  barbellAriaPrefix: 'Barre :',
  platesPerSide: 'disques par côté',
  dumbbellsToTake: 'haltères à prendre',
};

function calc() {
  return createPlateCalculator({ labels: LABELS });
}

describe('createPlateCalculator (D0 pattern)', () => {
  it('starts in bar mode with default target 80 / bar 20', () => {
    const c = calc();
    expect(c.mode).toBe('bar');
    expect(c.target).toBe(80);
    expect(c.errorMessage).toBeNull();
    expect(c.perSide).toBe(30);
  });

  it('returns plates per side without error for a reachable target', () => {
    const c = calc();
    expect(c.platesPerSide.length).toBeGreaterThan(0);
    expect(c.remainder).toBeGreaterThanOrEqual(0);
    expect(c.plateBreakdown.length).toBeGreaterThan(0);
  });

  it('reports targetBelowBar with the formatted template', () => {
    const c = calc();
    c.target = 10;
    expect(c.errorMessage).toBe('Cible sous la barre (10 < 20)');
    expect(c.platesPerSide).toEqual([]);
    expect(c.remainder).toBe(0);
  });

  it('reports invalid target for NaN or negative values', () => {
    const c = calc();
    c.target = Number.NaN;
    expect(c.errorMessage).toBe('Cible invalide');
    c.target = -5;
    expect(c.errorMessage).toBe('Cible invalide');
  });

  it('dumbbell mode: computes weight, pair and remainder', () => {
    const c = calc();
    c.mode = 'dumbbell';
    c.target = 22;
    c.dumbbellBarWeight = 2;
    expect(c.errorMessage).toBeNull();
    expect(c.dumbbellWeight).toBe(22);
    expect(c.dumbbellsToShow).toEqual([22, 22]);
    expect(c.dumbbellSummary).toContain('= 22');
    expect(c.resultTitle).toBe('Haltères à utiliser');
  });

  it('returns 0-weight dumbbells as empty display', () => {
    const c = calc();
    c.mode = 'dumbbell';
    c.target = 0;
    expect(c.errorMessage).toBeNull();
    expect(c.dumbbellsToShow).toEqual([]);
    expect(c.dumbbellSummary).toBe('—');
  });

  it('aria labels are composed from labels and computed values', () => {
    const c = calc();
    expect(c.barbellAria).toContain('Barre :');
    c.mode = 'dumbbell';
    c.target = 22;
    expect(c.dumbbellsAria).toBe('2 haltères à prendre');
  });
});
