# ADR-004 — Registre dynamique ciblé

**Statut** : accepté (P0) — 2026-11-19

## Contexte

Le plan proposait un registre typé `Record<Kind, Component>` pour remplacer les `x-if` en cascade.
Deux risques : l'over-engineering (un registre pour 2 variantes n'apporte rien) et la dépendance à
un type de composant Astro mal identifié (`ComponentType` n'existe pas en 7.2.0 — voir §1.1 du plan).

## Décision

N'utiliser un registre que lorsque **l'exhaustivité compile apporte une valeur** : au moins 3
variantes et une union TypeScript stable (`SessionStatus`, `ChartKind`, `SettingSection`).
Sinon, rester sur des props explicites.

Le type est `AstroComponentFactory`, importé de `astro/runtime/server/index.js` (vérifié dans
`node_modules/astro/package.json`, export `./runtime/*`).

## Conséquences

- Pas de registre dans `ui/` (les primitives utilisent des props/variants).
- Registres prévus : statuts de séance (3), sections de réglages (5), types de graphes (5).
- Chaque registre est couvert par un test paramétré sur `Object.keys(VIEWS)`.
