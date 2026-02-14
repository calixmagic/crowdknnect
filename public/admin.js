// CrowdConnect - Admin Logic (Exclusive)
let isAdmin = false;

// === SOCKET LISTENERS ===
socket.on('admin-granted', () => {
    isAdmin = true;
    log("Mode Admin ACTIVE !");
    openAdminPanel();
    socket.emit('request-state');
});

// === PANEL MANAGEMENT ===
function openAdminPanel() {
    if (!isAdmin) {
        socket.emit('promote-to-admin');
        return;
    }
    const panel = document.getElementById('settings-panel');
    if (panel) {
        panel.classList.add('open');
        renderSteps();
        updateUI();
    }
}

function closePanel() {
    document.getElementById('settings-panel').classList.remove('open');
    // Restore background animation on close
    if (state && state.bgAnim) {
        setBgAnimation(state.bgAnim, state.bgColor || '#000000');
    }
}

// === UI UPDATES ===
function updateUI() {
    if (!state || !state.routines) return;

    // Routine Select
    const rSelect = document.getElementById('routine-select');
    if (rSelect) {
        rSelect.innerHTML = state.routines.map((r, i) =>
            `<option value="${i}" ${i === state.activeRoutineIndex ? 'selected' : ''}>${r.name}</option>`
        ).join('');
    }

    // Configuration Inputs
    setInputValue('delay-input', (state.synchroDelay / 1000) || 2);
    setInputValue('zoom-range', state.logoZoom || 100);
    setInnerText('zoom-val', state.logoZoom || 100);

    // Start Image Source
    const radio = document.querySelector(`input[name="startImgSrc"][value="${state.startImageSource || 'logo'}"]`);
    if (radio) radio.checked = true;

    const customContainer = document.getElementById('custom-start-img-container');
    if (customContainer) customContainer.style.display = (state.startImageSource === 'custom') ? 'block' : 'none';

    // Text & URL Inputs
    const textInputs = {
        'start-img-url-input': state.startImageUrl,
        'welcome-text-input': state.welcomeText,
        'sub-text-input': state.subText,
        'logo-url-input': state.logoUrl,
        'redir-url-input': state.redirectionUrl,
        'tagline-input': state.tagline,
        'bg-color-input': state.bgColor || '#000000',
        'bg-anim-select': state.bgAnim || 'none',
        'start-anim-select': state.startAnim || 'fade'
    };

    for (const [id, val] of Object.entries(textInputs)) {
        setInputValue(id, val || '');
    }

    // Toggles
    setCheckboxValue('logs-toggle', !!state.showLogs);
    setCheckboxValue('toggle-debug', !!state.debug);
}

// Helper Functions
function setInputValue(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function setInnerText(id, val) { const el = document.getElementById(id); if (el) el.innerText = val; }
function setCheckboxValue(id, val) { const el = document.getElementById(id); if (el) el.checked = val; }

// === STEP MANAGEMENT ===
function renderSteps() {
    if (!state.routines) return;
    const list = document.getElementById('steps-list');
    if (!list) return;

    const currentScroll = list.scrollTop;
    const routine = state.routines[state.activeRoutineIndex];

    if (!routine) {
        list.innerHTML = '<p style="color:#aaa;font-size:12px;padding:10px;">Aucune routine active.</p>';
        return;
    }

    const icons = {
        emojis: '🃏', blackout: '⬛', flash: '⚡', shuffle: '🔀', reveal: '🎴',
        revealImage: '🖼️', video: '🎬', words: '🔤', lottie: '🎆', arrow: '⬇',
        heart: '❤️', countdown: '🔢', dice: '🎲', rippleFromLogo: '〰️', audio: '🔊',
        text: '📝', pulse: '💓', spiral: '🌀', color: '🎨', number: '🔢',
        breathing: '🫁', glitch: '⚡', ripple: '〰️', zoom: '🔍', shake: '📣',
        fade: '🌫️', pause: '⏸', cardFlip: '🎴', slot: '🎰', pinpoint: '🎯',
        unlock: '🔓', mirror: '🪞', wave: '🌊', sparkle: '✨', fire: '🔥',
        beat: '🎵', silence: '🔇', staticNoise: '📻', eye: '👁️', puzzle: '🧩',
        mask: '🎭', crystal: '🔮', snapshot: '📸', starfield: '🌟', stop: '⏹'
    };

    list.innerHTML = routine.steps.map((step, idx) => `
        <div class="step-item" draggable="true" data-idx="${idx}">
            <div class="step-handle">☰</div>
            <div class="step-info" onclick="editStep(${idx})">
                <div class="step-name">${icons[step.type] || '▶'} ${step.type.toUpperCase()}</div>
                <div class="step-meta">${step.duration}ms ${step.value ? '| ' + step.value : ''}</div>
            </div>
            <div class="step-toggle ${step.active ? 'active' : ''}" onclick="event.stopPropagation(); toggleStep(${idx})"></div>
            <div class="step-delete" onclick="event.stopPropagation(); deleteStep(${idx})">🗑️</div>
        </div>
    `).join('');

    attachDragListeners(list);
    requestAnimationFrame(() => { list.scrollTop = currentScroll; });
}

// === DRAG & DROP LOGIC ===
function attachDragListeners(list) {
    list.querySelectorAll('.step-item').forEach(item => {
        const handle = item.querySelector('.step-handle');

        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            item.classList.add('dragging');
        }, { passive: false });

        handle.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const after = getDragAfter(list, e.touches[0].clientY);
            if (!after) list.appendChild(item); else list.insertBefore(item, after);
        }, { passive: false });

        handle.addEventListener('touchend', () => {
            item.classList.remove('dragging');
            saveReorder();
        });

        handle.addEventListener('mousedown', () => item.setAttribute('draggable', true));
        item.addEventListener('dragstart', () => item.classList.add('dragging'));
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            saveReorder();
        });
    });

    list.addEventListener('dragover', e => {
        e.preventDefault();
        const after = getDragAfter(list, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (draggable) {
            if (!after) list.appendChild(draggable); else list.insertBefore(draggable, after);
        }
    });
}

