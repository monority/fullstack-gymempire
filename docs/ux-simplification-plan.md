# Plan de simplification UX & refonte visuelle — Gym Empire

> Objectif : une application **simple, rapide et désirable**, sur mobile comme sur desktop.
> Deux chantiers indissociables : **moins de saisie** (parcours) et **une direction visuelle assumée** (design).
> Le modèle de données reste compatible : aucune migration, aucun backend.

---

## 0. Méthode et outillage

- Audit des parcours réalisé sur le code courant (voir §1).
- Skill **`ui-ux-pro-max`** installé dans `.opencode/skills/ui-ux-pro-max/` (données : styles, palettes, typographies, guidelines UX, stack Astro).
- ⚠️ **Python n'est pas disponible dans ce container** : l'outil de recherche du skill n'a donc **pas pu être exécuté**. Les recommandations ci-dessous proviennent de la lecture directe de `references/quick-reference.md`, `references/pro-rules.md` et de `data/colors.csv`, `data/typography.csv`, `data/stacks/astro.csv`. Aucun résultat de recherche n'a été simulé.
- Stack détectée : **Astro 7 + Alpine**, CSS en couches, composants `.astro`, données locales (`localStorage`).

---

## 1. Constat (audit factuel)

L'application est fonctionnelle mais la saisie est éclatée en **trois parcours divergents** :

| Parcours                | Point d'entrée    | Séries créées                  | Champs par série    | Friction principale                                    |
| ----------------------- | ----------------- | ------------------------------ | ------------------- | ------------------------------------------------------ |
| Builder                 | `sessions/create` | 1 par exercice                 | type, charge, reps  | picker refermé à chaque ajout, recherche réinitialisée |
| Dialogue « + » exercice | page Exercices    | **3 vides**                    | type, charge, reps  | 3 lignes à remplir/supprimer, unité figée en kg        |
| Séance rapide           | `/sessions/quick` | copiées d'une séance `planned` | + RPE (2 contrôles) | charge/reps non modifiables pendant la séance          |

Faits vérifiés dans le code :

- `defaultAddSets()` crée 3 séries vides (`exercisesApp.ts:165`), contre 1 dans le builder (`exercisePicker.ts:38`).
- Le pré-remplissage « dernière charge / dernières reps » existe (`createNextSet`, `session-builder-stats.ts:122`) mais n'est utilisé **que** par le builder.
- RPE de séance = **5 par défaut**, toujours sauvegardé (`sessionBuilder.ts:115`, `sessionSave.ts:95`) : une séance non touchée affiche « Effort modéré ».
- Date sans `required` ni validation (`create/index.astro:59`).
- Carte « ressenti » masquée tant qu'aucun exercice n'est ajouté (`CreateNotes.astro:16`).
- Trois textes techniques rendus dans l'UI (`ExerciseFormDialog.astro:24,89,104`).
- Unité « Poids (kg) » codée en dur alors que le réglage lbs existe.
- `restPaused` : état écrit mais jamais lu (`quickSession.ts`, `quickRest.ts`).
- Responsive éclaté : 320 / 360 / 480 / 540 / 640 / 767 / 768 / 1024 selon les fichiers, avec un trou à 481–539 px.
- Supersets, échauffement automatique et suggestion MRV sont implémentés mais **sans contrôle** dans la page de création.

---

## 2. Direction visuelle (design system)

### 2.1 Identité

Produit : **outil de suivi d'entraînement**, usage fréquent, souvent en salle (mobile, une main), parfois au bureau (desktop, vision d'ensemble). Mots-clés : **énergique, net, dense mais calme, orienté données**.

La donnée `colors.csv` du skill contient une entrée **« Running & Cycling GPS »** (ligne 140) : orange profond `#EA580C`, émeraude `#059669`, fond ardoise `#0F172A`, surface `#192134`, texte `#F8FAFC`, gris `#94A3B8`. **Cette palette est retenue et déjà appliquée** (commit de palette) : elle remplace l'ancien accent clair `hsl(30 100% 66%)` et l'ancien vert `#22c55e`. Le thème clair utilise un accent assombri `#C2410C` et un émeraude `#047857` pour respecter le contraste 4.5:1.

La refonte ne se limite donc pas à la couleur : elle change surtout la **hiérarchie, la densité et la structure**.

### 2.2 Décisions de design

