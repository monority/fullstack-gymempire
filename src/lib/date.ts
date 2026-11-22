/**
 * Dates stockées sous forme `YYYY-MM-DD` (UTC ISO dans le stockage).
 * `new Date('2026-11-17')` est interprété comme minuit UTC, ce qui décale
 * d'un jour les utilisateurs à l'ouest de UTC. On parse explicitement en
 * heure locale pour les agrégations (jour/semaine/calendrier).
 */
export function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Clé locale `YYYY-MM-DD` pour une date (évite toISOString() qui repasse en UTC). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
