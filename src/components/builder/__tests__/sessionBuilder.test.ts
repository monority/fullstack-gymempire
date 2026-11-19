import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getExercises: vi.fn(),
  getSessions: vi.fn(),
  saveSessionBuilder: vi.fn(),
  loadEditSession: vi.fn(),
  expose: vi.fn(),
  onToggle: vi.fn(),
  openDialog: vi.fn(),
  closeDialog: vi.fn(),
  dispatch: vi.fn(),
  confirm: vi.fn(),
  navigate: vi.fn(),
  focusPickerSearch: vi.fn(),
}));

vi.mock('../../../lib/storage/exercises', () => ({ getExercises: mocks.getExercises }));
vi.mock('../../../lib/storage/sessions', () => ({ getSessions: mocks.getSessions }));
vi.mock('../sessionSave', () => ({
  saveSessionBuilder: mocks.saveSessionBuilder,
  shouldConfirmDiscard: (count: number, name: string) => count > 0 || Boolean(name),
}));
vi.mock('../editSessionLoader', () => ({ loadEditSession: mocks.loadEditSession }));

import { createSessionBuilderApp } from '../sessionBuilder';
import type { Exercise } from '../../../lib/storage/types';
import type { BuilderLabels } from '../builderLabels';
import type { SessionMetaLabels } from '../sessionMeta';

const labels = {
  discardConfirm: 'Discard changes?',
  saveSession: 'Save',
  rpeEasy: 'Easy',
  rpeModerate: 'Moderate',
  rpeHard: 'Hard',
  rpeMax: 'Max',
} as unknown as BuilderLabels & SessionMetaLabels;

const rpeLabels = {
  rpeEasy: 'Easy',
  rpeModerate: 'Moderate',
  rpeHard: 'Hard',
  rpeMax: 'Max',
} as SessionMetaLabels;

function exercise(id: string, name = nameFor(id)): Exercise {
  return {
    id,
    name,
    muscle: 'Cuisses',
    category: 'Barre',
    createdAt: '2026-01-01',
  } as Exercise;
}

function nameFor(id: string) {
  return id === 'e1' ? 'Squat' : 'Bench';
}

function create(search = '') {
  const app = createSessionBuilderApp({
    labels,
    rpeLabels,
    search,
    today: () => '2026-11-17',
    locale: 'fr-FR',
    localizedPath: (p) => p,
    host: {
      expose: mocks.expose,
      onToggle: mocks.onToggle,
      openDialog: mocks.openDialog,
      closeDialog: mocks.closeDialog,
      dispatch: mocks.dispatch,
      confirm: mocks.confirm,
      navigate: mocks.navigate,
      focusPickerSearch: mocks.focusPickerSearch,
    },
  });
  return { app };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getExercises.mockReturnValue([exercise('e1'), exercise('e2')]);
  mocks.getSessions.mockReturnValue([]);
  mocks.confirm.mockReturnValue(true);
});

describe('createSessionBuilderApp', () => {
  it('loads the catalog and exposes it to the picker', () => {
    const { app } = create();
    app.init();
    expect(app.availableExercises).toHaveLength(2);
    expect(app.sessionDate).toBe('2026-11-17');
    expect(mocks.expose).toHaveBeenCalledWith([], labels);
    expect(mocks.onToggle).toHaveBeenCalledOnce();
  });

  it('validates the form before allowing a save', () => {
    const { app } = create();
    expect(app.canSave).toBe(false);
    app.sessionName = 'Séance A';
    expect(app.canSave).toBe(false);
    app.addExercise(exercise('e1'));
    // buildNewExercise crée déjà une série vide : le builder est sauvegardable.
    expect(app.canSave).toBe(true);
  });

  it('adds and removes an exercise, keeping expansion in sync', () => {
    const { app } = create();
    app.init();
    app.addExercise(exercise('e1'));
    expect(app.exercises).toHaveLength(1);
    expect(app.expandedExercises).toEqual(['e1']);

    app.toggleExpand(0);
    expect(app.expandedExercises).toEqual([]);
    app.removeExercise(0);
    expect(app.exercises).toHaveLength(0);
  });

  it('filters out exercises already in the session', () => {
    const { app } = create();
    app.init();
    app.addExercise(exercise('e1'));
    expect(app.filteredExercises.map((e) => e.id)).toEqual(['e2']);
    app.exerciseSearch = 'bench';
    expect(app.filteredExercises.map((e) => e.id)).toEqual(['e2']);
  });

  it('expands and collapses all exercises through dispatched events', () => {
    const { app } = create();
    app.init();
    app.addExercise(exercise('e1'));
    app.collapseAll();
    expect(mocks.dispatch).toHaveBeenCalledWith('builder:collapse-all');
    app.expandAll();
    expect(mocks.dispatch).toHaveBeenCalledWith('builder:expand-all');
    expect(app.allExpanded).toBe(true);
  });

  it('normalizes superset ids', () => {
    const { app } = create();
    app.init();
    app.addExercise(exercise('e1'));
    app.exercises[0].supersetId = -1;
    app.onSupersetChange(0);
    expect(app.exercises[0].supersetId).toBeNull();
    app.removeFromSuperset(0);
    expect(app.exercises[0].supersetId).toBeNull();
  });

  it('saves then navigates back to the list', () => {
    const { app } = create();
    app.sessionName = 'Séance A';
    app.addExercise({
      ...exercise('e1'),
      sets: [
        {
          exerciseId: 'e1',
          setNumber: 1,
          type: 'work',
          weight: 60,
          reps: 8,
          completed: false,
        },
      ],
    } as never);
    expect(app.canSave).toBe(true);
    app.save();
    expect(mocks.saveSessionBuilder).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith('/sessions');
  });

  it('respects a cancelled discard confirmation', () => {
    const { app } = create();
    app.sessionName = 'Brouillon';
    mocks.confirm.mockReturnValue(false);
    app.discard();
    expect(mocks.navigate).not.toHaveBeenCalled();

    mocks.confirm.mockReturnValue(true);
    app.discard();
    expect(mocks.navigate).toHaveBeenCalledWith('/sessions');
  });
});
