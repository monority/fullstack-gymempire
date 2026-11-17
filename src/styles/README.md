# Architecture CSS — GymEmpire

## Principe

**Un seul fichier d'entrée** : `global.css`, importé par `AppLayout.astro`.
**Une seule source de vérité** pour les couleurs et l'échelle : `tokens/`.
**Aucune couleur en dur** dans les pages (sauf `debug.astro`, volontairement autonome).

## Couches (cascade)

Déclarées dans `global.css`, du plus faible au plus fort :

```
reset → tokens → base → components → utilities
```

Règle d'or : **les `<style>` scopés d'Astro ne sont dans aucune couche**, donc ils gagnent toujours. Une page peut surcharger un motif global sans `!important`.

## Arborescence

```
src/styles/
  global.css                  # point d'entrée + ordre des couches
  tokens/
    colors.css                # toutes les couleurs, dark + light
    scale.css                 # espacements, rayons, type, transition, layout
  base/
    reset.css                 # box-sizing, body, titres, scrollbar
    a11y.css                  # focus-visible, sr-only, reduced-motion, tactile
    root.css                  # html 62.5%, taille des icônes
  components/
    stepper.css               # stepper numérique injecté par AppLayout
  utilities.css               # type-pill, tones, set-row-grid, rpe-value
  calculator.css              # styles de la page calculatrice (import local)
src/components/ui/*.css       # CSS co-localisé des composants UI (layer components)
```

## Où mettre un nouveau style ?

| Besoin                                    | Emplacement                                 |
| ----------------------------------------- | ------------------------------------------- |
| Nouvelle couleur (dark + light)           | `tokens/colors.css` (les deux blocs)        |
| Nouvel espacement, rayon, police, durée   | `tokens/scale.css`                          |
| Comportement de base (tous les éléments)  | `base/`                                     |
| Motif utilisé par 2 pages ou plus         | `components/` (préfixe BEM `area__element`) |
| Classe à but unique (texte, tone, grille) | `utilities.css`                             |
| Style spécifique à une page               | `<style>` scoped dans la page `.astro`      |

## Règles

1. `var(--token)` uniquement ; pas de `#hex`, `rgb()` ou `hsl()` dans une page. `pnpm check:colors` le vérifie. Exceptions documentées : `tokens/`, `debug.astro`, `sessions/print.astro` (palette papier), `ui.astro` (spécimens), balises `theme-color`.
2. Préfixe BEM : `.stats__chart`, `.set__row`, `.dash__hero` — jamais `.chart` global.
3. Une action principale par écran ; pas de carte décorative (voir `rules.md`).
4. Cibles tactiles ≥ 44 px, `:focus-visible` visible, `prefers-reduced-motion` respecté.
5. Pas de `!important` sauf `x-cloak` et le dimensionnement des icônes.
6. Sur les fichiers modifiés : `pnpm format:check` puis `pnpm build`.
