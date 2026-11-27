/** Définition d'une métrique pour MetricGrid (ADR-009). */
export interface MetricDefinition {
  key: string;
  label: string;
  value: string;
  unit?: string;
  /** Expression Alpine pour une unité dépendant du réglage (ex. `unit`). */
  unitExpr?: string;
  foot: string;
  /** Texte statique (pas une expression Alpine). */
  footStatic?: boolean;
  icon?: string;
  hero?: boolean;
}
