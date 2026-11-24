# Plan de simplification UX — Gym Empire

> Objectif : rendre l'application **simple et rapide à utiliser au quotidien**, sur mobile comme sur desktop, en réduisant le nombre de champs, d'étapes et d'allers-retours. Ce plan est un plan d'exécution, pas une refonte technique : le modèle de données reste compatible.

---

## 1. Constat

L'application est fonctionnelle mais le parcours d'enregistrement est éclaté en **trois façons différentes** de saisir une série, avec des champs et des comportements divergents :

| Parcours                | Point d'entrée    | Séries créées                 | Champs par série   | Friction principale                             |
| ----------------------- | ----------------- | ----------------------------- | ------------------ | ----------------------------------------------- |
| Builder                 | `sessions/create` | 1 par exercice                | type, charge, reps | picker qui se referme à chaque ajout            |
| Dialogue « + » exercice | page Exercices    | **3 vides**                   | type, charge, reps | 3 lignes à remplir/supprimer, unité figée en kg |
| Séance rapide           | `/sessions/quick` | issues d'une séance `planned` | **RPE en plus**    | charge/reps non modifiables pendant la séance   |

Mesures relevées dans le code :

- `defaultAddSets()` crée 3 séries vides (`exercisesApp.ts:165`), contre 1 dans le builder (`exercisePicker.ts:38`).
- Le pré-remplissage « dernière charge / dernières reps » existe (`createNextSet`, `session-builder-stats.ts:122`) mais n'est utilisé que par le builder.
- Le RPE de séance vaut **5 par défaut** et est toujours sauvegardé (`sessionBuilder.ts:115`, `sessionSave.ts:95`) : une séance non touchée dit « Effort modéré ».
- La date est sans validation ni `required` (`create/index.astro:59`).
- La carte « Notes / ressenti » est masquée tant qu'aucun exercice n'est ajouté (`CreateNotes.astro:16`).
- Trois libellés techniques (`ADD / EDIT DIALOG`, `DELETE CONFIRMATION DIALOG`, `ADD TO SESSION DIALOG`) sont rendus dans l'UI (`ExerciseFormDialog.astro:24,89,104`).
- `restPaused` est un état jamais lu (`quickSession.ts`, `quickRest.ts`).
- Le builder reste en 2 colonnes nom/date et en tableau sans libellés jusqu'à 640 px ; la séance rapide a un trou de responsive entre 481 et 539 px.

---

## 2. Expérience cible

**Une seule façon de saisir une série**, réutilisée partout, avec des valeurs par défaut intelligentes.

