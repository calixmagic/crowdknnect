# Erreurs & Remarques – CrowdConnect

## 🚫 Erreurs Commises (ne plus refaire)

### JavaScript
- **Variable non définie** : Toujours déclarer `const logoScreen = document.getElementById(...)` AVANT de l'utiliser. (`logoScreen is not defined`)
- **Accès à `state.routines[activeRoutineIndex]` sans vérifier** : Toujours checker `state.routines.length > 0` et `activeRoutineIndex < state.routines.length` avant tout accès.
- **`prompt()` sur mobile = mauvais UX** : Ne jamais utiliser `prompt()` pour choisir un type d'étape. Utiliser un `<select>` visuel inline à la place.
- **Redéclaration `const`** : Ne pas déclarer deux fois la même variable `const videoWake` dans le même scope.

### iOS Safari
- **Wake Lock API non supportée** : Safari iOS ne supporte pas `navigator.wakeLock`. Ne pas compter dessus.
- **`data:` URI vidéo ne fonctionne pas** : Safari iOS refuse de lire les vidéos en `data:` base64. Erreur : "The operation is not supported."
- **`window.location.href = ...` recharge la page** : Ne JAMAIS utiliser ça comme "keep alive", ça détruit l'état.
- **Solution iOS anti-veille** : Servir un vrai fichier `.mp4` silencieux depuis le serveur et le jouer en boucle avec `playsinline muted loop`.

### Synchronisation
- **Admin envoie un état vide au serveur** : Protéger côté serveur avec `if (!newState.routines || newState.routines.length === 0) return;`
- **Routines disparaissent au reload** : Les routines par défaut doivent être hardcodées dans `server.js`. Elles ne persistent qu'en mémoire.
- **`activeRoutineIndex` peut être `undefined`** : Toujours fallback à `0`.

### UX
- **Texte technique visible par le public** : Ne pas afficher "VIBRATIONS ET ÉCRAN ACTIFS" au spectateur. Garder un texte neutre.
- **Bouton d'entrée** : Doit s'appeler "Participer" (pas "Démarrer"), gros et visible.
- **Compteur de spectateurs** : L'admin DOIT voir combien de personnes sont connectées.
- **Double-clic desktop** : Ajouter un accès au panneau admin via double-clic pour les tests Chrome.

## 💡 Remarques Techniques
- Safari iOS est le navigateur le plus restrictif. Toujours tester dessus en priorité.
- Les `console.log` doivent aussi apparaître dans la zone de debug visible, pas seulement dans la console dev.
- Toujours préfixer les logs : `[ADMIN]` ou `[PUBLIC]` + timestamp.
- Le serveur Node.js stocke tout en mémoire : redémarrer le serveur = reset des routines custom.