| Axe             | Décision                                                                                                               | Raison / source skill                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Couleurs        | Orange profond `#EA580C` + émeraude `#059669`, fond `#0F172A` ; variantes claires `#C2410C` / `#047857`                | Palette « Running & Cycling GPS », `data/colors.csv:140`                                                                                       |
| Typographie     | Conserver **Archivo** (display) et **Inter** (texte), déjà embarqués localement                                        | Le skill propose Barlow Condensed pour le sport, mais le projet est **offline-first** : garder les polices locales évite une dépendance réseau |
| Échelle de type | 5 niveaux seulement : page / section / carte / corps / légende ; corps ≥ 16 px mobile                                  | `readable-font-size`, `line-length-control` (§5)                                                                                               |
| Espacement      | Échelle 4/8 pt : 4, 8, 12, 16, 24, 32, 48 — un seul token par intention                                                | `spacing-scale` (§5)                                                                                                                           |
| Breakpoints     | **375 / 768 / 1024 / 1440**, définis une seule fois dans `tokens/layout.css`                                           | `breakpoint-consistency` (§5)                                                                                                                  |
| Cibles tactiles | ≥ 44 × 44 px, ≥ 8 px entre cibles, `touch-action: manipulation`                                                        | `touch-target-size`, `touch-spacing`, `tap-delay` (§2)                                                                                         |
| Navigation      | Mobile : barre inférieure ≤ 5 entrées + icône **et** libellé. Desktop ≥ 1024 : sidebar. Jamais les deux au même niveau | `adaptive-navigation`, `bottom-nav-limit`, `avoid-mixed-patterns`, `nav-label-icon` (§9)                                                       |
| Formulaires     | Libellé visible au-dessus du champ, erreur sous le champ, validation au blur, options avancées repliées                | `input-labels`, `inline-validation`, `progressive-disclosure` (§8)                                                                             |
| Feedback        | État pressé en 80–150 ms, confirmation brève, bouton désactivé pendant l'action, `aria-live="polite"`                  | `press-feedback`, `loading-buttons`, `toast-accessibility` (§2, §8)                                                                            |
| Mouvement       | Durées par intention (rapide = 100 ms, entrée = 180 ms) ; `prefers-reduced-motion` respecté                            | `animation` (§7), `prefers-reduced-motion`                                                                                                     |
| Contraste       | Vérifier clair **et** sombre séparément ; texte 4.5:1, contrôles 3:1                                                   | §1 + checklist `pro-rules.md`                                                                                                                  |
| Icônes          | SVG uniquement, une seule épaisseur de trait, taille tokenisée, libellé accessible si isolée                           | `pro-rules.md` « Icons & Visual Elements »                                                                                                     |

### 2.3 Cibles visuelles par écran

**Création de séance**

- Desktop : deux panneaux — bibliothèque d'exercices à gauche, brouillon à droite ; en-tête compact avec nom, date, compteur.
- Mobile : une colonne, carte d'exercice par bloc, champ « Charge » et « Reps » côte à côte mais avec libellés visibles, CTA principal fixe en bas (« Enregistrer »).
- Les métadonnées (RPE, fatigue, humeur, notes) sont **dans un panneau « Ressenti » replié**, accessible dès l'ouverture.

**Séance rapide**

- Un grand chiffre de charge, un grand chiffre de reps, un seul bouton « Série terminée ».
- Le repos devient une bandeau discret avec compte à rebours et « Passer », pas un écran.
- En-tête minimal : progression + « Terminer ».

**Statistiques**

- Une hiérarchie claire : 4 KPI en bandeau, puis un graphique principal pleine largeur, puis des cartes secondaires.
- Valeurs grandes, libellés petits et espacés, axes épurés (déjà amorcé).

**Bibliothèque d'exercices**

- Recherche en premier, filtres en puces qui reviennent à la ligne au lieu de se réduire (`chip-collection-reflow`).
- Cartes compactes avec actions dans un menu « … » sur mobile (`overflow-menu`).

---

## 3. Principes directeurs

1. **Un seul composant d'édition de série**, réutilisé par les trois parcours.
2. **Les valeurs par défaut font le travail** : historique local, une seule série, type = travail, date = aujourd'hui.
3. **Progressive disclosure** : l'essentiel visible, l'optionnel replié.
4. **Mobile first, desktop adapté** : un seul jeu de composants, deux mises en page.
5. **Zéro contrôle mort** : ce qui n'a pas d'effet est câblé ou supprimé.
6. **Design tokenisé** : aucune valeur littérale dans les composants, tout passe par `tokens/`.

---

## 4. Phases d'exécution

### Phase 0 — Fondations visuelles

_Objectif : poser le design system avant de toucher aux parcours._

- Créer `tokens/layout.css` : breakpoints 375/768/1024/1440, z-index (0/10/20/40/100), échelle d'espacement 4→48.
- Harmoniser les hauteurs de champs à 44 px minimum et les cibles tactiles à 44 × 44 px.
- Remplacer les media queries dispersées par les tokens (supprimer les paliers 360/480/540/640 contradictoires).
- Navigation : barre inférieure mobile (5 entrées max, icône + libellé), sidebar desktop ≥ 1024, une seule source de vérité `NavTree`.
- Vérifier le contraste clair et sombre séparément (axe + `check:contrast`).

**Acceptation** : aucun défilement horizontal de 320 à 1440 px ; une seule définition des breakpoints ; cibles tactiles conformes.

---

### Phase 1 — Corrections rapides

_Objectif : retirer les irritants sans toucher à la structure._

