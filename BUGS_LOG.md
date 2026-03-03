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
| 8 | Persistance des layers (Preview/Index) | Sélecteurs ciblés oubliant de nouveaux effets (`dice`, `puzzle`...) | Remplacé par un sélecteur universel `> *` (Admin et Public) pour masquer tous les enfants. |
| 9 | Logo QR Code absent ou invalide | Délai de chargement du Canvas et restrictions CORS sur Base64 | Timeout augmenté à 500ms, `crossOrigin="Anonymous"`, et URL hôte dynamique. Taille du logo réduite. |
| 10 | Barre noire en bas d'écran (iOS Safari) | `100vh` non adapté au resize dynamique de la barre d'outils Apple | Utilisation de l'unité `100dvh` sur les calques fullscreen. |
| 11 | Scroll bloqué dans Admin (Chrome iOS) | `overflow: hidden` sur `body` empêche le scroll natif d'un modal fixe | Ajout de `-webkit-overflow-scrolling: touch;` et padding de sécurité. |
| 12 | Popup d'autorisation (Gyroscope) | Ecoute automatique de `DeviceOrientationEvent` pour l'effet Parallaxe | Suppression totale de l'effet Parallaxe pour garantir 0 popup au lancement. |
| 13 | Emojis invisibles | `display: none` conservé par la passe de nettoyage | Forcer `emojiDiv.style.display = 'block'` au sein du case `emojis`. |
| 14 | Logs d'étapes multipliés par 6 | Execution à 60fps durant les 100 premières millisecondes de l'étape | Ajout d'un tracker `lastLoggedStepIdx` au lieu d'une dépendance temporelle. |
| 15 | Proxy allorigins.win Timeout (522) | Blocage serveur du proxy | Cascade `corsproxy.io` puis `api.codetabs.com` en fallbacks multiples. |
| 16 | Logo QR Code déformé | `drawImage` de `admin.html` imposait un carré fixe `120x120` sans respecter le ratio | Calcul de l'aspect ratio (img.width/img.height) avant dessiner. |
| 17 | Audio de séquence muet (1% volume) | Le volume (0 à 1) de l'UI était systématiquement divisé par 100 via une formule issue d'une ancienne interface 0-100 | Création de la fonction `parseVol` pour accepter (0-1) et être rétrocompatible avec les valeurs > 1. |

## Règles à ne pas oublier

1. **Toujours vérifier** que les fonctions appelées existent réellement dans le fichier
2. **Déclarer les variables** (`let`, `const`) avant de les utiliser
3. **Tester les deux côtés** (admin ET public) après chaque modification
4. **CSS mobile** : ne jamais utiliser `pointer-events: none` sur des éléments qui doivent être interactifs
5. **Drag & drop mobile** : `draggable="true"` ne fonctionne pas sur iOS Safari — utiliser les touch events
6. **NoSleep/WakeLock** : iOS Safari ne supporte pas les data URI vidéo — utiliser un vrai fichier servi (.mp4)
7. **Tagline** : toujours centrer le texte avec `text-align: center` sur les écrans plein écran
8. **index.html body** : doit avoir `background: #000; height: 100%` pour éviter le fond beige iOS
