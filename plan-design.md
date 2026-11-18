# Plan d'amélioration design — Gym Empire (objectif 10/10)

> Décisions cadrées : **refonte élégante** (on remplace le langage visuel, on garde la vérité produit), **dashboard d'abord**, direction **éditoriale / retenue**. Ce document est un plan : aucun `DESIGN.md` n'est écrit maintenant — il sera produit à la fin du build, depuis le monde réellement livré.

---

## 1. Ce que « 10/10 » signifie ici

Un 10/10 n'est pas un coup d'œil flatteur : c'est un score mesurable. Chaque critère a une définition de réussite et un mode d'échec reconnaissable. Le finish reviewer note sur cette grille.

| Critère                      | Poids  | 10/10 — pass                                                                                        | 6/10 — à refuser                                                  |
| ---------------------------- | ------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Thèse & premier viewport** | 2,0    | Un objet dominant (la prochaine séance), action principale Visible en < 1 s, test mémoire concluant | Grille de 4 KPI égaux, aucun point focal, « encore un dashboard » |
| **Hiérarchie typographique** | 1,5    | Échelle fixe de 9 pas, 2 voix aux rôles stricts, tracking réglé, chiffres tabulaires                | Tailles en dur, Inter partout, poids 800 synthétisé               |
| **Composition & rythme**     | 1,5    | Bento asymétrique, alternance dense/calme, grille 12 colonnes, espacement 100 % tokenisé            | Cartes toutes identiques, rythme plat, valeurs brutes             |
| **Restraint & couleur**      | 1,0    | 1 accent, zéro dégradé/glow/ombre décorative, fond statique                                         | Aurora animée, 6 accents, glass partout                           |
| **Composants & états**       | 1,5    | 7 états sur chaque interactif, vocabulaire unique, affordances standards                            | États incomplets, boutons différents d'une page à l'autre         |
| **Microcopy**                | 1,0    | Voix humaine et concrète, bilingue, états vides qui enseignent                                      | « Aucune donnée », « Erreur », jargon interne                     |
| **Mouvement**                | 0,5    | 1 signature liée à l'état, 150–250 ms, `reduced-motion` respecté                                    | Chorégraphie de chargement, hover sur tout                        |
| **Accessibilité**            | 1,0    | AA dans les 2 thèmes, cibles 44 px, focus visible, axe 0 critique                                   | Contraste limite, focus invisible, thème clair cassé              |
| **Total**                    | **10** |                                                                                                     |                                                                   |

Deux tests subjectifs mais décisifs, en plus de la grille :

- **Test mémoire** : quelqu'un qui ne voit que le premier viewport pendant 2 s doit pouvoir dire « l'appli me dit quelle séance faire et où j'en suis » — pas « c'est sombre avec des graphiques ».
- **Test squint** : en floutant l'écran, la hiérarchie doit rester lisible (un gros objet, deux seconds, le reste en retrait). Si tout se vaut, ce n'est pas un 10/10.

---

## 2. Tendances 2026 — même genre d'appli (sources consultées)

J'ai consulté les catégories Awwwards _App Style_, _Product Honors_ et _Sites of the Day_ (novembre 2026), notamment :

- **YumLog — AI Calorie Tracker** (nommé 10 nov. 2026, CSSDA Best UI / UX / Innovation). Tracker santé : écran _Today_ avec **un seul chiffre dominant** (« 1 280 / 2 100 kcal, 820 restantes »), macros en dessous ; **anneau de progression« qui se mange »** au fil de la saisie ; historique 30 / 90 / 365 jours ; copie très humaine (« Say it, logged », « Actually, it was three eggs »).
- **Reel Motion** (nommé 5 oct. 2026). Appli fitness : **dark-first explicite « like the app, for people who train in real gyms »**, **grille bento**, illustrations d'exercices sur mesure, wordmark surdimensionné, tags _Minimal / Clean / Typography_.
- **Grail** (SOTD 4 nov.), **Bulletproof** (16 nov.), **Sweet Tape** (17 nov.), **Grids** (2 nov.) : dominance du _Developer Award_, composition typographique stricte, peu d'ornement.
- Polices récurrentes sur les lauréats : Aeonik, Calibre, Circular, Figtree, Archivo, Bricolage Grotesque.

### Ce qu'on retient / ce qu'on refuse

