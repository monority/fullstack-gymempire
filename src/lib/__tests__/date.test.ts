// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { localDateKey, parseLocalDate } from '../date';

describe('parseLocalDate', () => {
  it('parse YYYY-MM-DD en heure locale (pas en UTC)', () => {
    const d = parseLocalDate('2026-11-17');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(17);
    expect(d.getHours()).toBe(0);
    // La clé locale doit être identique à l'entrée, quel que soit le TZ.
    expect(localDateKey(d)).toBe('2026-11-17');
  });

  it('conserve les ISO complets', () => {
    const d = parseLocalDate('2026-11-17T10:00:00.000Z');
    expect(d.toISOString()).toBe('2026-11-17T10:00:00.000Z');
  });

  it('garde le dimanche comme début de semaine cohérent', () => {
    // 17 nov 2026 = mardi → getDay() = 2 dans tous les fuseaux.
    expect(parseLocalDate('2026-11-17').getDay()).toBe(2);
  });
});
