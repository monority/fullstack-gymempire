// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { EXERCISE_TIPS } from '../exercise-tips';
import { EXERCISE_TIPS_EN } from '../../i18n/exercise-tips-en';
import { getExerciseTip, getExerciseTipText } from '../exercise-tips';

describe('coaching tips localisés', () => {
  it('couvre tous les exercices dans les deux langues', () => {
    expect(Object.keys(EXERCISE_TIPS).sort()).toEqual(Object.keys(EXERCISE_TIPS_EN).sort());
    expect(Object.keys(EXERCISE_TIPS)).toHaveLength(90);
  });

  it('retourne le tip FR par défaut et le tip EN quand demandé', () => {
    const fr = getExerciseTipText('Squat barre', 'fr');
    const en = getExerciseTipText('Squat barre', 'en');
    expect(fr).toContain('Genoux');
    expect(en).toContain('Brace your core');
    expect(en).not.toBe(fr);
  });

  it('ne laisse pas de texte français dans les tips EN', () => {
    const frenchWords = [
      '\bles\b',
      '\bdes\b',
      '\bpour\b',
      '\bavec\b',
      '\bgarder\b',
      '\bpas\b',
      '\bdu\b',
      '\bla\b',
    ];
    for (const [name, text] of Object.entries(EXERCISE_TIPS_EN)) {
      for (const word of frenchWords) {
        expect(new RegExp(word, 'i').test(text), `${name} contient « ${word} »`).toBe(false);
      }
    }
  });

  it('conserve la vidéo et la structure du tip', () => {
    const tip = getExerciseTip('Développé couché barre', 'en');
    expect(tip?.videoUrl).toContain('youtube.com');
    expect(tip?.muscles).toBe('');
    expect(tip?.mistakes).toBe('');
  });
});
