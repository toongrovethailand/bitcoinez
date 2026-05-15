const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

// --- Configuration & Shared State ---
let currentScene = 1;
let isMoving = false;
let isAiming = false;
let isPanning = false;
let isManualCam = false;
let showResults = false;
let isVerifying = false;

let power = 0;
let ball = { x: 0, y: 0 };
let ball2 = { x: 0, y: 0 }; 
let ballU1 = { x: -9999, y: -9999 }; 
let ballU2 = { x: -9999, y: -9999 }; 

const P = 997; 
let SCALAR_ORDER = 0; // จะถูกคำนวณอัตโนมัติ
const a_coeff = 0; // secp256k1 (Bitcoin)
const b_coeff = 7; // secp256k1 (Bitcoin)
let G_FINITE = { x: 0, y: 0 }; // จะถูกหาอัตโนมัติใน Finite Field

// จุดเริ่มต้นบน Real Field สำหรับสมการ y^2 = x^3 + 7 (x=2, y=sqrt(15))
let gPoint = { x: 2, y: Math.sqrt(15) }; 
let k = 0;
let trajectory = [];
let trajectory2 = [];
let shootStartTime = 0;

// ปรับจำนวนครั้งสูงสุดเป็น 20
const MAX_K_REAL = 20;
const MAX_K_FINITE = 100;

let camScale = 50;
let targetCamScale = 50;
let camOffset = { x: 0, y: 0 };
let targetCamOffset = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };

const colors = {
    curve: '#E6C27A',
    g: '#ffd700',
    ball: '#fff',
    ballBlue: '#00d2ff',
    ballOrange: '#ff9500',
    ballU1: '#00d2ff',
    ballU2: '#ff9500',
    guideLine: '#ff9500', 
    grid: 'rgba(255, 255, 255, 0.02)',
    guideSeek: 'rgba(0, 210, 255, 0.6)',
    guideReflect: 'rgba(255, 255, 255, 0.3)',
    lego: '#1a1f2c',
    point: '#00ff88'
};

