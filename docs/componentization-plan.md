# Plan de componentisation — Gym Empire

> Complément opérationnel de
> [`componentization-rules.md`](./componentization-rules.md), qui reste la référence normative.
>
> **Vision.** Passer d'un site où la page possède le markup, le style et la logique à un **système de
> composants dynamiques, typés et performants** : un contrat de props unique, des variants typés, un
> registre de rendu data-driven, un socle Alpine typé et des stores UI, des styles scopés et une
> mesure continue de la qualité. Aucun changement de design ni de comportement.

---

## 0. Charte

### 0.1 Principes directeurs du plan

1. **Un contrat, pas des conventions orales.** Chaque composant suit le même squelette (props, slots,
   variants, style, test). Un nouveau composant se copie depuis le template de la §2.2.
2. **Dynamique par données, pas par duplication.** Le rendu conditionnel complexe (`x-if` en cascade,
   tables spécifiques par page) devient un **registre typé** `kind → composant`.
3. **Headless d'abord, view ensuite.** Calculs et formatage vivent dans `lib/` (purs, testés) ;
   l'adaptateur Alpine ne fait que brancher ; le `.astro` ne fait qu'afficher.
4. **Le coût client est un indicateur de première classe.** Chaque extraction doit laisser — ou
   améliorer — les budgets gzip et le nombre de nœuds DOM rendus.
5. **Pas de big bang.** Une phase = un type de dette = une PR réversible, avec captures avant/après.

### 0.2 Non-objectifs (pour cadrer)

- Changer le design system, les tokens ou la charte (`.impeccable/design.json` reste souverain).
- Remplacer Alpine par un autre framework, ou bundler Alpine (contrainte matérielle documentée dans
  `AppLayout.astro:271-290` : rolldown crash et pas de `.d.ts` pour la 3.14.1 auto-hébergée).
- Refondre l'i18n dans ce plan (lot ADR dédié, §8) — on garde les 20 stubs de routes `src/pages/en/**` et les 25 modules de traduction `src/i18n/en/**` jusqu'à décision.
- Réécrire `print.astro` autrement que par un travail de tokenisation ciblé (T4.4).

---

## 1. Baseline et KPI

| #   | Indicateur (définition exacte)                       |    Baseline **mesurée** le 2026-11-19 |                                    Cible | Outil de mesure                               |
| --- | ---------------------------------------------------- | ------------------------------------: | ---------------------------------------: | --------------------------------------------- |
| K1  | Lignes de `<style>` dans `src/pages`                 |                     8 785 → **6 097** |                                    ≤ 400 | `check-components.mjs`                        |
| K2  | Pages > 1 000 lignes                                 |                             7 → **4** |                                        0 | `wc -l`                                       |
| K3  | Page la plus longue                                  | 1 488 (create) → **1 225** (settings) |                                    ≤ 250 | `wc -l`                                       |
| K4  | Occurrences de `alpine:init` dans `src`              |                    29 → **0** (P3) ✅ |                                        1 | `grep -r "alpine:init" src \| wc -l`          |
| K5  | Occurrences de `(window as any)`                     |                    55 → **0** (P1) ✅ |                                        0 | `grep -r "(window as any)" src \| wc -l`      |
| K6  | Fichiers de `src/pages` contenant `Alpine.data(`     |                    20 → **0** (P3) ✅ |                         0 (dans `pages`) | `grep -rl "Alpine.data" src/pages \| wc -l`   |
| K7  | Occurrences de `is:global`                           |                          5 → **0** ✅ |                         0 hors whitelist | `check-components.mjs`                        |
| K8  | Domaines sans composant `.astro`                     |                                     7 |                                        0 | `find src/components -name '*.astro'`         |
| K9  | Familles de helpers de formatage dupliqués           |                          6 → **0** ✅ |                                        0 | `grep -r "function fmt\|function format" src` |
| K10 | Globaux `window.*` pour UI (toast/dialog)            |                    5+ → **0** (P1) ✅ |                        0 (stores Alpine) | `grep -r "window.showToast\|openDialog" src`  |
| K11 | Littéraux de couleur                                 |          100 (`print`) + 21 (`debug`) |                        whitelist réduite | `pnpm check:colors`                           |
| K12 | JS / CSS / plus gros fichier gzip                    |       **108 280 / 45 917 / 26 942 B** |            ≤ 140k / 60k / 40k (↓ de 5 %) | `pnpm check:budget`                           |
| K13 | Couverture statements / branches / functions / lines |   **64,68 / 58,47 / 62,27 / 66,64 %** | **69,7 / 63,5 / 67,3 / 71,6 %** (+5 pts) | `pnpm test:coverage`                          |
| K14 | Violations a11y `serious`/`critical`                 |              0 sur 11 routes ✅ (axe) |                          0 sur 14 routes | `pnpm test:e2e` (11 tests a11y)               |

> Les chiffres K4–K7 et K12–K13 ont été **relevés dans le dépôt** (et non estimés) : ne pas les
> remplacer par les valeurs de l'audit initial, qui comptait des _fichiers_ là où on mesure désormais
> des _occurrences_. K6 compte les enregistrements `Alpine.data` résiduels dans les pages, pas les
> factories définies inline (3 : `statsApp`, `progressionApp`, `debugApp`, suivies séparément en P3).

