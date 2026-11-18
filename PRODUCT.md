# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pratiquant régulier en salle de musculation qui suit ses séances, ses charges, ses répétitions et sa progression. Usage hebdomadaire, sur desktop et mobile. _(inféré du dépôt — à confirmer)_

## Product Purpose

Construire des séances, enregistrer séries / charges / RPE / ressenti, puis consulter la progression, les records et les tendances. Succès : l'utilisateur retrouve en un coup d'œil sa séance du jour et sa trajectoire, et peut agir immédiatement. _(partiellement inféré)_

## Positioning

Aucun compte, aucun serveur : toutes les données restent dans le navigateur via `localStorage`. Pas de synchronisation imposée, pas de télémétrie, aucune variable d'environnement requise. _(confirmé : README, SECURITY.md, .env.example)_

## Operating Context

Interface web locale, thème sombre par défaut et thème clair (`data-theme="light"`), français et anglais, raccourci `/` pour la recherche, palette de commandes, service worker offline. _(confirmé : README, code)_

## Capabilities and Constraints

- `localStorage` est la seule source de vérité ; pas de migration de données prévue.
- Unités : kg canonique, lbs pour l'affichage/la saisie uniquement.
- Accessibilité : WCAG AA (contraste ≥ 4.5:1), cibles tactiles ≥ 44 px, `focus-visible`, `prefers-reduced-motion`.
- Quality gates obligatoires (AGENTS.md) : `test`, `check:strict`, `lint`, `check:colors`, `check:contrast`, `format`, `build`, `test:smoke`, `test:e2e`, `check:budget`.
- Règle de componentization Alpine (AGENTS.md) : le markup runtime reste dans le `.astro`, la logique dans des modules TypeScript.
- Aucune dépendance à un service distant. _(confirmé)_

## Brand Commitments

Nom : **Gym Empire**. Accent ambre existant `hsl(30 100% 66%)` (`--color-accent`). Voix : français / anglais. Le fichier `rules.md` impose une direction « anti-AI-slop » : cartes plates, pas de dégradés / glow / glass / ombres gratuits, validation en dark et en light, cibles ≥ 44 px. _(confirmé)_

## Evidence on Hand

Code source, 632 tests unitaires (51 fichiers), 34 scénarios E2E, 14 pages × 2 thèmes capturées, palette de tokens documentée dans `src/styles/`. Aucune donnée commerciale réelle (pas de témoignages, prix, clients ou chiffres) — ne pas en inventer. _(confirmé)_

## Product Principles

- **Local-first** : la donnée appartient à l'utilisateur.
- **Clarté avant décoration** : l'interface s'efface derrière la tâche.
- **Cohérence de vocabulaire** : un composant se comporte pareil partout.
- **Accessibilité non négociable** : conforme en dark comme en light.

## Accessibility & Inclusion

WCAG AA sur les paires texte/fond dans les deux thèmes, cibles ≥ 44 px, anneau de focus visible, respect de `prefers-reduced-motion`. _(confirmé : check:contrast, e2e/accessibility.spec.ts)_
