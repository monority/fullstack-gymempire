import type { Page } from '@playwright/test';

export const AUTH = { email: 'qa@gymempire.test', name: 'QA' };

/** Remplace le storage avant que l'app ne se initialise. */
export async function seed(page: Page, data: Record<string, unknown> = {}) {
  await page.addInitScript(
    ({ auth, payload }) => {
      // Une seule fois par onglet : addInitScript tourne à chaque navigation.
      if (sessionStorage.getItem('__qa_seeded')) return;
      localStorage.clear();
      localStorage.setItem('muscu-auth', JSON.stringify(auth));
      for (const [key, value] of Object.entries(payload)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      sessionStorage.setItem('__qa_seeded', '1');
    },
    { auth: AUTH, payload: data }
  );
}

/** Attend qu'Alpine ait initialisé les composants x-data de la page. */
export async function waitForAlpine(page: Page) {
  await page.waitForFunction(() => {
    const root = document.querySelector<HTMLElement>('[x-data]');
    const alpine = (window as { Alpine?: unknown }).Alpine;
    return Boolean(
      alpine &&
      root &&
      Array.isArray((root as unknown as { _x_dataStack?: unknown[] })._x_dataStack)
    );
  });
}

/** Storage vide et aucun auth — pour la page de connexion. */
export async function seedNoAuth(page: Page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__qa_noauth')) return;
    localStorage.clear();
    sessionStorage.setItem('__qa_noauth', '1');
  });
}

export function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    name: 'QA Push',
    date: '2026-11-17T10:00:00.000Z',
    status: 'planned',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Développé couché barre',
        muscle: 'Pectoraux',
        sets: [
          {
            exerciseId: 'e1',
            setNumber: 1,
            type: 'work',
            weight: 60,
            reps: 8,
            completed: false,
          },
          {
            exerciseId: 'e1',
            setNumber: 2,
            type: 'work',
            weight: 60,
            reps: 8,
            completed: false,
          },
        ],
      },
    ],
    ...overrides,
  };
}
