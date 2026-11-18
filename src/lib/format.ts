/**
 * format — Shared date/number formatting utilities.
 *
 * Consolidates the 7+ duplicated formatDate/formatNumber/formatVolume
 * implementations across pages into a single source of truth.
 */

import { DATE_LOCALE } from '../i18n';
import { getSettings } from './storage/settings';
import {
  roundForUnit,
  toDisplayWeight,
  unitLabel,
  fromInputWeight,
  type WeightUnit,
} from './units';

/** Unité préférée de l'utilisateur (kg par défaut). */
export function currentUnit(): WeightUnit {
  return getSettings().unit === 'lbs' ? 'lbs' : 'kg';
}

/** "lundi 12 août 2025" — full date + weekday. */
export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const loc = DATE_LOCALE();
  const date = d.toLocaleDateString(loc, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return date.charAt(0).toUpperCase() + date.slice(1);
}

/** "lundi 12 août 2025 · 14:30" — full date + time. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const loc = DATE_LOCALE();
  const date = d.toLocaleDateString(loc, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(loc, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return date.charAt(0).toUpperCase() + date.slice(1) + ' · ' + time;
}

/** "12 août 2025" — date without time. */
export function formatDateMedium(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DATE_LOCALE(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "12 août 2025" — date with short month, always includes the year. */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DATE_LOCALE(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "12 août" — day + month only. */
export function formatDateDayMonth(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DATE_LOCALE(), {
    day: 'numeric',
    month: 'short',
  });
}

/** Time-only "14:30". */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(DATE_LOCALE(), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Locale-formatted integer: "1 234". */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat(DATE_LOCALE()).format(Math.round(n));
}

/** Locale-formatted number, returns "0" for ≤0. */
export function formatNumPositive(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  return Math.round(n).toLocaleString(DATE_LOCALE());
}

/**
 * Volume stocké en kg, affiché dans l'unité courante.
 * formatVolume(100, 'lbs') → "220 lbs".
 */
export function formatVolume(kg: number, unit: WeightUnit = currentUnit()): string {
  const label = unitLabel(unit);
  if (!Number.isFinite(kg) || kg <= 0) return `0 ${label}`;
  const value = roundForUnit(toDisplayWeight(kg, unit), unit);
  return (
    value.toLocaleString(DATE_LOCALE(), {
      minimumFractionDigits: unit === 'lbs' && !Number.isInteger(value) ? 1 : 0,
      maximumFractionDigits: 1,
    }) + ` ${label}`
  );
}

/** Valeur de poids sans unité, convertie pour l'affichage. */
export function formatWeightValue(kg: number, unit: WeightUnit = currentUnit()): string {
  if (!Number.isFinite(kg) || kg <= 0) return '0';
  // Valeur brute de saisie/affichage : une décimale dans les deux unités.
  const value = Math.round(toDisplayWeight(kg, unit) * 10) / 10;
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

/**
 * Poids avec unité. La valeur fournie est toujours du kg stocké.
 * formatWeight(80, 'kg') → "80 kg", formatWeight(80, 'lbs') → "176 lbs".
 */
export function formatWeight(kg: number, unit: WeightUnit = currentUnit()): string {
  const label = unitLabel(unit);
  if (!Number.isFinite(kg) || kg <= 0) return `0 ${label}`;
  const value = roundForUnit(toDisplayWeight(kg, unit), unit);
  return `${value.toLocaleString(DATE_LOCALE(), { maximumFractionDigits: 1 })} ${label}`;
}

/** Valeur saisie (dans l'unité affichée) → kg à persister. */
export function weightFromInput(value: number, unit: WeightUnit = currentUnit()): number {
  return fromInputWeight(value, unit);
}

/** Duration in seconds → "2h 15min" or "15min 30s". */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

/** Duration with zero-padded segments → "2h 05m", "5m 03s". Returns "—" for invalid. */
export function formatDurationShort(seconds?: number): string {
  if (!seconds || seconds <= 0) return '\u2014';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

/** "12 août 2025 · 14:30" — date with short month + time. */
export function formatDateCompact(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const time = d.toLocaleTimeString(DATE_LOCALE(), {
    hour: '2-digit',
    minute: '2-digit',
  });
  return formatDateShort(iso) + ' \u00b7 ' + time;
}
