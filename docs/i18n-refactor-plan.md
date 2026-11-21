# Plan de refonte i18n — Gym Empire

> Version 1.0 — 2026-11-21. Suite à l'audit complet de l'architecture i18n.
> Objectif : **supprimer l'état global mutable**, garantir la langue à la compilation et au build,
> et rendre le client explicitement injecté. Plan 10/10 : chaque phase est mesurable, vérifiable et
> réversible.

---

## 1. Pourquoi : état actuel et preuves

### 1.1 Le bug P0 — le build mélange les langues

Le frontmatter de chaque page appelle `t()` **avant** le rendu de `<AppLayout>`, qui est l'endroit
où `setLocale()` est appelé (`AppLayout.astro:18`). Le build statique rend les pages dans un état
module-global partagé : la langue d'une page dépend de la page rendue précédemment.

Preuves dans `dist/` (build du 2026-11-21) :

| Page                  | Attendu | Constaté                                                         |
| --------------------- | ------- | ---------------------------------------------------------------- |
| `/en/calculator/`     | EN      | `<title>Calculateur de disques — Gym Empire</title>`, contenu FR |
| `/exercises/history/` | FR      | `<title>Exercise history — Gym Empire</title>`, contenu EN       |

Les autres pages sont correctes **par chance d'ordre de build**. Ce n'est pas un bug cosmétique :
le site livré peut présenter une page dans la mauvaise langue de façon non déterministe.

### 1.2 Recensement (mesuré)

| Fait                                  |                                                                                     Mesure | Source                |
| ------------------------------------- | -----------------------------------------------------------------------------------------: | --------------------- |
| Modules de dictionnaire               | 25 FR / 25 EN, **symétriques** (1 135 feuilles, 0 clé manquante, 0 placeholder divergeant) | audit AST             |
| Stubs de routes `src/pages/en/**`     |                                                                    20 fichiers de 3 lignes | `find`                |
| `Astro.currentLocale` utilisé         |                                                           **1** fois (`timer/pop.astro:4`) | `grep`                |
| `setLocale` / `getLocale`             |                                                                             35 occurrences | `grep`                |
| `t()` côté client (scripts/factories) |                                                                                  20+ sites | audit §6              |
| Globaux de traduction `window.tr*`    | 4 (`trExercise`, `trMuscle`, `trCategory`, `muscleHue`) + `__LOCALE__` + `__builderLabels` | audit §4              |
| Routes EN manquantes                  |                              `/en/timer/pop` (404 visé par `timerApp.ts:271`), `/en/debug` | audit §5              |
| Tests i18n                            |                                          **0** ; `src/i18n/` exclu de la couverture Vitest | `vitest.config.ts:11` |
| Persistance / négociation             |                              **aucune** (ni cookie, ni localStorage, ni `Accept-Language`) | audit §2              |

### 1.3 Diagnostic racine

1. **`t()` dépend d'un module-global** (`locale.ts:9-23`) : `setLocale()` muté pendant le rendu,
   lu par toutes les pages. Aucune fonction ne prend la locale en paramètre.
2. **FR est la seule source de vérité du type** (`types.ts:1-3` : `Dictionary = typeof fr`) :
   l'anglais est structurellement subordonné ; les clés surnuméraires EN sont invisibles, les
   placeholders ne sont pas validés.
3. **Le client réimplémente la locale** via `window.__LOCALE__` (écrit une seule fois à
   `AppLayout.astro:136`), jamais rafraîchi sur navigation `ClientRouter`.
