# Architecture CSS — Gym Empire

## Principe

**Un seul fichier d'entrée** : `global.css`, importé par `AppLayout.astro`.
**Une seule source de vérité** pour les couleurs et l'échelle : `tokens/`.
**Aucune couleur en dur** dans les pages (sauf exceptions documentées plus bas).

## Couches (cascade)

Déclarées dans `global.css`, du plus faible au plus fort :

```
reset → tokens → base → components → utilities
```

Règle d'or : les `<style>` scopés d'Astro ne sont dans aucune couche, donc ils gagnent toujours. Une page peut surcharger un motif global sans `!important`.

## Arborescence

```
src/styles/
  global.css                  # point d'entrée + ordre des couches
  tokens/
    colors.css                # couleurs + ombres, dark et light
    scale.css                 # espacements, rayons, type, mouvement, layout
  base/
    fonts.css                 # @font-face Archivo + Inter (woff2 locaux)
    reset.css                 # box-sizing, body, caret, scrollbar
    a11y.css                  # focus-visible, sr-only, reduced-motion, tactile
    root.css                  # html 62.5%, taille des icônes
  components/
    stepper.css               # stepper numérique injecté par AppLayout
    patterns.css              # motifs partagés entre pages
  utilities.css               # classes à but unique
  calculator.css              # styles de la page calculatrice (import local)
src/components/ui/*.css       # CSS co-localisé des composants UI (layer components)
```

## Tokens disponibles

| Famille      | Tokens                                                                              |
| ------------ | ----------------------------------------------------------------------------------- |
| Espacements  | `--spacing-1` à `--spacing-8` (base 4 px, `--spacing-7` = 28 px)                    |
| Rayons       | `--radius-sm/md/lg/xl`, `--radius-pill` (cartes : 16 px)                            |
| Type         | `--text-caption/small/body/body-lg/h3/h2/h1/metric/display`                         |
| Interlignage | `--leading-caption/body/heading/display`                                            |
| Tracking     | `--tracking-caption/heading/display` (plancher −0,04 em)                            |
| Polices      | `--font-display` (Archivo), `--font-body` (Inter)                                   |
| Mouvement    | `--transition-fast/base/normal`, `--ease-out`                                       |
| Empilement   | `--z-base/header/drawer/overlay`                                                    |
| Ombres       | `--shadow-1/2`, `--shadow-overlay` (dialogues uniquement)                           |
| Layout       | `--sidebar-width`, `--topbar-height`, `--page-max-w`, `--page-padding-*`, `--gap-*` |

Les anciens `--text-page-title*` restent disponibles temporairement et seront migrés au lot 2.

## Où mettre un nouveau style ?

| Besoin                                   | Emplacement                                 |
| ---------------------------------------- | ------------------------------------------- |
| Nouvelle couleur (dark + light)          | `tokens/colors.css` (les deux blocs)        |
| Nouvel espacement, rayon, police, durée  | `tokens/scale.css`                          |
| Comportement de base (tous les éléments) | `base/`                                     |
| Motif utilisé par 2 pages ou plus        | `components/` (préfixe BEM `area__element`) |
| Classe à but unique                      | `utilities.css`                             |
| Style spécifique à une page              | `<style>` scopé dans la page `.astro`       |

## Règles

1. `var(--token)` uniquement ; pas de `#hex`, `rgb()` ou `hsl()` dans une page. `pnpm check:colors` le vérifie. Exceptions documentées : `tokens/`, `debug.astro`, `sessions/print.astro` (palette papier), `ui.astro` (spécimens), balises `theme-color`.
2. Préfixe BEM : `.stats__chart`, `.set__row`, `.dash__hero` — jamais `.chart` global.
3. Une action principale par écran ; pas de carte décorative (voir `rules.md`).
4. Cibles tactiles à 44 px, `:focus-visible` visible, `prefers-reduced-motion` respecté.
5. Pas de kicker/eyebrow au-dessus d'un titre ; pas de dégradé, glow ou ombre décorative.
6. Pas de `!important` sauf `x-cloak` et le dimensionnement des icônes.
7. Sur les fichiers modifiés : `pnpm format:check` puis `pnpm build`.
