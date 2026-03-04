# CrowdConnect — Bugs & Erreurs Connues

## Bugs corrigés

| # | Bug | Cause | Correction |
|---|-----|-------|------------|
| 1 | `requestWakeLock()` n'existe pas | Fonction renommée en `enableNoSleep()` mais l'appel n'a pas été mis à jour | Ligne 334 index.html: `enableNoSleep()` |
| 2 | `serverOffset` non défini dans admin.html | Variable jamais déclarée | Ajout `let serverOffset = 0;` + sync horloge dans `connect` |
| 3 | `showStep` bloqué à 0 quand `logoUrl` est vide | Condition `logoUrl && logoVisible` trop stricte | Séparé: `showStep = logoVisible ? 1 : 0` |
| 4 | `prompt()` pour éditer les étapes | UX inutilisable sur mobile | Remplacé par formulaire inline adapté au type |
| 5 | Flèche PNG trop lourde (50 Ko) | Image bitmap | Remplacée par Lottie JSON (4 Ko, -91%) |
| 6 | `pointer-events: none` sur debug-log | Empêche le scroll/touch sur mobile | `pointer-events: auto` + `overflow-y: auto` |
| 7 | Logo dans un cercle gris `border-radius:50%` | CSS trop restrictif | Container libre, sans cercle ni fond |

## Règles à ne pas oublier

1. **Toujours vérifier** que les fonctions appelées existent réellement dans le fichier
2. **Déclarer les variables** (`let`, `const`) avant de les utiliser
3. **Tester les deux côtés** (admin ET public) après chaque modification
4. **CSS mobile** : ne jamais utiliser `pointer-events: none` sur des éléments qui doivent être interactifs
5. **Drag & drop mobile** : `draggable="true"` ne fonctionne pas sur iOS Safari — utiliser les touch events
6. **NoSleep/WakeLock** : iOS Safari ne supporte pas les data URI vidéo — utiliser un vrai fichier servi (.mp4)
7. **Tagline** : toujours centrer le texte avec `text-align: center` sur les écrans plein écran
8. **index.html body** : doit avoir `background: #000; height: 100%` pour éviter le fond beige iOS