4. **La traduction des données (noms d'exercices) passe par des globals window** non typés, avec des
   expressions Alpine en chaînes.
5. **Le routage est dupliqué à la main** (20 stubs) au lieu d'utiliser l'i18n d'Astro déjà configuré
   dans `astro.config.mjs:12-18`.

---

## 2. Architecture cible

### 2.1 Noyau pur — aucune état global

```ts
// src/i18n/locale.ts (cible)
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'fr' || value === 'en';
}

/** Unique point de résolution : explicite, jamais muté. */
export function resolveLocale(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : defaultLocale;
}

export function dateLocale(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : 'fr-FR';
}
```

```ts
// src/i18n/index.ts (cible)
export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}
export function localizedPath(path: string, locale: Locale): string {
  return locale === 'fr' ? path : '/en' + path;
}
export function useI18n(pathname: string) {
  const locale = resolveLocale(pathname);
  return { locale, dict: t(locale), dateLocale: dateLocale(locale) };
}
```

**Interdictions après refonte** : `setLocale`, `getLocale`, `window.__LOCALE__`, `t()` sans
argument, `localizedPath()` sans locale.

### 2.2 Typage bidirectionnel des dictionnaires

```ts
// src/i18n/en/index.ts — IMPORTANT : remplacer `const en: Dictionary = {...}`
// par `satisfies` pour ne pas écraser le type inféré.
const en = { ... } satisfies Dictionary;
export default en;
```

```ts
// src/i18n/types.ts (cible)
import fr from './fr';
import en from './en';

export type Dictionary = typeof fr;
type Exact<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type Assert<T extends true> = T;

// Avec `satisfies`, typeof en conserve sa forme inférée : l'assertion
// détecte les clés manquantes ET surnuméraires. Avec `const en: Dictionary`,
// typeof en vaudrait Dictionary et l'assertion serait toujours vraie (inutile).
export type _EnMatchesFr = Assert<Exact<typeof en, Dictionary>>;
```

_ON (cible)_ : l'assertion compile. Si quelqu'un ajoute une clé FR sans EN (échec de `satisfies`),
ou une clé EN en trop (échec de `Exact`), `astro check` échoue. On ajoute un test de placeholders
(`{count}`, `{weight}`) par paire de valeurs.

### 2.3 Rendu serveur via Astro i18n

- `astro.config.mjs` garde `locales`, `defaultLocale`, `prefixDefaultLocale: false` — on **utilise**
  enfin `Astro.currentLocale` / `Astro.getRelativeLocaleUrl()`.
- `AppLayout.astro` reçoit `{ locale, dict }` en props (calculé une fois dans le layout à partir de
  `Astro.currentLocale`), expose `<html lang={locale}>` et sérialise le dictionnaire pour le client.
- Chaque page fait `const { locale, dict: L } = useI18n(Astro.url.pathname)` — **avant** le layout,
  mais sans dépendre du layout : la locale est dérivée de l'URL, pas d'un état partagé.
- Les 20 stubs `pages/en/**` sont remplacés par une route dynamique locale (cf. §4.2).

### 2.4 Injection client explicite — plus de globals

```html
<script type="application/json" id="i18n-payload" is:inline set:html={JSON.stringify({
  locale,
  labels: clientLabels,     // tranches utilisées par Alpine
  translations: { exercises: EXERCISE_NAMES_EN, muscles: MUSCLES_EN, ... },
  dateLocale: dateLocale(locale),
})}"></script>
```

```ts
// src/lib/i18n-store.ts (côté client)
export interface I18nStore {
  locale: Locale;
  labels: ClientLabels;
  trExercise(name: string): string;
  trMuscle(name: string): string;
  trCategory(name: string): string;
  muscleHue(muscle: string): string;
  formatDate(iso: string): string;
}

registerStore('i18n', i18nStore); // via lib/alpine.ts déjà en place
```

Les factories Alpine reçoivent `i18n: I18nStore` dans leurs `deps` (comme `statsCharts.ts` reçoit
déjà `trExercise`/`trMuscle`). Plus aucun `t()` ni `getLocale()` dans un `<script>` client.

### 2.5 Données et formatage

- Les noms d'exercices restent des **clés canoniques françaises** en stockage (compatibilité
  descendante des données localStorage) ; les maps EN deviennent des objets typés dont les clés sont
  générées depuis `DEFAULT_EXERCISES` (union TypeScript) — ajouter un exercice sans traduction
  échoue à la compilation.
- `exercise-tips.ts` (90 textes FR) : ajouter `tipsEn` dans un module de dictionnaire et un helper
  `trTip(id)` injecté comme les autres.
- Un seul `Intl` locale (`en-GB`) : supprimer `en-US` (`exerciseCard.ts:135`) et les littéraux
  en dur (`QuickSearch.astro:252`, `printSheetApp.ts:105`).

### 2.6 Préférence utilisateur (optionnelle, après le correctif)

URL = source canonique (partageable). Un cookie `locale` + `Accept-Language` sert uniquement à
rediriger `/` vers `/` ou `/en/` la première fois. Aucune sélection ne modifie l'URL d'une page déjà
chargée sans navigation complète.

---

## 3. Cibles et KPI

