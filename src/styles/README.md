# Organisation des styles

Point d'entrée unique : [`global.css`](./global.css). Il déclare l'ordre de cascade :

```
@layer reset, tokens, base, components, utilities;
```

| Dossier / fichier                                   | Rôle                                                    |
| --------------------------------------------------- | ------------------------------------------------------- |
| `base/reset.css`                                    | reset navigateur                                        |
| `tokens/colors.css`, `tokens/scale.css`             | **seule source de vérité** des couleurs et de l'échelle |
| `base/fonts.css`, `base/root.css`, `base/a11y.css`  | polices, racine, accessibilité                          |
| `components/patterns.css`, `components/stepper.css` | motifs partagés stables                                 |
| `utilities.css`                                     | utilitaires                                             |

Les primitives de `src/components/ui/` qui doivent être globales importent leur CSS depuis
`global.css` (`Button.css`, `Badge.css`, `Card.css`, `Avatar.css`). Les autres composants portent
leur style dans un bloc `<style>` Astro **scopé**.

Règles :

- Aucun littéral de couleur hors `tokens/` et des exceptions documentées dans
  `scripts/check-colors.mjs` (`debug.astro`, `sessions/print.astro`, `ui.astro`).
- Pas de `is:global` dans un composant de domaine. Les rares cas (markup injecté via `x-html`)
  doivent être commentés et limités à `:global()` ciblé.
- Le style d'un composant vit dans le composant, jamais dans la page qui l'utilise.
- Vérifier avec `pnpm check:colors` et `pnpm check:contrast`.

La convention complète est dans [`docs/componentization-rules.md`](../../docs/componentization-rules.md).
