// --- General UI & Scene Management ---

function showFiniteInfo() {
    const overlay = document.getElementById('finite-info-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        // ใช้ setTimeout เล็กน้อยเพื่อให้ CSS Transition (Fade In) ทำงาน
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
        }, 10);
    }
}

window.closeFiniteInfo = function() {
    const overlay = document.getElementById('finite-info-overlay');
    if (overlay) {
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 500);
    }
};

function switchScene(num) {
    currentScene = num;
    document.querySelectorAll('.scene-btn').forEach(btn => btn.classList.toggle('active', parseInt(btn.id.split('-').pop()) === num));
    
    document.getElementById('scene-title').innerText = num === 1 ? 'Real Field Billiards' : 'Node\'s Truth Machine';
    document.getElementById('scene-icon').innerText = num === 1 ? '🎱' : '🧱';
    document.getElementById('comparison-box').classList.toggle('hidden', num === 1);
    document.getElementById('truth-machine-ui').classList.toggle('hidden', num === 1);
    
    const txPanel = document.getElementById('panel-tx');
    const realPanel = document.getElementById('panel-real-info');
    const sideTitle = document.getElementById('side-panel-title');
    const sideContainer = document.getElementById('side-panel-container');

    if (num === 1) {
        txPanel.classList.add('hidden');
        realPanel.classList.remove('hidden');
        sideTitle.innerText = "ℹ️ Information";
        sideContainer.className = "glass-panel rounded-xl p-5 border-t-2 border-t-gold flex-grow overflow-hidden flex flex-col min-h-[450px]";
    } else {
        txPanel.classList.remove('hidden');
        realPanel.classList.add('hidden');
        sideTitle.innerText = "💸 Transaction Simulation";
        sideContainer.className = "glass-panel rounded-xl p-5 border-t-2 border-t-blue-500 flex-grow overflow-hidden flex flex-col min-h-[450px]";
        unlockTransactionPanel(0); 
        
        // เรียกใช้ Popup เมื่อเข้าสู่ Finite Field
        showFiniteInfo();
    }
    closeModal();
    resetSim();
}

function resetSim() {
    isMoving = false;
    isAiming = false;
    isManualCam = false;
    isPanning = false;
    isVerifying = false;
    showResults = false;
    power = 0;
    k = 0;
    trajectory = [];
    trajectory2 = [];
    ballU1 = { x: -9999, y: -9999 };
    ballU2 = { x: -9999, y: -9999 };
    internalSig = { r: 0, s: 0, z: 0, msg: '', pubX: 0, pubY: 0, d: 0, ke: 0 };
    
    if (currentScene === 1) {
        gPoint = { x: 2, y: Math.sqrt(15) }; 
        targetCamScale = 50;
    } else {
        gPoint = { ...G_FINITE };
        targetCamScale = 1.5; 
        targetCamOffset = { x: 0, y: 0 };
        resetTruthUI();
        unlockTransactionPanel(0);
    }
    targetCamOffset = { x: 0, y: 0 };
    camScale = targetCamScale;
    camOffset = { ...targetCamOffset };
    ball = { x: gPoint.x - (currentScene === 2 ? P/2 : 0), y: gPoint.y - (currentScene === 2 ? P/2 : 0) };
    ball2 = { ...ball };
    updateUI();
}