| Tendance observée                                                                       | Décision pour Gym Empire                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dark-first justifié par le _scène d'usage_ (« on s'entraîne en salle, lumière faible ») | ✅ Adopté : sombre par défaut, déjà en place. On documente la raison dans `DESIGN.md`.                                                                                                    |
| **Un chiffre héros** + détails en dessous (YumLog)                                      | ✅ Adopté : le dashboard mène par **une** carte dominante, pas par une rangée de KPI.                                                                                                     |
| **Grille bento** asymétrique (YumLog, Reel Motion)                                      | ✅ Adopté : tailles de tuiles hiérarchisées, pas 4 cartes égales.                                                                                                                         |
| **Progression avec personnalité** (anneau qui se remplit)                               | ✅ Adopté, mais translaté : arc de progression de l'objectif hebdo, discret, jamais gamifié.                                                                                              |
| **Copie conversationnelle et concrète**                                                 | ✅ Adopté : microcopy réécrite en fr/en avec une voix humaine (§6).                                                                                                                       |
| **Illustrations de domaine sur mesure**                                                 | ⚠️ Adapté : on n'a pas d'illustrations, on utilisera les icônes existantes cohérentes + des **micro-visualisations de données** (sparklines, barres de semaine) comme « matière » propre. |
| Wordmark surdimensionné, scroll GSAP, bento de landing                                  | ❌ Refusé : ce sont des vitrines (Persuade), pas des écrans de travail (Operate). On extrait les principes, jamais la composition.                                                        |
| Palette _Colorful_, glow, glass                                                         | ❌ Refusé : contraire à `rules.md` et à la direction retenue.                                                                                                                             |

> ⚠️ Honnêteté sur les sources : Dribbble et Behance bloquent le fetch automatisé ; les références ci-dessus sont donc celles qu'Awwwards expose publiquement. Les principes extraits sont transposés, pas copiés.

---

## 3. Thèse du dashboard — « un carnet, pas un tableau de bord »

Le piège de catégorie est le dashboard générique : quatre KPI en haut, un graphe, un tableau. On le refuse.

**Thèse** : _Le premier écran est un carnet d'entraînement ouvert sur la séance du jour._ Il répond à trois questions dans l'ordre : **Que fais-je maintenant ? Où en suis-je cette semaine ? Qu'ai-je fait dernièrement ?**

- Ce que l'utilisateur fait : arrive, voit sa prochaine séance, la commence, puis vérifie sa trajectoire.
- Ce qui rend Gym Empire unique ici : 100 % local, pas de compte, pas de bruit — l'interface peut être **calme et directe** comme aucun produit concurrent avec onboarding commercial.
- Le moment mémorable : la carte « Prochaine séance » occupe le centre visuel, avec un filet d'accent et un arc de progression — c'est l'objet qu'on retient.

---

## 4. Spec du premier viewport (desktop 1440)

Grille 12 colonnes, `--page-max-w: 96rem`, padding `--page-padding-desktop: 5.6rem`.

```
┌───────────────────────────────────────────────────────────────────────┐
│ SIDEBAR 22rem                                                          │
├───────────────────────────────────────────────────────────────────────┤
│  display 4.0rem       Bonjour, Monority.              [recherche /]   │  ← titre nu, sans kicker
│                                                                       │
│  ┌─────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ PROCHAINE SÉANCE       7 col │  │ OBJECTIF HEBDO          5 col │  │
│  │ filet accent à gauche        │  │  arc de progression           │  │
│  │ « Full Body · A »            │  │  3 / 4 séances                │  │
│  │ 5 exercices · ~52 min        │  │  anneau Archivo 3.6rem          │  │
│  │ [ Commencer la séance ]      │  │  « Plus qu'une séance »       │  │
│  └─────────────────────────────┘  └───────────────────────────────┘  │
│                                                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│  │ VOLUME       │ │ SÉRIES       │ │ SÉRIE (STREAK)│   4 col chacun  │
│  │ 18 420 kg    │ │ 82           │ │ 6 semaines   │                  │
│  │ barres 7 j   │ │ barres semaine│ │ points J1..J7│                  │
│  └──────────────┘ └──────────────┘ └──────────────┘                  │
│                                                                       │
│  ┌─────────────────────────────────┐ ┌─────────────────────────────┐  │
│  │ TENDANCE DE VOLUME        8 col │ │ DERNIÈRES SÉANCES     4 col │  │
│  │ courbe 12 semaines, 1 accent    │ │ 3 lignes + « Voir tout »    │  │
│  └─────────────────────────────────┘ └─────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

Règles de composition :

- **Aucun kicker au-dessus du titre** : interdiction absolue du craft floor. La date vit dans la barre supérieure, pas en eyebrow.
- **Un seul accent visible** : le filet de la carte héros et le bouton principal. L'arc de l'objectif utilise le même accent, rien d'autre.
- **Hiérarchie de taille** : display 4rem → métriques 3.6rem → titres de carte 1.8rem → libellés 1.1rem.
- **Densité contrastée** : la carte héros respire (padding 2.8rem), la rangée de métriques est dense (padding 1.6rem), la courbe est aérée.
- **Le chiffre est une donnée, pas un décor** : chiffres tabulaires (`font-variant-numeric: tabular-nums`), unité en `text-small` muted, jamais en indice coloré.
- **Mobile (390)** : empilement — context strip → carte héros (pleine largeur) → objectif → métriques en 2 colonnes → tendance → historique. Aucune information perdue, aucun scroll horizontal.

---

## 5. Système visuel (spec de lot 0)

### Typographie

Archivo (display : titres de page, métriques, chiffres) / Inter (tout le reste). Échelle fixe :

```
--text-caption 1.1 / 1.3 / +0.08em   --text-h3    1.8 / 1.25 / -0.01em
--text-small   1.2 / 1.4             --text-h2    2.2 / 1.2  / -0.02em
--text-body    1.4 / 1.5             --text-h1    2.8 / 1.15 / -0.02em
--text-body-lg 1.6 / 1.5             --text-metric 3.6 / 1.05 / -0.03em
                                     --text-display 4.0 / 1.05 / -0.03em
