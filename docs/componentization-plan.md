# Plan d'architecture CSS & composants — v3

> Auteur : lead developer / architecte front. Remplace les versions 1 et 2.
> Le markup est componentisé à ~80 % ; le CSS ne l'est pas. Cette v3 construit une **architecture
> CSS déterministe**, puis y migre les composants sans régression visuelle.

---

## 1. Constat d'expert (baseline mesurée, 2026-11-20)

| Fait                                          |                               Mesure | Diagnostic                                                          |
| --------------------------------------------- | -----------------------------------: | ------------------------------------------------------------------- |
| Lignes de CSS dans les `<style>` Astro        |                           **12 547** | La dette a été déplacée, pas soldée                                 |
| Lignes de CSS global                          |    1 276 (dont `calculator.css` 493) | Couverture de couche insuffisante                                   |
| `text-transform: uppercase`                   |                                  126 | Devrait être **1** (dans un utility)                                |
| `border: 1px solid var(--color-border)`       |                                   85 | Devrait être **1** (dans un utility)                                |
| `tabular-nums`                                |                                   61 | Devrait être **1**                                                  |
| `:focus-visible`                              |                                   48 | Devrait être **1** (dans `base/a11y.css`)                           |
| `border-radius: var(--radius-md)`             |                                   47 | Devrait être **1**                                                  |
| `background-color: var(--color-surface-2)`    |                                   39 | Devrait être **1**                                                  |
| `patterns.css`                                | `:where(.cal__…, .comp__…, .rec__…)` | ❌ couplage global ↔ classes de page : **anti-pattern** à supprimer |
| `global.css` importe `../components/ui/*.css` |                            4 imports | ❌ dépendance inversée : les styles dépendent des composants        |
| Composants de synthèse quasi identiques       |                                    4 | ❌ à fusionner en un registre                                       |

**Verdict** : le projet a de bons tokens, mais **aucune couche de motifs réutilisables**. Chaque
composant réimplémente la même grammaire visuelle. Le correctif n'est pas « encore extraire un
composant », c'est **construire le système de classes partagées puis migrer**.

---

## 2. Architecture cible — les 6 couches

`@layer` reste l'unique mécanisme de cascade. Ordre strict, déclaré une seule fois dans `global.css` :

```
@layer reset, tokens, base, components, utilities, overrides;
```

| Couche       | Responsabilité                | Contenu autorisé                                                                              | Interdit                                              |
| ------------ | ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `reset`      | Normalisation navigateur      | `box-sizing`, margins, `button` reset                                                         | Token, couleur, composant                             |
| `tokens`     | Valeurs primitives uniquement | `--color-*`, `--space-*`, `--radius-*`, `--text-*`, `--ease-*`                                | Sélecteur d'élément, classe, `var()` d'un autre token |
| `base`       | Defaults d'éléments           | `html`, `body`, `a`, `input`, `:focus-visible`, `@font-face`                                  | Classe `.c-*` / `.u-*`                                |
| `components` | Objets visuels réutilisables  | `.c-btn`, `.c-card`, `.c-field`, `.c-dialog`, `.c-table`, `.c-metric`, `.c-badge`, `.c-panel` | Valeur littérale (tout vient de `tokens`)             |
| `utilities`  | Classes atomiques immuables   | `.u-surface`, `.u-label`, `.u-metric`, `.u-focus`, `.u-grid-3`, `.u-row`, `.u-truncate`       | Logique métier, surcharge de composant                |
| `overrides`  | Exceptions explicites         | `:global()` ciblé pour markup `x-html`                                                        | Anything else — doit rester **vide ou quasi**         |

**Décision d'architecte** : les blocs `<style>` Astro restent **non layerés** et ont donc la priorité
sur toutes les couches. C'est voulu : un composant peut surcharger un motif global **sans
`!important`**. On conserve cette propriété et on l'documente comme contrat.

### 2.1 Arboresence cible