**Mesure initiale à archiver** (P0.4) : `docs/componentization-baseline.txt` avec le `wc -l` complet,
les sorties des grep ci-dessus, `pnpm screens` et `pnpm check:budget`.

### 1.1 Hypothèses techniques vérifiées (2026-11-19)

Avant d'écrire le plan, chaque API citée a été confrontée au code installé (`astro@7.2.0`,
`@playwright/test@1.63.0`) :

| Hypothèse                                          | Vérification                                       | Conclusion                                                                                                                                        |
| -------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HTMLAttributes<T>` importable de `astro/types`    | `node_modules/astro/types.d.ts:9`                  | ✅ disponible                                                                                                                                     |
| `ComponentType` importable de `astro`              | recherche dans tous les `*.d.ts` d'Astro           | ❌ **n'existe pas** → remplacé par `AstroComponentFactory` de `astro/runtime/server/index.js` (export `./runtime/*` confirmé dans `package.json`) |
| `experimental_AstroContainer` de `astro/container` | `node_modules/astro/dist/container/index.d.ts:149` | ✅ disponible pour tester le rendu des composants (props + slots)                                                                                 |
| `Astro.slots.has()`                                | déjà utilisé dans `Button.astro:51-53`             | ✅ disponible                                                                                                                                     |
| Alpine non bundlé                                  | commentaire `AppLayout.astro:271-290`              | ✅ contrainte conservée (pont typé, pas d'import direct)                                                                                          |
| `page.clock` Playwright                            | API `clock` depuis 1.45                            | ✅ permet des captures déterministes (§6.2)                                                                                                       |

> **Leçon du plan** : ne pas copier un type « connu » d'une autre version de framework dans un
> exemple. Toute API nouvelle dans un doc est vérifiée dans `node_modules` avant d'être écrite.

### 1.2 Prêt / MVP / arrêt

- **Définition de prêt (avant P1)** : baseline archivée, `check-components` en mode avertissement,
  template de composant copié, POC du store UI validé (P0.6), API vérifiées (§1.1).
- **MVP livrable tôt = P0 + P1 + P4.1** : mesure, socle Alpine typé et `session-detail` encapsulé.
  Cela supprime déjà la pire dette (958 lignes de CSS dans la page) sans attendre les 8 phases.
- **Condition d'arrêt** : K1–K14 atteints, `check-components` strict, CI verte, captures sans diff.

---

## 2. Architecture cible — le « quoi »

### 2.1 Flux et couches

```
                    ┌──────────────────────────────────────┐
                    │  pages/*.astro  (assembleur, ≤250 l.) │
                    │  • t() / localizedPath / registerAlpine│
                    └───────────────┬──────────────────────┘
                                    │ props typées + slots
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌────────────────┐          ┌────────────────┐
│ components/ui │          │ components/<d> │◄────────►│ components/    │
│ primitives    │◄─────────│ composants     │  props   │ layout (shell) │
│ (0 état)      │          │ + xApp.ts      │  seulement│                │
└───────┬───────┘          └───────┬────────┘          └────────┬───────┘
        │                          │                            │
        └──────────────┬───────────┴────────────────────────────┘
                       ▼
        ┌──────────────────────────────────────┐
        │ lib/ (pur) : storage, *-stats, types │
        │ lib/alpine.ts : bridge + lifecycle   │
        │ lib/ui-store.ts : toasts / dialogs   │
        └───────────────┬──────────────────────┘
                        ▼
              i18n/ + styles/tokens
```

Règle d'or : **le flux de données descend, les actions remontent par callbacks ou par le store UI**.
Aucun composant de domaine n'importe un autre domaine (§2 du document de règles).

### 2.2 Contrat universel de composant (template à copier)

```astro
---
// src/components/<domaine>/SessionCard.astro
import type { HTMLAttributes } from 'astro/types';
import type { Session } from '../../lib/storage/types';

type Tag = 'article' | 'div' | 'li';
export interface Props extends HTMLAttributes<Tag> {
  session: Session;
  as?: Tag; // polymorphisme: même composant, balise différente
  variant?: 'default' | 'compact' | 'interactive';
  class?: string;
  //pas de [key: string]: unknown — HTMLAttributes couvre déjà aria-*, data-*, x-*
}

const {
  session,
  as: Tag = 'article',
  variant = 'default',
  class: className = '',
  ...rest
} = Astro.props;

const hasActions = Astro.slots.has('actions');
const styles = sessionCardVariants[variant]; // §2.3
---

<Tag
  class:list={['session-card', `session-card--${variant}`, className]}
  style={`--card-accent:${styles.accent};--card-pad:${styles.pad}`}
  {...rest}
>
  <h3 class="session-card__title">{session.name}</h3>
  {hasActions && (
    <div class="session-card__actions">
      <slot name="actions" />
    </div>
  )}
  <slot />
</Tag>

<style>
  .session-card {
    padding: var(--card-pad);
    border: 1px solid var(--color-border);
  }
  .session-card__title {
    font: var(--font-body);
    color: var(--color-text);
  }
  .session-card__actions {
    display: flex;
    gap: 8px;
  }
</style>
```

Points clés : `HTMLAttributes<'article'>` à la place de l'index signature `unknown`, `class:list`,
`as` polymorphe, `Astro.slots.has()` pour ne pas rendre de wrapper vide, variables CSS plutôt qu'une
explosion de classes, style scopé préfixé par le composant.

### 2.3 Variants typés (`satisfies`, une seule source de vérité)

```ts
// src/components/<domaine>/sessionCard.variants.ts
export const sessionCardVariants = {
  default: { accent: 'var(--color-accent)', pad: '24px' },
  compact: { accent: 'var(--color-border)', pad: '12px' },
  interactive: { accent: 'var(--color-accent)', pad: '24px' },
} as const satisfies Record<string, { accent: string; pad: string }>;

export type SessionCardVariant = keyof typeof sessionCardVariants;
```

`as const satisfies` donne à la fois l'inférence littérale **et** la vérification exhaustive : ajouter
un variant oublié dans la map fait échouer `astro check`. Le CSS consomme les variables, pas 6
modificateurs de classe.

### 2.4 Registre de rendu dynamique (le cœur du « dynamique réutilisable »)

Au lieu de `x-if` en cascade ou de tables copiées par page :

```astro
---
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { SessionStatus } from '../../lib/types';
import SessionCard from './SessionCard.astro';
import SessionGhost from './SessionGhost.astro';

const VIEWS = {
  completed: SessionCard,
  'in-progress': SessionCard,
  planned: SessionGhost,
  // Ajouter un statut sans mettre à jour cette map => erreur de type
} as const satisfies Record<SessionStatus, AstroComponentFactory>;

const { sessions } = Astro.props;
---

<ul class="session-list">
  {sessions.map((session) => {
    const View = VIEWS[session.status];
    return (
      <li>
        <View session={session} variant="compact" />
      </li>
    );
  })}
</ul>
```

Le même mécanisme s'applique aux **sections de Réglages** (profil / unités / objectifs / WebDAV /
danger), aux **types de graphes** (`statsCharts`), aux **lignes de tableau** et aux **items de nav**.
Le registre est typé par une union (`SessionStatus`, `SettingSection`, `ChartKind`) définie dans
`lib/types.ts` : l'exhaustivité est vérifiée à la compilation.

### 2.5 Socle Alpine moderne (sans globals `window`)

Contrainte respectée : Alpine reste le build ESM auto-hébergé (`/vendor/alpinejs-3.14.1.esm.js`),
non bundlé. On ajoute uniquement un **pont typé** et un **lifecycle centralisé**.

```ts
// src/lib/alpine.ts
export interface AlpineBridge {
  data(name: string, factory: () => Record<string, unknown>): void;
  store(name: string, value: Record<string, unknown>): void;
  initTree(root: Element): void;
}

export function getAlpine(): AlpineBridge {
  const A = (window as Window & { Alpine?: AlpineBridge }).Alpine;
  if (!A) throw new Error('[alpine] build ESM absent de window');
  return A;
}

export function registerAlpine<T extends Record<string, unknown>>(name: string, factory: () => T) {
  getAlpine().data(name, factory);
}

export function registerStore<T extends Record<string, unknown>>(name: string, value: T) {
  getAlpine().store(name, value);
}

/** Installe une seule fois le lifecycle ClientRouter (aujourd'hui inline dans AppLayout:304-326). */
export function installAlpineLifecycle() {
  /* astro:before-swap + astro:page-load */
}
```

`env.d.ts` passe de `Alpine: any` à `Alpine?: AlpineBridge` ; la page n'a plus qu'un bloc de 5–10
lignes :

```astro
<script>
  import { createSessionsApp } from '../../components/sessions/sessionsApp';
  import { registerAlpine } from '../../lib/alpine';
  import { ui } from '../../lib/ui-store';
  registerAlpine('sessionsApp', () => createSessionsApp({ labels, ui, locale, today, navigate }));
