# ADR-009 — MetricGrid générique

**Statut** : accepté

## Contexte

`HistoryStats`, `StatsSummary`, `RecordsSummary` ont la même structure : une grille de cartes
label + valeur + unité + pied, avec une variante héros. Seules les définitions changent.

## Décision

Un seul `src/components/ui/MetricGrid.astro`, data-driven via un registre `as const` :
`{ label, valueExpr, unitExpr, footExpr, icon?, hero?, columns }`.

Seuil d'application : au moins 3 métriques de même grammaire. `WeekMetric` reste spécifique
(barres hebdomadaires imposées par le design system) mais consomme `u-label` + `c-metric`.

## Conséquences

- 3 fichiers supprimés, un seul à maintenir.
- Chaque registre couvert par un test paramétré sur `Object.keys(metrics)`.
- Aucune régression visuelle tolérée (captures avant/après sur 4 pages).
