// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatDateShort, formatDateLong, formatDateMedium } from '../format';

describe('formatage des dates stockées', () => {
  it('une date YYYY-MM-DD reste sur le même jour civil', () => {
    // 17 nov 2026 : sans parseLocalDate, new Date() donnerait 16 nov en UTC-5.
    const short = formatDateShort('2026-11-17');
    expect(short).toContain('17');
    const long = formatDateLong('2026-11-17');
    expect(long).toContain('17');
  });
  it('ne renvoie jamais la chaîne brute pour une date invalide (XSS)', () => {
    const hostile = '<img src=x onerror=alert(1)>';
    expect(formatDateShort(hostile)).toBe('—');
    expect(formatDateMedium(hostile)).toBe('—');
    expect(formatDateLong(hostile)).toBe('—');
  });
});