</script>
```

**Stores UI** : `lib/ui-store.ts` expose `$store.ui.notify()`, `$store.ui.openDialog(id)`,
`$store.ui.closeDialog()` et remplace `window.showToast`, `window.openDialog`, `window.closeDialog`
(K10). `Toast.astro` et `Dialog.astro` deviennent des **vues du store** (`x-for` sur `ui.toasts`,
`x-show="ui.dialog === 'id'"`) : plus de closure capturée dans `init()`, plus de timer planqué dans un
composant, et un seul état source testable.

> Le lifecycle `astro:before-swap` / `astro:page-load` / `Alpine.initTree` est **préservé tel quel**
> (déplacement de code, pas changement de sémantique) : c'est lui qui évite les doublons de state
> après navigation ClientRouter.

### 2.6 Headless core — un seul calcul, trois consommateurs

```
lib/session-list-stats.ts  (pur, testé)
        ├── sessionsApp.ts (Alpine : état + actions)
        ├── SessionCard.astro (affichage via props)
        └── statsCharts.ts (SVG : même agrégat, pas de recalcul)
```

Toute factory > 150 lignes est découpée : les getters de calcul partent dans `lib/*-stats.ts`, la
factory ne garde que `state`, `init`, `actions` et les adaptateurs injectés.

### 2.7 Performance — optimisations prévues

| Levier                         | Application concrète                                                                                                                       | Gain attendu                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Granularité des îlots          | Markup sans interaction reste du HTML statique ; un seul `x-data` par widget interactif, pas un store global qui force tout à réagir       | moins de réactivité inutile                            |
| Chargement différé des graphes | `lib/lazy.ts` (IntersectionObserver) ne monte un graphe SVG que lorsqu'il entre dans le viewport ; `rootMargin: 200px`                     | first paint plus léger sur stats/progression           |
| Containment des longues listes | `content-visibility: auto; contain-intrinsic-size: auto 96px;` sur `.session-card`, `.history-row`, `.exercise-row` (38+ éléments en démo) | layout/scroll moins coûteux                            |
| Mémoïsation des SVG            | `Map<hash(inputs), string>` dans `statsCharts.ts` et `body-chart.ts`                                                                       | évite de régénérer les mêmes courbes sur chaque `x-if` |
| CSS partagé                    | Motifs répétés (tables, dialogs, rows) dans `@layer components` ; scopes Astro uniquement pour ce qui varie                                | cible ≤ 60 Ko CSS gzip                                 |
| Vue transitions                | Scripts de page enregistrés via `registerAlpine` **et** rejoués sur `astro:page-load` (déjà en place, centralisé en P1)                    | évite les `x-data` non initialisés après navigation    |
| Budgets par route              | `check-budget.mjs` étendu : taille HTML gzip + nombre de nœuds DOM par route critique                                                      | détecte une régression d'un seul coup                  |

Interdiction : `x-html` avec du contenu non maîtrisé. Les SVG injectés sont générés par notre code,
jamais par une saisie utilisateur — à documenter en commentaire à chaque usage.

### 2.8 Accessibilité et i18n

- `@axe-core/playwright` (déjà en devDependencies) branché sur les 14 routes de `capture-screens.mjs` :
  0 violation `serious`/`critical` en gate de CI (K14).
- Chaque composant expose `aria-label` pour les contrôles iconiques, `:focus-visible` avec anneau,
  et un état vide/erreur (`EmptyState.astro`, `Skeleton.astro` existent).
- Aucune chaîne littérale : `t()` + `Dictionary` + `buildXLabels(t)` ; la route `/en/…` est testée
  pour chaque composant extrait.

---

## 3. Patterns — avant / après (mémo d'exécution)

| Pattern               | ❌ Aujourd'hui                                        | ✅ Cible                                                             |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Enregistrement Alpine | 55 `(window as any)` + 29 `alpine:init` + garde       | `registerAlpine(name, factory)` (1 seul bridge typé)                 |
| Globaux UI            | `window.showToast(...)`, `window.openDialog(id)`      | `$store.ui.notify()`, `$store.ui.openDialog(id)`                     |
| Props                 | `interface Props { [key: string]: unknown }` + spread | `HTMLAttributes<'article'>`, `as`, `class:list`, slots conditionnels |
| Variantes             | `button--primary`, `button--secondary`, … 6 classes   | map `as const satisfies` → variables CSS                             |
| Rendu conditionnel    | `x-if` en cascade / tables dupliquées par page        | registre typé `Record<Kind, AstroComponentFactory>`                  |
| Styles                | 958 lignes dans la page + `is:global`                 | `<style>` scopé dans chaque fragment, BEM par composant              |
| Logique               | `statsApp` de 187 lignes inline dans `stats.astro`    | `components/progression/statsApp.ts` + helpers `lib/` + tests        |
| Listes longues        | 38 nœuds rendus d'un coup, tous réactifs              | `content-visibility` + registre + widget lazy                        |
| Tests                 | factories non testées dans les pages                  | 1 test par factory, mocks injectés, + axe-core                       |

---

## 4. Phases d'exécution

Chaque phase est **une PR**, vérifiable et réversible. Une phase ne commence que si la précédente est
verte (KPI mesuré + captures validées).

### P0 — Fondations et mesure _(S)_

| ID   | Tâche                                                           | Livrable / cible                                                                                                                                                |
| ---- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0.1 | Créer `src/styles/README.md` (référence cassée `global.css:11`) | ✅ fait — doc courte qui pointe vers les règles et décrit les 5 layers                                                                                          |
| P0.2 | `scripts/check-components.mjs`                                  | ✅ fait — mesure K1–K8, **mode avertissement**, sortie JSON + texte (`STRICT=1` bloque)                                                                         |
| P0.3 | Scripts package + CI non bloquants                              | ✅ fait — `check:components` dans `package.json` + CI (avertissement). `dead-code` reste à câbler en P6.10                                                      |
| P0.4 | Baseline                                                        | ✅ fait — `docs/componentization-baseline.txt` (tailles, patterns, budgets, couverture)                                                                         |
| P0.5 | Template de composant                                           | ✅ fait — `docs/templates/Component.astro` + `docs/templates/xApp.ts` (copiables)                                                                               |
| P0.6 | **Spike / go-no-go store UI**                                   | ✅ **GO** — store enregistré puis navigation `ClientRouter` : l'état survit (41 → 41). `Alpine.store()` est l'accès global, `$store` l'accès dans les templates |

**Acceptation** : `pnpm check:components` s'exécute et affiche la dette ; CI verte ; baseline archivée ;
le spike P0.6 est **go** (sinon ADR-001 est réévalué avant P1).

### P1 — Socle Alpine typé et stores UI _(M)_ — débloque tout le reste

| ID   | Tâche                                 | Livrable / cible                                                                                     |
| ---- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| P1.1 | `lib/alpine.ts`                       | bridge typé + `registerAlpine` + `installAlpineLifecycle`                                            |
| P1.2 | `lib/ui-store.ts` + `lib/types/ui.ts` | `$store.ui` (toasts, dialog) typé, testé                                                             |
| P1.3 | Migrer Toast/Dialog                   | vues du store ; suppression des globals `window.*` (K10)                                             |
| P1.4 | Migrer les enregistrements (K4/K6)    | K4 → 1 ; K5 → 0 ; K6 → 0 (pages + `AppShell`, `Header`, `QuickSearch`, `ReminderSettings`, `Dialog`) |
| P1.5 | Déplacer le lifecycle                 | `AppLayout.astro:304-326` → `installAlpineLifecycle()` appelé une fois ; comportement identique      |
| P1.6 | `env.d.ts`                            | `Alpine?: AlpineBridge`, registry typé des noms `x-data`                                             |

**Acceptation** : `grep -r "(window as any)" src` → 0 ; navigation ClientRouter testée dans le navigateur
(dialog + toast après 2 changements de page) ; K4/K5 à zéro ; budget JS stable.

### P2 — Design system et contrat universel _(M)_

| ID   | Tâche                                             | Livrable / cible                                                                                        |
| ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| P2.1 | Adopter le template §2.2 sur 5 primitives pilotes | `Button`, `Card`, `Badge`, `Input`, `Dialog` : `HTMLAttributes`, `as`, `class:list`, slots              |
| P2.2 | Maps de variants `as const satisfies`             | `*.variants.ts` par primitive ; types exportés                                                          |
| P2.3 | Audit des 39 primitives                           | fusionner doublons (ex. `StatusBadge`/`Badge`, `SearchInput`/`Input`), documenter les usages dans `/ui` |
| P2.4 | Registre générique                                | `lib/component-registry.ts` helper typé `Record<K, AstroComponentFactory>` + test                       |
| P2.5 | Docs templates                                    | `docs/templates/*` alignés sur le code réel                                                             |

**Acceptation** : `astro check` strict sans erreur sur les primitives migrées ; aucune primitive
dupliquée ; galerie `/ui` à jour ; captures identiques.

### P3 — Factories headless et couverture _(M)_

| ID   | Tâche                          | Livrable / cible                                                                                                                                      |
| ---- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3.1 | Extraire `statsApp`            | `components/progression/statsApp.ts` + `__tests__/statsApp.test.ts`                                                                                   |
| P3.2 | Extraire `progressionApp`      | idem                                                                                                                                                  |
| P3.3 | Extraire `debugApp`            | `components/debug/debugApp.ts`                                                                                                                        |
| P3.4 | Factory > 150 lignes           | extraire les getters de calcul vers `lib/*-stats.ts` (cibles : `quickSession.ts` 501, `timerApp.ts` 448, `settingsApp.ts` 415, `exercisesApp.ts` 401) |
| P3.5 | Standardiser `buildXLabels(t)` | une convention, appliquée aux 4 factories existantes + 3 nouvelles                                                                                    |
| P3.6 | Tests                          | +40 tests minimum ; couverture ≥ baseline +5 pts                                                                                                      |

**Acceptation** : K6 → 0 ; `pnpm test:coverage` vert avec seuils relevés ; aucune factory > 150 lignes.

### P4 — Encapsulation des styles _(L)_

| ID   | Tâche                          | Livrable / cible                                                                                                      |
| ---- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| P4.1 | **Session detail en priorité** | 958 lignes de `detail.astro:173-1130` → 6 fragments ; `is:global` supprimé                                            |
| P4.2 | Progression                    | `stats`, `poids`, `records` : idem                                                                                    |
| P4.3 | Tables                         | remplacer 5 tables page-préfixées par `ui/Table.*` + props                                                            |
| P4.4 | Dialogs                        | styles de dialog → variants `ui/Dialog` ou composant de domaine                                                       |
| P4.5 | Répartition des gros blocs     | `create` (856), `exercises/index` (725), `quick` (729), `settings` (548), `print` (567), `timer` (443), `login` (395) |
| P4.6 | Layers CSS                     | séparer clairement scoped / `@layer components` ; `src/styles/README.md` mis à jour                                   |
| P4.7 | Containment                    | `content-visibility` sur les longues listes (§2.7)                                                                    |

**Acceptation** : K1 ≤ 400, K7 → 0 hors whitelist ; captures dark+light identiques sur 14 routes.

### P5 — Composants de domaine data-driven _(L)_

| ID   | Domaine              | Composants / registre                                                                                        | Page source                           |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| P5.1 | `sessions`           | `SessionCard`, `SessionGhost`, `SessionsList`, `SessionsFilters`, registre par `SessionStatus`               | `sessions/index.astro` (608)          |
| P5.2 | `sessions/compare`   | `CompareHeader`, `CompareMetric`, `CompareExerciseRow`                                                       | `compare.astro` (1 016)               |
| P5.3 | `builder`            | `BuilderSection`, `ExerciseRow`, `SupersetGroup`, `BuilderFooter` + retrait de l'adaptateur `any[]` (`:591`) | `create/index.astro` (1 489)          |
| P5.4 | `sessions/quick`     | `QuickHeader`, `QuickExercise`, `QuickSetRow`, `QuickRestBar`                                                | `quick.astro` (1 071)                 |
| P5.5 | `exercises`          | `ExerciseRow`, `HistoryTable`, `ExerciseFilters`, registre de graphes                                        | `index`, `history`, `trends`          |
| P5.6 | `settings`           | registre `SettingSection` → `Profile/Units/Goals/Webdav/Danger`, `SettingsRow`                               | `settings/index.astro` (1 226)        |
| P5.7 | `progression`        | `MetricCard`, `LiftProgressRow`, `BodyChart`, `RecordsTable`, registre `ChartKind`                           | `stats`, `poids`, `records`           |
| P5.8 | `calendar` / `timer` | `MonthGrid`/`DayCell`, `TimerDial`/`TimerControls`/`TimerPresets`                                            | `calendar.astro`, `timer/index.astro` |
| P5.9 | `workout`            | compléter `ExerciseCard`/`SetRow`/`StatsCard`, migrer les usages inline                                      | `quick`, `create`                     |

**Acceptation** : K2 → 0, K3 ≤ 250, K8 → 0 ; chaque registre typé (`satisfies`) couvre toute son union ;
`pnpm screens` sans diff ; budget DOM/HTML par route stable.

### P6 — Qualité, performance et accessibilité _(M)_

| ID    | Tâche                     | Cible                                                                                                         |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| P6.1  | Consolidation des helpers | K9 → 0 (`formatDuration`, `formatRestTime`, `formatSetRpe`, `fmtTime/fmtShort/fmtMs`)                         |
| P6.2  | Types partagés            | `SessionStatus`, `ExerciseCategory`, `Unit`, `SessionMood`, `ChartKind`, `SettingSection` dans `lib/types.ts` |
| P6.3  | Icônes                    | convention `<Icon name>` ; migration des `set:html={icons.*}` statiques (K cible : 0 hors `x-html`)           |
| P6.4  | `print.astro`             | tokenisation ou restriction documentée de la whitelist (K11)                                                  |
| P6.5  | Lazy charts               | `lib/lazy.ts` + IntersectionObserver sur les graphes                                                          |
| P6.6  | Mémoïsation SVG           | caches dans `statsCharts.ts` / `body-chart.ts`                                                                |
| P6.7  | a11y                      | axe-core sur 14 routes, K14 → 0                                                                               |
| P6.8  | e2e réel                  | ✅ fait en P0 : `e2e/` avec 3 parcours (demo login, création séance, navigation FR/EN + thème)                |
| P6.9  | Budgets par route         | HTML gzip + nœuds DOM ajoutés à `check-budget.mjs`                                                            |
| P6.10 | `dead-code.mjs`           | script + CI, orphelins traités                                                                                |

**Acceptation** : K9–K14 atteints ; CI verte ; aucune régression de budget.

### P7 — Verrouillage et capitalisation _(S)_

| ID   | Tâche                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------- |
| P7.1 | `check-components` passe en **mode strict** (CI bloquante) avec K1–K8                                 |
| P7.2 | Ajout des étapes `check:components`, `dead-code`, a11y et budgets par route au workflow               |
| P7.3 | Seuils de couverture relevés (K13)                                                                    |
| P7.4 | `docs/adr/` : 3 ADR (Alpine ESM non bundlé, i18n stubs vs `Astro.currentLocale`, CSS scoped vs layer) |
| P7.5 | Revue finale : capture visuelle, `pnpm test:smoke`, `pnpm test:e2e`, build prod                       |

**Acceptation** : tous les KPI au vert ; la dette ne peut plus revenir sans faire échouer la CI.

### 4.1 Chiffrage et chemin critique

Estimation **humain-équivalent** (l'automatisation accélère l'exécution, mais le séquencement reste le même).
Les tailles sont celles du plan initial, réévaluées avec la dépendance P1 → tout le reste.

| Phase                | Taille | Effort | Dépend de                         | Parallélisable avec         |
| -------------------- | ------ | -----: | --------------------------------- | --------------------------- |
| P0 Fondations        | S      |    1 j | —                                 | —                           |
| P1 Socle Alpine      | M      |    2 j | P0 (spike go)                     | P2 (primitives sans Alpine) |
| P2 Contrat universel | M      |    2 j | P0                                | P1                          |
| P3 Headless          | M      |    3 j | P1                                | P4 (styles)                 |
| P4 Styles            | L      |    6 j | P1 (P4.1 dès que le spike est go) | P3, P5 partiel              |
| P5 Domaines          | L      |    8 j | P2 + P4.1 (motif validé)          | P6.1–P6.4                   |
| P6 Qualité           | M      |    4 j | P5                                | —                           |
| P7 Verrouillage      | S      |    1 j | P0–P6                             | —                           |

**Chemin critique** : `P0 → P1 → P4.1 → P5 → P6 → P7` ≈ **21 jours**, dont ~6 j gagnables en
parallélisant P2/P3 avec P4. Le lot P4.1 (session-detail) sert de **preuve de concept visuelle** : il
doit être validé avant de répliquer le motif sur les 9 autres pages.

**Conventions de livraison** : une branche `refactor/componentization-pX` par phase, une PR par phase,
commits atomiques par tâche (`P4.2: extraire styles progression`), message de PR qui référence les KPI
impactés. Rollback = `git revert` de la PR entière + restauration du jeu de captures de la baseline.

---

## 5. Inventaire des composants cibles (réutilisation maximale)

| Domaine          | Composants créés                                             | Réutilise                                | Dynamisme                 |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------- | ------------------------- |
| `ui`             | `SmartTable`, `FormRow`, `MetricBlock`, `Notice`             | —                                        | variants typés + slots    |
| `layout`         | `NavTree`, `UserZone` (refonte de 3 nav dupliquées)          | `Button`, `Icon`                         | registre `NavItemKind`    |
| `sessions`       | `SessionCard`, `SessionGhost`, `SessionsList`, `Filters`     | `Card`, `Badge`, `EmptyState`            | registre `SessionStatus`  |
| `session-detail` | 6 fragments existants **+ styles scopés**                    | `StatsCard`, `StatusBadge`               | props + slots             |
| `builder`        | 5 composants de formulaire                                   | `Input`, `Select`, `Dialog`              | registre `ExerciseKind`   |
| `exercises`      | `ExerciseRow`, `HistoryTable`, `TrendChart`                  | `SmartTable`, `Tabs`                     | registre `ChartKind`      |
| `progression`    | `MetricCard`, `LiftProgressRow`, `BodyChart`, `RecordsTable` | `SmartTable`, `MetricBlock`              | registre `ChartKind`      |
| `settings`       | `SettingsRow` + 5 sections                                   | `SettingsSection`, `Toggle`, `Segmented` | registre `SettingSection` |
| `calendar`       | `MonthGrid`, `DayCell`, `Legend`                             | `Badge`                                  | props `date`, `sessions`  |
| `timer`          | `TimerDial`, `Controls`, `Presets`                           | `Button`, `Progress`                     | état injecté              |
| `workout`        | enrichissement des 5 existants                               | `ui/*`                                   | props + callbacks         |

Règle de réutilisation : avant de créer un composant, `grep -r "class=\"…" src/components` — si un
motif existe déjà, on l'étend (props/variant) au lieu d'en créer un nouveau.

---

## 6. Quality gates (à chaque PR)

```bash
# 1. Correction & logique
pnpm check:strict && pnpm lint && pnpm test

# 2. Design system
pnpm check:colors && pnpm check:contrast

# 3. Build & budget
pnpm build && pnpm check:budget && node scripts/check-components.mjs

# 4. Parcours & rendu
pnpm test:smoke && pnpm test:e2e && pnpm screens && node scripts/diff-screens.mjs
```

### 6.1 Spécification de `check-components.mjs` (P0.2)

Sans nouvelle dépendance, parsing par regex des fichiers `src/**/*.astro` et `src/**/*.ts` :

| Règle détectée                     | Implémentation                                                        | Action                         |
| ---------------------------------- | --------------------------------------------------------------------- | ------------------------------ |
| K1 page > 250 lignes               | `wc -l` sur `src/pages/**`, hors whitelist                            | warn puis fail                 |
| K1 `<style>` de page > 20 lignes   | regex `<style(?![^>]*is:inline)[^>]*>([\s\S]*?)</style>`              | warn puis fail                 |
| K1 `<script>` de page > 20 lignes  | regex `<script(?![^>]*is:inline)[^>]*>([\s\S]*?)</script>`            | warn puis fail                 |
| K7 `is:global`                     | recherche littérale, whitelist `global.css` + exceptions documentées  | warn puis fail                 |
| K5 `(window as any)`               | recherche littérale                                                   | warn puis fail                 |
| K6 `Alpine.data(` sous `src/pages` | recherche littérale                                                   | warn puis fail                 |
| Imports interdomaines              | dans `components/<d>/`, tout `from '…components/<autre d>/…'`         | warn puis fail                 |
| `interface Props` absent           | composant `.astro` non importé par une page et sans `Props`/sans slot | warn seulement (faux positifs) |

Sortie : tableau texte + `--json` ; `STRICT=1` transforme les warnings en `exit 1` (utilisé en P7).
Le script ne doit **jamais** modifier les fichiers.

### 6.2 Parité visuelle déterministe (P6)

`capture-screens.mjs` est rendu reproductible puis comparé :

1. `page.clock.install({ time: new Date('2026-11-19T10:00:00Z') })` avant chaque navigation —
   les libellés relatifs (« aujourd'hui », « 19 nov. ») deviennent stables.
2. Seed localStorage identique pour chaque capture (jeu de données figé, `muscu-auth` inclus).
3. `screenshot({ animations: 'disabled' })` pour neutraliser les transitions.
4. `scripts/diff-screens.mjs` calcule un SHA-256 par PNG et compare à la baseline archivée ;
   toute différence liste les fichiers concernés. Un diff attendu doit être **validé et ré-enregistré**
   explicitement (`SCREENS_UPDATE=1`), jamais ignoré.

### 6.3 Tests de rendu des composants (P2/P5)

En plus des tests de factories (Vitest + déps mockées), les composants `.astro` sont testés avec
`experimental_AstroContainer` de `astro/container` (API vérifiée §1.1) : rendu avec props minimales,
props alternatives, slot nommé présent/absent, et wrap en FR + EN. Le registre typé est testé pour
couvrir **toutes** les valeurs de son union (test paramétré sur `Object.keys(VIEWS)`).

**Définition de terminé pour un composant** : `Props` typées (`HTMLAttributes`), template §2.2
suivi, style scopé préfixé, variants via `satisfies` si > 2 états, registre si rendu conditionnel,
factory testée si interactive, rendu testé via `AstroContainer`, FR/EN vérifiés, captures inchangées,
KPI non dégradés.

---

## 7. Risques et mitigations

| Risque                                          | Prob.   | Mitigation                                                                                               |
| ----------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| Régression visuelle au déplacement des styles   | Élevée  | Une page par PR, captures before/after, `is:global` retiré seulement une fois le style co-localisé       |
| `x-data` cassé par l'extraction (portée Alpine) | Élevée  | Garder la racine `x-data` intacte ; test navigateur après chaque extraction ; lifecycle centralisé en P1 |
| Cercles d'imports entre domaines                | Moyenne | Interdiction §2 des règles ; `check-components` détecte les imports interdomaines                        |
| Dépôt d'un store UI qui casse les dialogs       | Moyenne | P1.3 testé sur 2 navigations ClientRouter ; rollback facile (store = 1 fichier)                          |
| Alourdissement du bundle                        | Moyenne | Budgets par route (P6.9), lazy charts (P6.5), CSS partagé (P4.6)                                         |
| `as const satisfies` trop strict                | Faible  | Commencer par les primitives pilotes (P2.1), corriger les types en cascade                               |
| Périmètre i18n qui déborde                      | Moyenne | ADR dédié (P7.4), hors P1–P6                                                                             |
| Dette qui revient                               | Moyenne | Mode strict P7.1 + checklist PR dans les règles                                                          |

**Rollback** : chaque phase = 1 PR autonome ; `git revert` de la PR + restauration de la baseline de
captures. Aucune migration de données localStorage n'est prévue.

---

## 8. Décisions à prendre (ADR backlog)

| #       | Décision           | Options                                                                                                    | Recommandation                                                    | À trancher avant          |
| ------- | ------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------- |
| ADR-001 | Alpine             | garder l'ESM auto-hébergé + pont typé **vs** tenter un bundlage                                            | garder (crash rolldown documenté, pas de types)                   | **P1** (go du spike P0.6) |
| ADR-002 | i18n               | 20 stubs de routes + 25 modules de traduction + `setLocale` global **vs** `Astro.currentLocale`/middleware | étudier en lot séparé après P7 (impact build)                     | P7 / lot dédié            |
| ADR-003 | CSS                | tout scopé **vs** motifs partagés en `@layer components`                                                   | hybride : layer pour les motifs stables, scope pour le spécifique | **P4**                    |
| ADR-004 | Registre dynamique | partout **vs** uniquement les listes > 3 variantes                                                         | uniquement là où l'exhaustivité compile apporte une valeur        | **P2**                    |
| ADR-005 | `print.astro`      | tokens partagés **vs** palette autonome imprimable                                                         | documenter l'exception, réduire la whitelist au minimum           | **P6**                    |

Une ADR non tranchée bloque la phase concernée : elle est écrite en 10 lignes dans `docs/adr/`
(contexte, options, décision, conséquences) avant de commencer la phase.

---

## 9. Suivi

| Phase                  | Statut | KPI cible                                                               | PR                                    |
| ---------------------- | ------ | ----------------------------------------------------------------------- | ------------------------------------- |
| P0 — Fondations        | ☑      | garde-fou, baseline, templates, spike GO, git, e2e, gate de format      | `fa4289a`, `59129c2` + commit courant |
| P1 — Socle Alpine      | ☑      | K4, K5, K6, K10 → 0 ✅                                                  | `425563b`…`eafe4b7`                   |
| P2 — Contrat universel | ☐      | primitives typées, registre helper                                      | —                                     |
| P3 — Headless          | ◐      | factories inline extraites + 11 tests ✅ ; P3.4 (gros modules) restant  | `eafe4b7`                             |
| P4 — Styles            | ◐      | is:global 0 ✅, detail 338 l. ; reste 7 622 l. CSS + 6 pages > 1000     | `52d682d`, `5c0646b`                  |
| P5 — Domaines          | ☐      | K2, K3, K8 → 0                                                          | —                                     |
| P6 — Qualité           | ◐      | CSP, a11y, budgets/route, https WebDAV, dead-code ✅ ; CSP/e2e 14 tests | `43b5a80`, `da29aba`                  |
| P7 — Verrouillage      | ☐      | CI stricte, ADR                                                         | —                                     |

> **P0, P1 et P3 (extraction) terminés**. **P1** : pont Alpine typé, lifecycle centralisé, store UI (toasts +
> dialogs) et globals `window.*` supprimés (K5, K10 à 0). Restent 11 `alpine:init` (dont 3 pages à
> factories inline, traitées en P3). Prochaine action : **P3** (factories headless) puis **P4** (styles).

---

## 10. Limites résiduelles (honnêteté de planification)

Même après correction, ces points ne sont **pas** garantis par le document et doivent être traités
à l'exécution :

1. **Chiffrage non validé** : les 21 j du chemin critique sont une estimation humain-équivalent,
   sans retour d'expérience sur ce dépôt. À recalibrer après P1.
2. **Baseline a11y absente** (K14) : le nombre exact de violations n'est pas connu ; il sera mesuré
   en P6 et pourrait révéler un lot de travail supplémentaire.
3. **Captures déterministes à mettre en place** : `page.clock` + seed figé (§6.2) doivent être
   validés sur les 14 routes avant de servir de référence ; sinon le diff visuel donnera des faux
   positifs (dates relatives).
4. **ADR non tranchées** : 5 décisions ont un gate, mais aucune n'est écrite ; le plan suppose les
   recommandations, l'utilisateur peut les invalider (surtout ADR-002/i18n).
5. **`ComponentType` était une erreur** : corrigé en `AstroComponentFactory` après vérification dans
   `node_modules` (§1.1). Toute API future citée dans ce doc doit être vérifiée de la même manière.
6. **Aucune relecture indépendante** : une relecture avant exécution reste la meilleure garantie que le
   plan est complet.