| KPI                                          |                                   Baseline |                        Cible | Outil                          |
| -------------------------------------------- | -----------------------------------------: | ---------------------------: | ------------------------------ |
| Pages avec mauvaise langue dans `dist/`      | **2** (/en/calculator, /exercises/history) |                        **0** | `scripts/check-i18n-build.mjs` |
| `setLocale` / `getLocale`                    |                                         35 |                        **0** | `grep`                         |
| `window.__LOCALE__`                          |                                          4 |                        **0** | `grep`                         |
| Globaux `window.tr*` / `__builderLabels`     |                                          6 |                        **0** | `grep`                         |
| `t()` / `localizedPath()` client sans locale |                                        20+ |                        **0** | `grep` + check                 |
| Stubs `pages/en/**`                          |                                         20 |    **0** (1 route dynamique) | `find`                         |
| Assertions de type FR↔EN                     |                                          0 |       **1 bidirectionnelle** | `astro check`                  |
| Tests i18n                                   |                                          0 |                     **≥ 25** | Vitest                         |
| Couverture `src/i18n/**`                     |                                     exclue |                   **≥ 90 %** | `vitest --coverage`            |
| E2E bilingue                                 |                      0 assertion de langue | **1 parcours FR/EN complet** | Playwright                     |

---

## 4. Phases d'exécution

Chaque phase = 1 PR, avec `pnpm test`, `pnpm check:strict`, `pnpm lint`, `pnpm build`,
`pnpm check:i18n-build`, `pnpm test:e2e` verts avant de passer à la suivante.

### Phase 0 — Gardes-fous (S) — **à faire en premier**

- `src/i18n/__tests__/dictionary.test.ts` : symétrie des clés dans les deux sens, feuilles, arrays,
  placeholders, helpers `resolveLocale`/`localizedPath`/`dateLocale`, maps `tr*` vs `DEFAULT_EXERCISES`.
- Inclure `src/i18n/**` dans `vitest.config.ts` coverage.
- `scripts/check-i18n-build.mjs` : analyse tous les `dist/**/*.html`, vérifie que le `<title>` et le
  contenu principal correspondent au préfixe `/en/` ; échoue sur les 2 pages connues.
- Ajouter les étapes `check:i18n` et `check:i18n-build` à la CI.

**Acceptation** : les 2 pages corrompues sont détectées → le garde-fou prouve le bug avant correction.

### Phase 1 — Corriger le P0 (M)

- `t(locale)`, `localizedPath(path, locale)`, `resolveLocale(pathname)` : signature explicite.
- Supprimer `setLocale`/`getLocale`/`window.__LOCALE__` de `locale.ts`, `AppLayout.astro`, `print.astro`,
  `timer/pop.astro`.
- `useI18n(Astro.url.pathname)` dans chaque page et chaque layout ; `<html lang={locale}>`.
- Mettre à jour les 13 registration modules pour recevoir `labels` en deps au lieu d'appeler `t()`.
- Remplacer `Astro.currentLocale` de `pop.astro` par `useI18n` + transmettre la locale au widget
  via `data-locale`.

**Acceptation** : `check:i18n-build` vert — 0 page en mauvaise langue. C'est la phase la plus
importante : elle peut être livrée seule.

### Phase 2 — Routage Astro natif (M)

- Remplacer les 20 stubs par une route dynamique `[locale]/...` (ou réécrire les stubs pour qu'ils
  passent explicitement `locale="en"` au composant partagé — choisir selon résultat du POC).
- `Astro.getRelativeLocaleUrl()` pour `localizedPath`.
- Ajouter `/en/timer/pop` et `/en/debug` ou rediriger proprement.
- Header switcher : préserver query/hash, naviguer vers l'URL locale canonique.

**Acceptation** : `find src/pages/en -name '*.astro'` → 0 ; plus aucun lien vers 404 EN.

### Phase 3 — Client injecté (L)

- Sérialiser le payload i18n dans `AppLayout` ; créer `src/lib/i18n-store.ts` + `registerStore('i18n', …)`.
- Convertir les 20+ sites `t()` client en `deps.i18n.labels.*`.
- Remplacer `window.trExercise/trMuscle/trCategory/muscleHue` par les méthodes du store dans toutes
  les expressions Alpine (audit §4 : 15 fichiers).
- Supprimer `__builderLabels`, `window.icons` si possible (injecter `icons` en deps).
- Supprimer les casts `as unknown as Dictionary` des tests en fournissant un vrai fixtures typé.

