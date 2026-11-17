/**
 * mood — icônes et libellés d'humeur.
 *
 * Les icônes viennent du registre central `icons` pour rester cohérentes
 * avec le reste de l'UI. Les libellés sont fournis par l'appelant : ce module
 * pur ne contient aucune locale.
 */

import { icons } from './icons';
import type { SessionMood } from './storage/types';

export type { SessionMood };

export interface MoodLabels {
  great: string;
  good: string;
  ok: string;
  tired: string;
  bad: string;
}

/** SVG d'humeur, ou chaîne vide si aucune humeur. */
export function moodSvg(mood: SessionMood | undefined | null): string {
  if (!mood) return '';
  if (mood === 'great') return icons.smile();
  if (mood === 'good') return icons.heart();
  if (mood === 'ok') return icons.meh();
  if (mood === 'tired') return icons.frown();
  return icons.bed();
}

/** Libellé localisé de l'humeur. */
export function moodLabel(mood: SessionMood | undefined | null, labels: MoodLabels): string {
  if (!mood) return '';
  if (mood === 'great') return labels.great;
  if (mood === 'good') return labels.good;
  if (mood === 'ok') return labels.ok;
  if (mood === 'tired') return labels.tired;
  return labels.bad;
}
