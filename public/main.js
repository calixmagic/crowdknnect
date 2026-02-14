// CrowdConnect - Main Core Engine (Shared)
const socket = io();
let serverOffset = 0;
let state = {};
let hasStarted = false;

// Cache DOM elements for performance
const elements = {
    connectScreen: document.getElementById('connect-screen'),
    connectLogo: document.getElementById('connect-logo'),
    welcomeText: document.getElementById('welcome-text'),
    subText: document.getElementById('sub-text'),
    logoScreen: document.getElementById('logo-screen'),
    logoImg: document.getElementById('logo-img'),
    tagline: document.getElementById('tagline-text'),
    engineScreen: document.getElementById('engine-screen'),
    finalScreen: document.getElementById('final-screen'),
    emojiDisplay: document.getElementById('emoji-display'),
    mediaDisplay: document.getElementById('media-display'),
    videoDisplay: document.getElementById('video-display'),
    audioPlayer: document.getElementById('audio-player'),
    arrow: document.getElementById('arrow'),
    body: document.getElementById('main-body'),
    overlays: document.querySelectorAll('.screen > div[id$="-overlay"], #countdown-display, #text-display, #number-display, #crystal-ball, #unlock-icon, #eye-container, #mask-overlay, #puzzle-container, #slot-container, #pinpoint-target, #fire-container, #snapshot-flash, #card-flip-container')
};

function log(msg) {
    const time = new Date().toLocaleTimeString();
    console.log(`[CORE ${time}] ${msg}`);
}

// === ANTI-SLEEP (silence.mp4 + WakeLock API) ===
let noSleepVideo = null;
let wakeLockSentinel = null;
let noSleepActive = false;

function createNoSleepVideo() {
    const v = document.createElement('video');
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    v.setAttribute('loop', '');
    v.muted = true;
    v.style.cssText = 'position:fixed;top:-1px;left:-1px;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1;';
    v.src = 'silence.mp4';
    document.body.appendChild(v);
    return v;
}

function enableNoSleep() {
    if (noSleepActive) return;
    if (!noSleepVideo) noSleepVideo = createNoSleepVideo();

    noSleepVideo.play().then(() => {
        noSleepActive = true;
    }).catch(e => console.log("NoSleep video error:", e));

    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(s => {
            wakeLockSentinel = s;
            s.addEventListener('release', () => log("WakeLock released"));
        }).catch(() => { });
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && hasStarted) {
        enableNoSleep();
    }
});

// === ASSET PRELOADING ===
function preloadAllAssets() {
    if (!state || !state.routines) return;
    log("🚀 Preloading assets...");
    const assets = new Set();

    state.routines.forEach(routine => {
        routine.steps.forEach(step => {
            if (step.url) assets.add(JSON.stringify({ url: step.url, type: step.type }));

            if (step.value && (step.type === 'reveal' || step.type === 'cardFlip')) {
                let val = step.value;
                if (!val.includes('/')) val = 'cards/' + val + (val.endsWith('.jpg') ? '' : '.jpg');
                assets.add(JSON.stringify({ url: val, type: 'image' }));
            }

            if (step.images && Array.isArray(step.images)) {
                step.images.forEach(img => assets.add(JSON.stringify({ url: img, type: 'image' })));
            }
        });
    });

    assets.forEach(json => {
        const asset = JSON.parse(json);
        const url = asset.url;
        if (!url) return;

        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || asset.type === 'image') {
            new Image().src = url;
        } else if (url.match(/\.(mp3|wav|ogg)$/i) || asset.type === 'audio') {
            const a = new Audio();
            a.src = url;
            a.load();
        } else if (url.match(/\.(mp4|webm)$/i) || asset.type === 'video') {
            const v = document.createElement('video');
            v.src = url;
            v.preload = 'auto';
            v.load();
        }
    });
    log(`📦 ${assets.size} assets cached.`);
}

// === SOCKET HANDLING ===
socket.on('connect', () => {
    const start = Date.now();
    socket.emit('sync-time', start, (serverTime) => {
        const latency = (Date.now() - start) / 2;
        serverOffset = serverTime - (Date.now() - latency);
    });
});

socket.on('spectator-count', (data) => {
    const countEl = document.getElementById('connection-count');
    if (countEl) countEl.innerText = `👤 ${data.count}`;
});

socket.on('state-update', (serverState) => {
    state = serverState;
    updateLogoDisplay();
    updateConnectScreen();

    if (state.bgColor) document.body.style.backgroundColor = state.bgColor;
    if (state.bgAnim) setBgAnimation(state.bgAnim, state.bgColor || '#000000');

    const redirBtn = document.getElementById('redirection-btn');
    if (redirBtn) redirBtn.href = state.redirectionUrl || '#';
});

socket.on('trigger-routine', () => {
    log("🔥 TRIGGER RECEIVED");
    hasStarted = true;
    runRoutine();
});

socket.on('admin-trigger', runRoutine);
socket.on('admin-reset', () => window.location.reload());

