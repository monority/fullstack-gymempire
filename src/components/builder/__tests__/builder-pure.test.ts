// @vitest-environment jsdom
/** Tests des parcours critiques du builder : sauvegarde, brouillon, édition, séries. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../../../lib/storage/defaults';
import { setStore } from '../../../lib/storage/store';
import { setAuth, clearAuth } from '../../../lib/auth';
import type { Session } from '../../../lib/storage/types';
import type { BuilderExercise } from '../../../lib/session-builder-stats';

import {
  buildPayload,
  buildSupersets,
  cleanExercises,
  persistTransientExercises,
  shouldConfirmDiscard,
} from '../sessionSave';
import { clearBuilderDraft, loadBuilderDraft, saveBuilderDraft } from '../builderDraft';
import { loadEditSession } from '../editSessionLoader';
import { exerciseCard } from '../exerciseCard';

const DRAFT_KEY = 'muscu:builder-draft';

function set(id: string, opts: Partial<Session['exercises'][number]['sets'][number]> = {}) {
  return {
    exerciseId: id,
    setNumber: 1,
    type: 'work' as const,
    weight: 80,
    reps: 8,
    completed: false,
    ...opts,
  };
}

function ex(id: string, supersetId: number | null = null): BuilderExercise {
  return {
    exerciseId: id,
    name: id,
    muscle: 'Pectoraux',
    sets: [set(id)],
    supersetId,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  clearAuth();
  vi.restoreAllMocks();
});

afterEach(() => {
  window.localStorage.clear();
  clearAuth();
});

describe('sessionSave — payload', () => {
  it('n’écrit que les champs renseignés et conserve les supersets', () => {
    const exercises = [ex('template:a', 1), ex('template:b', 1)];
    const idMap = new Map([
      ['template:a', 'real-a'],
      ['template:b', 'real-b'],
    ]);
    const payload = buildPayload({
      name: '  Ma séance  ',
      date: '2026-11-25',
      exercises,
      rpe: null,
      fatigue: 0,
      mood: '',
      notes: '  ',
      editSessionId: null,
      idMap,
    });

    expect(payload.name).toBe('Ma séance');
    expect(payload.status).toBe('planned');
    expect(payload.rpe).toBeUndefined();
    expect(payload.fatigue).toBeUndefined();
    expect(payload.mood).toBeUndefined();
    expect(payload.notes).toBeUndefined();
    expect(payload.exercises.map((e) => e.exerciseId)).toEqual(['real-a', 'real-b']);
    expect(payload.supersets).toEqual([{ exercises: ['real-a', 'real-b'] }]);
  });

  it('persiste les exercices temporaires une seule fois et réécrit les ids des séries', () => {
    const exercises = [ex('template:x'), ex('template:x')];
    const idMap = persistTransientExercises(exercises);
    expect(idMap.size).toBe(1);

    const cleaned = cleanExercises(exercises, idMap);
    expect(cleaned).toHaveLength(2);
    for (const e of cleaned) {
      expect(e.exerciseId).toBe(idMap.get('template:x'));
      expect(e.sets[0].exerciseId).toBe(idMap.get('template:x'));
    }
  });

  it('ignore les groupes de supersets d’un seul exercice', () => {
    expect(buildSupersets([ex('a', 1), ex('b', 2)], new Map())).toEqual([]);
  });

  it('demande confirmation dès qu’il y a une saisie', () => {
    expect(shouldConfirmDiscard(0, '   ')).toBe(false);
    expect(shouldConfirmDiscard(1, '')).toBe(true);
    expect(shouldConfirmDiscard(0, 'Nom')).toBe(true);
  });
});

describe('builderDraft — garde démo', () => {
  const draft = {
    name: 'Brouillon',
    date: '2026-11-25',
    exercises: [ex('a')],
    rpe: null as number | null,
    fatigue: 0,
    mood: '' as const,
    notes: '',
  };

  it('sauvegarde et recharge un brouillon', () => {
    saveBuilderDraft(draft);
    const loaded = loadBuilderDraft();
    expect(loaded?.name).toBe('Brouillon');
    expect(loaded?.exercises).toHaveLength(1);
    expect(typeof loaded?.savedAt).toBe('number');

    clearBuilderDraft();
    expect(loadBuilderDraft()).toBeNull();
  });

  it('n’écrit rien en compte démo', () => {
    setAuth('alex@demo.fr', 'Alex', true);
    saveBuilderDraft(draft);
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('ignore un brouillon corrompu', () => {
    window.localStorage.setItem(DRAFT_KEY, '{ invalide');
    expect(loadBuilderDraft()).toBeNull();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: 'x' }));
    expect(loadBuilderDraft()).toBeNull();
  });
});

describe('editSessionLoader', () => {
  it('charge une séance existante sans inventer de RPE et réinitialise les séries', () => {
    const session: Session = {
      id: 'edit-1',
      name: 'À éditer',
      date: '2026-11-25T18:30:00.000Z',
      status: 'completed',
      exercises: [ex('a')],
      supersets: [{ exercises: ['a'] }],
    };
    setStore(STORAGE_KEYS.sessions, [session]);

    const data = loadEditSession('edit-1');
    expect(data).not.toBeNull();
    expect(data?.rpe).toBeNull();
    expect(data?.date).toBe('2026-11-25');
    expect(data?.exercises[0].supersetId).toBe(1);
    expect(data?.exercises[0].sets[0].completed).toBe(false);
    expect(loadEditSession('inconnu')).toBeNull();
  });
});

describe('exerciseCard — CRUD des séries et listeners', () => {
  it('ajoute, renumérote et supprime des séries', () => {
    const card = exerciseCard(ex('a'), 0);
    card.addSet();
    card.addSet();
    expect(card.exercise.sets.map((s) => s.setNumber)).toEqual([1, 2, 3]);

    card.removeSet(1);
    expect(card.exercise.sets.map((s) => s.setNumber)).toEqual([1, 2]);

    card.removeSet(0);
    card.removeSet(0);
    expect(card.exercise.sets).toHaveLength(1);
    card.removeSet(0);
    expect(card.exercise.sets).toHaveLength(1);
  });

  it('retire ses listeners window à la destruction', () => {
    const before = vi.spyOn(window, 'addEventListener');
    const after = vi.spyOn(window, 'removeEventListener');
    const card = exerciseCard(ex('a'), 0);

    card.init();
    expect(card.expanded).toBe(true);
    expect(before).toHaveBeenCalledWith('builder:expand-all', expect.any(Function));
    expect(before).toHaveBeenCalledWith('builder:collapse-all', expect.any(Function));

    card.destroy();
    expect(after).toHaveBeenCalledWith('builder:expand-all', expect.any(Function));
    expect(after).toHaveBeenCalledWith('builder:collapse-all', expect.any(Function));
  });
});
