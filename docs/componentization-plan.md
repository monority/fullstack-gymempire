# Plan d'optimisation — v3 « une règle, une source »

> Remplace les versions précédentes. Le plan antérieur a componentisé le **markup** avec succès,
> mais a surtout **déplacé** le CSS des pages vers les composants sans le mutualiser. Cette v3
> corrige ce défaut.

---

## 1. État honnête (mesuré le 2026-11-20)

| Indicateur                                 |                                                       Valeur | Verdict                          |
| ------------------------------------------ | -----------------------------------------------------------: | -------------------------------- |
| Composants `.astro`                        |                                                           79 | ✅ markup largement componentisé |
| Pages `.astro`                             |                                                           42 | —                                |
| Pages > 1 000 lignes                       | 3 (`quick` 1 067, `ui` 1 060 [galerie dev], `compare` 1 007) | 🟡 reste 2 pages réelles         |
| Lignes de CSS dans les `<style>` Astro     |                                                   **12 547** | ❌ très largement dupliqué       |
| Fichiers `.css` partagés                   |               15 (dont seulement 6 dans `@layer components`) | ❌ couverture faible             |
| `border: 1px solid var(--color-border)`    |                                           **85 occurrences** | ❌                               |
| `text-transform: uppercase` (labels)       |                                          **126 occurrences** | ❌                               |
| `font-variant-numeric: tabular-nums`       |                                           **61 occurrences** | ❌                               |
| `:focus-visible`                           |                                           **48 occurrences** | ❌                               |
| `background-color: var(--color-surface-2)` |                                           **39 occurrences** | ❌                               |
| `border-radius: var(--radius-md)`          |                                           **47 occurrences** | ❌                               |

**Conclusion** : markup componentisé à ~80 %, **CSS non optimisé**. On a remplacé 8 785 lignes de CSS
de page par 12 547 lignes réparties dans les composants, souvent avec les mêmes déclarations.

---

## 2. Principe directeur v3

> Une règle visuelle = une seule déclaration, dans `@layer components` (ou une primitive UI).
> Un composant n'écrit que ce qui le rend **spécifique**.

Les tokens (couleurs, scale, radius, transitions, typographies) existent déjà dans
`src/styles/tokens/`. On ajoute une couche de **motifs partagés** consommée par tous les composants :

| Classe partagée                    | Rôle                                                | Remplace                     |
| ---------------------------------- | --------------------------------------------------- | ---------------------------- |
| `u-surface`                        | fond `--color-surface-2` + border hairline + radius | 39 + 85 + 47 occurrences     |
| `u-label`                          | Inter, caption, uppercase, tracking, muted          | 126 occurrences              |
| `u-metric`                         | Archivo, metric, tabular-nums, line-height          | 61 occurrences               |
| `u-focus`                          | anneau de focus accessible                          | 48 occurrences               |
| `u-grid-2`, `u-grid-3`, `u-grid-4` | grilles responsive + séparateurs hairline           | 8 occurrences + duplications |
| `u-row`, `u-stack`, `u-between`    | flex layouts récurrents                             | ~57 occurrences de `gap`     |

Ces classes vivent dans `src/styles/components/` et sont importées par `global.css` dans l'ordre
de cascade existant (`reset → tokens → base → components → utilities`).

---

## 3. Cibles chiffrées

| KPI                                        | Baseline v3 |                                  Cible |
| ------------------------------------------ | ----------: | -------------------------------------: |
| Lignes de CSS dans les composants + pages  |      12 547 |                            **≤ 6 500** |
| Occurrences de `text-transform: uppercase` |         126 | **≤ 10** (dans `u-label` + exceptions) |
| Occurrences de `tabular-nums`              |          61 |                                **≤ 8** |
| Occurrences du border hairline             |          85 |                               **≤ 25** |
| Occurrences de `:focus-visible`            |          48 |                               **≤ 10** |
| Pages > 1 000 lignes (hors `ui`)           |           2 |                                  **0** |
| Composants de synthèse quasi identiques    |           4 |               **1** registre générique |
| Tests / E2E                                |    660 / 14 |       ≥ 660 / ≥ 14 (aucune régression) |

---

## 4. Phases

### O0 — Fondations CSS partagées _(S)_

- Créer `src/styles/components/{surfaces,typography,layout,focus}.css` avec les classes `u-*`.
- Importer dans `global.css` (couche `components`).
- Documenter dans `src/styles/README.md` (déjà créé).
- Ajouter à `check-components.mjs` une règle de comptage des motifs dupliqués (avertissement).

**Acceptation** : les classes `u-*` sont disponibles globalement, aucun rendu ne change.

### O1 — Généraliser les composants de synthèse _(M)_

- Créer `src/components/ui/MetricGrid.astro` : un seul composant data-driven (registre `as const`
  de métriques : libellé, expression Alpine, unité, pied, variant héros, icône).
- Remplacer `HistoryStats`, `StatsSummary`, `RecordsSummary` par `MetricGrid` avec des définitions.
- `WeekMetric` reste spécifique (barres hebdo, pattern design system) mais consomme `u-label`/`u-metric`.

**Acceptation** : 3 fichiers supprimés, rendu identique sur 4 pages (captures).

### O2 — Migration des motifs partagés _(L)_

- Appliquer `u-surface` / `u-label` / `u-focus` / `u-row` à tous les composants :
  formulaires (`FormField`, `Input`, `Select`, `Toggle`), tables (`Table.*`), cartes (`Card.*`),
  dialogues (`Dialog`), sections de réglages, cartes de séance.
- Supprimer les déclarations désormais redondantes des `<style>`.locaux.
- Variantes via `class:list` et variables CSS, pas par duplication de blocs.

**Acceptation** : KPI CSS en baisse d'au moins 40 %, captures inchangées.

### O3 — Dernières pages _(M)_

- `sessions/quick.astro` (1 067) : extraire `QuickHeader`, `QuickExercise`, `QuickSetRow`, `QuickRestBar`.
- `sessions/compare.astro` (1 007) : extraire `CompareHeader`, `CompareMetric`, `CompareExerciseRow`.
- `ui.astro` reste galerie de design system (exemption documentée, 404 en prod).

**Acceptation** : 0 page > 1 000 lignes hors `ui`.

### O4 — Verrouillage _(S)_

- Passer la règle de duplication CSS en mode strict dans `check-components`.
- CI : `check:components` bloquant, budgets, a11y, e2e.
- Revue finale des captures FR/EN.

---

## 5. Règles de non-régression

1. Une page reste un assembleur ; aucun style spécifique à un composant dans la page.
2. Un composant n'écrit que sa structure et ses variantes ; les motifs communs viennent des `u-*`.
3. Toute nouvelle valeur visuelle passe d'abord par un token (`--color-*`, `--text-*`, `--radius-*`).
4. Chaque phase = 1 PR + captures avant/après + `pnpm test / check:strict / lint / build / budget / smoke / e2e`.
5. Aucune suppression de test ni d'assertion a11y pour faire passer une étape.

---

## 6. Suivi

| Phase                     | Statut | Prérequis |
| ------------------------- | ------ | --------- |
| O0 — Fondations CSS       | ☐      | —         |
| O1 — MetricGrid générique | ☐      | O0        |
| O2 — Migration des motifs | ☐      | O0        |
| O3 — Dernières pages      | ☐      | O1 + O2   |
| O4 — Verrouillage         | ☐      | O0–O3     |

> Prochaine action : **O0**. Le travail déjà fait (markup, stores, a11y, CSP, security) est conservé ;
> cette v3 ne recommence pas de zéro, elle s'attaque à la couche qui n'était pas encore optimisée.
