const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/cards', express.static(path.join(__dirname, 'cards')));
app.get('/fleche.png', (req, res) => res.sendFile(path.join(__dirname, 'fleche.png')));

// Configuration Multer pour l'upload audio
const multer = require('multer');
const audioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'public', 'audio');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Garder le nom d'origine ou sécuriser si besoin
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: audioStorage });

app.post('/upload-audio', upload.single('audioFile'), (req, res) => {
    if (!req.file) return res.status(400).send('Aucun fichier.');
    console.log(`[SERVER] Audio uploadé: ${req.file.originalname}`);
    res.json({ filename: req.file.originalname, path: 'audio/' + req.file.originalname });
});

// Configuration Multer pour l'upload vidéo
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'public', 'videos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const uploadVideo = multer({ storage: videoStorage });

app.post('/upload-video', uploadVideo.single('videoFile'), (req, res) => {
    if (!req.file) return res.status(400).send('Aucun fichier.');
    console.log(`[SERVER] Vidéo uploadée: ${req.file.originalname}`);
    res.json({ filename: req.file.originalname, path: 'videos/' + req.file.originalname });
});

// Upload Logo
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'images');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, 'logo-' + Date.now() + path.extname(file.originalname))
});
const uploadLogo = multer({ storage: logoStorage });

app.post('/upload-logo', uploadLogo.single('logoFile'), (req, res) => {
    if (!req.file) return res.status(400).send('Aucun fichier.');
    console.log(`[SERVER] Logo uploadé: ${req.file.filename}`);
    res.json({ filename: req.file.filename, path: 'images/' + req.file.filename });
});

// Upload Start Image
const startStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'images');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, 'start-' + Date.now() + path.extname(file.originalname))
});
const uploadStart = multer({ storage: startStorage });

app.post('/upload-start-image', uploadStart.single('startImage'), (req, res) => {
    if (!req.file) return res.status(400).send('Aucun fichier.');
    console.log(`[SERVER] Start Image uploadée: ${req.file.filename}`);
    res.json({ filename: req.file.filename, path: 'images/' + req.file.filename });
});

// État initial du Laboratoire
let state = {
    logoUrl: '',
    logoVisible: false,
    logoZoom: 100,
    sequenceDelay: 2,
    redirectionUrl: 'https://g.page/r/CddOBKIvn5onEBM/review',
    activeRoutineIndex: 0,
    routines: [
        {
            id: 'routine-cards',
            name: 'Tour de Cartes Classic',
            steps: [
                { id: 1, type: 'emojis', duration: 8000, active: true },
                { id: 2, type: 'shuffle', duration: 4000, active: true },
                { id: 3, type: 'reveal', duration: 24000, active: true, value: '9D' }
            ]
        },
        {
            id: 'routine-light',
            name: 'Lumière Jetée',
            steps: [
                { id: 1, type: 'blackout', duration: 5000, active: true },
                { id: 2, type: 'flash', duration: 2000, active: true, vibrate: true },
                { id: 3, type: 'video', duration: 20000, active: true, url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }
            ]
        }
    ]
};

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Sync initial
    console.log(`[SERVER] Sync initial pour ${socket.id} (${state.routines.length} routines)`);
    socket.emit('state-update', state);

    // Broadcast total connections
    updateConnectionCount();

    socket.on('sync-time', (clientTimestamp, callback) => {
        if (typeof callback === 'function') callback(Date.now());
    });

    // Mise à jour complète (Admin)
    socket.on('update-state', (newState) => {
        if (!newState.routines || newState.routines.length === 0) {
            console.log("[SERVER] Tentative d'écrasement par un état vide bloquée.");
            return;
        }
        state = { ...state, ...newState };
        console.log(`[SERVER] État mis à jour par l'Admin. ActiveRoutine: ${state.activeRoutineIndex}`);
        io.emit('state-update', state);
    });

    // Promotion Admin Nomade (Geste 3 doigts)
    socket.on('promote-to-admin', () => {
        console.log(`[SERVER] Demande de promotion de ${socket.id}`);
        socket.emit('admin-granted');
    });

    socket.on('admin-show-logo', () => {
        state.logoVisible = true;
        console.log("[SERVER] Show Logo triggered");
        io.emit('state-update', state);
    });

    socket.on('admin-trigger', (data) => {
        const delayMs = (data && data.delay !== undefined ? data.delay : state.sequenceDelay) * 1000;
        const targetTime = Date.now() + delayMs;
        const routine = state.routines[state.activeRoutineIndex];

        if (!routine) {
            console.error("[SERVER] Erreur: Routine active invalide au trigger.");
            return;
        }

        console.log(`[SERVER] Trigger routine: ${routine.name} dans ${delayMs}ms`);
        io.emit('start-sequence', {
            targetTime: targetTime,
            routine: routine
        });
    });

    socket.on('admin-reset', () => {
        state.logoVisible = false;
        console.log("[SERVER] Reset triggered");
        io.emit('reset-sequence');
        io.emit('state-update', state);
    });

    socket.on('disconnect', () => {
        console.log('[SERVER] Client déconnecté:', socket.id);
        updateConnectionCount();
    });
});

function updateConnectionCount() {
    const count = io.engine.clientsCount;
    console.log(`[SERVER] Spectateurs connectés: ${count}`);
    io.emit('spectator-count', { count: count });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Magic Server running on port ${PORT}`);
});