```
src/styles/
├── global.css              # UNIQUEMENT @layer + @import (aucune règle)
├── README.md               # conventions + catalogue des classes
├── tokens/
│   ├── colors.css          # couleurs + alias sémantiques (state)
│   ├── spacing.css         # --space-* (remplace --spacing-*)
│   ├── typography.css      # --font-*, --text-*, --leading-*, --tracking-*
│   ├── radii.css           # --radius-*
│   ├── motion.css          # --transition-*, --ease-*
│   └── layout.css          # --z-*, --sidebar-width, --page-*, --gap-*
├── base/
│   ├── reset.css
│   ├── elements.css        # a, button, input, select, table, dialog
│   ├── typography.css      # h1..h6, p, code
│   ├── fonts.css
│   └── a11y.css            # :focus-visible, sr-only, prefers-reduced-motion
├── components/
│   ├── button.css          # déplacé depuis src/components/ui/Button.css
│   ├── card.css            # déplacé depuis .../Card.css
│   ├── badge.css
│   ├── avatar.css
│   ├── field.css           # Input / Select / Textarea / Checkbox / Toggle
│   ├── dialog.css          # Dialog + DialogFooter
│   ├── table.css           # Table + TableHead/Body/Row/Cell
│   ├── metric.css          # valeur de métrique (Archivo, tabular)
│   ├── panel.css           # en-tête + contenu de panneau
│   └── stepper.css
├── utilities/
│   ├── surface.css         # .u-surface, .u-surface-raised, .u-hairline
│   ├── typography.css      # .u-label, .u-metric, .u-muted, .u-truncate
│   ├── layout.css          # .u-row, .u-stack, .u-between, .u-grid-{2,3,4}
│   └── focus.css           # .u-focus
└── calculator.css          # isolé en dernier recours (page autonome)
```

**Règle de dépendance** : `components/` et `utilities/` consomment `tokens/` exclusivement.
Aucun fichier de `styles/` n'importe un fichier de `src/components/`. Les composants Astro ne
portent plus leur propre `.css` global : `global.css` est le seul point d'entrée (importé une fois
par `AppLayout`).

### 2.2 Convention de nommage

| Préfixe       | Usage                                        | Exemple                         |
| ------------- | -------------------------------------------- | ------------------------------- |
| `u-`          | utility atomique, une seule responsabilité   | `.u-label`, `.u-grid-3`         |
| `c-`          | objet composant (layer `components`)         | `.c-card`, `.c-dialog`          |
| `is-`         | état piloté par Alpine                       | `.is-active`, `.is-open`        |
| `has-`        | état structurel                              | `.has-icon`                     |
| BEM `b__e--m` | **uniquement** dans un `<style>` Astro scopé | `.session-card__title--compact` |
| `data-*`      | hook JS/Alpine, jamais de style              | `data-dialog-trigger`           |

Les classes de page (`.cal__`, `.set__`, `.hist__`, …) disparaissent des fichiers globaux. Elles
restent **locales** aux composants et ne sont jamais référencées depuis `global.css`.

---

## 3. Règles de codage normatives (à intégrer dans `componentization-rules.md`)

1. **Token first** — aucune valeur brute hors `tokens/`. `check:colors` étendu à toutes les props.
2. **Une déclaration, une source** — si une déclaration apparaît dans 2 composants, elle est promue
   en utility ou en classe de composant.
