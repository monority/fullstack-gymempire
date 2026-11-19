// @vitest-environment jsdom
/**
 * Tests du profil démo : génération de données fictives, connexion en
 * lecture seule et verrou des écritures (src/lib/demo-account.ts, seed.ts,
 * auth.ts et storage/store.ts).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { getAuth, isDemoAccount, setAuth } from '../auth';
import {
  DEMO_BACKUP_KEY,
  DEMO_EMAIL,
  DEMO_NAME,
  loginWithDemoAccount,
  logoutFromDemoAccount,
} from '../demo-account';
import { generateDemoData } from '../seed';
import { STORAGE_KEYS } from '../storage/defaults';
import { getStore, setStore, withUnlockedWrites } from '../storage/store';

afterEach(() => {
  window.localStorage.clear();
});

describe('generateDemoData', () => {
  it('remplit un historique réaliste et retourne un résumé cohérent', () => {
    const summary = generateDemoData();

    expect(summary.sessions).toBeGreaterThan(20);
    expect(summary.completed).toBeGreaterThan(20);
    expect(summary.inProgress).toBe(1);
    expect(summary.planned).toBe(1);
    expect(summary.progressRecords).toBeGreaterThan(0);
    expect(summary.bodyRecords).toBeGreaterThan(0);
    expect(summary.exercises).toBeGreaterThan(0);
    expect(summary.demoSessionId).not.toBe('');
    expect(summary.compareId1).not.toBe('');
    expect(summary.compareId2).not.toBe('');

    const sessions = getStore<Array<{ status: string }>>(STORAGE_KEYS.sessions, []);
    expect(sessions).toHaveLength(summary.sessions);

    const body = getStore<Array<{ weight: number }>>(STORAGE_KEYS.body, []);
    expect(body).toHaveLength(summary.bodyRecords);
    expect(body[0].weight).toBeLessThan(body[body.length - 1].weight);

    const settings = getStore<{ pseudo: string; email: string }>(STORAGE_KEYS.settings, {
      pseudo: '',
      email: '',
    });
    expect(settings.pseudo).toBe('Alex');
    expect(settings.email).toBe(DEMO_EMAIL);
  });
});

describe('loginWithDemoAccount', () => {
  it('génère les données puis connecte un compte démo', () => {
    loginWithDemoAccount();

    expect(getAuth()).toEqual({ email: DEMO_EMAIL, name: DEMO_NAME, demo: true });
    expect(isDemoAccount()).toBe(true);
    expect(getStore<unknown[]>(STORAGE_KEYS.sessions, []).length).toBeGreaterThan(0);
  });
});

describe('verrou des écritures en compte démo', () => {
  it('neutralise setStore après la connexion démo', () => {
    loginWithDemoAccount();
    setStore(STORAGE_KEYS.sessions, []);
    expect(getStore<unknown[]>(STORAGE_KEYS.sessions, [])).not.toHaveLength(0);
  });

  it('autorise les écritures dans withUnlockedWrites puis les re-verrouille', () => {
    setAuth(DEMO_EMAIL, DEMO_NAME, true);
    withUnlockedWrites(() => setStore(STORAGE_KEYS.sessions, []));
    expect(getStore<unknown[]>(STORAGE_KEYS.sessions, [])).toHaveLength(0);

    setStore(STORAGE_KEYS.sessions, [{ id: 'nope' }]);
    expect(getStore<unknown[]>(STORAGE_KEYS.sessions, [])).toHaveLength(0);
  });

  it('laisse les écritures passer pour un compte normal', () => {
    setAuth('user@example.com', 'Alice');
    setStore(STORAGE_KEYS.sessions, [{ id: 'ok' }]);
    expect(getStore<Array<{ id: string }>>(STORAGE_KEYS.sessions, [])).toEqual([{ id: 'ok' }]);
  });
});

describe('sauvegarde et restauration autour de la démo', () => {
  it('sauvegarde les données réelles avant de charger le jeu démo', () => {
    setAuth('user@example.com', 'Alice');
    setStore(STORAGE_KEYS.sessions, [{ id: 'reelle', date: '2026-01-01' }]);
    setStore(STORAGE_KEYS.settings, { pseudo: 'Alice', email: 'user@example.com' });

    loginWithDemoAccount();

    const raw = window.localStorage.getItem(DEMO_BACKUP_KEY);
    expect(raw).not.toBeNull();
    const snapshot = JSON.parse(raw as string) as {
      sessions: Array<{ id: string }>;
      settings: { pseudo: string };
    };
    expect(snapshot.sessions.map((s) => s.id)).toContain('reelle');
    expect(snapshot.settings.pseudo).toBe('Alice');
  });

  it('restaure les données réelles et déconnecte à la sortie de démo', () => {
    setAuth('user@example.com', 'Alice');
    setStore(STORAGE_KEYS.sessions, [{ id: 'reelle', date: '2026-01-01' }]);
    loginWithDemoAccount();
    expect(getStore<Array<{ id: string }>>(STORAGE_KEYS.sessions, [])[0].id).not.toBe('reelle');

    expect(logoutFromDemoAccount()).toBe(true);

    expect(getAuth()).toBeNull();
    const restored = getStore<Array<{ id: string; date: string }>>(STORAGE_KEYS.sessions, []);
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe('reelle');
    expect(restored[0].date).toBe('2026-01-01');
    expect(window.localStorage.getItem(DEMO_BACKUP_KEY)).toBeNull();
  });

  it('ne touche pas à une session normale', () => {
    setAuth('user@example.com', 'Alice');
    setStore(STORAGE_KEYS.sessions, [{ id: 'reelle', date: '2026-01-01' }]);

    expect(logoutFromDemoAccount()).toBe(false);

    expect(getAuth()?.email).toBe('user@example.com');
    expect(getStore<Array<{ id: string }>>(STORAGE_KEYS.sessions, [])).toEqual([
      { id: 'reelle', date: '2026-01-01' },
    ]);
  });

  it('déconnecte quand même si la sauvegarde est corrompue', () => {
    setAuth(DEMO_EMAIL, DEMO_NAME, true);
    window.localStorage.setItem(DEMO_BACKUP_KEY, '{pas du json');

    expect(logoutFromDemoAccount()).toBe(true);

    expect(getAuth()).toBeNull();
    expect(window.localStorage.getItem(DEMO_BACKUP_KEY)).toBeNull();
  });
});
