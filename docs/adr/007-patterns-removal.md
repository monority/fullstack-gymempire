# ADR-007 — Suppression des `:where(.page__…)` globaux

**Statut** : accepté

## Contexte

`styles/components/patterns.css` contient des sélecteurs `:where(.cal__…, .comp__…, .rec__…)` :
le CSS global connaît les classes privées des pages. Tout nouveau composant doit être ajouté à la
liste, sinon il ne bénéficie pas du motif. C'est un couplage inverse (le global dépend du local).

## Décision

Remplacer ces listes par des utilities explicites (`.u-label`, `.u-row`, `.u-metric`, `.u-surface`,
`.u-focus`, `.u-grid-*`). Les composants **ajoutent la classe utility dans leur markup** ; le global
ne connaît plus aucune classe de page.

## Conséquences

- Migration parallèle Phase 0/1 : ajouter la utility puis retirer le `:where()` correspondant.
- `check-css.mjs` interdit `:where()` dans `components/` et `utilities/`.
- Captures des 14 routes validées avant suppression de chaque entrée.
