/** Définition d'une métrique pour MetricGrid (ADR-009). */
export interface MetricDefinition {
  key: string;
  label: string;
  value: string;
  unit?: string;
  foot: string;
  icon?: string;
  hero?: boolean;
}