function resetTruthUI() {
    const ids = ['envelope', 'grinder', 'ticket-u1', 'ticket-u2', 'verification-lock'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.opacity = '0'; el.classList.add('hidden'); }
    });
    document.getElementById('tx-status').classList.add('hidden');
    document.getElementById('verification-panel').classList.add('hidden');
    document.getElementById('tx-envelope').classList.add('hidden');
    
    const btnSend = document.getElementById('btn-send');
    if (btnSend) {
        btnSend.disabled = true;
        btnSend.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function closeModal() {
    const modal = document.getElementById('error-modal');
    if (modal) modal.classList.add('hidden');
    resetSim();
}

function shoot() {
    if (power < 5 || isMoving || showResults) return;
    isVerifying = false; 
    isMoving = true;
    isManualCam = false;
    k = 0;
    shootStartTime = Date.now();
    
    if (currentScene === 1) {
        calculateRealTrajectory();
        if (trajectory.length > 0) startRealAnimation(); else isMoving = false;
    } else {
        const targetK = Math.min(MAX_K_FINITE, Math.max(1, Math.floor(power / 1)));
        let cur = { ...G_FINITE };
        trajectory = [{ x: cur.x - P/2, y: cur.y - P/2 }];
        for(let i=1; i<targetK; i++) {
            cur = eccAddModular(cur, G_FINITE, P);
            if(cur) trajectory.push({ x: cur.x - P/2, y: cur.y - P/2 });
        }
        startManualJumpAnimation();
    }
}

function finishShot() { isMoving = false; showResults = true; updateUI(); }
function showInfinityError() { isMoving = false; document.getElementById('error-modal').classList.remove('hidden'); }

// --- Event Listeners & Interactions (Mouse + Touch Support) ---

let initialPinchDistance = null;
let initialCamScale = 1;

function handleInputStart(e) {
    if (e.target === canvas && e.type === 'touchstart') e.preventDefault(); 
    if (isMoving || isVerifying) return; 

    if (e.type === 'touchstart') {
        if (e.touches.length === 2) {
            isAiming = false;
            isPanning = true;
            isManualCam = true;
            initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialCamScale = targetCamScale;
            lastMousePos = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            return;
        }
        if (e.touches.length === 1) {
            if (currentScene === 1 && showResults) {
                resetSim();
                isAiming = true; showResults = false; power = 0;
                return;
            } else if (showResults) return;
            isAiming = true; showResults = false; power = 0;
        }
    } else {
        if (currentScene === 1 && showResults) {
            resetSim();
            if (e.button === 0) { isAiming = true; showResults = false; power = 0; }
            return;
        } else if (showResults) return;

        if (e.button === 0) { isAiming = true; showResults = false; power = 0; }
        else { isPanning = true; isManualCam = true; lastMousePos = { x: e.clientX, y: e.clientY }; }
    }
}

function handleInputMove(e) {
    if (e.target === canvas && e.type === 'touchmove') e.preventDefault(); 
    
    if (e.type === 'touchmove') {
        if (e.touches.length === 2 && isPanning) {
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const zoomFactor = currentDistance / initialPinchDistance;
            targetCamScale = initialCamScale * zoomFactor;
            targetCamScale = Math.min(Math.max(targetCamScale, 0.1), 1000);

            const centerPos = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            let dx = (centerPos.x - lastMousePos.x) / camScale;
            let dy = (centerPos.y - lastMousePos.y) / camScale;
            targetCamOffset.x -= dx;
            targetCamOffset.y += dy;
            lastMousePos = centerPos;
            return;
        }
        if (e.touches.length === 1 && isAiming && currentScene === 1) calculateRealTrajectory();
    } else {
        if (isPanning) {
            let dx = (e.clientX - lastMousePos.x) / camScale;
            let dy = (e.clientY - lastMousePos.y) / camScale;
            targetCamOffset.x -= dx;
            targetCamOffset.y += dy;
            lastMousePos = { x: e.clientX, y: e.clientY };
        }
        if (isAiming && currentScene === 1) calculateRealTrajectory();
    }
}

function handleInputEnd(e) {
    if (e.type === 'touchend' || e.type === 'touchcancel') {
        if (isAiming) { isAiming = false; shoot(); }
        if (e.touches.length === 0) {
            isPanning = false;
            initialPinchDistance = null;
        }
    } else {
        if (isAiming) { isAiming = false; shoot(); }
        isPanning = false;
    }
}

canvas.addEventListener('mousedown', handleInputStart);
window.addEventListener('mousemove', handleInputMove, { passive: false });
window.addEventListener('mouseup', handleInputEnd);

canvas.addEventListener('touchstart', handleInputStart, { passive: false });
window.addEventListener('touchmove', handleInputMove, { passive: false });
window.addEventListener('touchend', handleInputEnd);
canvas.addEventListener('touchcancel', handleInputEnd);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    isManualCam = true;
    if (e.deltaY < 0) targetCamScale *= 1.1; else targetCamScale /= 1.1;
    targetCamScale = Math.min(Math.max(targetCamScale, 0.1), 1000);
}, { passive: false });

