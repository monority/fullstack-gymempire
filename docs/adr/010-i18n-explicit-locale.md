# ADR-010 — Locale explicite, zéro état global

**Statut** : accepté

## Contexte

L'ancien système utilisait un module-global `currentLocale` muté par `setLocale()` dans
`<AppLayout>`, alors que les pages appelaient `t()` **avant** ce rendu. Le build statique a produit
des pages dans la mauvaise langue (`/en/calculator` en FR, `/exercises/history` en EN). Le client
maintenait un second canal (`window.__LOCALE__`, `window.tr*`, `window.__builderLabels`) jamais
rafraîchi sur `ClientRouter`.

## Décision

1. **Serveur** : la locale est toujours dérivée du chemin (`resolveLocale(Astro.url.pathname)`) et
   passée explicitement à `t(locale)`. Aucun `setLocale`, aucun `getLocale` serveur.
2. **Client** : `getLocale()` lit l'attribut `lang` du `<html>` rendu (immuable). Les helpers de
   traduction sont injectés via un store Alpine typé `$store.i18n` — plus aucun global `window.tr*`.
3. **Typage** : `Dictionary = typeof fr`, `en` annoté `satisfies Dictionary`, assertion
   `Exact<typeof en, Dictionary>` pour une symétrie bidirectionnelle à la compilation.
4. **Données** : les noms d'exercices restent des clés FR canoniques (compatibilité localStorage) ;
   seules les chaînes affichées sont traduites, via des maps typées et des tips localisés.
5. **Routage** : un seul catch-all `src/pages/en/[...slug].astro` remplace les 20 stubs ; les pages
   racines restent l'unique implémentation. `/en/timer/pop` est servi par un composant partagé.
6. **Formatage** : `dateLocale(locale)` est l'unique source (`en-GB` / `fr-FR`).

## Conséquences

- Ordonnancement de build sans effet sur la langue : `check:i18n-build` vérifie les 43 pages.
- 9 tests unitaires i18n + 4 tests tips ; `src/i18n/**` inclus dans la couverture.
- Ajout d'une clé FR sans EN, ou d'une clé EN surnuméraire → `astro check` échoue.
- Le store i18n est enregistré une fois dans `AppLayout` et lu par 15 composants.
- Le changement de langue se fait par navigation complète (URL canonique partageable).

## Alternatives écartées

- Garder `setLocale()` et corriger l'ordre d'appel : trop fragile (chaque nouvelle page peut
  réintroduire le bug).
- Utiliser `Astro.currentLocale` partout : non disponible de manière fiable en mode static pour
  toutes les routes ; `resolveLocale(pathname)` reste la source canonique (utilisée une fois dans
  `pop.astro` historiquement).
- Traduire les données stockées : casserait la compatibilité des clés (tips, rest times, templates).
