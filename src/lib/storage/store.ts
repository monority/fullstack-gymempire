/**
 * Low-level localStorage access with graceful degradation.
 * Moved verbatim from `src/lib/storage.ts` (C1, plan-execution.md).
 */

/**
 * Estimated 1RM via the Epley formula: weight × (1 + reps / 30).
 * Returns 0 for non-positive inputs, weight as-is for a single rep.
 */
export function calculate1RM(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return 0;
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function getStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStore<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded, private mode, or storage disabled — silently no-op
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through to fallback
    }
  }
  // Fallback: time + random base36
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
