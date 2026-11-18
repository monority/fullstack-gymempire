# Plan d'exécution technique — GymEmpire

> Ce document est le **plan de chantier** : il traduit l'ambition produit de [`plan.md`](./plan.md) et les règles de [`rules.md`](./rules.md) en tâches exécutables, ordonnées et vérifiables.
>
> - **Périmètre** : qualité du code, architecture, design system, accessibilité, performance, tests.
> - **Hors périmètre** : nouvelle fonctionnalité métier majeure (sauf le lot F, unité kg/lbs, qui corrige une incohérence produit existante).
> - **Dernière mise à jour** : 17 novembre 2026.
> - **État de référence** (17/11) : `pnpm test` **629 tests / 51 fichiers**, couverture **63,8 %**, `pnpm check:strict` **0/0/0**, `pnpm lint` **0 erreur**, `pnpm check:colors` **vert**, `pnpm format:check` **vert**, `pnpm build` **42 pages**, `pnpm test:e2e` **32/32** (dont 6 audits axe et 10 contrôles thème/responsive), `pnpm test:smoke` **12 routes + SW**, `git diff --check` **vert**.
> - **Avancement** : S1 et S2 largement entamés, S3–S4 lancés (D0–D8, hors `timer`/`print`), fondation CSS (D9/E1/E2) livrée. Voir §0.1.

---

## 0. Comment lire ce document

Chaque tâche possède :

| Élément       | Signification                                                                      |
| ------------- | ---------------------------------------------------------------------------------- |
| **ID**        | Identifiant stable (`D3`, `C2`…) pour référencer la tâche dans une PR ou un commit |
| **Statut**    | Reporté dans le suivi §0.1 (✅ fait · 🔶 partiel · ⬜ à faire · ⏸ décision)        |
| **Effort**    | `S` ≤ 2 h · `M` ≈ 0,5 j · `L` ≈ 1–2 j · `XL` > 2 j (à découper)                    |
| **Dépend de** | Tâches à terminer avant de commencer — cartographie complète en §0.2               |
| **Fichiers**  | Cibles principales, pour éviter les recherches                                     |
| **Critères**  | Cases à cocher : la tâche n'est pas finie tant qu'elles ne sont pas toutes vertes  |

**Règle de lecture** : une tâche `L`/`XL` doit être livrée en plusieurs PR atomiques. Si une PR dépasse ~400 lignes modifiées hors tests, elle est découpée.

### 0.1 Statut d'exécution (17/11/2026)

