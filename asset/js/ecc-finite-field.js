let finitePoints = [];

// --- Finite Field Math ---
function modInverse(a, m) {
    a = (a % m + m) % m;
    if (m === 1) return 0;
    let m0 = m, t, q;
    let x0 = 0, x1 = 1;
    if (m === 1) return 0;
    while (a > 1) {
        if (m === 0) return null; 
        q = Math.floor(a / m);
        t = m;
        m = a % m;
        a = t;
        t = x0;
        x0 = x1 - q * x0;
        x1 = t;
    }
    if (a < 1) return null; 
    if (x1 < 0) x1 += m0;
    return x1;
}

function eccAddModular(P1, P2, p) {
    if (!P1) return P2;
    if (!P2) return P1;
    let m;
    if (P1.x === P2.x && P1.y === P2.y) {
        if (P1.y === 0) return null;
        let num = (3 * P1.x * P1.x + a_coeff) % p;
        let den = modInverse(2 * P1.y, p);
        if (den === null) return null;
        m = (num * den) % p;
    } else {
        if (P1.x === P2.x) return null;
        let num = (P2.y - P1.y + p) % p;
        let den = modInverse(P2.x - P1.x + p, p);
        if (den === null) return null;
        m = (num * den) % p;
    }
    let x3 = (m * m - P1.x - P2.x + 2 * p) % p;
    let y3 = (m * (P1.x - x3 + p) - P1.y + p) % p;
    return { x: x3, y: y3 };
}

function eccMultiplyModular(k, P1, p) {
    let result = null;
    let current = P1;
    let rem = k;
    while (rem > 0) {
        if (rem % 2 === 1) result = eccAddModular(result, current, p);
        current = eccAddModular(current, current, p);
        rem = Math.floor(rem / 2);
    }
    return result;
}

// -------------------------------------------------------------
// ค้นหาจุด G และคำนวณหาค่า Scalar Order อัตโนมัติ (แก้บั๊ก INF)
// -------------------------------------------------------------
function initBitcoinCurve() {
    // หาจุดแรกรอบๆ Field ที่รันสมการผ่าน
    for (let x = 1; x < P; x++) {
        const rhs = (Math.pow(x, 3) + a_coeff * x + b_coeff) % P;
        for (let y = 1; y < P; y++) {
            if ((y * y) % P === rhs) {
                G_FINITE = { x, y };
                break;
            }
        }
        if (G_FINITE.x !== 0) break;
    }
    
    // จำลองหาจำนวนรอบทั้งหมดจนกว่าจะวนกลับไปที่จุด Infinity
    let cur = { ...G_FINITE };
    let order = 1;
    while (cur !== null && order < 2000) {
        cur = eccAddModular(cur, G_FINITE, P);
        order++;
    }
    SCALAR_ORDER = order;
}

function precalculateFinitePoints() {
    finitePoints = [];
    for (let x = 0; x < P; x++) {
        const rhs = (Math.pow(x, 3) + a_coeff * x + b_coeff) % P;
        for (let y = 0; y < P; y++) {
            if ((y * y) % P === rhs) {
                finitePoints.push({ x, y });
            }
        }
    }
}

// รันหาค่า G และสมการบน Finite Field ทันที
initBitcoinCurve();
precalculateFinitePoints();

// --- Finite Field Animation ---
function startManualJumpAnimation() {
    let step = 0, timer = 0;
    function frame() {
        if (!isMoving) return;
        timer++;
        if (timer > 2) {
            timer = 0;
            if (step < trajectory.length - 1) { 
                step++; 
                ball.x = trajectory[step].x; 
                ball.y = trajectory[step].y; 
                k = step + 1; 
                updateUI(); 
            } else { 
                isMoving = false; 
                showResults = true; 
                updateUI(); 
                if (currentScene === 2) {
                    unlockTransactionPanel(k);
                    const status = document.getElementById('tx-status');
                    status.innerText = `สร้างสำเร็จ! Private Key = ${k}, Public Key = จุดสุดท้าย`;
                    status.className = "p-2 rounded text-[9px] font-bold text-center uppercase tracking-widest bg-blue-900/50 text-blue-400 block border border-blue-500/50 mt-2";
                    status.classList.remove('hidden');
                }
                return; 
            }
        }
        requestAnimationFrame(frame);
    }
    frame();
}

function drawFiniteScene() {
    const halfP = P / 2;
    ctx.fillStyle = colors.point;
    finitePoints.forEach(pt => {
        let p = worldToScreen(pt.x - halfP, pt.y - halfP);
        if (p.x > -50 && p.x < canvas.width + 50 && p.y > -50 && p.y < canvas.height + 50) {
            // [แก้ไข] ปรับขนาดของจุดอัตโนมัติ: ถ้าจอกว้างก็ใช้ 2 ถ้าจอมือถือเล็กๆ จะลดเหลือ 1 ไม่ให้ซ้อนทับกัน
            let radius = camScale > 10 ? 4 : (camScale < 0.8 ? 1 : 2);
            ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI*2); ctx.fill();
        }
    });

    ctx.font = "bold 12px Prompt";
    ctx.shadowBlur = 0;

    if (ballU1.x > -9000) {
        let p = worldToScreen(ballU1.x, ballU1.y);
        ctx.fillStyle = colors.ballU1; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillText("U1 (z*s⁻¹)", p.x + 12, p.y - 12);
    }
    
    if (ballU2.x > -9000) {
        let p = worldToScreen(ballU2.x, ballU2.y);
        ctx.fillStyle = colors.ballU2; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillText("U2 (r*s⁻¹)", p.x + 12, p.y - 12);
    }

    if (isMoving || showResults) {
        if (!isMoving && showResults) {
            let p = worldToScreen(ball.x, ball.y);
            ctx.fillStyle = colors.ball; ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI*2); ctx.fill();
            
            if (isVerifying) {
                ctx.fillText("RESULT (U1+U2)", p.x + 12, p.y + 20);
                if (ballU1.x > -9000 && ballU2.x > -9000) {
                    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
                    let pb1 = worldToScreen(ballU1.x, ballU1.y); 
                    let pb2 = worldToScreen(ballU2.x, ballU2.y);
                    ctx.beginPath(); ctx.moveTo(pb1.x, pb1.y); ctx.lineTo(pb2.x, pb2.y); ctx.stroke(); ctx.setLineDash([]);
                }
            } else {
                ctx.fillText("Public Key (K)", p.x + 12, p.y + 20);
            }
            
        } else {
            if (ball.x > -9000) {
                let p = worldToScreen(ball.x, ball.y);
                ctx.fillStyle = colors.ballBlue; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
            }
            if (ball2.x > -9000) {
                let p = worldToScreen(ball2.x, ball2.y);
                ctx.fillStyle = colors.ballOrange; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
            }
        }
    }
}