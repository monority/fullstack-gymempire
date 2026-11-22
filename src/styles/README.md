# Architecture des styles — v3

> Point d'entrée unique : [`global.css`](./global.css). Aucune autre feuille n'est importée
> par un composant. Voir les ADR 006-009.

## Couches (ordre strict)

```
@layer reset, tokens, base, components, utilities, overrides;
```

| Couche       | Rôle                | Autorisé                                                              | Interdit              |
| ------------ | ------------------- | --------------------------------------------------------------------- | --------------------- |
| `reset`      | normalisation       | box-sizing, margins                                                   | couleurs, composants  |
| `tokens`     | valeurs primitives  | `--color-*`, `--text-*`, `--space-*`, `--radius-*`, `--ease-*`        | sélecteurs, `var()`   |
| `base`       | defaults d'éléments | `html`, `body`, `a`, `button`, `:focus-visible`                       | classes `u-*` / `c-*` |
| `components` | objets visuels      | `.c-btn`, `.c-card`, `.c-field`, `.c-dialog`, `.c-table`, `.c-metric` | valeurs littérales    |
| `utilities`  | atomes immuables    | `.u-surface`, `.u-label`, `.u-metric`, `.u-focus`, `.u-grid-*`        | logique métier        |
| `overrides`  | exceptions `x-html` | `:global()` commenté                                                  | tout le reste         |

**Contrat** : les blocs `<style>` Astro sont **non layerés** et gagnent donc sur toutes les couches.
Un composant surcharge un motif global sans `!important` (ADR-006).

## Arborescence

```
styles/
  global.css          # @layer + @import uniquement
  tokens/             colors, spacing, typography, radii, motion, layout
  base/               reset, root, elements, typography, fonts, a11y
  components/         button, badge, card, avatar, field, dialog, table, metric, panel, stepper
  utilities/          surface, typography, layout, focus + utilities.css (type-pill)
  overrides.css       exceptions documentées
  calculator.css      page autonome
```

## Catalogue des utilities

| Classe                                  | Rôle                                |
| --------------------------------------- | ----------------------------------- |
| `.u-surface` / `.u-surface-raised`      | fond + hairline + rayon             |
| `.u-hairline` / `.u-hairline-x`         | séparateur horizontal / vertical    |
| `.u-label`                              | libellé uppercase, mute, caption    |
| `.u-metric`                             | valeur Archivo, `tabular-nums`      |
| `.u-unit` / `.u-muted` / `.u-truncate`  | unité, texte secondaire, troncature |
| `.u-row` / `.u-stack` / `.u-between`    | layouts flex                        |
| `.u-grid-2` / `.u-grid-3` / `.u-grid-4` | grilles responsive + séparateurs    |
| `.u-focus`                              | anneau de focus                     |

## Règles

1. Token first : aucune valeur de design littérale hors `tokens/`.
2. Une déclaration = une source : promue en `u-*` ou `c-*` dès qu'elle apparaît 2 fois.
3. Nommage : `u-*` utility, `c-*` composant, `is-*`/`has-*` états, BEM `b__e--m` **local uniquement**.
4. Aucun `!important` hors whitelist documentée (`root.css` icon-size, `a11y.css` x-cloak/reduced-motion).
5. `:where()` interdit dans `components/` et `utilities/`.
6. Spécificité max 2 classes, pas de `#id` (sauf hooks de dialogue whitelistés).
7. Aucune classe de page (`.set__`, `.hist__`, …) dans un fichier global.
8. Vérifier avec `pnpm check:css`, `pnpm check:colors`, `pnpm check:contrast`.
9. La dette résiduelle est mesurée dans `scripts/quality-baseline.json` : en CI (`STRICT=1`), tout
   compteur qui **augmente** bloque. La réduire lot par lot en abaissant cette baseline.
