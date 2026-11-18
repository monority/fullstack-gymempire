import { describe, it, expect } from 'vitest';
import { formatWeight, formatWeightValue } from '../format';

// single weight-formatting API in lib/format.

describe('formatWeightValue', () => {
  it('formats integer weights without decimals', () => {
    expect(formatWeightValue(80)).toBe('80');
    expect(formatWeightValue(100)).toBe('100');
  });

  it('keeps one decimal for fractional weights', () => {
    expect(formatWeightValue(80.5)).toBe('80.5');
    expect(formatWeightValue(45.36)).toBe('45.4');
  });

  it('returns "0" for zero, negative and non-finite values', () => {
    expect(formatWeightValue(0)).toBe('0');
    expect(formatWeightValue(-5)).toBe('0');
    expect(formatWeightValue(NaN)).toBe('0');
    expect(formatWeightValue(Infinity)).toBe('0');
  });
});

describe('formatWeight', () => {
  it('appends kg by default', () => {
    expect(formatWeight(80)).toBe('80 kg');
    expect(formatWeight(0)).toBe('0 kg');
  });

  it('converts stored kg to the explicit unit', () => {
    expect(formatWeight(80, 'lbs')).toMatch(/^176[.,]4 lbs$/);
    expect(formatWeight(0, 'lbs')).toBe('0 lbs');
  });

  it('rounds to the integer', () => {
    expect(formatWeight(120.4)).toBe('120 kg');
    expect(formatWeight(120.5)).toBe('121 kg');
  });
});
