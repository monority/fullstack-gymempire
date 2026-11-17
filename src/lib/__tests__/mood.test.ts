import { describe, expect, it } from 'vitest';
import { moodLabel, moodSvg, type MoodLabels } from '../mood';

const labels: MoodLabels = {
  great: 'Great',
  good: 'Good',
  ok: 'Okay',
  tired: 'Tired',
  bad: 'Bad',
};

describe('mood', () => {
  it('returns no visual for a missing mood', () => {
    expect(moodSvg(null)).toBe('');
    expect(moodSvg(undefined)).toBe('');
    expect(moodLabel(null, labels)).toBe('');
  });

  it('uses the central icon registry', () => {
    for (const mood of ['great', 'good', 'ok', 'tired', 'bad'] as const) {
      const svg = moodSvg(mood);
      expect(svg).toContain('<svg');
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('stroke="currentColor"');
    }
    // Chaque humeur a un dessin distinct.
    const drawings = (['great', 'good', 'ok', 'tired', 'bad'] as const).map(moodSvg);
    expect(new Set(drawings).size).toBe(5);
  });

  it('returns the caller locale instead of hardcoded French', () => {
    expect(moodLabel('great', labels)).toBe('Great');
    expect(moodLabel('bad', labels)).toBe('Bad');
    expect(moodLabel('tired', { ...labels, tired: 'Fatigué' })).toBe('Fatigué');
  });
});
