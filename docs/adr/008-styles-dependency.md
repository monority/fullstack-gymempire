# ADR-008 — Inversion de dépendance des styles

**Statut** : accepté — plan v3 Phase 0

## Contexte

`global.css` importe `../components/ui/Button.css`, `Badge.css`, `Card.css`, `Avatar.css` : la
couche globale dépend du dossier composants. Les fichiers CSS vivent à côté des `.astro`, ce qui
mélange deux responsabilités et rend les imports fragiles.

## Décision

Tous les CSS partagés vivent dans `src/styles/`. `global.css` est l'unique point d'entrée, importé
une seule fois par `AppLayout.astro`. Aucun fichier de `src/styles/` n'importe un fichier de
`src/components/`.

## Conséquences

- Déplacement des 4 fichiers CSS vers `styles/components/`.
- Less composants n'importent plus leur propre CSS ; ils consomment `u-*` / `c-*`.
- Forms/Table/Dialog suivent le même motif en Phase 2.
- `check-css.mjs` vérifie qu'aucun `.css` ne reste sous `src/components/`.
