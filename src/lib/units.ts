/**
 * units — conversion des poids.
 *
 * Le stockage est TOUJOURS en kilogrammes (canonique). On ne convertit
 * qu'à l'affichage et à la saisie : changer l'unité préférée ne modifie
 * donc aucune donnée existante et reste réversible.
 */

export type WeightUnit = 'kg' | 'lbs';

/** 1 lb = 0,45359237 kg (définition internationale). */
export const KG_PER_LB = 0.45359237;

/** Nombre de décimales affichées pour une unité. */
export const DECIMALS: Record<WeightUnit, number> = { kg: 0, lbs: 1 };

/** kg stocké → valeur dans l'unité demandée. */
export function toDisplayWeight(kg: number, unit: WeightUnit = 'kg'): number {
  if (!Number.isFinite(kg)) return 0;
  return unit === 'lbs' ? kg / KG_PER_LB : kg;
}

/** Valeur saisie dans l'unité demandée → kg stocké. */
export function fromInputWeight(value: number, unit: WeightUnit = 'kg'): number {
  if (!Number.isFinite(value)) return 0;
  return unit === 'lbs' ? value * KG_PER_LB : value;
}

/** Arrondit selon l'unité, puis supprime les zéros inutiles. */
export function roundForUnit(value: number, unit: WeightUnit): number {
  const factor = 10 ** DECIMALS[unit];
  return Math.round(value * factor) / factor;
}

/** Libellé court de l'unité. */
export function unitLabel(unit: WeightUnit): string {
  return unit === 'lbs' ? 'lbs' : 'kg';
}
