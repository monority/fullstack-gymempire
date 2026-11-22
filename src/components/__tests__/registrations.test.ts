// @vitest-environment jsdom
/**
 * Les modules de registration sont des points d'entrée clients : sans ces
 * tests leur couverture était de 0 %. On vérifie qu'ils s'exécutent sans
 * erreur et enregistrent bien un composant Alpine.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ data: vi.fn() }));
vi.mock('../../lib/alpine', () => ({
  registerAlpine: (name: string, factory: () => unknown) => mocks.data(name, factory),
  getAlpine: () => null,
  installAlpineLifecycle: () => {},
  registerStore: () => {},
}));

import { registerBuilder } from '../builder/registration';
import { registerCalendar } from '../calendar/registration';
import { registerDashboard } from '../dashboard/registration';
import { registerExercises } from '../exercises/registration';
import { registerTrends } from '../exercises/trendsRegistration';
import { registerLogin } from '../layout/loginRegistration';
import { registerRecords } from '../progression/recordsRegistration';
import { registerPrintSheet } from '../session-detail/printRegistration';
import { registerSessionDetail } from '../session-detail/registration';
import { registerCompare } from '../sessions/compareRegistration';
import { registerQuick } from '../sessions/quickRegistration';
import { registerSessions } from '../sessions/sessionsRegistration';
import { registerSettings } from '../settings/registration';

const registrations = [
  ['builder', registerBuilder],
  ['calendar', registerCalendar],
  ['dashboard', registerDashboard],
  ['exercises', registerExercises],
  ['trends', registerTrends],
  ['login', registerLogin],
  ['records', registerRecords],
  ['print', registerPrintSheet],
  ['detail', registerSessionDetail],
  ['compare', registerCompare],
  ['quick', registerQuick],
  ['sessions', registerSessions],
  ['settings', registerSettings],
] as const;

describe('registrations Alpine', () => {
  beforeEach(() => {
    mocks.data.mockClear();
    document.documentElement.setAttribute('lang', 'fr');
  });

  it.each(registrations)('%s enregistre un composant sans erreur', (_name, register) => {
    expect(() => register()).not.toThrow();
    expect(mocks.data).toHaveBeenCalled();
    const [, factory] = mocks.data.mock.calls[0];
    expect(typeof factory).toBe('function');
  });
});
