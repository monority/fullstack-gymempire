/**
 * Brouillon local du builder — évite de perdre une séance en cours si on
 * quitte la page par erreur. Reste dans localStorage, jamais envoyé au serveur.
 */
import { isDemoAccount } from '../../lib/auth';
import type { SessionMood } from '../../lib/storage/types';
import type { BuilderExercise } from '../../lib/session-builder-stats';

const DRAFT_KEY = 'muscu:builder-draft';

export interface BuilderDraft {
  name: string;
  date: string;
  exercises: BuilderExercise[];
  rpe: number | null;
  fatigue: number;
  mood: SessionMood | '';
  notes: string;
  savedAt: number;
}

export function saveBuilderDraft(draft: Omit<BuilderDraft, 'savedAt'>): void {
  // Le compte démo est en lecture seule : aucun brouillon n'est persisté.
  if (isDemoAccount()) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // stockage indisponible ou plein : le brouillon n'est pas critique
  }
}

export function loadBuilderDraft(): BuilderDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BuilderDraft;
    if (!parsed || !Array.isArray(parsed.exercises)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearBuilderDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