```

Inter chargé en 400/500/600/700 (plus de 800 synthétique). Archivo en 600/700 (remplace Geist, signalé « police saturée » par le détecteur).

### Couleur — Restrained

Fond neutre existant, **un seul accent** `hsl(30 100% 66%)` réservé à l'action / sélection / état. Sémantique inchangée. Chaque couleur ajoutée doit avoir sa paire dark/light et passer `check:contrast`.

### Surface & élévation

Cartes plates + filet `--color-border`. Une seule ombre `--shadow-overlay` pour les dialogues. Rayons `6 / 10 / 16 / pill`. `--z-*` tokenisé. Fond décoratif réduit à **un** traitement statique très faible (décision à trancher sur capture) — l'aurora animée actuelle est supprimée.

### Mouvement

`--transition-fast/base` (140/200 ms) + `--ease-out`. **Une signature** : le filet d'accent et l'arc de la carte héros s'animent au _changement d'état_ (séance démarrée/terminée), jamais à l'arrivée sur la page. Hover = léger wash `--alpha-bg-subtle`. Aucun `keyframe` décoratif supplémentaire.

---

## 6. Microcopy — niveau 10/10

La voix est humaine, concrète, bilingue. On remplace les textes génériques par des phrases qui situent l'utilisateur.

| État             | ❌ 6/10              | ✅ 10/10 (FR)                                              | ✅ 10/10 (EN)                                          |
| ---------------- | -------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Première visite  | « Aucune séance »    | « Votre carnet est vierge. Créons votre première séance. » | « Your log is empty. Let's build your first session. » |
| Retour           | « Bonjour »          | « Bonjour, {pseudo}. Votre semaine prend forme. »          | « Hey {pseudo}. Your week is taking shape. »           |
| Jour de repos    | (rien)               | « Jour de repos. La prochaine séance est jeudi. »          | « Rest day. Next session is on Thursday. »             |
| Objectif atteint | « Objectif atteint » | « Objectif de la semaine atteint. Bien joué. »             | « Weekly goal hit. Nice work. »                        |
| Séance terminée  | « Session saved »    | « Séance terminée — 4 820 kg · 52 min · RPE 8. »           | « Session done — 4,820 kg · 52 min · RPE 8. »          |
| Recherche vide   | « Aucun résultat »   | « Aucun exercice pour « {q} ». Essayez un autre nom. »     | « No exercise matches “{q}”. Try another name. »       |
| Erreur de saisie | « Valeur invalide »  | « La charge doit être comprise entre 0 et 500 kg. »        | « Weight must be between 0 and 500 kg. »               |

Règle : toute phrase d'état vide **enseigne l'action suivante** et propose un bouton. Aucun texte d'erreur sans correction possible.

---

## 7. Composants — exigence de finition

Chaque interactif livre ses 7 états : `default · hover · focus-visible · active · disabled · loading · error`.

| Composant                    | Détail 10/10                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Button**                   | Une seule forme primaire. Loading = spinner inline, pas de changement de largeur. `active` = `translateY(1px)`.                                  |
| **Card**                     | Plate, filet, pas d'ombre. `hover` uniquement si cliquable (wash + accent au survol).                                                            |
| **Input / Select**           | Hauteur 4.4rem, label toujours visible, hint sous le champ, erreur en `--color-destructive` avec `aria-describedby`.                             |
| **KpiItem**                  | Valeur Archivo tabulaire, unité Inter muted, libellé caption, **barres de semaine** (donnée réelle) — ni sparkline décorative, ni icône colorée. |
| **Progress / arc**           | Une seule géométrie d'arc ; `aria-valuenow` ; état « atteint » change l'accent en success.                                                       |
| **Dialog / Command palette** | `position: fixed` (jamais clippé par un `overflow: hidden`), `Esc` ferme, focus piégé puis restauré, entrée 180 ms.                              |
| **EmptyState / Skeleton**    | EmptyState = icône + phrase qui enseigne + action. Skeleton pour le chargement, jamais de spinner au milieu du contenu.                          |
| **Toast**                    | Empilement bas-droite, 4 variantes, `aria-live="polite"`, dismiss auto 3 s.                                                                      |

---

## 8. Exécution — lots atomiques

| Lot                        | Contenu                                                                                                                                                                                                        | Sortie                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **0 — Fondations**         | `PRODUCT.md` + ce plan ; tokens (`--text-*`, `--spacing-7`, `--shadow-overlay`, `--z-*`, `--ease-out`) ; polices Archivo + Inter ; corrections CSS dupliquées (`.topbar`, `Background.astro`) ; docs périmées. | 10 gates vertes                                                                                  |
| **1 — Shell & composants** | fond statique ; sidebar/topbar densité + focus ; 7 états sur Button/Input/Select/IconButton/Dialog/Tabs/Segmented/Toggle.                                                                                      | captures shell dark/light, axe, AA                                                               |
| **2 — Dashboard vitrine**  | composition §4, microcopy §6, signature §5, micro-visualisations.                                                                                                                                              | revue desktop 1440 + mobile 390, dark + light, `impeccable detect --json`, axe, **grille 10/10** |
| **3 — Réplication**        | propagation du système aux autres pages, aucune ancienne vocabulaire résiduel.                                                                                                                                 | 14 pages × 2 thèmes recapturées                                                                  |
| **4 — Finition**           | finish reviewer indépendant → `ship` ; `DESIGN.md` depuis le livré + `.impeccable/design.json` ; `plan-execution.md` mis à jour.                                                                               | disposition `ship`, tout vert                                                                    |

---

## 9. Validation du 10/10

- **Automatisé** : `pnpm test`, `check:strict`, `lint`, `check:colors`, `check:contrast`, `format:check`, `build`, `check:budget`, `test:smoke`, `test:e2e`.
- **Visuel** : captures 1440 et 390, dark et light, **tous les états** (défaut, survol, focus, erreur, vide, chargement, surcharge). Deux tours maximum ; correctifs groupés entre les tours.
- **Design** : `impeccable detect --json` par lot, puis finish reviewer indépendant avec la grille §1.
- **Humain** : test mémoire + test squint (§1). Si le premier viewport ne raconte que « c'est sombre avec des graphiques », le lot 2 n'est pas fini.

---

## 10. Non-négociables & anti-objectifs

**Préservé** : local-first, fr/en, dark+light, WCAG AA, pattern Alpine (markup dans `.astro`, logique en TS), gates, vérité produit de `PRODUCT.md`.

**Refusé** : dégradés/glow/glass/ombres décoratives, **kicker/eyebrow au-dessus d'un titre** (le `.page-header__eyebrow` existant sera retiré au lot 3), display font sur libellés, chorégraphie de chargement, fond animé, sparklines décoratives, copier la composition d'une landing (même primée), gamification, invention de chiffres/clients/témoignages, casse des données ou des tests.

---

## 11. Décisions à confirmer au lot 0

1. **Archivo + Inter** retenus — Geist écarté après détection « police saturée » ; alternative : Bricolage Grotesque.
2. **Fond décoratif** : discret-statique vs suppression totale — à trancher sur capture.
3. **Arc de progression** de l'objectif hebdo : signature validée en mouvement.
4. **Microcopy** §6 : valider le ton « humain » en fr/en avant propagation.
