# CrowdConnect — Synchronisation Spectateur/Magicien

Application web temps réel pour shows de mentalisme, avec interface admin déguisée et moteur de séquences personnalisables.

---

## 🚀 Installation & Démarrage

### Local
```bash
npm install
npm start
```
- **Spectateurs** : `http://localhost:3000/`
- **Admin** : `http://localhost:3000/admin.html`

### Railway.app
1. Connecte-toi sur [railway.app](https://railway.app) avec GitHub
2. Nouveau projet → Deploy from GitHub repo
3. Sélectionne `crowdconnect`
4. Railway détecte Node.js automatiquement

---

## 📱 Utilisation

### Spectateur
1. **Tap "Participer"** → Active NoSleep + sync serveur
2. Attend le déclenchement admin
3. Vit la séquence (symboles, cartes, mots, effets...)
4. Redirigé vers l'URL finale configurée

### Admin
- **Long press** (1s) → Ouvre le panneau de contrôle
- **Double tap** → Lance la routine active
- **❓ Guide** → Affiche la liste des types d'étapes
- Configure : logo, tagline, fond, routines, étapes

---

## 🎬 Types d'Étapes

### ✨ Effets de base
| Icône | Type | Description |
|:-----:|------|-------------|
| ⬛ | **blackout** | Écran noir total |
| ⚡ | **flash** | Flash blanc + vibration (500ms) |
| 🎨 | **color** | Couleur de fond personnalisée (ex: rouge, bleu) |
| 🌫️ | **fade** | Fondu progressif vers noir ou blanc |
| 📳 | **shake** | Tremblement de l'écran (climax) |
| 💓 | **pulse** | Pulsation hypnotique de l'écran |
| 〰️ | **ripple** | Effet d'ondulation depuis le centre |
| 🔍 | **zoom** | Zoom progressif sur un élément |

### 🃏 Cartes & Symboles
| Icône | Type | Description |
|:-----:|------|-------------|
| 🃏 | **emojis** | Symboles de cartes accélérés (♠♥♣♦) |
| 🔀 | **shuffle** | Mélange rapide de cartes |
| 🎴 | **reveal** | Révélation d'UNE carte précise (ex: `9C` = 9 de trèfle) |

### 📝 Texte & Nombres
| Icône | Type | Description |
|:-----:|------|-------------|
| 🔤 | **words** | Animation lettres → mots → MOT FINAL (personnalisable) |
| 📝 | **text** | Affiche un texte personnalisé en géant |
| 🔢 | **number** | Nombre qui défile rapidement puis s'arrête |
| 🔢 | **countdown** | Compte à rebours 3 → 2 → 1 |

### 🎥 Multimédia
| Icône | Type | Description |
|:-----:|------|-------------|
| 🎬 | **video** | Lit une vidéo (URL) en plein écran |
| ⬇ | **arrow** | Affiche la flèche rouge en bas (appel à l'action) |
| ❤️ | **heart** | Animation morphing point → cœur battant (SVG) |

### 🌀 Effets hypnotiques
| Icône | Type | Description |
|:-----:|------|-------------|
| 🌀 | **spiral** | Spirale tournante hypnotique (CSS) |
| 🫁 | **breathing** | Animation respiration Zen (synchronisation) |
| ⚡ | **glitch** | Effet matrix/bug visuel (rupture) |

### ⏹ Contrôle
| Icône | Type | Description |
|:-----:|------|-------------|
| ⏹ | **stop** | Arrête la séquence (écran noir, attend reset manuel) |

---

## ⚙️ Configuration Routine

### Structure
Chaque routine contient des **steps** avec :
- `type` : Type d'étape (voir tableau ci-dessus)
- `duration` : Durée en ms
- `active` : `true`/`false` (toggle on/off)
- `value` : Paramètre spécifique (carte, texte, URL...)

### Exemples

#### Révélation carte classique
```javascript
{ type: 'blackout', duration: 2000 },
{ type: 'emojis', duration: 5000 },
{ type: 'shuffle', duration: 4000 },
{ type: 'reveal', value: '9C', duration: 7000 },
{ type: 'arrow', duration: 20000 }
```

#### Mot final avec buildup
```javascript
{ type: 'countdown', duration: 3000 },
{ type: 'words', words: ['MAGIE','MYSTÈRE','ILLUSION'], value: 'AMITIÉ', duration: 15000 },
{ type: 'arrow', duration: 2000 }
```

#### Effet hypnotique
```javascript
{ type: 'breathing', duration: 10000 },
{ type: 'spiral', duration: 8000 },
{ type: 'pulse', duration: 5000 },
{ type: 'text', value: 'DORMEZ', duration: 3000 }
```

---

## 🎨 Personnalisation

### Logo & Fond
- **Logo** : URL ou fichier local (Galerie)
- **Zoom** : 50% à 250%
- **Fond** : Noir, blanc, ou couleur personnalisée (color picker)

### Tagline
Texte d'accueil affiché sous le logo ("Réaliser une expérience")

### Redirection finale
URL Instagram / site pour redirection après séquence

---

## 🔧 Fonctionnalités Avancées

### NoSleep
- `silence.mp4` + WakeLock API (empêche verrouillage écran iOS/Android)

### Timing Logs
- Log au démarrage de chaque étape
- ⏱ Toutes les secondes pendant l'étape
- ✓ À la fin de chaque étape
- **Toggle logs** disponible dans Configuration Globale (admin)

### Synchronisation
- Offset serveur calculé automatiquement
- Tous les spectateurs voient la même chose au même instant

---

## 📝 Support Base64
L'admin accepte les images **base64** directement dans les champs :
- Champ "Logo : URL" → colle `data:image/png;base64,...`
- Champ "Valeur" (reveal) → colle une image base64 pour révélation custom

---

## 🐛 Logs & Debug
Fichier `BUGS_LOG.md` pour tracer les erreurs récurrentes et éviter les régressions.

---

## 📦 Stack Technique
- **Backend** : Node.js + Socket.IO
- **Frontend** : Vanilla HTML/CSS/JS (zéro framework)
- **Animations** : CSS3 + SVG (morphing cœur)
- **Déploiement** : Railway.app (ou tout hébergeur Node.js)