3. **Pas de `!important`**, pas de sélecteur de profondeur > 2 (hors `:global()` documenté).
4. **`:where()` interdit dans `components/` et `utilities/`** (perd la spécificité, rend l'ordre
   d'import fragile). Réservé à `base/` pour des defaults à spécificité zéro.
5. **Spécificité max 2 classes**. Aucun `#id` hors hook de dialogue documenté.
6. **Style local = structure du composant uniquement**. Dès qu'un bloc local dépasse 80 lignes ou
   répète un motif, il est promu.
7. **Variantes par `class:list` + variables CSS**, jamais par duplication de bloc.
8. **Accessibilité** : `:focus-visible` unique dans `base/a11y.css`, `prefers-reduced-motion`
   centralisé, contraste vérifié par `check:contrast`.
9. **Chaque classe globale est documentée** dans `src/styles/README.md` (rôle, couche, usage).
10. **Aucune exception implicite** : toute exception est une ADR + une entrée dans le garde-fou.

---

## 4. Cibles chiffrées (KPI v3)

| KPI                                      |        Baseline |                Cible | Outil                  |
| ---------------------------------------- | --------------: | -------------------: | ---------------------- |
| Lignes CSS `<style>` + global            |          13 823 |          **≤ 6 000** | `check-css.mjs`        |
| `uppercase` hors `u-label`               |             126 |              **≤ 5** | `check-css.mjs`        |
| border hairline hors `u-surface`         |              85 |             **≤ 15** | `check-css.mjs`        |
| `tabular-nums` hors `c-metric`           |              61 |              **≤ 5** | `check-css.mjs`        |
| `:focus-visible` hors `base`             |              48 |              **≤ 5** | `check-css.mjs`        |
| `border-radius: var(--radius-md)`        |              47 |             **≤ 10** | `check-css.mjs`        |
| Littéraux de couleur hors tokens         | 121 (whitelist) |             **≤ 30** | `check-colors.mjs`     |
| Blocs `<style>` > 80 lignes              | **45** (sur 92) |                **0** | `check-components.mjs` |
| Pages > 1 000 lignes (hors `ui`)         |               2 |                **0** | `wc -l`                |
| Composants de synthèse                   |               4 | **1** (`MetricGrid`) | inventaire             |
| Valeurs de design littérales hors tokens |         **737** |             **≤ 50** | `check-css.mjs`        |
| Tests / e2e                              |        660 / 14 |         ≥ 660 / ≥ 14 | CI                     |

---

## 5. Phases d'exécution (strangler pattern, jamais de big bang)

### Phase 0 — Socle _(S)_

- Créer l'arborescence cible, déplacer les fichiers sans changer une règle.
- Réécrire `global.css` : `@layer` + `@import` uniquement.
- Supprimer les `:where(.cal__…, .comp__…)` de `patterns.css` → les remplacer par des utilities
  **et** ajouter les classes correspondantes dans les composants concernés (migration parallèle).
- Inverser la dépendance : déplacer `Button.css`, `Badge.css`, `Card.css`, `Avatar.css` vers
  `styles/components/`.
- Mettre à jour `src/styles/README.md` (catalogue complet).

**Acceptation** : captures identiques sur 14 routes, `check:colors` vert.

### Phase 1 — Utilities haute fréquence _(M)_

- Écrire `utilities/{surface,typography,layout,focus}.css` avec les classes `u-*`.
- Migérer en priorité : uppercase (126), border (85), tabular (61), focus (48), radius (47),
  surface (39) — soit **~406 déclarations** réduites à 6 sources.
- Ajouter `check-css.mjs` en mode avertissement avec les compteurs KPI.

**Acceptation** : KPI divisés par 10, captures inchangées, a11y 11/11.

### Phase 2 — Objets composants _(L)_

- Créer `c-btn`, `c-card`, `c-field`, `c-dialog`, `c-table`, `c-metric`, `c-badge`, `c-panel`.
- Migrer les primitives UI (`Button`, `Card`, `Input`, `Select`, `Dialog`, `Table`, `Badge`,
  `StatsCard`, `StatCard`) vers ces classes ; retirer leurs styles locaux redondants.
- Supprimer `src/components/ui/*.css` (plus de CSS hors `styles/`).

**Acceptation** : 0 fichier `.css` sous `src/components/`, bundle CSS gzip en baisse, captures OK.

### Phase 3 — MetricGrid générique _(M)_

- `src/components/ui/MetricGrid.astro` : registre `as const` de métriques (label, expression
  Alpine, unité, pied, héros, icône, colonnes).
- Remplacer `HistoryStats`, `StatsSummary`, `RecordsSummary` (3 fichiers supprimés).
- `WeekMetric` conservé (barres hebdo, règle design system) mais consomme `u-label` + `c-metric`.

**Acceptation** : 4 pages inchangées visuellement, 3 fichiers de moins.

### Phase 4 — Dernières pages _(M)_

- `sessions/quick.astro` (1 067) → `QuickHeader`, `QuickExercise`, `QuickSetRow`, `QuickRestBar`.
- `sessions/compare.astro` (1 007) → `CompareHeader`, `CompareMetric`, `CompareExerciseRow`.
- `ui.astro` reste galerie de design system (exemption ADR, 404 en prod).

**Acceptation** : 0 page > 1 000 lignes hors galerie.

### Phase 5 — Verrouillage _(S)_

- `check-css.mjs` passe en strict dans `package.json` + CI.
- `check-components.mjs` : budget 80 lignes par bloc `<style>` en strict.
- Budgets gzip ajustés à la baisse (CSS cible ≤ 40 Ko gzip).
- Revue finale : captures FR/EN, `test`, `check:strict`, `lint`, `build`, `budget`, `smoke`, `e2e`.

---

## 6. Outil de gouvernance : `scripts/check-css.mjs`

Nouveau garde-fou, sans dépendance, sortie texte + `--json`, `STRICT=1` bloquant :

| Contrôle                   | Règle                                       | Action     |
| -------------------------- | ------------------------------------------- | ---------- |
| Littéraux de couleur       | hors `tokens/` (whitelist ADR)              | error      |
| `!important`               | interdit partout                            | error      |
| `:where(`                  | interdit dans `components/` et `utilities/` | error      |
| `#id` en sélecteur         | interdit sauf whitelist dialog              | error      |
| Profondeur > 2             | `a b c` interdit                            | warn→error |
| Compteurs KPI              | cf. tableau §4                              | warn→error |
| Bloc `<style>` > 80 lignes | dans `.astro`                               | warn→error |
| `var(--…)` inconnu         | token non défini                            | error      |
| Ordre des `@layer`         | doit matcher `global.css`                   | error      |

---

## 7. Risques & mitigations

| Risque                                            | Mitigation                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Régression visuelle lors du passage aux utilities | Une phase = un lot + captures avant/après sur 14 routes ; rollback par PR                        |
| Spécificité : utility écrasée par un style scopé  | C'est le contrat : le style local gagne. On documente, on n'ajoute pas de `!important`           |
| `:global()` nécessaire pour `x-html`              | Autorisé uniquement dans la couche `overrides`, commenté, compté                                 |
| Migration des 4 primitives UI cassant les slots   | Tests de rendu + e2e existants (14 tests) ; migration une primitive à la fois                    |
| Taille du diff Phase 1                            | Le codemod est mécanique (regex contrôlée) et vérifié par capture, jamais « à la main » en masse |
| Dette i18n (ADR-002)                              | Hors périmètre, lot dédié                                                                        |

---

## 8. ADR à écrire avant exécution

- **ADR-006** — layers CSS et priorité des styles scopés non layerés (décision §2).
- **ADR-007** — suppression de `patterns.css` couplé aux classes de page au profit d'utilities.
- **ADR-008** — déplacement des CSS de `components/ui/` vers `styles/components/` (inversion de dépendance).
- **ADR-009** — `MetricGrid` générique vs composants spécialisés (seuil : ≥ 3 métriques).

---

## 9. Définition de terminé (chaque phase)

- [ ] Parité des styles calculés sur 14 routes (`scripts/style-parity.mjs`) et captures identiques.
- [ ] `pnpm test` ≥ 660, `pnpm test:e2e` ≥ 14 (dont 11 a11y).
- [ ] `pnpm check:strict` 0/0/0, `pnpm lint` 0 erreur.
- [ ] `pnpm check:colors`, `check:contrast`, `check:components`, `check:css` verts.
- [ ] `pnpm build`, `check:budget`, `test:smoke` verts.
- [ ] KPI de la phase en baisse effective (mesurés, pas estimés).
- [ ] README des styles à jour pour toute nouvelle classe.

---

## 10. Suivi

| Phase                                                     | Statut                                 |
| --------------------------------------------------------- | -------------------------------------- |
| 0 — Socle (layers, arborescence, inversion de dépendance) | ☑                                      |
| 1 — Utilities haute fréquence                             | ☑                                      |
| 2 — Objets composants                                     | ☑                                      |
| 3 — MetricGrid générique                                  | ☑                                      |
| 4 — Dernières pages                                       | ☑                                      |
| 5 — Verrouillage CI                                       | ☑ (ratchet strict + budgets resserrés) |

> Prochaine action : **Phase 0**. Aucune phase ne commence avec un KPI en régression.

> Plan v3 exécuté intégralement. La dette résiduelle est mesurée dans `scripts/quality-baseline.json`
> et ne peut plus augmenter sans faire échouer la CI (ratchet). Le total de dette reste à réduire
> par lots successifs en abaissant cette baseline.