// === UI UPDATES ===
function updateConnectScreen() {
    let hasImage = false;

    if (state.startImageSource === 'custom' && state.startImageUrl) {
        elements.connectLogo.src = state.startImageUrl;
        hasImage = true;
    } else if (state.logoUrl) {
        elements.connectLogo.src = state.logoUrl;
        hasImage = true;
    }

    if (hasImage) {
        elements.connectLogo.style.display = 'block';
        elements.connectLogo.style.width = (state.logoZoom || 100) + '%';
    } else {
        elements.connectLogo.style.display = 'none';
    }

    if (elements.welcomeText) {
        elements.welcomeText.innerText = state.welcomeText || '';
        elements.welcomeText.style.display = state.welcomeText?.trim() ? 'block' : 'none';
    }

    if (elements.subText) {
        elements.subText.innerText = state.subText || '';
        elements.subText.style.display = state.subText?.trim() ? 'block' : 'none';
    }
}

function updateLogoDisplay() {
    if (state.logoUrl && state.logoVisible) {
        elements.logoImg.src = state.logoUrl;
        elements.logoImg.style.width = (state.logoZoom || 100) + '%';
        elements.logoScreen.classList.add('active');
    } else {
        elements.logoScreen.classList.remove('active');
    }
    if (elements.tagline && state.tagline) {
        elements.tagline.innerText = state.tagline;
    }
}

// === ENGINE LOOP ===
function runRoutine() {
    if (!state?.routines || state.activeRoutineIndex === undefined) return;

    const routine = state.routines[state.activeRoutineIndex];
    if (!routine?.triggerTime) return;

    const now = Date.now() + serverOffset;
    const startTime = routine.triggerTime + ((state.synchroDelay || 2) * 1000);

    if (now < startTime) {
        requestAnimationFrame(runRoutine);
        return;
    }

    // Activate Engine Screen
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    elements.engineScreen.classList.add('active');

    let elapsed = now - startTime;
    const steps = routine.steps.filter(s => s.active);

    let currentStepIdx = -1;
    for (let i = 0; i < steps.length; i++) {
        if (elapsed < steps[i].duration) {
            currentStepIdx = i;
            break;
        }
        elapsed -= steps[i].duration;
    }

    if (currentStepIdx === -1) {
        finishRoutine();
        return;
    }

    renderStep(steps[currentStepIdx], now, elapsed);
    requestAnimationFrame(runRoutine);
}

function clearScreen() {
    elements.emojiDisplay.innerText = '';
    elements.mediaDisplay.style.display = 'none';
    elements.videoDisplay.style.display = 'none';
    elements.arrow.style.display = 'none';

    elements.body.className = '';
    elements.body.style.animation = '';

    elements.overlays.forEach(el => el.style.display = 'none');
}

function finishRoutine() {
    document.querySelectorAll('audio').forEach(a => a.pause());
    elements.engineScreen.classList.remove('active');

    if (state.redirectionUrl && state.redirectionUrl !== '#') {
        window.location.href = state.redirectionUrl;
    } else {
        elements.finalScreen.classList.add('active');
    }
}

