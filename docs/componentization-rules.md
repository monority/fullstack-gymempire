# Règles de componentisation — Gym Empire

> Document canonique. Toute extraction, tout nouveau composant et toute PR doit s'y conformer.
> Les règles visuelles du design system (`.impeccable/design.json`) restent souveraines :
> aucune componentisation ne doit introduire une couleur, une ombre, une typographie ou un
> espacement qui les contredit.

---

## 1. Principes directeurs

1. **Une page est un assembleur, pas une implémentation.** Elle choisit les composants, leur passe
   les données et les libellés, et s'arrête là.
2. **Un composant = une responsabilité visuelle.** S'il faut expliquer le composant en deux phrases,
   c'est deux composants.
3. **Le style suit le composant, jamais la page.** Un sélecteur `.detail__xxx` défini dans
   `detail.astro` pour un élément rendu par `SessionHeader.astro` est une violation.
4. **La logique suit une factory testable, jamais le template.** Un bloc Alpine dans un `<script>`
   de page est une violation (sauf les 10 lignes d'enregistrement, voir §5).
5. **On réutilise avant de créer.** La bibliothèque `src/components/ui/` contient 39 primitives :
   un nouveau `<table>`, `<dialog>`, `<input>` ou `<button>` fait maison est une violation.
6. **On garde le site vert à chaque étape.** Tests, typage, budget et captures visuelles avant/après.

---

## 2. Typologie et graphe de dépendances

Quatre couches, un sens de dépendance unique :

```
pages/  →  components/{layout,<domaine>,ui}/  →  lib/  →  i18n/ + styles/
```

| Couche             | Dossier                 | Responsabilité                                                                                                                                                                               | Dépendances autorisées                 | Interdit                                                           |
| ------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| **Primitives UI**  | `components/ui/`        | Contrôles sans état ni métier (`Button`, `Card`, `Dialog`, `Input`, `Table`, `Icon`…)                                                                                                        | `styles/`, `icons.ts`, types           | `lib/storage`, `lib/*-stats`, `i18n`, un autre domaine             |
| **Shell / layout** | `components/layout/`    | Structure applicative (`AppShell`, `Header`, `Sidebar`, `QuickSearch`)                                                                                                                       | `ui/`, `lib/auth`, `lib/nav`, `i18n`   | Logique métier d'un domaine, écritures storage                     |
| **Domaine**        | `components/<domaine>/` | Composants métier + factories Alpine (`sessions/`, `session-detail/`, `dashboard/`, `workout/`, `exercises/`, `progression/`, `settings/`, `calendar/`, `timer/`, `builder/`, `calculator/`) | `ui/`, `lib/`, `i18n/`                 | Un **autre domaine** (passer par des props), la page qui l'utilise |
| **Routes**         | `pages/`                | Assemblage, frontmatter de locale/titre, enregistrement Alpine                                                                                                                               | les 3 couches ci-dessus                | Logique métier, styles de composant, accès storage direct          |
| **Logique pure**   | `lib/`                  | Storage, calculs, formatage, types                                                                                                                                                           | `i18n/` (formatage), `styles/` (aucun) | `components/`, `.astro`, DOM global                                |

**Règle de frontière.** Un composant de domaine ne connaît pas la page qui l'héberge et un autre
composant de domaine ne s'importe pas : les données passent par des `props`, les actions par des
callbacks. Seule la couche `pages/` connaît l'assemblage complet.

---

## 3. Budgets de taille (mesurables)

| Élément                                         | Limite                                                | Action si dépassé                                         |
| ----------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Page `.astro` (hors stubs `en/`, `ui`, `debug`) | **250 lignes** (cible 150)                            | Extraire une section entière vers `components/<domaine>/` |
| Composant `.astro` de domaine                   | **200 lignes**                                        | Découper en sous-composants                               |
| Bloc `<style>` dans une page                    | **20 lignes max**, uniquement le layout de page       | Déplacer le style dans le composant concerné              |
| Bloc `<script>` dans une page                   | **20 lignes max**, uniquement l'enregistrement Alpine | Déplacer la logique vers `xApp.ts`                        |
| Factory Alpine                                  | **150 lignes**                                        | Extraire des helpers purs dans `lib/`                     |
| `is:global`                                     | **interdit** hors `global.css` et whitelist explicite | Utiliser un `<style>` scopé dans le composant             |
| Bloc de markup identique                        | 2 occurrences → composant ; 3 → **obligatoire**       | Extraire vers `ui/` ou le domaine                         |

État initial (mesures relevées dans le dépôt) : **8 785 lignes de CSS inline dans les pages**,
18 blocs > 150 lignes, 7 pages > 1 000 lignes, 55 `(window as any)` et 29 `alpine:init`. Ces chiffres sont la
cible du plan, pas un état acceptable.

---

## 4. Contrat d'un composant `.astro`

```astro
---
import type { HTMLAttributes } from 'astro/types';
import type { Session } from '../../lib/storage/types';

type Tag = 'article' | 'div' | 'li';
interface Props extends HTMLAttributes<Tag> {
  session: Session;
  as?: Tag; // polymorphisme : même composant, balise différente
  variant?: 'default' | 'compact';
  class?: string;
}
const {
  session,
  as: Tag = 'article',
  variant = 'default',
  class: className = '',
  ...rest
} = Astro.props;
const hasActions = Astro.slots.has('actions');
---

<Tag class:list={['session-card', `session-card--${variant}`, className]} {...rest}>
  <h3 class="session-card__title">{session.name}</h3>
  {hasActions && (
    <div class="session-card__actions">
      <slot name="actions" />
    </div>
  )}
  <slot />
</Tag>

<style>
  /* style scopé, préfixé par le NOM DU COMPOSANT */
  .session-card__title {
    color: var(--color-text);
  }
</style>
```

Template complet et variantes typées : voir [`componentization-plan.md`](./componentization-plan.md#2-architecture-cible--le-quoi) §2.2–2.4.

Règles :

- `interface Props` **obligatoire** dès que le composant prend des données (même vide pour un
  composant purement décoratif : `interface Props {}`).
- Étendre `HTMLAttributes<'tag'>` plutôt que d'utiliser `[key: string]: unknown` : les attributs
  Alpine/ARIA sont typés. Props optionnelles avec valeurs par défaut ; toujours accepter
  `class?: string` et le fusionner via `class:list` ; toujours transmettre `...rest` à la racine.
- Slots : un `<slot />` par défaut, des slots nommés pour les zones variables (`icon-left`,
  `actions`, `footer`). Détecter un slot optionnel avec `Astro.slots.has('nom')`.
- **Nommage CSS BEM préfixé par le composant** : `.session-card__title`, `.week-bars__fill`.
  Jamais `.sess__title` défini dans la page qui l'utilise.
- Style `<style>` scopé dans le composant. Un fichier `.css` séparé uniquement pour une primitive
  `ui/` partagée par plusieurs composants (précédent : `Button.css`).
- Si un état piloté par Alpine doit être stylé, cibler l'attribut sur l'élément du composant
  (`:class="{ 'is-active': … }"` + `.session-card.is-active`) ou utiliser `:global()` **ciblé et
  commenté**. Jamais `is:global` sur tout le bloc.
- Accessibilité : `aria-label` sur les contrôles iconiques, `:focus-visible` (jamais `outline:none`
  sans anneau de remplacement), rôles et états vides / chargement / erreur prévus dès l'écriture.

---

## 5. Contrat Alpine (logique)

Une factory par comportement, dans `components/<domaine>/<x>App.ts` :

```ts
export interface XAppDeps {
  labels: Dictionary['x'];
  locale(): 'fr' | 'en';
  today(): Date;          // jamais de new Date() dans la factory
  navigate(path: string): void;
  onError(e: unknown): void;
  ui: UiAdapters;         // toast / dialog injectés
}

export interface XApp {
  items: Item[];
  isLoading: boolean;
  init(): void;
  retry(): void;
}

export function createXApp(deps: XAppDeps): XApp { … }
```

Règles :

- **Un seul objet `deps`** (pas d'arguments positionnels multiples). Les signatures historiques à
  plusieurs arguments (`createDashboardApp(labels, localizedPath, deps)`) sont tolérées jusqu'à leur
  migration, mais aucune nouvelle factory ne les utilise.
- Tout ce qui est global est **injecté** : horloge, locale, navigation, toast, dialog, traduction
  d'exercice. Rien n'est importé de `window`/`document` dans la factory.
- Accès aux données uniquement via `lib/storage/*` ; aucune écriture storage dans un composant de
  présentation. Le compte démo reste verrouillé par `setStore` (voir `demo-account.ts`).
- Enregistrement **centralisé** : `registerAlpine('xApp', () => createXApp(deps))` depuis
  `lib/alpine.ts`. Le `<script>` de la page se limite à construire `deps` et à appeler cette fonction.
- Template : `x-data="xApp()"`. Le nom enregistré = le nom de la factory en camelCase.
- Chaque factory a son test `components/<domaine>/__tests__/xApp.test.ts` avec des déps mockées.
- Les calculs réutilisables ou > 30 lignes vont dans `lib/*-stats.ts` et sont testés séparément.

---

## 6. i18n, formatage et types

- Aucune chaîne visible en dur dans un composant ou une page (hors `ui.astro`, `debug.astro`).
  Tout passe par `t()` et le type `Dictionary`.
- **Locale explicite (ADR-010)** : côté serveur, `t(locale)` avec `locale = resolveLocale(Astro.url.pathname)`.
  Interdits : `setLocale`, `window.__LOCALE__`, `getLocale()` dans un frontmatter, `t()` sans argument
  dans un script client. Le client consomme `$store.i18n` (store Alpine typé), jamais `window.tr*`.
- Les libellés sont construits une fois dans la couche assemblage via `buildXLabels(t)` (convention
  déjà en place dans `sessionsApp.ts`, `settingsApp.ts`, `exercisesApp.ts`, `sessionDetailApp.ts`),
  puis passés en `deps`.
- Dates, nombres, unités : `dateLocale(locale)` (`en-GB`/`fr-FR`), `lib/format.ts`, `lib/units.ts`.
  Pas de `toLocaleDateString` maison ni de locale littérale (`en-US` interdit).
- Les traductions de données (noms/muscles/catégories/tips) sont des maps typées, injectées via
  `$store.i18n` ; les clés FR stockées restent canoniques (compatibilité localStorage).
- Un seul helper par format : interdiction des doublons `formatDuration`, `formatRestTime`,
  `formatSetRpe`, `fmtTime`/`fmtShort`/`fmtMs` (`timer-widget.ts` aujourd'hui).
- Les unions métier (`SessionStatus`, `ExerciseCategory`, `Unit`) sont définies une fois dans
  `lib/types.ts` et importées partout ; pas de chaînes littérales `'planned' | 'in-progress'`
  dispersées dans les templates.

---

## 7. Icônes et couleurs

- Convention unique : `<Icon name="…" size={n} />` (accessible, stylable en CSS). La forme
  `<Fragment set:html={icons.foo()} />` reste tolérée uniquement pour les icônes injectées
  dynamiquement via `x-html`, et doit être migrée progressivement.
- Couleurs : tokens CSS uniquement (`var(--color-*)`). Aucun littéral hors `tokens/`,
  `debug.astro`, `sessions/print.astro`, `ui.astro` et `theme-color` (whitelist actuelle de
  `scripts/check-colors.mjs`). Toute nouvelle exception doit être justifiée dans un commentaire.
- Respecter les règles du design system : un seul accent, hairlines, pas de kicker, pas d'ombre au
  repos, Archivo réservé à Display/Metric.
- **Architecture en 6 couches** (`reset → tokens → base → components → utilities → overrides`) :
  voir le plan v3 §2 et `src/styles/README.md`.
- Nommage global : `u-*` utility atomique, `c-*` objet composant, `is-*` / `has-*` états, BEM
  `b__e--m` **uniquement** dans un `<style>` Astro scopé.
- Une déclaration répétée dans 2 composants est promue en utility ou en classe `c-*`. Aucune valeur
  littérale hors `tokens/`, aucun `!important`, aucune classe de page dans un fichier global.
- Les blocs `<style>` Astro restent **non layerés** (priorité sur les couches) : c'est le contrat de
  surcharge, pas un bug. `:global()` ciblé uniquement dans la couche `overrides`.

---

## 8. Procédure : componentiser une page

1. **Mesurer** : `wc -l` de la page, repérer les blocs `<style>` / `<script>` et les répétitions.
2. **Nommer les composants** : une liste de sections, chaque section = un composant de domaine.
3. **Extraire le markup d'abord** : créer `components/<domaine>/Section.astro` avec `Props`, slots,
   classe BEM propre, puis remplacer le bloc dans la page par `<Section … />`.
4. **Déplacer le style** : motifs communs → utility `u-*` ou classe `c-*` (couches
   `components`/`utilities`) ; structure spécifique → `<style>` scopé du composant. Supprimer tout
   `is:global` devenu inutile.
5. **Extraire la logique** : si un bloc Alpine existe, créer `xApp.ts` + tests, puis réduire le
   `<script>` de la page à `registerAlpine(...)`.
6. **Vérifier** : `pnpm test && pnpm check:strict && pnpm lint && pnpm build && pnpm check:budget &&
pnpm test:smoke`, puis comparer les captures `pnpm screens` avant/après.
7. **Mettre à jour** la checklist du plan et, si un nouveau primitives UI a été créé, l'ajouter à
   la galerie `/ui`.

---

## 9. Exceptions documentées

| Fichier                               | Exception                         | Raison                                                        |
| ------------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| `pages/ui.astro`, `pages/debug.astro` | taille, styles et couleurs libres | outils de revue visuelle / générateur de données, 404 en prod |
| `pages/sessions/print.astro`          | `is:inline`, palette locale       | feuille autonome/imprimable, sans le shell ni les tokens      |
| `pages/en/**`                         | 6 lignes                          | stubs de route vers la page française                         |
| `styles/global.css`                   | `is:global`, `@layer`             | point d'entrée des tokens et des rules globales               |
| `components/ui/Table.astro`           | `:global()` ciblé                 | (cellules rendues via slots) — à réduire au minimum           |

Toute autre exception doit être ajoutée ici **et** dans la whitelist du futur
`scripts/check-components.mjs`, avec un commentaire.

---

## 10. Définition de terminé (checklist PR)

- [ ] Aucune page > 250 lignes, aucun `<style>` de page > 20 lignes.
- [ ] Chaque nouveau composant a `interface Props extends HTMLAttributes<…>`, un préfixe BEM propre
      et son style scopé.
- [ ] Aucun `is:global`, `(window as any)`, `new Date()` direct ou chaîne UI littérale ajouté.
- [ ] Toute factory Alpine a son test et son enregistrement passe par `registerAlpine`.
- [ ] Aucune primitive UI dupliquée ; `<Icon name>` utilisé pour les icônes statiques.
- [ ] i18n FR + EN vérifiés (routes `/…` et `/en/…`).
- [ ] `pnpm test`, `pnpm check:strict`, `pnpm lint`, `pnpm check:colors`, `pnpm check:contrast`,
      `pnpm build`, `pnpm check:budget`, `pnpm test:smoke` verts.
- [ ] Captures `pnpm screens` comparées : aucun changement visuel non intentionnel.

---

## 11. Patterns modernes (applicables dès la Phase 2 du plan)

Ces patterns complètent les règles ci-dessus ; leurs implémentations de référence sont dans
[`componentization-plan.md`](./componentization-plan.md#2-architecture-cible--le-quoi) §2.2–2.7.

1. **Props typées** : `HTMLAttributes<'article'>` + `as` polymorphe + `class:list` + `...rest`.
   Interdiction de l'index signature `[key: string]: unknown`.
2. **Variants exhaustifs** : map `as const satisfies Record<string, …>` → variables CSS. Ajouter un
   état oublié doit faire échouer `astro check`.
3. **Rendu data-driven** : registre typé `Record<Kind, AstroComponentFactory>` (type importé de
   `astro/runtime/server/index.js`) + `<View {...props} />`
   plutôt que des `x-if` en cascade ou des tables dupliquées. À réserver aux listes > 3 variantes
   (ADR-004).
4. **Socle Alpine typé** : `lib/alpine.ts` (`registerAlpine`, `getAlpine`, `installAlpineLifecycle`) ;
   Alpine reste le build ESM auto-hébergé, non bundlé (ADR-001). Le lifecycle `ClientRouter` est
   déplacé, pas réécrit.
5. **Stores UI** : `$store.ui.notify()` / `openDialog()` / `closeDialog()` remplacent les globals
   `window.*` ; Toast et Dialog deviennent des vues du store.
6. **Headless** : calcul dans `lib/*-stats.ts`, adaptateur Alpine, vue Astro — jamais de calcul
   dupliqué entre les trois.
7. **Performance** : `content-visibility` sur les longues listes, graphes montés à la vue
   (IntersectionObserver), SVG mémoïsés, budgets gzip + DOM par route.
8. **Qualité** : axe-core sur les routes critiques, un test par factory, types d'union partagés
   (`SessionStatus`, `ChartKind`, `SettingSection`, …) définis une seule fois dans `lib/types.ts`.
