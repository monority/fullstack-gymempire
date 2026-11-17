import { describe, expect, it } from 'vitest';
import {
  DECIMALS,
  KG_PER_LB,
  fromInputWeight,
  roundForUnit,
  toDisplayWeight,
  unitLabel,
} from '../units';
import { formatVolume, formatWeight, formatWeightValue, weightFromInput } from '../format';

describe('units (F1)', () => {
  it('converts kg ↔ lbs with the international factor', () => {
    expect(KG_PER_LB).toBe(0.45359237);
    expect(toDisplayWeight(100, 'lbs')).toBeCloseTo(220.4623, 3);
    expect(fromInputWeight(220.4623, 'lbs')).toBeCloseTo(100, 3);
    expect(toDisplayWeight(80, 'kg')).toBe(80);
  });

  it('rounds according to the unit', () => {
    expect(DECIMALS).toEqual({ kg: 0, lbs: 1 });
    expect(roundForUnit(80.4, 'kg')).toBe(80);
    expect(roundForUnit(80.46, 'lbs')).toBe(80.5);
    expect(unitLabel('lbs')).toBe('lbs');
    expect(unitLabel('kg')).toBe('kg');
  });

  it('keeps the default kg output unchanged', () => {
    expect(formatVolume(1234).replace(/\u202f/g, ' ')).toBe('1 234 kg');
    expect(formatWeight(80)).toBe('80 kg');
    expect(formatWeightValue(80.5)).toBe('80.5');
    expect(weightFromInput(80)).toBe(80);
  });

  it('formats stored kg in the chosen unit', () => {
    expect(formatVolume(100, 'lbs')).toMatch(/^220[.,]5 lbs$/);
    expect(formatWeight(100, 'lbs')).toMatch(/^220[.,]5 lbs$/);
    expect(formatWeightValue(100, 'lbs')).toBe('220.5');
    expect(weightFromInput(220, 'lbs')).toBeCloseTo(99.79, 1);
  });

  it('handles invalid values in both units', () => {
    expect(formatVolume(Number.NaN, 'lbs')).toBe('0 lbs');
    expect(formatWeight(0, 'kg')).toBe('0 kg');
    expect(formatWeightValue(-5, 'lbs')).toBe('0');
    expect(fromInputWeight(Number.NaN, 'lbs')).toBe(0);
  });
});