// --- Core Rendering Loop ---
function updateCamera() {
    let tS, tO;
    if (isMoving) { 
        tS = currentScene === 1 ? 80 : (camScale > 2 ? camScale : 2); 
        tO = { x: ball.x, y: ball.y }; 
    }
    else if (!isManualCam) { 
        if (currentScene === 1) {
            tS = 50; tO = { x: (gPoint.x + ball.x) / 2, y: (gPoint.y + ball.y) / 2 }; 
        } else {
            tS = 0.8; tO = { x: 0, y: 0 };
        }
    }
    else { tS = targetCamScale; tO = targetCamOffset; }
    camScale += (tS - camScale) * 0.1;
    camOffset.x += (tO.x - camOffset.x) * 0.1;
    camOffset.y += (tO.y - camOffset.y) * 0.1;
}

function updateUI() {
    const kElem = document.getElementById('k-count');
    const pElem = document.getElementById('p-coords');
    const powerFill = document.getElementById('power-gauge-fill');

    if (kElem) kElem.innerText = k;
    if (pElem) {
        let dx = currentScene === 1 ? ball.x.toFixed(2) : (ball.x + P/2).toFixed(0);
        let dy = currentScene === 1 ? ball.y.toFixed(2) : (ball.y + P/2).toFixed(0);
        pElem.innerText = (isMoving || k === 0) ? "---" : `(${dx}, ${dy})`;
    }
    if (powerFill) powerFill.style.height = `${power}%`;
}

function draw() {
    updateCamera();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = colors.grid;
    let gs = currentScene === 1 ? 10 : 100;
    if (camScale > 5) gs = 10;
    if (camScale > 20) gs = 1;

    for(let x = -600; x <= 600; x += gs) { 
        let p1 = worldToScreen(x, -600), p2 = worldToScreen(x, 600); 
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); 
    }
    for(let y = -600; y <= 600; y += gs) { 
        let p1 = worldToScreen(-600, y), p2 = worldToScreen(600, y); 
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); 
    }
    
    if (currentScene === 1) drawRealScene(); else drawFiniteScene();
    
    if (currentScene === 1) {
        let pb = worldToScreen(ball.x, ball.y);
        ctx.shadowBlur = 15; ctx.shadowColor = colors.ball;
        ctx.fillStyle = colors.ball;
        ctx.beginPath(); ctx.arc(pb.x, pb.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    if (isAiming) { 
        power = Math.min(100, power + 2.4); 
        const powerFill = document.getElementById('power-gauge-fill');
        if (powerFill) powerFill.style.height = `${power}%`; 
    }
    requestAnimationFrame(draw);
}

// --- Initialize App ---
setupEditableInputs(); 
switchScene(1);
draw();

// =============================================================
// Welcome Modal Logic (The Story of ECDSA)
// =============================================================

// เรียกใช้ทันทีเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    // โชว์หน้าต่าง Welcome
    const welcomeModal = document.getElementById('welcome-modal');
    if(welcomeModal) {
        welcomeModal.classList.remove('hidden');
    }
});

window.nextWelcomePage = function() {
    document.getElementById('welcome-page-1').classList.add('hidden');
    document.getElementById('welcome-page-2').classList.remove('hidden');
    
    document.getElementById('welcome-btn-group-1').classList.add('hidden');
    document.getElementById('welcome-btn-group-2').classList.remove('hidden');
    document.getElementById('welcome-btn-group-2').classList.add('flex');
};

window.prevWelcomePage = function() {
    document.getElementById('welcome-page-2').classList.add('hidden');
    document.getElementById('welcome-page-1').classList.remove('hidden');
    
    document.getElementById('welcome-btn-group-2').classList.add('hidden');
    document.getElementById('welcome-btn-group-2').classList.remove('flex');
    document.getElementById('welcome-btn-group-1').classList.remove('hidden');
};

window.closeWelcomeModal = function() {
    const modal = document.getElementById('welcome-modal');
    const content = document.getElementById('welcome-modal-content');
    
    if (modal && content) {
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.remove(); // ลบออกจาก DOM ไปเลยเพื่อไม่ให้รก
        }, 500);
    }
};