**Acceptation** : `grep` → 0 global de traduction, 0 `t()` client ; e2e FR/EN vert.

### Phase 4 — Données et formatage (M)

- Maps `tr*` typées par les clés de `DEFAULT_EXERCISES` (union générée) ; test de couverture 90/90.
- `tipsEn` + `trTip(id)` injecté.
- `templates.ts` : déplacer la description FR vers le dictionnaire.
- Un seul `Intl` locale (`en-GB`) ; supprimer `en-US` et les literals.
- Option : cookie/localStorage + `Accept-Language` pour la première visite.

**Acceptation** : 0 chaîne FR visible en EN (test), 1 seule locale de formatage.

### Phase 5 — Documentation et verrouillage (S)

- Mettre à jour `docs/componentization-rules.md` §6 (i18n) et créer `docs/adr/010-i18n-explicit-locale.md`.
- E2E : parcours complet FR→EN (navigation, thème persistant, formulaire, traduction d'exercice).
- Ratchet : ajouter les compteurs i18n à `quality-baseline.json` et les passer en strict.

**Acceptation** : CI stricte verte, documentation à jour, 0 régression.

---

## 5. Stratégie de tests

| Niveau     | Tests                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Unitaire   | symétrie FR/EN bidirectionnelle, placeholders, `resolveLocale`, `localizedPath`, `dateLocale`, maps `tr*`, `trTip`      |
| Build      | `check-i18n-build` : titre + contenu des 42 pages HTML vs préfixe de route                                              |
| E2E        | navigation FR/EN, conservations query/hash, exercices traduits EN, `/en/timer/pop` accessible, pas de FR résiduel en EN |
| Régression | les 2 pages connues (`/en/calculator`, `/exercises/history`) deviennent des tests nommés                                |

---

## 6. Risques et mitigations

| Risque                                                  | Mitigation                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Casser les 42 routes en changeant le routage            | Phase 2 livrée après la Phase 1 ; POC sur une route avant migration de masse                                                                                           |
| Dictionnaire sérialisé trop volumineux (1 135 feuilles) | Ne sérialiser que les tranches utilisées par Alpine (`clientLabels`)                                                                                                   |
| `ClientRouter` + store i18n désynchronisé               | Le payload est dans le `<head>` de chaque document ; le lifecycle existant (`lib/alpine.ts`) recharge le store à `astro:page-load`                                     |
| Perte de compatibilité localStorage                     | Les clés d'exercices restent FR ; aucune migration de données                                                                                                          |
| Build static + `Astro.currentLocale`                    | Vérifier que `currentLocale` est bien renseigné pour les routes préfixées en mode static ; sinon `resolveLocale(pathname) reste la source canonique (déjà implémentée) |

---

## 7. Ordre recommandé

**Phase 0 → Phase 1 → (livrer) → Phase 2 → Phase 3 → Phase 4 → Phase 5**

La Phase 1 est le correctif d'urgence : dès qu'elle est livrée, le site n'a plus de page dans la
mauvaise langue. Les phases suivantes sont des améliorations structurelles sans urgence.

---

## 8. Suivi

| Phase                 | Statut | KPI principal                |
| --------------------- | ------ | ---------------------------- |
| 0 — Gardes-fous       | ☐      | 2 pages corrompues détectées |
| 1 — Correctif P0      | ☐      | 0 page corrompue             |
| 2 — Routage natif     | ☐      | 0 stub                       |
| 3 — Client injecté    | ☐      | 0 global de traduction       |
| 4 — Données/formatage | ☐      | 0 FR résiduel en EN          |
| 5 — Verrouillage      | ☐      | CI stricte, ADR              |

> Prochaine action : **Phase 0**. Aucune phase ne commence avec un KPI en régression.

> Phases 0 et 1 exécutées (commit `c8e66ee`). Le site n'a plus de page dans la mauvaise langue.
> Les phases 2 à 5 restent à faire (routage natif, injection client, données, verrouillage).

> Phase 2 exécutée : 20 stubs remplacés par `src/pages/en/[...slug].astro`, `/en/timer/pop` ajouté.
> 43 pages buildées, toutes dans la bonne langue.

> Phase 3 exécutée : `$store.i18n` injecté dans 15 composants, globals supprimés, builder labels via store.
> Vérifié en navigateur : `/en/exercises` traduit `Squat barre` en `Barbell Squat`.