- **Mobile** : tout en une colonne, libellés visibles au-dessus de chaque champ, une main, pas de défilement horizontal, bouton d'action principal fixe en bas.
- **Desktop** : deux panneaux (bibliothèque d'exercices à gauche, brouillon de séance à droite), mais **les mêmes composants** que sur mobile.
- **Valeurs par défaut** : date = aujourd'hui, type = travail, charge et reps = dernières valeurs de cet exercice, une seule série créée à l'ajout.
- **Options masquées par défaut** : RPE, fatigue, humeur, notes, échauffement, supersets — accessibles via un unique bouton « Détails ».
- **Zéro aller-retour** : le sélecteur d'exercice reste ouvert, la recherche et le filtre sont conservés.

---

## 3. Principes directeurs

1. **Un seul composant d'édition de série** utilisé par les trois parcours.
2. **Les bonnes valeurs par défaut plutôt qu'un champ de plus** (historique local, pas de devinette serveur).
3. **Progressive disclosure** : l'essentiel visible, l'optionnel replié.
4. **Mobile first** : un seul jeu de composants, deux mises en page.
5. **Aucun contrôle mort** : ce qui n'a pas d'effet est supprimé ou câblé.

---

## 4. Phases d'exécution

### Phase 0 — Corrections rapides et fiabilité

_Objectif : retirer les irritants et les incohérences sans toucher à la structure._

- Supprimer les trois textes techniques dans `ExerciseFormDialog.astro`.
- Distinguer « RPE non renseigné » de `RPE = 5` : `null` par défaut, ne sauvegarder que si l'utilisateur a touché au contrôle (`sessionBuilder.ts`, `sessionSave.ts`, slider dans `CreateNotes.astro`).
- Valider la date : `required` + valeur par défaut explicite au chargement (`create/index.astro`).
- Rendre la carte « ressenti » accessible dès l'ouverture, sans condition `exercises.length > 0` (`CreateNotes.astro`).
- Supprimer l'unité figée « Poids (kg) » ; utiliser le réglage kg/lbs partout (`builder.ts`, `CreateExerciseList.astro`, `ExerciseAddDialog.astro`).
- Ajouter les `aria-label` manquants sur les champs numériques du dialogue « ajouter une série ».
- Supprimer l'état mort `restPaused` (`quickSession.ts`, `quickRest.ts`).
- `flex-wrap` / grille sur les groupes fatigue et humeur pour éviter le débordement sous 360 px (`builder-extra.css`).

**Acceptation** : aucun texte parasite, RPE vide si non renseigné, date toujours valide, unité cohérente, aucun débordement à 320 px.

---

### Phase 1 — Un seul éditeur de série

_Objectif : harmoniser les trois parcours sur un composant unique._

- Créer `src/components/workout/SetEditor.astro` + `setEditor.ts` : une ligne de série avec type / charge / reps, libellés visibles sur mobile, `aria-label` systématiques.
- L'utiliser dans `CreateExerciseList.astro`, `ExerciseAddDialog.astro` et `QuickWorking.astro`.
- Uniformiser le nombre de séries créées à l'ajout : **1** partout (`defaultAddSets`).
- Pré-remplir charge et reps depuis la dernière séance de l'exercice via `createNextSet()` (`session-builder-stats.ts`) dans les trois parcours.
- Harmoniser l'échelle RPE : un seul contrôle (le slider 1–10 entier du builder), supprimer le double contrôle RPE/uRPE du parcours rapide ou l'aligner.

**Acceptation** : ajouter un exercice connu crée 1 série déjà remplie avec les dernières valeurs ; les trois parcours affichent les mêmes libellés et la même unité.

---

### Phase 2 — Picker sans aller-retour

_Objectif : ajouter plusieurs exercices sans rouvrir le dialogue._

- Garder le dialogue ouvert après ajout (`sessionBuilder.ts:205`).
- Conserver recherche et filtre muscle entre les ajouts (supprimer le reset à l'ouverture, `:199`).
- Afficher un compteur « N exercices ajoutés » dans le pied du dialogue.
- Mettre les templates en avant (section déjà présente `CreatePicker.astro:58`) et ajouter « tout effacer la recherche ».

**Acceptation** : ajouter 3 exercices depuis une recherche ne demande qu'une saisie.

---

### Phase 3 — Séance rapide directe

_Objectif : exécuter une séance sans quitter l'écran._

- Rendre charge et reps modifiables dans `QuickWorking.astro` (réutiliser `SetEditor`) avec sauvegarde immédiate.
- Remplacer les 4 états par 3 : `selecting` → `working` → `completed` ; le repos devient un simple bandeau au-dessus de la série suivante, pas un écran (`QuickResting.astro`).
- Une seule commande de sortie dans l'en-tête : « Terminer » ; « Quitter » déplacé dans le menu de confirmation.
- Undo unique avec le même raccourci partout.
- Trier la sélection par récence plutôt que par nom (`quick-session-stats.ts:90`).

**Acceptation** : corriger une charge pendant la séance ne provoque aucun retour au builder ; le repos ne bloque pas l'écran.

---

### Phase 4 — Responsive unifié

_Objectif : une seule grille, deux présentations._

- Définir des tokens de breakpoints uniques (par exemple 480 / 768) dans `tokens/layout.css` et les utiliser dans `builder-page.css`, `builder.css`, `sessions-extra.css`, `exercises-extra.css`, `dialog.css`.
- Mobile : cartes avec libellés visibles pour **toutes** les listes de séries ; bouton d'action principal fixe en bas du dialogue.
- Desktop : deux panneaux dans `sessions/create` (bibliothèque + brouillon) en réutilisant les mêmes composants.
- Combler le trou 481–539 px et retirer les media queries contradictoires.

**Acceptation** : aucune page ne défile horizontalement entre 320 et 1440 px ; mêmes composants, aucun doublon de markup.

---

### Phase 5 — Nettoyage fonctionnel

_Objectif : câbler ou supprimer ce qui n'existe que dans le code._

- Supersets : ajouter le contrôle de création dans `CreateExerciseList.astro` **ou** retirer l'état et les libellés (`builder.ts:53-62`).
- Échauffement automatique : rendre le bouton accessible dans le builder (`exerciseCard.ts:88` déjà implémenté).
- Suggestion MRV : câbler `suggestLoadSuggestion()` dans le builder ou masquer les libellés associés.
- Harmoniser le vocabulaire : une seule expression pour `weight` (« Charge »), supprimer `weightHeader` / `weightForSet`.
- Remplacer le placeholder codé en dur « Ex. Mollets » par `customMusclePlaceholder` (`exercices.ts:37`).

**Acceptation** : aucun libellé i18n sans contrôle correspondant, aucun contrôle sans effet.

---

## 5. Indicateurs de réussite

| Mesure                                    | Aujourd'hui                         | Cible                                    |
| ----------------------------------------- | ----------------------------------- | ---------------------------------------- |
| Champs pour ajouter un exercice connu     | 3 lignes vides (charge, reps, type) | 1 ligne pré-remplie, 0 champ obligatoire |
| Allers-retours pour ajouter 3 exercices   | 3 ouvertures de dialogue            | 1 ouverture                              |
| Contrôles RPE par série en séance rapide  | 2 (type d'échelle + valeur)         | 1                                        |
| Écrans du parcours rapide                 | 4                                   | 3                                        |
| Pages sans défilement horizontal à 320 px | à mesurer                           | 100 %                                    |
| Contrôles morts / libellés orphelins      | ~4                                  | 0                                        |

---

## 6. Hors périmètre

- Aucun compte serveur, aucun backend, aucune synchronisation automatique (le modèle local-first reste).
- Aucune migration de données : les séances existantes restent lisibles (les nouveaux champs optionnels ont des valeurs par défaut).
- Aucune refonte du design system (couleurs, typographie, tokens existants conservés).
- Aucune modification de la licence ou de la structure du dépôt.

---

## 7. Ordre d'exécution recommandé

**Phase 0 → Phase 1 → Phase 4 → Phase 2 → Phase 3 → Phase 5.**

Rationale : les corrections rapides et l'éditeur de série débloquent le gros du gain perçu ; le responsive est ensuite appliqué à un composant unique au lieu de trois ; le picker et la séance rapide viennent après ; le nettoyage fonctionnel clôture.

Chaque phase se termine par la chaîne de vérification complète : `test`, `test:coverage`, `test:e2e` (dont axe-core), `check:strict`, `lint`, `format`, `build`, `check:budget`, `test:smoke`, `check:i18n-build`, ratchets CSS/composants, et revue des captures `pnpm screens` en clair et sombre.
