# ADR-001 — Alpine reste un build ESM auto-hébergé

**Statut** : accepté (P0, spike GO) — 2026-11-19

## Contexte

`AppLayout.astro` charge Alpine depuis `/vendor/alpinejs-3.14.1.esm.js` avec un `<script is:inline
type="module">`. Deux contraintes sont documentées dans le fichier (`:271-290`) :

- le build CDN s'auto-démarre via `queueMicrotask` et s'exécute avant les listeners `alpine:init`
  des pages (Astro les hisse après `</html>`), ce qui cassait les composants (`loginApp is not defined`) ;
- `import Alpine from 'alpinejs'` dans un script traité fait crasher rolldown sur cette machine, et
  la 3.14.1 ne fournit pas de `.d.ts`.

Le spike P0.6 a confirmé qu'un store enregistré via `Alpine.store()` survit aux navigations
`ClientRouter` (état 41 → 41 après changement de page).

## Décision

Conserver le build ESM auto-hébergé et l'amorçage sur `DOMContentLoaded`. Introduire un
**pont typé** `src/lib/alpine.ts` (`getAlpine`, `registerAlpine`, `registerStore`,
`installAlpineLifecycle`) : aucun import直接 d'Alpine, aucun `(window as any).Alpine`.

## Conséquences

- `env.d.ts` déclare une interface `Window` structurelle (pas de `any`).
- Les pages ne contiennent plus que `registerAlpine('xApp', () => createXApp(deps))`.
- Le lifecycle `astro:before-swap` / `astro:page-load` / `Alpine.initTree` est déplacé dans
  `installAlpineLifecycle()` sans changement de sémantique.
- Aucun changement de dépendance, aucun script CDN.