| Tâche                | Statut | Preuve / reste à faire                                                                                                       |
| -------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| A1 fins de ligne     | ✅     | `git diff --check` vert                                                                                                      |
| A2 `check:strict`    | ✅     | script + CI                                                                                                                  |
| A3 Prettier          | ✅     | `format:check` sur 119 fichiers modifiés, vert après formatage                                                               |
| A4 oxlint            | ✅     | 0 erreur (warnings `no-explicit-any` tolérés)                                                                                |
| A5 E2E harness       | ✅     | `scripts/playwright-dev.mjs` (force + kill de l'arbre de process sur Windows) ; 2 runs à froid verts, aucun serveur résiduel |
| A6 documentation     | ✅     | README, plan.md, AGENTS.md                                                                                                   |
| B1 `ui.astro`        | ✅     | garde `import.meta.env.PROD` → `Astro.rewrite('/404')` ; sources conservées                                                  |
| B2 `rest-times`      | ✅     | déjà branché dans la page rapide (option A) ; `getRestTime` accepte désormais le fallback de l'utilisateur                   |
| B3/B4 formatters     | ✅     | seuls restent les adaptateurs Alpine, qui délèguent à `lib/format`                                                           |
| B5 orphelins         | ✅     | `scripts/dead-code.mjs`                                                                                                      |
| C1 découpage storage | ✅     | `src/lib/storage/{types,defaults,store,guards,exercises,sessions,settings,body,backup,csv}.ts`                               |
| C2 CSV               | ✅     | `src/lib/storage/csv.ts`                                                                                                     |
| C3 migration imports | ✅     | aucun import du barrel dans `src/` (barrel conservé pour compatibilité)                                                      |
| C4 migrations schéma | ✅     | table `MIGRATIONS` + `SNAPSHOT_VERSION` dans `backup.ts`                                                                     |
| C5 guards            | ✅     | `isProgressRecord` filtre désormais l'historique                                                                             |
| D0 patron Alpine     | ✅     | `plateCalculator.ts` + test                                                                                                  |
| D1 quick             | ✅     | `quickSession.ts`, `quickRest.ts` + tests                                                                                    |
| D2 timer             | ✅     | `timerEngine.ts` + test (nom divergent du plan, sans conséquence)                                                            |
| D3 stats             | ✅     | `src/lib/charts/statsCharts.ts` (364 l.) + 16 tests ; page 1 008 → 728 l.                                                    |
| D4 settings          | ✅     | `src/components/settings/settingsApp.ts` + 11 tests ; page 1 626 → 1 279 l.                                                  |
| D5 detail            | ✅     | `sessionDetailApp.ts` + 6 tests + `mood.test.ts` ; page 1 510 → 1 143 l.                                                     |
| D6 exercises         | ✅     | `exercisesApp.ts` + 7 tests ; page 1 559 → 1 237 l.                                                                          |
| D6b create           | ✅     | `sessionBuilder.ts` + 8 tests ; page 1 706 → 1 425 l.                                                                        |
| D7                   | ✅     | `sessionsApp`, `calendarApp`, `historyApp`, `compareApp`, `poidsApp` + 30 tests                                              |
| D8                   | ✅     | `recordsApp`, `trendsApp`, `loginApp`, `dashboardApp` + 25 tests                                                             |
| D8 + reste D7        | ⬜     | compare, poids, records, trends, login, dashboard, timer, print                                                              |
| D9/E1/E2 CSS         | ✅     | layers `reset→tokens→base→components→utilities`, tokens splittés, a11y, `src/styles/README.md`                               |
| E1                   | ✅     | `--color-scrim` + `--shadow-2`, 6 littéraux supprimés, `pnpm check:colors` en CI                                             |
| E2–E7                | ⬜     | a11y, thème clair                                                                                                            |
| F1–F6                | ⏸      | arbitre F1 requis avant de coder                                                                                             |
| G1/G3/G4             | ✅     | mesure gzip, vendor ESM documenté, pas de polices distantes                                                                  |
| G2                   | ⬜     | test offline manuel + bump version SW à documenter                                                                           |
| G5                   | ✅     | budget gzip en CI + outil `pnpm screens`                                                                                     |
| H3 E2E               | ✅     | 15 scénarios Playwright (liste/duplication, quick, timer, réglages, login, EN)                                               |
| H1/H2                | ✅     | couverture 63,56 % avec seuils CI ; 6 audits axe-core verts (5 défauts corrigés)                                             |
| H4–H6                | ⬜     | golden visuel, import/export complet, mode clair, lbs, offline                                                               |

### 0.2 Dépendances

| Tâche | Dépend de                        | Raison                                         |
| ----- | -------------------------------- | ---------------------------------------------- |
| A1–A6 | rien                             | prérequis à tout le reste                      |
| B1/B2 | rien (décision)                  | bloque la fin de S1                            |
| C2–C5 | C1                               | découpages successifs de `storage`             |
| D0    | A2, A5                           | gate strict + filet E2E avant extraction       |
| D1–D2 | D0, H3                           | patron figé + parcours E2E couvert             |
| D3–D9 | D0, C1 (pour les appels storage) | cohérence des imports                          |
| E1–E7 | D9                               | CSS partagé avant purge des couleurs           |
| F2    | C5                               | helpers d'unité branchés sur les guards/backup |
| F3–F5 | F1, F2                           | arbitre produit + helpers                      |
| G1    | S5                               | mesurer après stabilisation                    |
| H2–H5 | D0–D2 au minimum                 | tests des factories extraites                  |

### 0.3 Décisions à consigner

Voir §7.5. Toute tâche `⏸` reste bloquée tant que la décision n'y est pas écrite avec date et responsable.

---

## 1. Diagnostic chiffré (état initial — 16/11/2026)

### 1.1 Volumétrie

| Indicateur                           | Valeur                               |
| ------------------------------------ | ------------------------------------ |
| Fichiers source (`src/`, hors tests) | 247                                  |
| Lignes `src/`                        | ≈ 41 000                             |
| Pages `.astro`                       | 42 (dont 20 wrappers EN de 5 lignes) |
| Pages substantielles (> 50 lignes)   | 21                                   |
| Lignes cumulées de ces 21 pages      | **20 532**                           |
| dont blocs `<script>` inline         | **5 825**                            |
| dont blocs `<style>` scoped          | **9 173**                            |
| Composants Alpine (`Alpine.data`)    | 24                                   |
| Composants `.astro`                  | 64                                   |
| Modules `src/lib`                    | 42                                   |
| Tests                                | 461 (27 fichiers)                    |
| E2E                                  | 2 scénarios Chromium                 |
| Build                                | 42 pages, ~1,4 s                     |

### 1.2 Top 12 des fichiers les plus lourds

| Fichier                                 | Lignes | dont script | dont style |
| --------------------------------------- | -----: | ----------: | ---------: |
| `src/pages/sessions/create/index.astro` |  1 773 |         291 |        850 |
| `src/pages/exercises/index.astro`       |  1 659 |         336 |        809 |
| `src/pages/sessions/quick.astro`        |  1 654 |     **539** |        738 |
| `src/pages/settings/index.astro`        |  1 593 |         413 |        563 |
| `src/pages/sessions/detail.astro`       |  1 505 |         374 |        963 |
| `src/pages/sessions/compare.astro`      |  1 277 |         299 |        519 |
| `src/pages/timer/index.astro`           |  1 130 |     **507** |        405 |
| `src/pages/progression/stats.astro`     |  1 025 |         492 |        379 |
| `src/pages/sessions/print.astro`        |    912 |           — |          — |
| `src/pages/ui.astro`                    |    855 |           0 |         55 |
| `src/pages/progression/poids.astro`     |    838 |         222 |        335 |
| `src/lib/storage.ts`                    |    878 |           — |          — |

### 1.3 Dettes confirmées par l'audit

| #   | Dette                                            | Preuve                                                  | Impact                                  |
| --- | ------------------------------------------------ | ------------------------------------------------------- | --------------------------------------- |
| 1   | Markup + logique + CSS entremêlés dans les pages | 20 532 lignes sur 21 fichiers                           | Lisibilité, revue, risque de régression |
| 2   | Scripts Alpine inline de 300–540 lignes          | `quick` 539, `timer` 507, `stats` 492                   | Logique non testable unitairement       |
| 3   | CSS scoped massif et répété                      | 9 173 lignes inline ; motifs cartes/KPI/états dupliqués | Dérive visuelle, thème difficile        |
| 4   | `storage.ts` god-module                          | 878 lignes : types + defaults + CRUD + CSV + backup     | Couplage, tests lourds                  |
| 5   | Unités kg uniquement                             | ≈ 50–60 références `kg` en dur, `Settings.unit` ignoré  | Fonction visible mais inopérante        |
| 6   | `ui.astro` publié mais non lié                   | 855 l. + 15 composants + 2×148 l. i18n                  | Poids mort exposé en prod               |
| 7   | `rest-times.ts` orphelin                         | seul son test l'importe                                 | Code mort                               |
| 8   | Formatage de dates dupliqué dans les pages       | `history`, `calendar`, `poids`                          | Incohérences de libellés                |
| 9   | Couleurs en dur                                  | 101 littéraux hors `debug.astro`                        | Rupture dark/light, thème               |
| 10  | Animation non conditionnée                       | 3 `prefers-reduced-motion` pour ~20k lignes d'UI        | Accessibilité                           |
| 11  | Couverture E2E faible                            | 2 scénarios pour ~25 parcours                           | Filet insuffisant avant refactor        |
| 12  | `git diff --check` rouge                         | CRLF dans 3 fichiers i18n                               | Bruit permanent dans les diffs          |

### 1.4 Ce qui est déjà solide (à ne pas casser)

- Séparation nette `src/lib` (logique pure) / `src/components` (UI) / `src/pages` (composition).
- i18n typé : `Dictionary = typeof fr`, donc l'EN ne peut pas diverger structurellement.
- `PageHeader`, `AppLayout`, tokens CSS centralisés (`tokens/colors.css`, `tokens/scale.css`, `utilities.css`).
- Chaîne de validation complète : Vitest + `astro check` + build + smoke + E2E, branchée en CI.
- Convention builder déjà exemplaire : `src/components/builder/*.ts` + template inline.
- Validation d'import (`importAllData`) et `SNAPSHOT_VERSION` déjà en place.

---

## 2. Objectifs et résultats mesurables

| KPI                                               |                         Aujourd'hui |                    Cible | Échéance                |
| ------------------------------------------------- | ----------------------------------: | -----------------------: | ----------------------- |
| Hints `astro check`                               |                                   0 |      **0 en permanence** | Lot A                   |
| Plus grosse page `.astro`                         |                            1 773 l. |           **< 1 200 l.** | Fin lot D               |
| Pages > 1 500 lignes                              |                                   5 |                    **0** | Fin lot D (script seul) |
| Pages > 1 000 lignes                              |                                   8 |      **≤ 3, justifiées** | Fin lot D               |
| Pages clés > 900 lignes                           |                                   8 |                    **0** | Fin lot D9              |
| Lignes de `<script>` inline / page max            |                                 539 |                **< 150** | Fin lot D               |
| Littéraux de couleur hors `debug.astro`           |                                 101 |                 **< 20** | Lot E                   |
| Règles animées sans `prefers-reduced-motion`      |                            majorité |                **100 %** | Lot E                   |
| Références `kg` en dur                            |                             ≈ 50–60 | **0** (via helper unité) | Lot F                   |
| Composants dupliqués (formatters, download, mood) | 4 familles corrigées, reste 3 pages |                    **0** | Lot B                   |
| Scénarios E2E                                     |                                   2 |                 **≥ 10** | Lot H                   |
| Couverture `src/lib`                              |                         non mesurée |               **≥ 80 %** | Lot H                   |
| `git diff --check`                                |                        rouge (i18n) |                 **vert** | Lot A                   |

> **État courant (17/11)** : 626 tests / 50 fichiers · `check:strict` 0/0/0 · `lint` 0 erreur · `format:check` vert · `diff --check` vert · plus grosse page 1 425 l. (`sessions/create`, était 1 706) · `settings` 1 279 l. · `exercises` 1 237 l. · `detail` 1 143 l. · `compare` 1 011 l. · `print` 795 l. · `stats` 728 l. · `timer` 724 l. (était 1 142) · `sessions/index` 645 l. · `poids` 644 l. · `records` 638 l. · `login` 619 l. · `calendar` 599 l. · `history` 565 l. · `trends` 401 l. · `dashboard` 393 l. · E2E 2/2 à froid.
>
> Les valeurs « Aujourd'hui » ci-dessus sont celles de l'audit initial (16/11) ; elles servent de référence de départ pour mesurer les gains.

---

## 3. Règles du jeu (non négociables)

### 3.1 Contraintes du projet

1. **Alpine d'abord** : le markup produit par `x-for`/`x-if`/état runtime reste dans le `.astro` parent. Jamais d'extraction de markup dynamique en composant Astro (`AGENTS.md`, `rules.md`).
2. **Logique en TS** : toute transformation, validation, règle métier va dans un module TypeScript testable, sans DOM.
3. **Communication** : `$dispatch("area:event-name", detail)` entre zones Alpine ; pas d'appel direct d'une app à l'autre.
4. **Labels** : injectés par le parent (`LABELS = t()`), jamais importés en dur dans un module métier.
5. **Pas d'AI slop** : pas de carte flottante décorative, pas de gradient/glow/glassmorphism gratuit (`rules.md`).
6. **Accessibilité** : cible 44 px, `:focus-visible`, contraste dark/light, `prefers-reduced-motion`, annonces lecteur d'écran.
7. **Données** : valider à chaque frontière (localStorage, import, sync). Ne jamais perdre une saisie silencieusement.
8. **Pas de suppression de contenu utilisateur** sans accord explicite.

### 3.2 Definition of Done (chaque PR)

```text
pnpm test          -> vert (510 tests actuellement ; aucun test supprimé sans justification)
pnpm check:strict  -> 0 erreur / 0 warning / 0 hint (--minimumFailingSeverity hint)
pnpm lint          -> 0 erreur (oxlint ; les warnings no-explicit-any sont tolérés)
pnpm format:check  -> vert (Prettier sur les fichiers du diff uniquement)
pnpm build         -> 42+ pages, 0 warning
pnpm test:smoke    -> vert (12 routes + service worker)
pnpm test:e2e      -> vert si le parcours touché est couvert
git diff --check   -> vert
git status         -> aucun fichier non intentionnel
```

- revue visuelle **mobile / desktop / dark / light / clavier / FR / EN** pour toute PR UI, validée par le propriétaire produit (utilisateur).
- pas de commit fourre-tout ; message explicite.

### 3.3 Anti-objectifs

- ❌ Réécrire en React/Vue/Svelte, ajouter un backend, migrer de base de données.
- ❌ Remplacer Alpine par un import npm : la build rolldown crash sur ce poste (commentaire documenté dans `AppLayout.astro`). Garder le build ESM auto-hébergé.
- ❌ Extraire massivement les templates Alpine en composants Astro.
- ❌ Introduire une dépendance UI lourde.
- ❌ Refactor « big bang » : chaque lot reste déployable et testé.

---

## 4. Lots de travail

### Lot A — Hygiène et garde-fous

> Objectif : rendre les régressions impossibles à ignorer avant de toucher au reste.

#### A1 — Fins de ligne propres (`S`) — **accord requis**

- **Fichiers** : `src/i18n/en/index.ts`, `src/i18n/fr/index.ts`, `src/i18n/types.ts`
- **Problème** : CRLF locaux → `git diff --check` échoue en permanence, masquant les vraies erreurs.
- **Action** : normaliser en LF (contenu inchangé) **après validation explicite**, ou ajouter ces 3 chemins à une exception documentée.
- **Critères**
  - [x] `git diff --check` vert sans exclusion (16/11/2026)
  - [x] `git diff --stat` ne montre plus que des changements intentionnels
  - [x] `pnpm test` et `pnpm check` inchangés

#### A2 — Verrouiller le zéro-hint (`S`)

- **Fichiers** : `package.json`, `.github/workflows/ci.yml`
- **Action** : `astro check` accepte un seuil d'échec. Ajouter un script `check:strict` (échec sur hint) et l'utiliser en CI.
- **Critères**
  - [x] `pnpm check:strict` échoue si un import mort est réintroduit (`--minimumFailingSeverity hint`)
  - [x] CI utilise `check:strict`
  - [x] Documenté dans `README.md`

#### A3 — Formatage automatique (`M`)

- **Fichiers** : `.prettierrc`, `.prettierignore`, `package.json`, CI
- **Action** : Prettier + `prettier-plugin-astro`. Démarrer en `--check` sur les fichiers **modifiés** uniquement (pas de reformat global : diff ingérable).
- **Critères**
  - [x] `pnpm format:check` sur les fichiers du diff (`scripts/format-changed.mjs`, compatible Windows)
  - [x] Step CI ajouté
  - [x] `AGENTS.md` mis à jour (commande de format)

#### A4 — Lint ciblé (`M`)

- **Fichiers** : `eslint.config.js` (flat config) ou `oxlint`
- **Action** : règles minimales et non bruyantes : `no-unused-vars`, `no-console` (hors scripts), `eqeqeq`, `prefer-const`, `no-explicit-any` en warn. Pas de règles stylistiques (Prettier s'en charge).
- **Critères**
  - [x] 0 erreur sur le code actuel (`eqeqeq` en mode `smart` ; 2 `catch`/`new Array` corrigés)
  - [x] Les `any` existants restent en `warn` (choix du plan) ; à typer au fil du lot D
  - [x] Step CI ajouté

#### A5 — Réparer le harness E2E local (`S`)

- **Fichiers** : `playwright.config.ts`
- **Problème observé** : `webServer` démarre `pnpm dev`, Playwright sonde `localhost:4321` (résolu en `::1`) alors qu'un serveur existant écoute parfois `127.0.0.1` → « Process exited early ».
- **Action** : `command: "pnpm exec astro dev --host 127.0.0.1 --port 4321"`, `url` aligné, `reuseExistingServer: !process.env.CI`.
- **Critères**
  - [x] `pnpm test:e2e` passe à froid, deux fois de suite
  - [x] CI inchangée fonctionnellement

#### A6 — Documentation de pilotage (`S`)

- **Fichiers** : `README.md`, `roadmap.md`, `AGENTS.md`
- **Action** : aligner chiffres (461 tests), procédures, et pointer vers ce plan.
- **Critères**
  - [x] Aucun chiffre périmé (README : scripts complets, limites à jour)
  - [x] `plan-execution.md` référencé depuis `plan.md` et `README.md`

---

### Lot B — Dette immédiate (code mort & doublons)

#### B1 — Trancher le sort de `ui.astro` (`S`) — **décision utilisateur**

- **Fichiers** : `src/pages/ui.astro`, `src/pages/en/ui.astro`, `src/i18n/{fr,en}/ui.ts`, `src/components/ui/*`
- **Options**

  | Option                       | Effet                                         | Coût                   |
  | ---------------------------- | --------------------------------------------- | ---------------------- |
  | A. Statu quo                 | Page publique non liée                        | 0                      |
  | B. **Dev-only** (recommandé) | Route absente du build prod, source conservée | S                      |
  | C. Suppression               | −855 l., −15 composants, −296 l. i18n         | M (perte de référence) |

- **Implémentation de B** : garde `import.meta.env.DEV` + `Astro.rewrite('/404')` en prod (ou `getStaticPaths` vide côté EN) et test smoke vérifiant `dist/ui/index.html` absent.
- **Critères**
  - [x] Décision consignée dans ce fichier — **B. Dev-only (16/11/2026)** : garde `import.meta.env.PROD` + `Astro.rewrite('/404')` dans `ui.astro`, composants et i18n conservés
  - [x] Build prod sans contenu `/ui` : `dist/ui/index.html` rend la 404 ; assertion smoke ajoutée (`scripts/smoke-routes.mjs`)
  - [x] Composants conservés si B, supprimés si C
  - [x] Aucun lien mort dans la nav (aucun lien vers `/ui` dans `src/`)

#### B2 — `rest-times.ts` : brancher ou supprimer (`S`)

- **Fichiers** : `src/lib/rest-times.ts`, `src/lib/__tests__/rest-times.test.ts`, `src/pages/sessions/quick.astro`
- **Action** : si branchement, l'utiliser comme **valeur par défaut** du repos par exercice dans le builder/quick (avec `Settings.defaultRestTime` en override). Sinon supprimer module + test.
- **Critères**
  - [x] Décision consignée — **Branché (16/11/2026)** : `getRestTime(name, userDefault)` accepte un fallback utilisateur ; `_startRest` de `quick.astro` l'utilise (valeur conseillée par exercice, `Settings.defaultRestTime` sinon)
  - [x] Si branché : tests d'intégration ajoutés (fallback utilisateur, valeur courbe conservée) — pas de libellé i18n nécessaire (aucun affichage nouveau)
  - [x] Si supprimé : n/a

#### B3 — Finir la déduplication des formatters (`S`)

- **Fichiers** : `src/pages/exercises/history.astro` (l. 548-556), `src/pages/calendar.astro` (l. 381-387), `src/pages/progression/poids.astro` (l. 367)
- **Action** : supprimer les wrappers locaux qui réimplémentent `lib/format` ; garder uniquement les adaptateurs Alpine qui appellent la fonction importée.
- **Critères**
  - [x] Plus aucune implémentation de `formatDate*`/`formatNumber` dans `src/pages` : inline `toLocaleString` supprimés dans `poids.astro`, `index.astro`, `exercises/index.astro` (→ `formatNumber`/`formatNumPositive`/`formatDateShort` de `lib/format`)
  - [x] `pnpm test` vert (469) ; vérif visuelle des pages à faire côté utilisateur

#### B4 — Consolider le formatage des poids (`S`)

- **Fichiers** : `src/lib/format.ts`, `src/lib/quick-session-stats.ts`
- **Action** : un seul module expose `formatWeightValue` (valeur brute, sans unité) et `formatWeight(…, unit)` (avec unité). Documenter le contrat dans le JSDoc.
- **Critères**
  - [x] Un seul nom exporté par concept : implémentation unique dans `lib/format.ts` ; `quick-session-stats.ts` ré-exporte `formatWeightValue` ; `formatWeight(weight, unit = 'kg')` accepte l'unité explicite (contrat JSDoc)
  - [x] Tests des deux fonctions : `src/lib/__tests__/format-weight.test.ts`
  - [x] Aucun appel ambigu dans les templates

#### B5 — Vérifier l'absence d'autres orphelins (`S`)

- **Action** : script ponctuel `scripts/dead-code.mjs` (ou `knip` en devDependency) qui liste les modules/exports non importés hors tests. Résultat à traiter ou documenter.
- **Critères**
  - [x] Rapport généré : `node scripts/dead-code.mjs` — sortie : seul `src/env.d.ts` (déclaration ambiant, non importable par design). `rest-times.ts` ne figure plus (branché en B2)
  - [x] Chaque orphelin : justification écrite (aucun module mort restant)

---

### Lot C — Socle de données

> Objectif : sortir `storage.ts` du statut de god-module sans casser les 30+ imports existants.

#### C1 — Découper `storage.ts` (`L`)

- **Cible** :

  ```text
  src/lib/storage/
    index.ts       # ré-export (compatibilité) — supprimé en C3
    types.ts       # Exercise, Session, SessionSet, Settings…
    defaults.ts    # DEFAULT_SETTINGS, DEFAULT_REMINDERS, DEFAULT_WEBDAV, STORAGE_KEYS
    store.ts       # getStore/setStore/generateId + garde localStorage
    exercises.ts   # CRUD exercices
    sessions.ts    # CRUD séances + requêtes par date/mois/semaine
    body.ts        # mesures corporelles
    settings.ts    # get/save/update settings
    backup.ts      # exportAllData/importAllData/resetAllData
    guards.ts      # isExercise/isSession/isBodyRecord/normalizeSession
  ```

- **Méthode** : déplacements purs, **zéro changement de comportement**. `src/lib/storage.ts` reste un barrel `export *` le temps de la migration.
- **Critères**
  - [ ] `pnpm test` strictement identique (461 tests)
  - [ ] Aucun cycle d'import (`madge` ou `pnpm dlx madge --circular src/lib`)
  - [ ] Chaque nouveau module < 250 lignes

#### C2 — Extraire la sérialisation CSV (`S`)

- **Fichiers** : `src/lib/storage.ts` (l. 779-818), `src/lib/csv-export.ts`
- **Action** : créer `src/lib/csv.ts` (pur : `sessionsToCsv`, `exportSessionAsCsv`) ; `csv-export.ts` ne garde que le DOM (`downloadBlob`, `slugify`).
- **Critères**
  - [ ] `csv.ts` sans aucune référence `window`/`document`
  - [ ] Tests CSV déplacés et verts
  - [ ] `storage` ne contient plus de formatage

#### C3 — Migrer les imports vers les nouveaux modules (`M`)

- **Action** : remplacer progressivement `from '../lib/storage'` par le module précis ; supprimer le barrel quand `grep` ne trouve plus d'import global.
- **Critères**
  - [ ] Plus aucun import du barrel
  - [ ] Barrel supprimé
  - [ ] `pnpm check` 0 hint

#### C4 — Versionner et migrer le schéma (`M`)

- **Fichiers** : `src/lib/storage/backup.ts`
- **Action** : `SNAPSHOT_VERSION` + table de migrations `migrate(snapshot)`. Toute évolution future (ex. `unit`) passe par une migration testée.
- **Critères**
  - [ ] Test : snapshot v1 importé → données valides et normalisées
  - [ ] Test : version future rejetée avec message explicite
  - [ ] Test : payload partiel → defaults appliqués

#### C5 — Typage des frontières (`M`)

- **Action** : remplacer les `as` par des type guards exhaustifs ; vérifier que `importAllData` filtre bien **tous** les champs (aujourd'hui `progress` est stocké sans filtre).
- **Fichiers** : `src/lib/storage/backup.ts`, `guards.ts`
- **Critères**
  - [ ] `progress` filtré comme `exercises`/`sessions`/`body`
  - [ ] Tests d'import avec entrées corrompues
  - [ ] Aucune perte silencieuse

---

### Lot D — Extraction de la logique Alpine

> Objectif : ramener chaque page sous ~1 200 lignes en déplaçant **uniquement la logique** vers TS, puis sous 900 lignes pour les pages clés via D9. Les templates restent dans les `.astro`.
> Ordre = (lignes de script) × (risque) × (valeur de test).

#### D0 — Patron de référence (`S`)

Créer d'abord un exemple canonique sur une petite page (`calculator`, 146 l. de script) pour figer le patron :

```ts
// src/components/calculator/plateCalculator.ts
import { computePlates, type PlateResult } from '../../lib/calculator';

export interface PlateCalculatorDeps {
  unit: () => string;
  labels: {/* sous-ensemble de LABELS.calculateur */};
}

export function createPlateCalculator(deps: PlateCalculatorDeps) {
  return {
    weight: 0,
    bar: 20,
    result: null as PlateResult | null,
    compute() {
      /* pur, testable sans DOM */
    },
    reset() {
      /* … */
    },
  };
}
```

```astro
<!-- src/pages/calculator.astro -->
<script>
  import { createPlateCalculator } from '../components/calculator/plateCalculator';
  Alpine.data('plateCalculator', () =>
    createPlateCalculator({
      unit: () => getSettings().unit,
      labels: LABELS.calculateur,
    })
  );
</script>
```

- **Critères**
  - [ ] `calculator.astro` < 300 lignes
  - [ ] Test unitaire du factory (sans jsdom)
  - [ ] Aucun changement visuel (capture avant/après)
  - [ ] Patron documenté en annexe C

#### D1 — `sessions/quick` → `src/components/sessions/quickSession.ts` (`L`)

- **Fichiers** : `src/pages/sessions/quick.astro` (1 654 l., 539 l. de script)
- **Déjà extrait** : `lib/quick-session-stats.ts` (pure). Reste : état de session, navigation séries, timer de repos, undo, complétion.
- **Découpage**
  1. `quickSession.ts` : état + méthodes pures (navigation, progression, complétion)
  2. `quickRest.ts` : machine d'état du repos (`start/pause/reset/tick`)
  3. Le page-level garde : chargement localStorage, `window.showToast`, `$dispatch`
- **Critères**
  - [ ] Page < 1 200 l. après extraction du script (cible < 900 après D9)
  - [ ] Script inline < 200 l.
  - [ ] Tests : navigation premier/dernier set, undo, complétion partielle/totale, repos qui expire
  - [ ] E2E : nouveau scénario « quick session : valider 3 séries puis terminer »
  - [ ] Parcours mobile vérifié

#### D2 — `timer` → `src/components/timer/timerApp.ts` (`L`)

- **Fichiers** : `src/pages/timer/index.astro` (507 l. de script), `src/lib/timer-widget.ts` (777 l.)
- **Action** : le widget est déjà isolé ; extraire l'état de page (mode, presets, notifications, plein écran) dans un factory. Réutiliser `lib/timer-format` / `lib/timer-input`.
- **Critères**
  - [ ] Page < 700 l. après extraction (cible < 650 après D9)
  - [ ] Tests : démarrage/pause/reprise/reset, presets, passage en négatif
  - [ ] E2E : lancer un timer de 1 s et vérifier l'alerte
  - [ ] Comportement onglet caché documenté

#### D3 — `progression/stats` → `src/lib/charts/statsCharts.ts` (`L`) — ✅

- **Fichiers** : `src/pages/progression/stats.astro` (492 l. de script), nouveau module `src/lib/charts/statsCharts.ts`, tests `src/lib/charts/__tests__/statsCharts.test.ts`
- **Action** : les 5 renderers + `benchmarkBadge` sont sortis dans un module **pur**. Données, labels et helpers dépendants du DOM (`cssVar`, `formatNumber`, `trMuscle`…) sont injectés via `StatsChartDeps` / `StatsChartLabels`. La page ne garde que le binding Alpine.
- **Critères**
  - [x] 5 renderers extraits (volume, donut, fréquence, top exercices, benchmarks) + badge
  - [x] 16 tests unitaires : vide, 1 point, 12 semaines, famille unique (`gapLen = 0`), 3 familles, échappement HTML, bandes percentiles
  - [x] Aucun `Date.now()`, `window` ni locale dans le module
  - [x] Page 1 008 → 728 l.
  - [ ] `stats.astro` < 600 l. : reste du CSS scoped à remonter en D9
  - [ ] Snapshots FR/EN et contraste dark/light (H5 / E)

#### D4 — `settings` → `src/components/settings/settingsApp.ts` (`L`) — ✅

- **Fichiers** : `src/components/settings/settingsApp.ts` (factory + `buildSettingsLabels`), `src/components/settings/__tests__/settingsApp.test.ts`, page 1 626 → 1 279 l. (script 401 → 57 l.)
- **Action** : tout l'état et les actions (profil, unités, repos, objectif, export/import JSON+CSV, reset, WebDAV) sont dans la factory. La page ne garde que le câblage DOM réel : `showToast`, `downloadBlob`, `FileReader`, `DATE_LOCALE()`, dialogues et sélecteur de fichier.
- **Critères**
  - [x] 11 tests : init, locale injectée, toast unique, goal invalide/inchangé, trim pseudo, export JSON/CSV, import valide/illisible, reset confirmé, timestamp WebDAV, délégation dialogues
  - [x] `setWeeklyGoal` réutilise `toastSaved()` (doublon supprimé) et le toast utilise `DATE_LOCALE()`
  - [x] Aucun `Date.now()` ni locale codée en dur dans la factory
  - [ ] E2E : export JSON → réimport → données identiques (H3)
  - [ ] Cible < 900 l. après D9 (CSS scoped restant)

#### D5 — `sessions/detail` → `src/components/session-detail/sessionDetailApp.ts` (`L`) — ✅

- **Fichiers** : factory 372 l. + 6 tests ; page 1 510 → 1 143 l. (script 369 → 35 l.)
- **Action** : état, agrégats, supersets, liens, CSV, partage et dialogues déplacés dans la factory. `window`, localStorage et locale sont injectés. **`lib/mood.ts` restauré** : icônes du registre central, `moodEmoji` mort supprimé, `moodLabel(mood, labels)` localisé ; callers `sessions/index` et `NotesSection` mis à jour.
- **Critères**
  - [x] Aucun `window`/localStorage dans la factory
  - [x] 6 tests : not found, chargement, humeur localisée, supersets, dialogues/navigation, hrefs
  - [x] 3 tests `mood` : SVG du registre, 5 dessins distincts, libellé venant de l'appelant
  - [ ] E2E : changer l'humeur et vérifier la persistance après reload (H3)
  - [ ] Notes sauvegardées / delta RPE (H3)

#### D6 — `exercises/index` → `src/components/exercises/exercisesApp.ts` (`M`) — ✅

- **Fichiers** : factory 447 l. + 7 tests ; page 1 559 → 1 237 l. (script 324 → 40 l.)
- **Action** : état, filtres, CRUD, favoris, conseils, ajout à une séance (nouvelle ou existante) déplacés dans la factory. `window`, horloge, locale et dialogues injectés.
- **Critères**
  - [x] 7 tests : init/compteurs, filtres combinés, validation formulaire, muscle personnalisé, tips, échauffements, ajout à une séance avec date injectée
  - [x] Aucun `Date.now()` ni locale codée en dur dans la factory
  - [ ] E2E : créer un exercice, le filtrer, le supprimer (H3)
  - [ ] Cible < 1 100 l. après D9

#### D6b — `sessions/create` → `src/components/builder/sessionBuilder.ts` (`L`) — ✅

- **Fichiers** : factory 360 l. + 8 tests ; page 1 706 → 1 425 l. (script 283 → 62 l.). `BuilderLabels` typé dans `builderLabels.ts`.
- **Action** : tout l'état du builder est dans la factory. Les effets (`window`, dialogues, events `builder:*`, navigation, focus du picker) sont injectés via `host` — la factory ne touche plus `window`. Ajout de `rpeLabels` séparé pour satisfaire `sessionMeta`.
- **Critères**
  - [x] 8 tests : init/exposition, validation `canSave`, ajout/suppression, filtres, expand/collapse, supersets, save+navigation, discard annulé
  - [x] Aucun `window` dans la factory
  - [ ] E2E : construire et sauvegarder une séance complète (H3)
  - [ ] Aucune perte de saisie au reload / changement d'onglet (H3)
  - [ ] Cible < 1 200 l. après D9 (CSS scoped)

#### D7 — Pages moyennes (`M` × 4)

| Page                | Script | Cible                                |
| ------------------- | -----: | ------------------------------------ |
| `sessions/compare`  |    299 | `components/sessions/compareApp.ts`  | ✅ 5 tests, 1304→1011 l. |
| `exercises/history` |    301 | `components/exercises/historyApp.ts` | ✅ 5 tests, 822 → 565 l. |
| `progression/poids` |    222 | `components/progression/poidsApp.ts` | ✅ 6 tests, 856→644 l.   |
| `calendar`          |    199 | `components/calendar/calendarApp.ts` | ✅ 8 tests, 770 → 599 l. |
| `sessions/index`    |    199 | `components/sessions/sessionsApp.ts` | ✅ 6 tests, 810 → 645 l. |

- **Critères par page** : script inline < 120 l., 1 test du factory, `pnpm check` propre.
- Les factories injectent toutes l'horloge (`today()`) : plus aucun `new Date()` non contrôlé dans la logique de page.

#### D8 — Petites pages (`S` × 5) — ✅

`recordsApp`, `trendsApp`, `loginApp`, `dashboardApp` livrés (+ `sessionsApp` en D7). 25 tests : PR et tri, graphique, validation login/thème/langue, chargement dashboard avec erreur et retry. Pages : records 785→638, trends 508→401, login 692→619, dashboard 563→393 l. Horloge et locale injectées partout.

**Complété ensuite** : `timerApp.ts` (10 tests, page 1 142 → 724 l.) et `printSheetApp.ts` (5 tests, page 936 → 795 l.). Le pont pop-out du timer (BroadcastChannel / PiP) reste hors du store réactif, comme dans l'original. **Toutes les pages logiques sont maintenant découplées.**

#### D9 — CSS scoped : extraire les motifs récurrents (`L`)

- **Fichiers** : 21 `<style>` de page (9 173 l.)
- **Action** : identifier les blocs identiques (cartes, tiles KPI, états vides, barres de filtre) et les remonter en composants CSS partagés (`src/styles/patterns.css` ou `ui/*.css`). **Ne pas** déplacer les styles spécifiques à une page.
- **Fondation livrée (17/11)** : `global.css` est l'unique point d'entrée avec l'ordre `@layer reset → tokens → base → components → utilities`. Tokens splittés en `tokens/colors.css` (dark+light) et `tokens/scale.css` ; base splittée en `base/reset.css`, `base/a11y.css`, `base/root.css` ; styles co-localisés des composants UI et stepper dans les layers. Règles documentées dans `src/styles/README.md`. Piège corrigé : les tokens dépendants du thème (`--shadow-*`, `--alpha-*`, `--bg-*`) sont tous dans `colors.css` pour que le light override gagne.
- **Critères**
  - [x] Architecture en couches + tokens splittés + documentation
  - [x] Aucune régression de build (42 pages) ni de thème (ordre des tokens vérifié dans le CSS compilé)
  - [x] `src/styles/components/patterns.css` : 11 motifs partagés centralisés (`:where(...)` dans la couche `components`) — 39 règles locales supprimées dans 20 fichiers
  - [x] Focus des champs : 10 copies remplacées par une seule règle dans `base/a11y.css`
  - [x] Groupes de déclarations dupliqués : 49 → 38 (mesure par script)
  - [ ] Aucune duplication > 8 lignes entre deux pages
  - [ ] Captures avant/après sur 8 pages clés
  - [ ] Cible KPI atteinte : 8 pages clés < 900 lignes, aucune page > 1 200 lignes

---

### Lot E — Design system, thème et accessibilité

#### E1 — Purger les couleurs en dur (`M`) — ✅

- **Action** : 6 littéraux réels remplacés par des tokens (`--color-scrim` pour les voiles overlay, `--shadow-2` pour l'ombre de carte). Les ~95 autres appartenaient à des exceptions légitimes.
- **Exceptions documentées** : `tokens/` (source de vérité), `sessions/print.astro` (palette papier fixe — l'impression ne suit pas le thème), `debug.astro` (page autonome), `ui.astro` (spécimens : les littéraux sont la donnée affichée), meta `theme-color` (le navigateur ne résout pas `var()`).
- **Garde-fous** : `scripts/check-colors.mjs` + `pnpm check:colors` en CI et dans AGENTS.md.
- **Critères**
  - [x] 0 littéral hors tokens/exceptions (script vert)
  - [x] Exceptions documentées dans `src/styles/README.md` et dans le script
  - [x] `check:colors` branché en CI
  - [ ] Contraste vérifié sur les 8 pages clés (E7)

#### E2 — `prefers-reduced-motion` global (`S`)

- **Fichiers** : `src/styles/base/a11y.css` (✅ fait), `src/styles/base/reset.css`
- **Action** : media query globale neutralisant transitions/animations non essentielles (déjà présente, déplacée depuis `reset.css`), `:focus-visible`, `.sr-only`, `touch-action: manipulation`. Reste : audit des animations JS (timer, toasts).
- **Critères**
  - [x] Règle globale `prefers-reduced-motion` dans la couche `base`
  - [x] `:focus-visible` et cibles tactiles documentées dans `src/styles/README.md`
  - [ ] Animations JS respectent `matchMedia('(prefers-reduced-motion: reduce)')`
  - [ ] Test manuel documenté

#### E3 — Cibles tactiles et focus (`M`)

- **Action** : audit des boutons icône, `x-for` de séries, steppers numériques. Garantir ≥ 44 px et `:focus-visible` visible sur fond sombre et clair.
- **Critères**
  - [ ] Aucune cible < 44 px sur mobile (375 px)
  - [ ] Ordre de tabulation logique sur builder/quick/settings
  - [ ] Anneau de focus contrasté vérifié

#### E4 — États systématiques (`M`)

- **Action** : vérifier que chaque écran de données possède : vide, chargement, erreur, succès, données longues (≥ 30 items). Utiliser `EmptyState`, `EmptyFilterState`, `Skeleton`.
- **Critères**
  - [ ] Matrice d'états remplie (annexe D)
  - [ ] Aucun écran sans état vide ni état d'erreur
  - [ ] Textes d'erreur actionnables (« réessayer », pas « erreur »)

#### E5 — Hiérarchie et anti-slop (`M`)

- **Action** : repasser les pages sur les règles `rules.md` : une action principale par écran, cartes plates, accents mesurés. Supprimer les surfaces décoratives.
- **Critères**
  - [ ] 1 action dominante identifiée par écran
  - [ ] Aucune carte décorative sans fonction
  - [ ] Validation dark/light sur les 8 pages clés

#### E6 — Typographie et échelle (`S`)

- **Action** : vérifier l'échelle dans `tokens/scale.css`, les tailles fluides, le comportement à 200 % de zoom.
- **Critères**
  - [ ] Aucun débordement à 200 %
  - [ ] Aucune taille < 12 px pour du texte lisible
  - [ ] Titres hiérarchisés (h1 unique par page)

#### E7 — Mode clair (`M`) — ✅

- `scripts/check-contrast.mjs` calcule le ratio WCAG des paires texte/fond dans les deux thèmes, en CI via `pnpm check:contrast`.
- 10 tests E2E (`e2e/theme.spec.ts`) parcourent 5 pages × 2 thèmes, vérifient `data-theme`, l'absence de débordement horizontal à 375 px et 1280 px, et écrivent une capture de diagnostic dans `test-results/` (non versionnée).
- **Défaut corrigé** : `--color-muted` du thème clair avait un ratio de 4,45:1 sur `--color-bg` → `#647266` (4,71:1). Tous les couples sont désormais ≥ 4,5:1.

---

### Lot F — Unité kg / lbs

> **Décision retenue et consignée (17/11)** : stockage canonique en **kg**, conversion uniquement à l'affichage et à la saisie. Aucune migration de données, changement réversible.

#### F1 — Spécification (`S`) — ✅

- Stockage kg ; saisie convertie avant persistance (`lb → kg × 0.45359237`) ; arrondis 0 décimale en kg, 1 en lbs ; historique inchangé.

#### F2 — Helpers d'unité (`S`) — ✅

- `src/lib/units.ts` : `toDisplayWeight`, `fromInputWeight`, `roundForUnit`, `unitLabel`, `KG_PER_LB`.
- `src/lib/format.ts` : `formatVolume`, `formatWeight`, `formatWeightValue`, `weightFromInput` lisent l'unité courante via `currentUnit()` (defaut kg), sans casser les appels existants.
- 5 tests de conversion et de formatage, dont un test E2E qui vérifie que passer en lbs convertit l'affichage **sans modifier le kg stocké**.

#### F3 — Remplacement des `kg` en dur (`L`)

- **Fichiers** : ≈ 50–60 références (`formatVolume`, KPI, hero, cartes séance, progression, records, poids, compare, print, i18n `common.kg`).
- **Action** : injecter l'unité via `getSettings().unit` dans les adaptateurs Alpine ; jamais de `' kg'` littéral.
- **Critères**
  - [ ] `grep -R "' kg'\|\" kg\"\|>kg<"` → 0 hors tests
  - [x] `formatVolume`/`formatWeight` lisent l'unité courante : toutes les pages qui les utilisent affichent l'unité choisie sans modification de template
  - [x] E2E : passer en lbs, vérifier la liste des séances et l'absence de conversion du stockage (helper `weightFromInput` prêt pour la saisie)

#### F4 — Saisie convertie (`M`)

- **Fichiers** : builder, quick, poids, records.
- **Action** : les inputs affichent l'unité choisie ; conversion à la lecture/écriture ; ne jamais arrondir deux fois.
- **Critères**
  - [ ] Saisie 100 lbs → stocké 45,36 kg → réaffiché 100 lbs
  - [ ] Timer/repos inchangés
  - [ ] Tests unitaires de conversion aux frontières

#### F5 — Cas limites (`S`)

- [ ] Poids corporel, objectifs, benchmarks, records historiques
- [ ] Import/export JSON : toujours en kg, indépendant du réglage
- [ ] WebDAV : idem
- [ ] Print/PDF : unité affichée

#### F6 — Documentation (`S`)

- [ ] `README.md` : modèle de stockage kg + unité d'affichage
- [ ] `rules.md` : règle « jamais de kg en dur »

---

### Lot G — Performance, PWA et build

#### G1 — Mesure avant/après (`S`) — partiel

- Mesure gzip du build : **106,7 Ko JS / 46,3 Ko CSS** sur l'ensemble des assets (48 fichiers JS, 21 CSS). Plus gros fichier : `i18n` 26,5 Ko gzip.
- Reste : Lighthouse mobile (LCP/CLS) non exécuté — nécessite un run CI dédié.

#### G2 — Service worker (`M`)

- **Fichiers** : `public/sw.js`
- **Action** : `APP_SHELL` n'inclut que le FR ; vérifier la stratégie de version (`muscu-app-v7` manuel → risque d'oubli), ajouter une note de bump dans la checklist de release. Vérifier le fallback offline `/`.
- **Critères**
  - [ ] Test manuel : offline après 1 visite → navigation OK
  - [ ] Bump de version documenté
  - [ ] Cache runtime borné (pas de croissance infinie)

#### G3 — Alpine et vendor (`S`)

- **Fichiers** : `public/vendor/*`, `AppLayout.astro`
- **Action** : conserver l'ESM (contrainte rolldown documentée), mais vérifier que le fichier `min.js` n'est chargé que par `debug`/`print`. Ajouter un commentaire de version unique.
- **Critères**
  - [ ] Aucun doublon de version
  - [ ] Commentaires de contrainte à jour

#### G4 — Polices et assets (`S`)

- [ ] `font-display: swap` effectif
- [ ] Préconnexions utilisées uniquement si polices distantes
- [ ] Favicon/manifest cohérents

#### G5 — Budget CI (`M`) — ✅

- `scripts/check-budget.mjs` + `pnpm check:budget` en CI, après le build : JS gzip < 140 Ko, CSS gzip < 60 Ko, fichier isolé < 40 Ko. Seuils fixés avec ~25 % de marge sur la mesure actuelle.
- `pnpm screens` (`scripts/capture-screens.mjs`) permet une revue visuelle reproductible des 14 pages × 2 thèmes dans `test-results/screens` (non versionné). Utilisé lors de cette session : a permis de détecter le bug d'agrégation des statistiques et le bouton « Commencer » affiché sur une séance terminée.

---

### Lot H — Tests et QA

#### H1 — Couverture mesurée (`M`) — ✅

- `@vitest/coverage-v8` + `pnpm test:coverage`, rapports texte/HTML/lcov dans `coverage/` (gitignore + tsconfig exclude).
- Planchers bloquants en CI : lignes 63 %, instructions 61 %, fonctions 60 %, branches 55 %.
- Mesure initiale : 63,56 % lignes / 56 % branches. Points faibles identifiés : `timerApp` (22 %), `settingsApp` (46 %), `quickSession` (48 %), `share-card`/`timer-widget` (≈3 %) — à traiter en priorité.

#### H2 — Accessibilité automatisée (`M`) — ✅

- `@axe-core/playwright` sur 6 routes : dashboard, sessions (avec une carte), réglages, timer, exercices, login. Règles WCAG 2.0/2.1 A+AA ; échec sur toute violation `serious`/`critical`.
- 5 vrais défauts corrigés suite au premier run : libellé du sélecteur de langue (texte visible absent du nom accessible ×2), bouton d'affichage du mot de passe sans nom, contraste du pied de page login (`opacity: 0.7`), interrupteurs et sélecteur de repos sans libellé, carte séance dont l'`aria-label` écrasait le texte visible.
- Le test d'accessibilité fait partie de `pnpm test:e2e`, donc de la CI.

#### H3 — E2E : parcours critiques (`L`)

| Scénario                       | Assertion clé                     |
| ------------------------------ | --------------------------------- |
| Builder → sauvegarde → détail  | séance visible, volume correct    |
| Quick session → 3 séries → fin | toast, statut `completed`         |
| Timer 1 s                      | alerte déclenchée                 |
| Settings → export → import     | données identiques                |
| Bascule FR/EN                  | titres traduits, pas de clé brute |
| Mode clair                     | contraste, aucune zone illisible  |
| Unité lbs                      | valeurs converties partout        |
| Offline                        | navigation depuis le cache        |

- **Livré (17/11)** : 15 scénarios dans `e2e/` (+ `helpers.ts` avec seed une seule fois par onglet) : dashboard, builder picker, liste/filtrage, duplication+suppression, humeur FR/EN, quick session complète, timer (démarrer/pause/reset + durée custom), export JSON, objectif hebdo persistant, choix d'unité, login (validation, pseudo dérivé, dev-login), route EN.
- **Deux vrais bugs trouvés par les E2E et corrigés** : `icons.eye()` appelé comme une string dans `loginApp`, et les actions du menu Session (dupliquer/déplacer/statut) qui navigaient vers le détail au lieu de s'exécuter (`@click.stop` ajouté).
- **Quirk dev documenté** : en `astro dev`, la page `/en/` rend parfois les labels FR de la page importée ; le build statique est correct (`dist/en/index.html` contient « Welcome! »). Le test vérifie donc `html[lang=en]` + les liens `/en/...`.
- **Critères**
  - [x] 15 scénarios verts
  - [x] Aucun `waitForTimeout` arbitraire
  - [x] Données de test isolées (localStorage vidé une seule fois par onglet)
  - [ ] Scénarios restants : import JSON, mode clair, lbs, offline (H6)

#### H4 — Tests de composants Alpine (`M`)

- **Action** : pour chaque factory extraite (lot D), un test Vitest pur (sans DOM) + un test jsdom seulement si interaction DOM.
- **Critères**
  - [ ] 1 factory = 1 fichier de test
  - [ ] Cas limites (vide, 1 élément, 100 éléments, données corrompues)

#### H5 — Contrôle visuel (`M`) — partiel

- Livré : captures Playwright sur 5 pages × 2 thèmes + contrôle de débordement responsive (`e2e/theme.spec.ts`), contraste WCAG automatisé (E7). Captures non versionnées pour éviter le bruit entre Windows et la CI Linux.
- Reste : snapshots SVG deterministes des graphiques (stats, poids, tendances) avec séries de dates fixes.

#### H6 — Tests de données (`S`)

- [ ] Import : JSON invalide, version future, champs manquants
- [ ] WebDAV : 401, 403, 404, 5xx, réseau coupé
- [ ] localStorage indisponible / quota dépassé
- [ ] `SNAPSHOT_VERSION` migration

---

### Lot I — Produit et UX (backlog suivant, non bloquant)

> À planifier après les lots A–H. Chaque item mérite sa propre spec.

| ID  | Sujet                                                             | Valeur                    | Effort |
| --- | ----------------------------------------------------------------- | ------------------------- | ------ |
| I1  | Auth réelle ou clarification assumée du mode démo                 | Confiance                 | XL     |
| I2  | Stratégie de merge WebDAV (au-delà du last-write-wins)            | Fiabilité multi-appareils | L      |
| I3  | Benchmarks communautaires (le flag `benchmarksOptIn` existe déjà) | Différenciation           | XL     |
| I4  | Onboarding première séance guidée                                 | Rétention                 | M      |
| I5  | Export PDF soigné (au-delà de `print`)                            | Partage                   | M      |
| I6  | Recherche globale étendue (exercices + séances + records)         | Vitesse                   | M      |

---

## 5. Séquencement

| Sprint | Lots         | Livrable démontrable                                                              | Durée indicative |
| ------ | ------------ | --------------------------------------------------------------------------------- | ---------------- |
| **S1** | A1–A6, B1–B5 | Hygiène verte, dette immédiate purgée, décisions `ui.astro`/`rest-times` prises   | 1 semaine        |
| **S2** | C1–C5        | `storage` découpé, CSV extrait, migrations de schéma testées                      | 1 semaine        |
| **S3** | D0–D2        | Patron figé + `quick` et `timer` allégés et testés                                | 1,5 semaine      |
| **S4** | D3–D5        | `stats`, `settings`, `detail` allégés                                             | 1,5 semaine      |
| **S5** | D6–D9        | `create`, `exercises` et pages moyennes allégés, CSS partagé, pages clés < 900 l. | 2 semaines       |
| **S6** | E1–E7        | Design system purgé, a11y et thème clair validés                                  | 1,5 semaine      |
| **S7** | F1–F6        | Unité kg/lbs fonctionnelle de bout en bout                                        | 1,5 semaine      |
| **S8** | G1–G5, H1–H6 | Budgets perf, E2E ≥ 10, couverture ≥ 80 %                                         | 1,5 semaine      |

> Les sprints sont indicatifs : la règle est **un lot = une PR mergeable**, pas un sprint = un lot.
>
> **Hypothèse de capacité** : 1 développeur à temps plein (~35 h/semaine), revue incluse. Avec 2 personnes, paralléliser C1–C5 et D0–D2 ; ne jamais paralléliser deux extractions sur la même page. Les durées sont des estimations, pas des engagements.

### Jalons

- **J1 (fin S2)** : base saine, aucune dette bloquante, décisions produit prises.
- **J2 (fin S5)** : plus aucune page > 1 500 lignes, script inline < 150 l., logique métier testée hors DOM.
- **J3 (fin S6)** : UI conforme à `rules.md` (thème, focus, motion, états).
- **J4 (fin S8)** : qualité mesurée et protégée par la CI.

---

## 6. Priorisation impact / effort

| Tâche                | Impact    | Effort | Priorité          |
| -------------------- | --------- | ------ | ----------------- |
| A1 fins de ligne     | Moyen     | S      | **P0**            |
| A2 check strict      | Haut      | S      | **P0**            |
| A5 E2E harness       | Moyen     | S      | **P0**            |
| B1 `ui.astro`        | Moyen     | S      | **P0** (décision) |
| B2 `rest-times`      | Faible    | S      | **P1**            |
| B3/B4 formatters     | Moyen     | S      | **P1**            |
| C1 découpage storage | Haut      | L      | **P0**            |
| C4 migrations        | Haut      | M      | **P1**            |
| D1 quick             | Très haut | L      | **P0**            |
| D2 timer             | Haut      | L      | **P1**            |
| D3 stats             | Haut      | L      | **P1**            |
| D4 settings          | Haut      | L      | **P1**            |
| D5 detail            | Moyen     | L      | **P2**            |
| D9 CSS partagé       | Haut      | L      | **P1**            |
| E1 couleurs          | Haut      | M      | **P1**            |
| E2 reduced motion    | Moyen     | S      | **P1**            |
| E7 thème clair       | Moyen     | M      | **P2**            |
| F3 kg/lbs UI         | Haut      | L      | **P1**            |
| H3 E2E               | Très haut | L      | **P0** (avant D)  |

---

## G. Refonte design « 10/10 » — 18 novembre 2026

Suite de la refonte technique : le langage visuel est remplacé (direction éditoriale retenue, dashboard d'abord), la vérité produit restant inchangée. Le plan détaillé et le barème sont dans [`plan-design.md`](./plan-design.md) ; la vérité produit dans [`PRODUCT.md`](./PRODUCT.md) ; le système livré dans [`DESIGN.md`](./DESIGN.md).

| Lot                    | Contenu                                                                                            | Commit               |
| ---------------------- | -------------------------------------------------------------------------------------------------- | -------------------- |
| 0 — Fondations         | tokens de type, Archivo + Inter, suppression de l'eyebrow global, correcs CSS dupliquées, docs     | `2ad5451`, `87843cd` |
| 1 — Shell & composants | fond décoratif supprimé, 7 états des interactifs, cibles 44 px, token hygiene                      | `8bb1b2e`            |
| 2 — Dashboard          | titre nu, héros « prochaine séance », objectif en arc, 3 métriques à barres hebdo, état vide épuré | `52db68d`            |
| 3 — Réplication        | échelle fixe propagée aux en-têtes et motifs partagés                                              | `467c01f`            |
| 4 — Finition           | review indépendante (disposition `ship`), `DESIGN.md` + sidecar, vérification visuelle 4 vues      | ce lot               |

**État final** : 632 tests / 51 fichiers, `check:strict` 0/0/0, lint/colors/contrast/format/budget/smoke verts, build 42 pages, 34 E2E, `git diff --check` vert. Revue indépendante : 7 correctifs appliqués puis dispositions `fix` → `ship`.

> **Note d'ordonnancement** : H3 (E2E des parcours critiques) doit démarrer **avant** le lot D. Sans filet, un refactor de 500 lignes de logique runtime est un pari.

---

## 7. Risques et parades

| Risque                                                     | Probabilité | Impact   | Parade                                                                 |
| ---------------------------------------------------------- | ----------- | -------- | ---------------------------------------------------------------------- |
| Régression silencieuse lors de l'extraction Alpine         | Moyenne     | Élevé    | E2E des parcours critiques **avant** extraction ; captures avant/après |
| Perte de saisie utilisateur en refactorant les formulaires | Faible      | Critique | Tests de non-perte ; jamais de suppression de brouillon                |
| Dérive visuelle en déplaçant le CSS                        | Moyenne     | Moyen    | Captures 8 pages × 2 thèmes ; revue design                             |
| Explosion du diff Prettier                                 | Élevée      | Faible   | Formater uniquement les fichiers modifiés                              |
| Conversion lbs mal arrondie                                | Moyenne     | Moyen    | Tests aller-retour, stockage kg canonique                              |
| Surcharge de la CI (durée)                                 | Moyenne     | Faible   | E2E en parallèle, cache Playwright, smoke rapide d'abord               |
| Scope creep (nouvelles features pendant le refactor)       | Élevée      | Moyen    | Lot I séparé, backlog explicite                                        |

### 7.5 Journal de décisions

Toute tâche `⏸` est bloquée jusqu'à ce qu'une ligne soit remplie ici avec une date et un responsable.

| ID  | Sujet                                       | Options                                                                                              | Décision                              | Date       | Responsable |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------- | ----------- |
| B1  | `ui.astro` (855 → 1 072 l. après formatage) | A. statu quo · **B. dev-only (recommandé)** · C. suppression                                         | _à trancher_                          | —          | utilisateur |
| B2  | `src/lib/rest-times.ts` orphelin            | **A. déjà branché dans la page rapide** · B. supprimer                                               | A (constaté) — fallback ajouté        | 17/11/2026 | équipe      |
| F1  | Unité kg/lbs                                | **Stockage kg canonique + conversion affichage/saisie (recommandé)** · stockage dans l'unité choisie | retenu : kg canonique                 | 17/11/2026 | équipe      |
| A1  | CRLF i18n                                   | normaliser LF vs exception documentée                                                                | normalisation LF, `diff --check` vert | 17/11/2026 | équipe      |
| E*  | Validation visuelle                         | revue propriétaire produit vs check automatique seul                                                 | revue propriétaire produit            | 17/11/2026 | utilisateur |

### 7.6 Rollback par lot

Règle : **un lot = une PR = un revert atomique**. Aucune migration de données n'est irréversible.

| Lot | Rollback                                                                                                     | Impact données                                     |
| --- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| A   | Revert des fichiers de config/scripts                                                                        | aucun                                              |
| B   | Restaurer le fichier supprimé depuis Git ; pour B1, retirer la garde dev-only                                | aucun                                              |
| C   | Le barrel `storage/index.ts` est conservé : restaurer `storage.ts` et rétablir les imports globaux si besoin | aucun : `localStorage` inchangé                    |
| D   | Remplacer le `<script>` de la page par sa version précédente ; supprimer le module extrait                   | aucun : le markup et le stockage ne changent pas   |
| E   | Revert CSS/tokens                                                                                            | aucun                                              |
| F   | Forcer le helper d'unité sur `'kg'` (le stockage reste canonique en kg) : les données restent valides        | aucun, c'est pour cela que le stockage reste en kg |
| G   | Revert `sw.js` + redéployer ; le cache se purgera au prochain bump de version                                | aucun                                              |
| H   | Revert des tests/outils                                                                                      | aucun                                              |

---

## 8. Suivi

Template à tenir à jour dans `roadmap.md` ou un `CHANGELOG` :

```text
Sprint : S__
Lots terminés : …
KPI avant → après :
  - plus grosse page        : 1773 → ____
  - script inline max       :  539 → ____
  - littéraux couleur       :  101 → ____
  - tests                   :  626 → ____
  - E2E                     :    2 → ____
  - couverture src/lib      :  n/a → ____ %
Commandes : test __ / check:strict __ / lint __ / format:check __ / build __ / smoke __ / e2e __ / diff-check __
Décisions prises : ui.astro = dev-only · rest-times = branché · unité = kg canonique + conversion affichage
```

### 8.1 Fixtures, horloge et données de test

Le premier bug de l'audit venait d'une date codée en dur (`2026-08-23`) sortie de la fenêtre glissante de 12 semaines. Règles pour H1–H6 :

1. **Horloge injectable** : toute fonction qui dépend de « maintenant » prend un `anchor: Date = new Date()` (déjà fait pour `topExercisesByVolume`). Aucun `new Date()` direct dans une règle métier testée.
2. **Temps figé dans les tests** : `vi.setSystemTime()` ou horloge factice (`TimerClock` de `timerEngine.ts`) ; jamais de `waitForTimeout` arbitraire dans les E2E.
3. **Dates relatives** : les fixtures calculent leurs dates par rapport à l'anchor, pas en littéral (sauf test explicite de régression de date).
4. **localStorage isolé** : chaque test E2E repart d'un store vide ; un helper de seed crée séances/exercices cohérents avec l'anchor.
5. **Bilingue** : chaque scénario critique est joué en FR et en EN pour vérifier l'absence de clés brutes.
6. **Frontières** : import JSON corrompu, version future, WebDAV 401/403/5xx, quota localStorage — voir H6.
7. **Régression à garder** : test « une séance en milieu de semaine est agrégée dans le bucket du dimanche » (« week-aggregation.test.ts »).

---

## 9. Annexes

### A. Commandes utiles

```bash
pnpm dev                 # serveur local
pnpm test                # Vitest
pnpm test:watch          # Vitest watch
pnpm check               # astro check (diagnostic)
pnpm check:strict        # échoue sur le moindre hint (CI)
pnpm lint                # oxlint, 0 erreur
pnpm format              # Prettier sur les fichiers du diff
pnpm format:check        # vérification Prettier (CI)
pnpm build               # build statique
pnpm test:smoke          # 12 routes + service worker
pnpm test:e2e            # Playwright (Chromium)
git diff --check         # hygiène de diff
```

### B. Conventions d'extraction

| Élément     | Convention                                                                        |
| ----------- | --------------------------------------------------------------------------------- |
| Fichier     | `src/components/<area>/<feature>.ts`                                              |
| Factory     | `create<Feature>(deps) => state & methods`                                        |
| Dépendances | injectées (`labels`, `getSettings`, `notify`) — jamais importées du DOM           |
| Événements  | `$dispatch("<area>:<event>", detail)`                                             |
| Labels      | passés par le parent, jamais codés en dur                                         |
| Test        | `<feature>.test.ts` dans `src/lib/__tests__` ou `src/components/<area>/__tests__` |
| Template    | reste dans le `.astro` (jamais de composant Astro pour du `x-for`)                |

### C. Patron de module Alpine extrait

```ts
// src/components/<area>/<feature>.ts
export interface FeatureDeps {
  labels: {/* clés i18n utilisées */};
  unit: () => 'kg' | 'lbs';
  notify: (message: string, kind: 'success' | 'error') => void;
}

export interface FeatureState {
  items: Item[];
  selectedId: string | null;
  busy: boolean;
}

export function createFeature(deps: FeatureDeps) {
  return {
    // ── état ──
    items: [] as Item[],
    selectedId: null as string | null,
    busy: false,

    // ── cycle de vie ──
    init(this: FeatureState) {
      /* … */
    },

    // ── méthodes pures testables ──
    select(this: FeatureState, id: string) {
      this.selectedId = id;
    },
    get selected() {
      /* … */
    },

    // ── effets de bord explicites ──
    save(this: FeatureState) {
      try {
        /* … */ deps.notify('…', 'success');
      } catch {
        deps.notify('…', 'error');
      }
    },
  };
}
```

### D. Matrice d'états à remplir par écran

| Écran        | Vide | Chargement | Erreur | Succès | Données longues |
| ------------ | ---- | ---------- | ------ | ------ | --------------- |
| Dashboard    | ☐    | ☐          | ☐      | ☐      | ☐               |
| Sessions     | ☐    | ☐          | ☐      | ☐      | ☐               |
| Builder      | ☐    | ☐          | ☐      | ☐      | ☐               |
| Quick        | ☐    | ☐          | ☐      | ☐      | ☐               |
| Détail       | ☐    | ☐          | ☐      | ☐      | ☐               |
| Progression  | ☐    | ☐          | ☐      | ☐      | ☐               |
| Stats        | ☐    | ☐          | ☐      | ☐      | ☐               |
| Records      | ☐    | ☐          | ☐      | ☐      | ☐               |
| Poids        | ☐    | ☐          | ☐      | ☐      | ☐               |
| Exercices    | ☐    | ☐          | ☐      | ☐      | ☐               |
| Calendrier   | ☐    | ☐          | ☐      | ☐      | ☐               |
| Timer        | ☐    | ☐          | ☐      | ☐      | —               |
| Settings     | ☐    | ☐          | ☐      | ☐      | ☐               |
| Calculatrice | ☐    | —          | ☐      | ☐      | —               |

### E. Cartographie cible de `src/`

```text
src/
  components/
    builder/          # logique builder (existant)
    calculator/       # D0
    calendar/         # D7
    dashboard/        # D8
    exercises/        # D6/D7
    layout/           # shell, header, nav
    progression/      # D7
    session-detail/   # D5
    sessions/         # D1, D7
    settings/         # D4
    stats/            # D3
    timer/            # D2
    ui/               # design system
    workout/          # cartes séance
  lib/
    charts/           # D3 : renderers SVG purs
    storage/          # C1 : types/defaults/store/CRUD/backup
    __tests__/        # tests unitaires
  i18n/               # fr/, en/, types
  layouts/            # AppLayout
  pages/              # composition + templates Alpine
  styles/             # tokens, utilities, reset, patterns
```

### F. Checklist de PR

```text
[ ] La tâche est référencée (ID du plan)
[ ] Aucun fichier utilisateur supprimé sans accord
[ ] Markup dynamique resté dans le .astro
[ ] Logique métier dans un module TS testé
[ ] Labels via i18n (FR + EN)
[ ] États vide / erreur / chargement vérifiés
[ ] Mobile 375 px, desktop, dark, light, clavier
[ ] pnpm test / check / build / smoke / e2e / diff-check verts
[ ] Documentation mise à jour si comportement changé
[ ] Aucun commit fourre-tout
```