// --- Utilities ---
function resize() {
    if (!container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
window.addEventListener('resize', resize);
resize();

function worldToScreen(x, y) { 
    return { 
        x: canvas.width / 2 + (x - camOffset.x) * camScale, 
        y: canvas.height / 2 - (y - camOffset.y) * camScale 
    }; 
}

function sleep(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
}

// --- Real Field Math & Logic ---
function getCurveY(x) {
    const ySq = Math.pow(x, 3) + a_coeff * x + b_coeff;
    return ySq >= 0 ? Math.sqrt(ySq) : null;
}

function eccAddReal(P1, P2) {
    if (!P1) return P2;
    if (!P2) return P1;
    let m;
    if (Math.abs(P1.x - P2.x) < 0.001 && Math.abs(P1.y - P2.y) < 0.001) {
        if (Math.abs(P1.y) < 0.001) return null;
        m = (3 * P1.x * P1.x + a_coeff) / (2 * P1.y);
    } else {
        if (Math.abs(P1.x - P2.x) < 0.001) return null;
        m = (P2.y - P1.y) / (P2.x - P1.x);
    }
    const x3 = m * m - P1.x - P2.x;
    const y3 = m * (P1.x - x3) - P1.y;
    return { x: x3, y: y3, intersectX: x3, intersectY: -y3, m: m };
}

function calculateRealTrajectory() {
    trajectory = [];
    // หาร 5 เพื่อให้หลอดเต็ม 100% ได้ 20 ครั้งพอดี
    let targetK = Math.min(MAX_K_REAL, Math.max(1, Math.floor(power / 5)));
    let currentP = { ...gPoint };
    for (let i = 0; i < targetK; i++) {
        let nextP = (i === 0) ? eccAddReal(currentP, currentP) : eccAddReal(currentP, gPoint);
        // ปลดลิมิตแกน x เป็น 10 ล้าน เพื่อให้กระโดดครบ 20 ครั้ง
        if (!nextP || Math.abs(nextP.x) > 10000000) break;
        trajectory.push({ fromX: currentP.x, fromY: currentP.y, toX: nextP.x, toY: nextP.y, hitX: nextP.intersectX, hitY: nextP.intersectY, m: nextP.m });
        currentP = { x: nextP.x, y: nextP.y };
    }
}

function startRealAnimation() {
    let step = 0, progress = 0, baseSpeed = 0.4, hitCounted = false;
    function frame() {
        if (!isMoving || currentScene !== 1) return;
        if (Date.now() - shootStartTime > 8000) { showInfinityError(); return; }
        if (step >= trajectory.length) { finishShot(); return; }
        let t = trajectory[step];
        if (progress < 1) {
            let dist = Math.sqrt(Math.pow(t.hitX - t.fromX, 2) + Math.pow(t.hitY - t.fromY, 2)) || 1;
            progress += baseSpeed / dist;
            ball.x = t.fromX + (t.hitX - t.fromX) * Math.min(progress, 1);
            ball.y = t.fromY + (t.hitY - t.fromY) * Math.min(progress, 1);
            if (progress >= 1 && !hitCounted) { k = step + 1; hitCounted = true; updateUI(); }
        } else if (progress < 2) {
            let dist = Math.abs(t.toY - t.hitY) || 1;
            progress += baseSpeed / dist;
            ball.y = t.hitY + (t.toY - t.hitY) * Math.min(progress - 1, 1);
        } else { progress = 0; step++; hitCounted = false; }
        requestAnimationFrame(frame);
    }
    frame();
}

function drawRealScene() {
    ctx.strokeStyle = colors.curve; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = colors.curve;
    
    let rootX = Math.cbrt(-b_coeff); 
    
    for (let s of [1, -1]) {
        ctx.beginPath();
        let pRoot = worldToScreen(rootX, 0);
        ctx.moveTo(pRoot.x, pRoot.y); 
        
        // วาดเส้นโค้งไกลขึ้น (ทะลุ 10 ล้าน) โดยเพิ่มระยะ step ให้คำนวณไวขึ้นเมื่อค่า x เยอะขึ้น เพื่อไม่ให้คอมกระตุก
        for (let x = rootX + 0.01; x < 15000000; x += (x < 20 ? 0.1 : x * 0.1)) {
            let y = getCurveY(x); 
            if (y !== null) { 
                let p = worldToScreen(x, s * y); 
                ctx.lineTo(p.x, p.y); 
            }
        }
        ctx.stroke();
    }

    ctx.shadowBlur = 0; ctx.lineWidth = 1;
    if (isAiming) {
        ctx.strokeStyle = colors.guideLine; ctx.lineWidth = 2; ctx.setLineDash([10, 5]);
        trajectory.forEach(t => { let p1 = worldToScreen(t.fromX, t.fromY), p2 = worldToScreen(t.hitX, t.hitY), p3 = worldToScreen(t.toX, t.toY); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.stroke(); });
        ctx.setLineDash([]);
    }
    trajectory.forEach((t, i) => {
        if (!isMoving && !showResults) return;
        if (isMoving && i > k-1) return;
        ctx.strokeStyle = colors.guideSeek; ctx.lineWidth = 1;
        let xS = -20, xE = 150; // เส้น Guide 
        let pS = worldToScreen(xS, t.fromY + t.m * (xS - t.fromX)), pE = worldToScreen(xE, t.fromY + t.m * (xE - t.fromX));
        ctx.beginPath(); ctx.moveTo(pS.x, pS.y); ctx.lineTo(pE.x, pE.y); ctx.stroke();
        if (i < k || (i === k-1 && isMoving)) {
            ctx.strokeStyle = colors.guideReflect; ctx.setLineDash([4, 4]);
            let p1 = worldToScreen(t.hitX, t.hitY), p2 = worldToScreen(t.toX, t.toY);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]);
        }
    });
    let pg = worldToScreen(gPoint.x, gPoint.y);
    ctx.shadowBlur = 15; ctx.shadowColor = colors.g; ctx.fillStyle = colors.g;
    ctx.beginPath(); ctx.arc(pg.x, pg.y, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px Prompt"; ctx.fillText("G", pg.x + 12, pg.y - 12);
}