- Supprimer les trois textes techniques de `ExerciseFormDialog.astro`.
- RPE `null` par défaut ; ne sauvegarder que si l'utilisateur a interagi (`sessionBuilder.ts`, `sessionSave.ts`).
- Date `required` + valeur par défaut explicite.
- Carte « ressenti » accessible dès l'ouverture.
- Supprimer « Poids (kg) » figé ; utiliser le réglage d'unité partout.
- Ajouter les libellés/aria-label manquants dans le dialogue d'ajout.
- Supprimer `restPaused`.
- Remplacer le placeholder codé en dur par `customMusclePlaceholder`.

**Acceptation** : aucun texte parasite, RPE vide si non renseigné, unité cohérente, aucun débordement à 320 px.

---

### Phase 2 — Éditeur de série unique

_Objectif : harmoniser les trois parcours._

- Créer `src/components/workout/SetEditor.astro` + `setEditor.ts` : type / charge / reps, libellés visibles sur mobile, aria-label systématiques, cibles 44 px.
- L'utiliser dans `CreateExerciseList.astro`, `ExerciseAddDialog.astro`, `QuickWorking.astro`.
- Une seule série créée à l'ajout, pré-remplie via `createNextSet()` (dernière charge / dernières reps de l'exercice).
- Un seul contrôle RPE (slider entier 1–10 de `CreateNotes.astro`).

**Acceptation** : ajouter un exercice connu = 1 série déjà remplie ; mêmes libellés et unités partout.

---

### Phase 3 — Création allégée

_Objectif : créer une séance sans allers-retours._

- Picker : rester ouvert après ajout, conserver recherche et filtre muscle, compteur « N ajoutés », templates mis en avant.
- Déplacer « Ressenti » avant les exercices, dans un panneau replié.
- Supprimer le double dépliage automatique / bouton « Tout développer » redondant.
- Câbler l'échauffement automatique (`exerciseCard.ts:88`) dans la page de création.
- Brouillon auto-sauvegardé localement (`form-autosave`) pour éviter la perte sur fermeture.

**Acceptation** : ajouter 3 exercices depuis une recherche = 1 seule saisie ; le bouton d'échauffement est utilisable.

---

### Phase 4 — Séance rapide en 3 écrans

_Objectif : exécuter sans quitter l'écran._

- `selecting` → `working` → `completed` ; le repos devient un bandeau dans `working`.
- Charge et reps modifiables via `SetEditor`, sauvegarde immédiate.
- Une seule commande de sortie ; undo unique avec le même raccourci.
- Liste des séances triée par récence, pas par nom.

**Acceptation** : corriger une charge pendant la séance ne renvoie pas au builder ; 3 écrans au lieu de 4.

---

### Phase 5 — Finition et nettoyage

_Objectif : cohérence et zéro dette._

- Supersets : câbler le contrôle ou supprimer état + libellés.
- Suggestion MRV : câbler ou masquer les libellés.
- Vocabulaire unique pour `weight` (« Charge ») ; supprimer `weightHeader` / `weightForSet`.
- Passer la checklist `pro-rules.md` : feedback de pression, reduced-motion, focus, dark mode, safe areas.
- Revue visuelle complète `pnpm screens` (clair + sombre, 375 px + paysage).

**Acceptation** : aucun libellé sans contrôle, aucun contrôle sans effet, checklist validée.

---

## 5. Indicateurs de réussite

| Mesure                                       | Aujourd'hui              | Cible                              |
| -------------------------------------------- | ------------------------ | ---------------------------------- |
| Champs pour ajouter un exercice connu        | 3 lignes vides           | 1 ligne pré-remplie, 0 obligatoire |
| Allers-retours pour ajouter 3 exercices      | 3 ouvertures de dialogue | 1                                  |
| Contrôles RPE par série en séance rapide     | 2                        | 1                                  |
| Écrans du parcours rapide                    | 4                        | 3                                  |
| Paliers de breakpoints distincts             | 8                        | 4                                  |
| Cibles tactiles < 44 px                      | à mesurer                | 0                                  |
| Pages avec défilement horizontal 320–1440 px | à mesurer                | 0                                  |
| Contrôles morts / libellés orphelins         | ~4                       | 0                                  |

---

## 6. Hors périmètre

- Aucun compte serveur, backend ou synchronisation automatique : le modèle local-first reste.
- Aucune migration de données : les séances existantes restent lisibles.
- Aucun téléchargement de police (offline-first) : Archivo et Inter restent embarqués localement. La palette, elle, est déjà migrée vers « Running & Cycling GPS ».
- Aucun changement de licence ou de structure du dépôt.

---

## 7. Ordre d'exécution

**Phase 0 → 1 → 2 → 3 → 4 → 5.**

Le design system d'abord, pour éviter de refaire deux fois le responsive ; ensuite les corrections rapides ; puis l'éditeur de série unique, qui débloque le gros du gain perçu ; enfin les parcours et la finition.

Chaque phase se termine par : `test`, `test:coverage`, `test:e2e` (dont axe-core), `check:strict`, `lint`, `format`, `build`, `check:budget`, `test:smoke`, `check:i18n-build`, ratchets CSS/composants, et revue des captures `pnpm screens` en clair et sombre à 375 px et en paysage.
