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

function initBitcoinCurve() {
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
                ECCAudio.bounce(); // <-- เล่นเสียงเด้งบนกระดาน
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
            let radius = camScale > 10 ? 4 : (camScale < 0.8 ? 1 : 2);
            ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI*2); ctx.fill();
        }
    });

    if (G_FINITE.x !== 0) {
        let pg = worldToScreen(G_FINITE.x - halfP, G_FINITE.y - halfP);
        ctx.fillStyle = colors.ballU1; 
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.ballU1; 
        ctx.beginPath(); ctx.arc(pg.x, pg.y, (camScale > 10 ? 6 : 4), 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = colors.ballU1; 
        ctx.font = "bold 12px Prompt";
        ctx.fillText("G", pg.x + 12, pg.y - 12);
    }

    if (currentPubKey) {
        let pk = worldToScreen(currentPubKey.x - halfP, currentPubKey.y - halfP);
        ctx.fillStyle = colors.ballU2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.ballU2;
        ctx.beginPath(); ctx.arc(pk.x, pk.y, (camScale > 10 ? 6 : 4), 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = colors.ballU2;
        ctx.font = "bold 12px Prompt";
        ctx.fillText("Public Key (K)", pk.x + 12, pk.y - 12);
    }

    ctx.font = "bold 12px Prompt";
    ctx.shadowBlur = 0;

    if (ballU1.x > -9000) {
        let p1 = worldToScreen(ballU1.x, ballU1.y);
        
        if (G_FINITE.x !== 0) {
            let pg = worldToScreen(G_FINITE.x - halfP, G_FINITE.y - halfP);
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
            ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(pg.x, pg.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); 
            ctx.setLineDash([]);
        }

        ctx.fillStyle = colors.ballU1; ctx.beginPath(); ctx.arc(p1.x, p1.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillText("U1 (z*s⁻¹)", p1.x + 12, p1.y - 12);
    }
    
    if (ballU2.x > -9000) {
        let p2 = worldToScreen(ballU2.x, ballU2.y);
        
        if (currentPubKey) {
            let pk = worldToScreen(currentPubKey.x - halfP, currentPubKey.y - halfP);
            ctx.strokeStyle = 'rgba(255, 149, 0, 0.3)';
            ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(pk.x, pk.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); 
            ctx.setLineDash([]);
        }

        ctx.fillStyle = colors.ballU2; ctx.beginPath(); ctx.arc(p2.x, p2.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillText("U2 (r*s⁻¹)", p2.x + 12, p2.y - 12);
    }

    if (verificationResult !== null && ballU1.x > -9000 && ballU2.x > -9000) {
        let pb1 = worldToScreen(ballU1.x, ballU1.y);
        let pb2 = worldToScreen(ballU2.x, ballU2.y);
        
        let easeP = mergeProgress < 0.5 ? 2 * mergeProgress * mergeProgress : 1 - Math.pow(-2 * mergeProgress + 2, 2) / 2;

        if (calculatedRPoint) {
            let pr = worldToScreen(calculatedRPoint.x, calculatedRPoint.y);

            let curX1 = pb1.x + (pr.x - pb1.x) * easeP;
            let curY1 = pb1.y + (pr.y - pb1.y) * easeP;
            let curX2 = pb2.x + (pr.x - pb2.x) * easeP;
            let curY2 = pb2.y + (pr.y - pb2.y) * easeP;

            if (expectedXPoint) {
                let px = worldToScreen(expectedXPoint.x, expectedXPoint.y);
                
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)'; 
                ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
                ctx.beginPath(); ctx.moveTo(px.x, -9999); ctx.lineTo(px.x, 9999); ctx.stroke();
                
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(px.x, px.y, 16, 0, Math.PI*2); ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.fillStyle = '#ffd700';
                ctx.font = "bold 12px Prompt";
                ctx.fillText("Target X (r)", px.x + 20, px.y - 20);
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; 
            ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(pb1.x, pb1.y); ctx.lineTo(pr.x, pr.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pb2.x, pb2.y); ctx.lineTo(pr.x, pr.y); ctx.stroke();

            let pathColor = '#ff66ff';
            ctx.strokeStyle = pathColor; 
            ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
            ctx.beginPath(); ctx.moveTo(pb1.x, pb1.y); ctx.lineTo(curX1, curY1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pb2.x, pb2.y); ctx.lineTo(curX2, curY2); ctx.stroke();
            ctx.setLineDash([]);

            if (mergeProgress < 1) {
                ctx.shadowBlur = 15; ctx.shadowColor = colors.ballU1;
                ctx.fillStyle = colors.ballU1;
                ctx.beginPath(); ctx.arc(curX1, curY1, 6, 0, Math.PI*2); ctx.fill();
                
                ctx.shadowBlur = 15; ctx.shadowColor = colors.ballU2;
                ctx.fillStyle = colors.ballU2;
                ctx.beginPath(); ctx.arc(curX2, curY2, 6, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                let rLaserColor = '#ff66ff';
                let rGlow = 'rgba(255, 102, 255, 0.3)';

                ctx.shadowBlur = 30; ctx.shadowColor = rLaserColor;
                ctx.fillStyle = rGlow; 
                ctx.beginPath(); ctx.arc(pr.x, pr.y, 12, 0, Math.PI*2); ctx.fill();
                
                ctx.shadowBlur = 10;
                ctx.fillStyle = rLaserColor; 
                ctx.beginPath(); ctx.arc(pr.x, pr.y, 7, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#FFFFFF';
                ctx.fillText("Point R (U1+U2)", pr.x + 20, pr.y + 10);
                
                if (verificationResult === 'fail') {
                     ctx.fillStyle = '#ff4d4d';
                     ctx.fillText("❌ R.x ≠ Target X", pr.x + 20, pr.y + 25);
                } else {
                     ctx.fillStyle = '#10b981';
                     ctx.fillText("✅ R.x = Target X", pr.x + 20, pr.y + 25);
                }
            }
        }
    }

    if (isMoving || showResults) {
        if (!isMoving && showResults) {
            if (!isVerifying && verificationResult === null && !currentPubKey) {
                let p = worldToScreen(ball.x, ball.y);
                ctx.fillStyle = colors.ball; ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI*2); ctx.fill();
                ctx.fillText("Public Key (K)", p.x + 12, p.y + 20);
            }
        } else {
            if (ball.x > -9000 && verificationResult === null) {
                let p = worldToScreen(ball.x, ball.y);
                ctx.fillStyle = colors.ballBlue; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
            }
            if (ball2.x > -9000 && verificationResult === null) {
                let p = worldToScreen(ball2.x, ball2.y);
                ctx.fillStyle = colors.ballOrange; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
            }
        }
    }
}

function startSequentialVerificationAnimation(u1, u2, targetR, isForged, mathData) {
    let step1 = 0, step2 = 0, phase = 1;

    ball = trajectory.length > 0 ? { ...trajectory[0] } : { x: -9999, y: -9999 };
    ball2 = { x: -9999, y: -9999 };
    ballU1 = { x: -9999, y: -9999 };
    ballU2 = { x: -9999, y: -9999 };

    function frame() {
        if (!isMoving) return;

        if (phase === 1) {
            if (trajectory.length === 0) {
                phase = 2;
            } else if (step1 < trajectory.length - 1) {
                step1 = Math.min(step1 + Math.ceil(trajectory.length / 45), trajectory.length - 1);
                ball.x = trajectory[step1].x;
                ball.y = trajectory[step1].y;
            } else {
                ballU1 = { ...trajectory[trajectory.length - 1] };
                phase = 2;
                if (trajectory2.length > 0) ball2 = { ...trajectory2[0] };
            }
        } else if (phase === 2) {
            if (trajectory2.length === 0) {
                isMoving = false;
                startCombineAnimationVisuals(targetR, isForged, mathData);
                return;
            } else if (step2 < trajectory2.length - 1) {
                step2 = Math.min(step2 + Math.ceil(trajectory2.length / 45), trajectory2.length - 1);
                ball2.x = trajectory2[step2].x;
                ball2.y = trajectory2[step2].y;
            } else {
                ballU2 = { ...trajectory2[trajectory2.length - 1] };
                isMoving = false;
                startCombineAnimationVisuals(targetR, isForged, mathData);
                return;
            }
        }
        updateUI(); 
        requestAnimationFrame(frame);
    }
    frame();
}

async function startCombineAnimationVisuals(targetR, isForged, mathData) {
    isMoving = true;
    await sleep(800); 

    let p1 = (ballU1 && ballU1.x > -9000) ? { x: ballU1.x + P/2, y: ballU1.y + P/2 } : null;
    let p2 = (ballU2 && ballU2.x > -9000) ? { x: ballU2.x + P/2, y: ballU2.y + P/2 } : null;

    const res = eccAddModular(p1, p2, P);
    const isCorrect = res && (res.x % SCALAR_ORDER === targetR % SCALAR_ORDER);
    
    verificationResult = (isCorrect && !isForged) ? 'success' : 'fail';

    if (res) {
        calculatedRPoint = { x: res.x - P/2, y: res.y - P/2 };
    } else {
        calculatedRPoint = null; 
    }

    if (verificationResult === 'success' && calculatedRPoint) {
        expectedXPoint = { x: calculatedRPoint.x, y: calculatedRPoint.y };
    } else {
        let expectedPt = finitePoints.find(pt => pt.x === (targetR % P));
        expectedXPoint = expectedPt ? { x: expectedPt.x - P/2, y: expectedPt.y - P/2 } : null;
    }

    ball.x = -9999; 
    ball.y = -9999;
    mergeProgress = 0;
    
    function mergeFrame() {
        mergeProgress += 0.02; 
        if (mergeProgress <= 1) {
            updateUI();
            requestAnimationFrame(mergeFrame);
        } else {
            finishVerificationVisuals(isCorrect, isForged, targetR, res, mathData);
        }
    }
    mergeFrame();
}

function finishVerificationVisuals(isCorrect, isForged, targetR, res, mathData) {
    isMoving = false; showResults = true; updateUI();

    const lock = document.getElementById('verification-lock');
    const lockIcon = document.getElementById('lock-icon');
    const lockText = lock.querySelector('div:last-child');
    lock.classList.remove('hidden');

    setTimeout(() => {
        lock.style.opacity = '1'; lock.style.transform = 'translate(-50%, -50%) scale(1)';
        const log = document.getElementById('step-log');
        const entry = document.createElement('div');
        entry.className = "mt-2 border-t border-slate-500/30 pt-2 text-[9px] leading-relaxed";

        if (verificationResult === 'success') {
            ECCAudio.success(); // <-- เล่นเสียงสำเร็จ
            
            lockIcon.className = 'fas fa-lock-open text-4xl text-emerald-500 animate-bounce';
            lockText.className = 'bg-emerald-500 text-navy px-4 py-1 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg';
            lockText.innerText = `X = r (${res.x} = ${targetR}) VERIFIED`;

            entry.classList.add("text-emerald-400");
            entry.innerHTML = "<b>💡 ไขสมการสำเร็จ!</b> ดูหน้าจอเพื่อเห็นจุด U1, U2 วิ่งไปรวมกันที่จุด R และเข้ามาอยู่ในกรอบ Target X พอดี";
            log.appendChild(entry);
        } else {
            ECCAudio.error(); // <-- เล่นเสียง Error
            
            lockIcon.className = 'fas fa-times-circle text-4xl text-red-500 animate-pulse';
            lockText.className = 'bg-red-500 text-white px-4 py-1 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg';
            lockText.innerText = `X != r (${res ? res.x : 'INF'} != ${targetR}) FAILED`;

            entry.classList.add("text-red-400");
            entry.innerHTML = "<b>❌ ไขสมการล้มเหลว!</b> จุด U1, U2 วิ่งไปรวมกันที่จุด R แต่พิกัด X เด้งกระเด็นไปตกไกลจากแนวเป้าหมาย Target X!";
            log.appendChild(entry);
        }
        isVerifying = false;

        const btnSend = document.getElementById('btn-send');
        if (btnSend) {
            btnSend.innerHTML = "ตรวจสอบอีกครั้ง (VERIFY)";
        }

        setTimeout(() => {
            showExplanationModal(isCorrect, isForged, targetR, res ? res.x : 'INF', mathData);
        }, 1500); 

    }, 500);

    const status = document.getElementById('tx-status');
    status.innerText = (verificationResult === 'success') ? "Status: VERIFIED!" : "Status: INVALID! (SIGNATURE REJECTED)";
    status.className = `p-2 rounded text-[9px] font-bold text-center uppercase tracking-widest block border mt-2 ${(verificationResult === 'success') ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500' : 'bg-red-900/50 text-red-400 border-red-500'}`;
}