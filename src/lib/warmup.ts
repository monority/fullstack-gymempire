/**
 * Échauffement — règle unique partagée entre le builder de séance
 * (SessionSet) et la table d'ajout rapide (AddSetRow).
 */
export const WARMUP_PERCENTS = [0.4, 0.6, 0.8] as const;
export const WARMUP_REPS = [12, 8, 5] as const;

export interface WarmupValue {
  weight: number;
  reps: number;
}

/** Valeurs d'échauffement dérivées de la charge de travail maximale. */
export function warmupValues(maxWeight: number): WarmupValue[] {
  return WARMUP_PERCENTS.map((percent, i) => ({
    weight: Math.round(maxWeight * percent),
    reps: WARMUP_REPS[i],
  }));
}

/** Vrai si au moins une série de travail/top porte une charge > 0. */
export function isWorkingSet(set: { type?: string; weight?: number | string }): boolean {
  const weight = typeof set.weight === 'string' ? Number(set.weight) : set.weight;
  return (set.type === 'work' || set.type === 'top') && typeof weight === 'number' && weight > 0;
}