// === RENDER LOGIC ===
function renderStep(step, now, elapsed) {
    // Only reset specifically if needed, or implement a diffing check for performance
    // Currently, we rely on CSS handling transitions.

    switch (step.type) {
        case 'blackout': elements.body.className = 'blackout-bg'; break;
        case 'flash':
            const flashDur = step.duration / (step.value || 1);
            if ((elapsed % flashDur) / flashDur < 0.5) {
                elements.body.classList.add('flash-bg');
                if (step.color) elements.body.style.backgroundColor = step.color;
            } else {
                elements.body.classList.remove('flash-bg');
                elements.body.style.backgroundColor = '';
            }
            break;
        case 'emojis':
            const speed = (step.speed || 1200) * Math.pow(0.25, Math.min(1, elapsed / step.duration));
            const icon = ['♠️', '♥️', '♣️', '♦️'][Math.floor(now / speed) % 4];
            elements.emojiDisplay.innerText = icon;
            elements.emojiDisplay.className = (icon === '♥️' || icon === '♦️') ? 'red' : 'black';
            break;
        case 'shuffle':
            elements.body.className = 'white-bg';
            elements.mediaDisplay.style.display = 'block';
            const cards = ['AS', 'KH', '2J', 'QC', '7H', '3C'];
            elements.mediaDisplay.src = `cards/${cards[Math.floor(now / (step.speed || 150)) % cards.length]}.jpg`;
            break;
        case 'reveal':
            elements.body.className = 'white-bg';
            elements.mediaDisplay.style.display = 'block';
            elements.mediaDisplay.src = `cards/${step.value}.jpg`;
            break;
        case 'video':
            elements.videoDisplay.style.display = 'block';
            if (elements.videoDisplay.getAttribute('data-url') !== step.url) {
                elements.videoDisplay.src = step.url;
                elements.videoDisplay.setAttribute('data-url', step.url);
                elements.videoDisplay.play();
            }
            break;
        case 'words':
            const wordList = step.words || ['MAGIE'];
            elements.emojiDisplay.innerText = wordList[Math.floor(now / (step.speed || 300)) % wordList.length];
            break;
        case 'audio':
            if (elements.audioPlayer.getAttribute('src') !== step.url) {
                elements.audioPlayer.src = step.url;
                elements.audioPlayer.play();
            }
            break;
        case 'text':
            const textDiv = document.getElementById('text-display');
            textDiv.style.display = 'block'; textDiv.innerText = step.value;
            break;
        case 'number':
            const numDiv = document.getElementById('number-display');
            numDiv.style.display = 'block';
            numDiv.innerText = (elapsed < step.duration - 1000) ? Math.floor(Math.random() * 100) : step.value;
            break;
        case 'countdown':
            const countDiv = document.getElementById('countdown-display');
            countDiv.style.display = 'block';
            countDiv.innerText = Math.max(0, Math.ceil((step.duration - elapsed) / 1000));
            break;

        // CSS Class triggers
        case 'pulse': elements.body.classList.add('pulse-bg'); break;
        case 'breathing': elements.body.classList.add('breathing-bg'); break;
        case 'glitch': elements.body.classList.add('glitch-bg'); break;
        case 'shake': elements.body.classList.add('shake-bg'); break;
        case 'zoom': elements.body.classList.add('zoom-bg'); break;

        // Overlay Triggers
        case 'heart': document.getElementById('heart-svg').style.display = 'block'; break;
        case 'spiral': document.getElementById('spiral-overlay').style.display = 'block'; break;
        case 'ripple': document.getElementById('ripple-center').style.display = 'block'; break;
        case 'arrow': elements.arrow.style.display = 'block'; break;

        case 'cardFlip':
            document.getElementById('card-flip-container').style.display = 'block';
            document.getElementById('card-flip').innerHTML = `<img src="${step.value || 'cards/AC.jpg'}" style="width:100%;height:100%;">`;
            break;

        case 'dice':
            document.getElementById('dice-container').style.display = 'block';
            if (elapsed > 2000) {
                const rotations = { 1: 'rotateY(0deg)', 2: 'rotateY(180deg)', 3: 'rotateY(90deg)', 4: 'rotateY(-90deg)', 5: 'rotateX(90deg)', 6: 'rotateX(-90deg)' };
                document.getElementById('dice').style.transform = rotations[step.value || 6];
            }
            break;

        case 'color':
            const col = document.getElementById('color-overlay');
            col.style.display = 'block'; col.style.backgroundColor = step.value;
            break;
    }
}

// === BACKGROUND ANIMATION ===
let bgCanvas = document.getElementById('bg-canvas');
let bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
let bgAnimFrameId = null;

function setBgAnimation(type, color) {
    if (!bgCanvas) return;
    cancelAnimationFrame(bgAnimFrameId);
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    if (type === 'particles') initParticles(color);
    else if (type === 'stars') initStarfield();
}

function initParticles(color) {
    const particles = Array.from({ length: 100 }, () => ({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        vx: (Math.random() - 0.5), vy: (Math.random() - 0.5),
        size: Math.random() * 3 + 1, alpha: Math.random()
    }));

    const loop = () => {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.fillStyle = color;
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = bgCanvas.width; if (p.x > bgCanvas.width) p.x = 0;
            if (p.y < 0) p.y = bgCanvas.height; if (p.y > bgCanvas.height) p.y = 0;
            bgCtx.globalAlpha = p.alpha;
            bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2); bgCtx.fill();
        });
        bgAnimFrameId = requestAnimationFrame(loop);
    };
    loop();
}

function initStarfield() {
    const stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, z: Math.random() * bgCanvas.width
    }));

    const loop = () => {
        bgCtx.fillStyle = '#000'; bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.fillStyle = '#fff';
        const cx = bgCanvas.width / 2, cy = bgCanvas.height / 2;

        stars.forEach(p => {
            p.z -= 2;
            if (p.z <= 0) { p.z = bgCanvas.width; p.x = Math.random() * bgCanvas.width; p.y = Math.random() * bgCanvas.height; }
            const k = 128.0 / p.z;
            const x = (p.x - cx) * k + cx;
            const y = (p.y - cy) * k + cy;

            if (x >= 0 && x < bgCanvas.width && y >= 0 && y < bgCanvas.height) {
                bgCtx.beginPath(); bgCtx.arc(x, y, (1 - p.z / bgCanvas.width) * 3, 0, Math.PI * 2); bgCtx.fill();
            }
        });
        bgAnimFrameId = requestAnimationFrame(loop);
    };
    loop();
}

// === INITIALIZATION ===
elements.connectScreen.addEventListener('click', () => {
    enableNoSleep();
    preloadAllAssets();
    hasStarted = true;
    elements.connectScreen.classList.remove('active');
    updateLogoDisplay();
});