function getDragAfter(container, y) {
    const els = [...container.querySelectorAll('.step-item:not(.dragging)')];
    return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveReorder() {
    const list = document.getElementById('steps-list');
    const newOrder = [...list.querySelectorAll('.step-item')].map(el => parseInt(el.dataset.idx));
    const routine = state.routines[state.activeRoutineIndex];
    routine.steps = newOrder.map(i => routine.steps[i]);
    syncState();
}

// === DATA MANAGEMENT ===
function syncState() {
    socket.emit('update-state', state);
    renderSteps();
}

function confirmAddStep() {
    const type = document.getElementById('new-step-type').value;
    const duration = parseInt(document.getElementById('new-step-duration').value) || 2000;
    const value = document.getElementById('new-step-value').value;

    state.routines[state.activeRoutineIndex].steps.push({
        type, duration, value, active: true, id: Date.now()
    });

    syncState();
    document.getElementById('new-step-value').value = '';
}

function toggleStep(idx) {
    const step = state.routines[state.activeRoutineIndex].steps[idx];
    step.active = !step.active;
    syncState();
}

function deleteStep(idx) {
    if (!confirm("Supprimer cette étape ?")) return;
    state.routines[state.activeRoutineIndex].steps.splice(idx, 1);
    syncState();
}

function editStep(idx) {
    const step = state.routines[state.activeRoutineIndex].steps[idx];
    const val = prompt("Valeur:", step.value || '');
    if (val !== null) {
        step.value = val;
        const dur = prompt("Durée (ms):", step.duration);
        if (dur) step.duration = parseInt(dur);
        syncState();
    }
}

// === UTILS & GENERATORS ===
function toggleGuide() {
    const guide = document.getElementById('step-guide');
    if (guide) guide.style.display = guide.style.display === 'block' ? 'none' : 'block';
}

function updateZoom(val) {
    const text = document.getElementById('zoom-val');
    if (text) text.innerText = val;
    state.logoZoom = parseInt(val);
    syncState();
}

function updateTexts() {
    state.welcomeText = document.getElementById('welcome-text-input').value;
    state.subText = document.getElementById('sub-text-input').value;
    state.tagline = document.getElementById('tagline-input')?.value || state.tagline;
    state.redirectionUrl = document.getElementById('redir-url-input').value;
    state.logoUrl = document.getElementById('logo-url-input').value;
    syncState();
}

function addRoutine() {
    const name = prompt("Nom de la nouvelle routine ?", "Nouveau Spectacle");
    if (!name) return;
    state.routines.push({ id: Date.now(), name, steps: [] });
    state.activeRoutineIndex = state.routines.length - 1;
    syncState();
    updateUI();
}

function switchRoutine(idx) {
    state.activeRoutineIndex = parseInt(idx);
    syncState();
    renderSteps();
}

function saveAll() {
    syncState();
    alert("Configuration sauvegardée et synchronisée !");
}

function generateQR() {
    const container = document.getElementById('qr-container');
    const canvas = document.getElementById('qr-canvas');
    if (!container || !canvas) return;

    container.innerHTML = '';
    const url = window.location.origin + window.location.pathname.replace('admin.html', '');

    new QRCode(container, {
        text: url, width: 200, height: 200,
        colorDark: "#000000", colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
        const img = container.querySelector('img');
        if (img) {
            canvas.width = 200; canvas.height = 200;
            canvas.getContext('2d').drawImage(img, 0, 0);
        }
    }, 500);
}

function downloadQR() {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'crowdconnect-qr.png';
    link.href = canvas.toDataURL();
    link.click();
}

// === FILE UPLOADS ===
async function handleStartImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('startImage', file);
    try {
        const res = await fetch('/upload-start-image', { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            state.startImageUrl = data.path;
            syncState();
            alert("Image de démarrage uploadée !");
        }
    } catch (e) { alert("Erreur upload"); }
}

async function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logoFile', file);
    try {
        const res = await fetch('/upload-logo', { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            state.logoUrl = data.path;
            syncState();
            alert("Upload réussi !");
        }
    } catch (e) { alert("Erreur upload"); }
}

// === SECRET ADMIN GESTURE ===
let adminTouchTimer = null;
let adminStartX = 0, adminStartY = 0;

document.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, input, select, .step-handle')) return;

    if (e.touches.length === 1) {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        if (x > 150 || y > 150) return;

        adminStartX = x; adminStartY = y;
        adminTouchTimer = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            openAdminPanel();
        }, 1500);
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (adminTouchTimer) {
        const diffX = Math.abs(e.touches[0].clientX - adminStartX);
        const diffY = Math.abs(e.touches[0].clientY - adminStartY);
        if (diffX > 20 || diffY > 20) { clearTimeout(adminTouchTimer); adminTouchTimer = null; }
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    if (adminTouchTimer) clearTimeout(adminTouchTimer);
});
