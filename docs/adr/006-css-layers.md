# ADR-006 — Couches CSS et priorité des styles scopés

**Statut** : accepté — plan v3 §2

## Contexte

Le projet utilise `@layer` pour ordonner la cascade. Les blocs `<style>` Astro sont compilés
**hors couche**, donc ils gagnent sur toutes les couches déclarées. Certains ont voulu corriger ça
avec `is:global` ou `!important`, ce qui casse la prévisibilité.

## Décision

Six couches, ordre strict : `reset, tokens, base, components, utilities, overrides`.
Les styles scopés Astro restent **non layerés** et constituent le niveau de surcharge légitime.

## Conséquences

- Aucun `!important` autorisé.
- Un composant peut surcharger un `u-*` ou un `c-*` depuis son `<style>` sans trick.
- `:global()` ciblé uniquement dans la couche `overrides` (markup injecté par `x-html`).
- `scripts/check-css.mjs` vérifie l'ordre des couches et interdit `!important`.
