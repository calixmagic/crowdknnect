// =========================================
// CrowdConnect - Node.js Server
// =========================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// === CONFIGURATION ===
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// === MIDDLEWARE ===
app.use(express.static(path.join(__dirname, 'public')));
app.use('/cards', express.static(path.join(__dirname, 'cards')));
app.get('/fleche.png', (req, res) => res.sendFile(path.join(__dirname, 'fleche.png')));

// === FILE UPLOAD CONFIGURATION (Multer) ===

// 1. Audio Upload
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'audio');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, file.originalname)
});
const uploadAudio = multer({ storage: audioStorage });

// 2. Video Upload
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'videos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, file.originalname)
});
const uploadVideo = multer({ storage: videoStorage });

// 3. Image Uploads (Logo & Start Screen)
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'images');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});
const uploadImage = multer({ storage: imageStorage });

// === UPLOAD ROUTES ===
app.post('/upload-audio', uploadAudio.single('audioFile'), (req, res) => {
    if (!req.file) return res.status(400).send('No file.');
    console.log(`[UPLOAD] Audio: ${req.file.originalname}`);
    res.json({ filename: req.file.originalname, path: 'audio/' + req.file.originalname });
});

app.post('/upload-video', uploadVideo.single('videoFile'), (req, res) => {
    if (!req.file) return res.status(400).send('No file.');
    console.log(`[UPLOAD] Video: ${req.file.originalname}`);
    res.json({ filename: req.file.originalname, path: 'videos/' + req.file.originalname });
});

app.post('/upload-logo', uploadImage.single('logoFile'), (req, res) => {
    if (!req.file) return res.status(400).send('No file.');
    console.log(`[UPLOAD] Logo: ${req.file.filename}`);
    res.json({ filename: req.file.filename, path: 'images/' + req.file.filename });
});

app.post('/upload-start-image', uploadImage.single('startImage'), (req, res) => {
    if (!req.file) return res.status(400).send('No file.');
    console.log(`[UPLOAD] Start Image: ${req.file.filename}`);
    res.json({ filename: req.file.filename, path: 'images/' + req.file.filename });
});

// === APPLICATION STATE ===
let state = {
    logoUrl: '',
    logoVisible: false,
    logoZoom: 100,
    synchroDelay: 2000,
    redirectionUrl: 'https://g.page/r/CddOBKIvn5onEBM/review',
    activeRoutineIndex: 0,
    startImageSource: 'logo',
    startImageUrl: '',
    welcomeText: '',
    subText: '',
    tagline: '',
    routines: [
        {
            id: 'demo-routine',
            name: 'Demo Routine',
            steps: [
                { type: 'emojis', duration: 5000, active: true },
                { type: 'flash', duration: 2000, active: true }
            ]
        }
    ]
};

// === SOCKET.IO LOGIC ===
io.on('connection', (socket) => {
    console.log(`[SOCKET] New connection: ${socket.id}`);

    // Send initial state
    socket.emit('state-update', state);

    // Broadcast spectator count
    updateConnectionCount();

    // Time Synchronization
    socket.on('sync-time', (clientTs, callback) => {
        if (typeof callback === 'function') callback(Date.now());
    });

    // === ADMIN LISTENERS ===

    // State Update from Admin
    socket.on('update-state', (newState) => {
        if (!newState.routines) return; // Basic validation
        state = { ...state, ...newState };
        // Broadcast to all clients
        io.emit('state-update', state);
        console.log(`[STATE] Updated by Admin. Active Routine: ${state.activeRoutineIndex}`);
    });

    // Request to be Admin (Simple security for now)
    socket.on('promote-to-admin', () => {
        console.log(`[ADMIN] Promotion granted to ${socket.id}`);
        socket.emit('admin-granted');
    });

    // Trigger Routine
    socket.on('trigger-routine', () => {
        console.log(`[TRIGGER] Routine started via Admin`);
        io.emit('trigger-routine');
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] Disconnected: ${socket.id}`);
        updateConnectionCount();
    });
});

function updateConnectionCount() {
    const count = io.engine.clientsCount;
    io.emit('spectator-count', { count });
    console.log(`[INFO] Connected users: ${count}`);
}

// === SERVER START ===
server.listen(PORT, () => {
    console.log(`\n🚀 Magic Server running at http://localhost:${PORT}\n`);
});
