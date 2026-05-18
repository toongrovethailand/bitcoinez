// --- Transaction Simulation Logic ---
let internalSig = { r: 0, s: 0, z: 0, msg: '', pubX: 0, pubY: 0, d: 0, ke: 0 };

function setupEditableInputs() {
    const privInput = document.getElementById('input-privkey');
    const msgInput = document.getElementById('tx-message'); 
    const btnSend = document.getElementById('btn-send');
    
    if (btnSend) {
        btnSend.innerHTML = "2. กดส่ง (SEND)";
        btnSend.onclick = promptConfirmSend;
    }

    const invalidateSignature = () => {
        internalSig.r = 0;
        internalSig.s = 0;
        document.getElementById('display-sig-r').innerText = "?";
        document.getElementById('display-sig-s').innerText = "?";
        document.getElementById('tx-envelope').classList.add('hidden');
        document.getElementById('tx-status').classList.add('hidden');
    };
    
    if(privInput) {
        privInput.removeAttribute('readonly');
        privInput.classList.remove('cursor-default', 'filter', 'blur-[5px]', 'hover:blur-0');
        privInput.addEventListener('input', invalidateSignature);
    }

    if(msgInput) {
        msgInput.addEventListener('input', invalidateSignature);
    }
}

function autoUpdatePublicKey() {
    const pubXInput = document.getElementById('tx-pub-x');
    const pubYInput = document.getElementById('tx-pub-y');
    
    if (pubXInput.value !== '' && pubYInput.value !== '') {
        return; 
    }

    const dStr = document.getElementById('input-privkey').value;
    let d = parseInt(dStr, 10);
    if (isNaN(d) || d < 1) {
        pubXInput.value = '';
        pubYInput.value = '';
        return;
    }
    
    d = ((d - 1) % (SCALAR_ORDER - 1)) + 1;
    const K = eccMultiplyModular(d, G_FINITE, P);
    
    if (K) {
        pubXInput.value = K.x;
        pubYInput.value = K.y;
    }
}

function unlockTransactionPanel(steps) {
    const lock = document.getElementById('panel-lock');
    const privKeyInput = document.getElementById('input-privkey');
    const pubXInput = document.getElementById('tx-pub-x');
    const pubYInput = document.getElementById('tx-pub-y');
    const btnSend = document.getElementById('btn-send');
    
    if (steps > 0) {
        if (lock) {
            lock.style.opacity = '0';
            setTimeout(() => lock.classList.add('hidden'), 500);
        }
        privKeyInput.value = steps;

        internalSig.r = 0;
        internalSig.s = 0;
        const sigR = document.getElementById('display-sig-r');
        const sigS = document.getElementById('display-sig-s');
        if(sigR) sigR.innerText = "?";
        if(sigS) sigS.innerText = "?";
        const envelope = document.getElementById('tx-envelope');
        if(envelope) envelope.classList.add('hidden');
        const txStatus = document.getElementById('tx-status');
        if(txStatus) txStatus.classList.add('hidden');
        
        autoUpdatePublicKey(); 
        
        if(btnSend) {
            btnSend.disabled = false;
            btnSend.classList.remove('opacity-50', 'cursor-not-allowed');
            btnSend.innerHTML = "2. กดส่ง (SEND)";
        }
    } else {
        if (lock) {
            lock.classList.remove('hidden');
            setTimeout(() => { if(lock) lock.style.opacity = '1'; }, 10);
        }
        if (privKeyInput) privKeyInput.value = '';
        if (pubXInput) pubXInput.value = '';
        if (pubYInput) pubYInput.value = '';
        
        if(btnSend) {
            btnSend.disabled = true;
            btnSend.classList.add('opacity-50', 'cursor-not-allowed');
            btnSend.innerHTML = "2. กดส่ง (SEND)";
        }
    }
}

function signTransaction() {
    const message = document.getElementById('tx-message').value;
    const dRaw = parseInt(document.getElementById('input-privkey').value, 10);
    const pubX = parseInt(document.getElementById('tx-pub-x').value, 10);
    const pubY = parseInt(document.getElementById('tx-pub-y').value, 10);
    const n = SCALAR_ORDER;
    
    if (isNaN(dRaw) || isNaN(pubX)) { alert("กรุณาใส่ Private Key ให้ถูกต้องครับ"); return; }
    const d = ((dRaw - 1) % (n - 1)) + 1;

    let z = 0;
    for(let i=0; i<message.length; i++) z = (z + message.charCodeAt(i)) % n;
    if (z === 0) z = 1;

    let k_e, s, r;
    let attempts = 0;
    while (attempts < 500) {
        k_e = Math.floor(Math.random() * (n - 2)) + 1;
        const R = eccMultiplyModular(k_e, G_FINITE, P);
        if (!R) { attempts++; continue; }
        r = R.x % n;
        if (r === 0) { attempts++; continue; }
        
        const kInv = modInverse(k_e, n);
        if (kInv === null) { attempts++; continue; }
        
        s = (kInv * (z + r * d)) % n;
        if (s === 0 || modInverse(s, n) === null) { attempts++; continue; }
        break;
    }

    if (attempts >= 500) { alert("Signature failed. Try another shot!"); return; }

    internalSig = { r, s, z, msg: message, pubX, pubY, d, ke: k_e };
    
    document.getElementById('display-sig-r').innerText = r;
    document.getElementById('display-sig-s').innerText = s;
    document.getElementById('tx-envelope').classList.remove('hidden');
    
    const status = document.getElementById('tx-status');
    status.innerText = "ลงชื่อเรียบร้อย (SIGNED) พร้อมส่ง!";
    status.className = "p-2 rounded text-[9px] font-bold text-center uppercase tracking-widest bg-emerald-900/50 text-emerald-400 block border-emerald-500/50 mt-2";
    status.classList.remove('hidden');

    const btnSend = document.getElementById('btn-send');
    if(btnSend) {
        btnSend.disabled = false;
        btnSend.classList.remove('opacity-50', 'cursor-not-allowed');
        btnSend.innerHTML = "2. กดส่ง (SEND)";
    }
}

function promptConfirmSend() {
    if (isVerifying || isMoving) return;

    const r = internalSig.r;
    const s = internalSig.s;

    if (r === 0 || s === 0) {
        showExplanationModal(false, true, 0, 'N/A', { errorType: 'NO_SIGNATURE' });
        return;
    }

    const existing = document.getElementById('confirm-send-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'confirm-send-modal';
    modal.className = "fixed inset-0 bg-navy/95 backdrop-blur-md flex items-center justify-center z-[1000] p-4 text-left transition-opacity duration-300 opacity-0";

    modal.innerHTML = `
        <div class="max-w-md w-full bg-slate-900 border-2 border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)] transform scale-95 transition-all duration-300" id="confirm-modal-content">
            <div class="text-center"><i class='fas fa-network-wired text-slate-400 text-5xl mb-4'></i></div>
            <h2 class="text-lg font-bold text-white mb-2 text-center tracking-widest uppercase">ส่งข้อมูลเข้าเครือข่าย</h2>
            <p class="text-slate-400 text-[10px] mb-4 text-center leading-relaxed">คุณสามารถทดลองเป็นแฮ็กเกอร์ แอบแก้ข้อมูล <br>ก่อนที่แพ็กเกจนี้จะเดินทางไปถึงโหนดตรวจสอบได้!</p>

            <div class="bg-slate-800 p-4 rounded-lg font-mono text-[11px] space-y-3 border border-red-500/50 mb-6 shadow-inner relative">
                <div class="absolute top-2 right-2 text-red-500 font-bold animate-pulse text-[10px]"><i class="fas fa-user-secret"></i> Intercept Mode</div>
                <p class="text-red-400 font-bold mb-2">// 📦 Payload ที่กำลังเดินทาง (แก้ไขได้)</p>

                <div>
                    <label class="text-slate-400 block mb-1">1. Message:</label>
                    <input type="text" id="intercept-msg" value="${internalSig.msg}" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-yellow-300 focus:border-red-500 focus:outline-none transition-colors">
                </div>

                <div class="flex gap-4 items-center bg-slate-900/50 p-2 rounded border border-slate-700">
                    <p class="text-white flex-1"><span class="text-slate-400 block text-[9px]">2. Signature (r):</span> <span class="text-emerald-300">${r}</span></p>
                    <p class="text-white flex-1"><span class="text-slate-400 block text-[9px]">3. Signature (s):</span> <span class="text-emerald-300">${s}</span></p>
                    <i class="fas fa-lock text-slate-500" title="ลายเซ็นถูกล็อคแก้ไขไม่ได้"></i>
                </div>

                <div class="flex gap-2">
                    <div class="flex-1">
                        <label class="text-slate-400 block mb-1">4. Public Key X:</label>
                        <input type="number" id="intercept-pubx" value="${internalSig.pubX}" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-blue-300 focus:border-red-500 focus:outline-none transition-colors">
                    </div>
                    <div class="flex-1">
                        <label class="text-slate-400 block mb-1">5. Public Key Y:</label>
                        <input type="number" id="intercept-puby" value="${internalSig.pubY}" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-blue-300 focus:border-red-500 focus:outline-none transition-colors">
                    </div>
                </div>
            </div>

            <div class="flex gap-3">
                <button onclick="closeConfirmModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 rounded-xl transition-all uppercase text-[10px] tracking-widest">
                    ยกเลิก
                </button>
                <button onclick="executeVerification()" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all uppercase text-[10px] tracking-widest shadow-lg hover:scale-[1.02]">
                    ยืนยันการส่ง
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('confirm-modal-content').classList.remove('scale-95');
        document.getElementById('confirm-modal-content').classList.add('scale-100');
    });
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-send-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        document.getElementById('confirm-modal-content').classList.remove('scale-100');
        document.getElementById('confirm-modal-content').classList.add('scale-95');
        setTimeout(() => modal.remove(), 300);
    }
}

function executeVerification() {
    const interceptedMsg = document.getElementById('intercept-msg').value;
    const interceptedPubX = parseInt(document.getElementById('intercept-pubx').value, 10) || 0;
    const interceptedPubY = parseInt(document.getElementById('intercept-puby').value, 10) || 0;

    closeConfirmModal();
    verifyTransaction(interceptedMsg, interceptedPubX, interceptedPubY);
}

async function verifyTransaction(interceptedMsg, interceptedPubX, interceptedPubY) {
    if (isVerifying) return;
    isVerifying = true;

    verificationResult = null;
    mergeProgress = 0;
    calculatedRPoint = null;
    expectedXPoint = null;
    currentPubKey = null; 

    const r = internalSig.r;
    const s = internalSig.s;
    const n = SCALAR_ORDER;

    const currentMsg = interceptedMsg;
    const currentPubX = interceptedPubX;
    const currentPubY = interceptedPubY;

    let z = 0;
    for(let i=0; i<currentMsg.length; i++) z = (z + currentMsg.charCodeAt(i)) % n;
    if (z === 0) z = 1;
    currentPubKey = { x: currentPubX, y: currentPubY };
    const panel = document.getElementById('verification-panel');
    const log = document.getElementById('step-log');
    panel.classList.remove('hidden');
    log.innerHTML = '';

    const addLog = (text, isError = false) => {
        const entry = document.createElement('div');
        entry.innerText = text;
        if(isError) entry.className = "text-red-400 font-bold bg-red-900/30 p-1 border-l-2 border-red-500 mt-1";
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
        
        ECCAudio.type(); // <-- เล่นเสียงตอนเพิ่ม Log
    };

    addLog("--- NODE VERIFYING ---");
    addLog("📥 RECEIVED: Message, Signature(r,s), PublicKey");

    let isForged = false;
    let errorType = null;

    if (currentMsg !== internalSig.msg) {
        addLog(`🚨 ตรวจพบ Message ถูกแก้ไขระหว่างทาง! Hash(z) เปลี่ยนไป`, true);
        isForged = true;
        errorType = 'MODIFIED_MSG';
    } else if (currentPubX !== internalSig.pubX || currentPubY !== internalSig.pubY) {
        addLog(`🚨 ตรวจพบ Public Key ถูกแก้ไขระหว่างทาง!`, true);
        isForged = true;
        errorType = 'MODIFIED_PUBKEY';
    }

    addLog(`Hash (z): ${z}`);

    const sInv = modInverse(s, n);
    if (sInv === null) {
        addLog(`[ERROR] sInv is null! Equation generated invalid signature.`, true);
        isVerifying = false;
        return;
    }

    const u1 = (z * sInv) % n;
    const u2 = (r * sInv) % n;
    addLog(`u1 = z*s^-1 = ${u1}`);
    addLog(`u2 = r*s^-1 = ${u2}`);

    const keInv = internalSig.ke ? modInverse(internalSig.ke, n) : 0;
    const mathData = {
        z: z, r: r, s: s, sInv: sInv, u1: u1, u2: u2,
        d: internalSig.d, ke: internalSig.ke, keInv: keInv,
        pubX: currentPubX, pubY: currentPubY, n: n,
        currentMsg: currentMsg, errorType: errorType,
        originalZ: internalSig.z
    };

    resetTruthUI(); 
    document.getElementById('u1-val').innerText = u1;
    document.getElementById('u2-val').innerText = u2;

    isMoving = true;
    const K = { x: currentPubX, y: currentPubY };

    let cur1 = { ...G_FINITE };
    let cur2 = { ...K };

    trajectory = u1 > 0 ? [{ x: cur1.x - P/2, y: cur1.y - P/2 }] : [];
    trajectory2 = u2 > 0 ? [{ x: cur2.x - P/2, y: cur2.y - P/2 }] : [];

    for (let i = 1; i < u1; i++) {
        cur1 = eccAddModular(cur1, G_FINITE, P);
        if (cur1) trajectory.push({ x: cur1.x - P/2, y: cur1.y - P/2 });
    }
    for (let i = 1; i < u2; i++) {
        cur2 = eccAddModular(cur2, K, P);
        if (cur2) trajectory2.push({ x: cur2.x - P/2, y: cur2.y - P/2 });
    }

    startSequentialVerificationAnimation(u1, u2, r, isForged, mathData);
}

// -------------------------------------------------------------
// POPUP Modal: อธิบายคณิตศาสตร์
// -------------------------------------------------------------
function showExplanationModal(isCorrect, isForged, targetR, resX, math) {
    const existing = document.getElementById('verify-explain-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'verify-explain-modal';
    modal.className = "fixed inset-0 bg-navy/95 backdrop-blur-md flex items-center justify-center z-[1000] p-4 text-left transition-opacity duration-500 opacity-0";

    let title, borderColor, icon, page1Content, page2Content;

    if (math && math.errorType === 'NO_SIGNATURE') {
        borderColor = "border-red-500";
        icon = "<i class='fas fa-ban text-red-500 text-5xl mb-4 animate-bounce'></i>";
        title = "TRANSACTION REJECTED";
        page1Content = `
            <div class="space-y-4 text-[12px] text-slate-300 leading-relaxed text-center py-6">
                <p class="text-red-400 text-xl font-bold">"คุณยังไม่ได้กดปุ่ม SIGN!"</p>
                <p class="text-slate-300">ระบบบล็อกเชนจะปฏิเสธธุรกรรมที่ไม่มีลายเซ็น (ค่า r, s เป็น 0) ทันที เนื่องจากไม่มีการแนบหลักฐานทางคณิตศาสตร์ว่าคุณคือเจ้าของบัญชีตัวจริง</p>
            </div>
        `;
        page2Content = page1Content;
    } 
    else if (isCorrect && !isForged) {
        borderColor = "border-emerald-500";
        icon = "<i class='fas fa-check-circle text-emerald-500 text-5xl mb-2'></i>";
        title = "VERIFICATION SUCCESS";

        page1Content = `
            <div class="space-y-3 text-[11px] text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto custom-scrollbar pr-3">
                <p class="text-center font-bold text-emerald-400 mb-2">หน้า 1/2: การสร้างลายเซ็น (ฝั่งคนส่ง)</p>
                <p>ในการส่งธุรกรรม ผู้ส่งจะต้องนำ <b>ข้อความ</b> และ <b>กุญแจส่วนตัว (Private Key)</b> มาผสมกันทางคณิตศาสตร์เพื่อสร้างลายเซ็น (r, s)</p>

                <div class="bg-slate-800 p-4 rounded-lg font-mono space-y-3 border border-slate-700 shadow-inner">
                    <div>
                        <p class="text-blue-400 font-bold">// 1. แปลงข้อความเป็นตัวเลข (Hash)</p>
                        <p class="text-white">Message: "${math.currentMsg}"</p>
                        <p class="pl-4">👉 <span class="text-purple-400 font-bold">z (ค่าของข้อความ)</span> = <span class="text-purple-400">${math.z}</span></p>
                    </div>

                    <hr class="border-slate-600">

                    <div>
                        <p class="text-blue-400 font-bold">// 2. สุ่มกระโดดบนกราฟ</p>
                        <p class="text-slate-400">ระบบจะสุ่มตัวเลขความเร็ว <span class="text-orange-400">k_e (${math.ke})</span> กระโดดไปหาจุด R บนกราฟ และนำพิกัด X มาเป็นค่า <span class="text-orange-400">r</span></p>
                        <p class="pl-4 mt-1">👉 <span class="text-orange-400 font-bold">r (ครึ่งแรกของลายเซ็น)</span> = <span class="text-orange-400">${math.r}</span></p>
                    </div>

                    <hr class="border-slate-600">

                    <div>
                        <p class="text-blue-400 font-bold">// 3. ผสมทุกอย่างด้วย Private Key</p>
                        <p class="text-slate-400">สร้างครึ่งหลังของลายเซ็น (s) โดยใช้ Private Key (<span class="text-pink-400">d=${math.d}</span>) เพื่อล็อกข้อมูลทั้งหมด</p>
                        <p class="text-white mt-1">s = k_e⁻¹(<span class="text-purple-400">z</span> + <span class="text-orange-400">r</span>·<span class="text-pink-400">d</span>) mod n</p>
                        <p class="pl-4 text-slate-400">แทนค่า: s = ${math.keInv} × (<span class="text-purple-400">${math.z}</span> + <span class="text-orange-400">${math.r}</span> × <span class="text-pink-400">${math.d}</span>) mod ${math.n}</p>
                        <p class="pl-4 mt-1">👉 <span class="text-emerald-400 font-bold">s (ครึ่งหลังของลายเซ็น)</span> = <span class="text-emerald-400">${math.s}</span></p>
                    </div>
                </div>
                <p class="text-center text-slate-400 italic">** ข้อมูลที่ส่งให้โหนดมีแค่ Message, ค่า r, ค่า s และ Public Key เท่านั้น</p>
            </div>
        `;

        page2Content = `
            <div class="space-y-3 text-[11px] text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto custom-scrollbar pr-3">
                <p class="text-center font-bold text-emerald-400 mb-2">หน้า 2/2: การตรวจสอบ (ฝั่ง Node)</p>
                <p>โหนดไม่มีทางรู้ Private Key แต่มันสามารถไขความจริงได้โดยใช้ <b>Public Key (K)</b> เข้ามาหักล้างในสมการ</p>

                <div class="bg-slate-800 p-4 rounded-lg font-mono space-y-3 border border-slate-700 shadow-inner">

                    <div>
                        <p class="text-blue-400 font-bold">// 4. ถอดรหัสหาระยะทาง (U₁ และ U₂)</p>
                        <p class="text-slate-400">นำ <span class="text-emerald-400">s⁻¹ (${math.sInv})</span> ไปคูณกับข้อความและลายเซ็น เพื่อหาน้ำหนักในการกระโดดบนกราฟ</p>
                        <p class="pl-4 text-white">U₁ = (<span class="text-purple-400">z</span>·<span class="text-emerald-400">s⁻¹</span>) mod n = <span class="text-cyan-400">${math.u1}</span></p>
                        <p class="pl-4 text-white">U₂ = (<span class="text-orange-400">r</span>·<span class="text-emerald-400">s⁻¹</span>) mod n = <span class="text-yellow-400">${math.u2}</span></p>
                    </div>

                    <hr class="border-slate-600">

                    <div>
                        <p class="text-blue-400 font-bold">// 5. ไขสมการมหัศจรรย์</p>
                        <p class="text-slate-400">กระโดดจากจุด G เป็นระยะ U₁ และกระโดดจาก Public Key (K) เป็นระยะ U₂</p>
                        <p class="text-white mt-1 text-center bg-slate-900 p-2 rounded">R = <span class="text-cyan-400">U₁</span>G + <span class="text-yellow-400">U₂</span>K</p>
                        <p class="text-slate-400 mt-2">ทำไมมันถึงได้จุดเดิมกลับมา? เพราะ K = dG:</p>
                        <p class="pl-4 text-slate-400">R = (<span class="text-purple-400">z</span>·<span class="text-emerald-400">s⁻¹</span>)G + (<span class="text-orange-400">r</span>·<span class="text-emerald-400">s⁻¹</span>)(<span class="text-pink-400">d</span>G)</p>
                        <p class="pl-4 text-slate-400">R = <span class="text-emerald-400">s⁻¹</span>(<span class="text-purple-400">z</span> + <span class="text-orange-400">r</span>·<span class="text-pink-400">d</span>)G</p>
                        <p class="text-slate-400 mt-1">สมการในวงเล็บจะตัดกันลงตัวอย่างสมบูรณ์ กลายเป็น:</p>
                        <p class="text-emerald-400 font-bold text-center mt-2 bg-emerald-900/30 p-2 rounded">R = k_e·G = จุดเดิม!</p>
                    </div>
                </div>

                <p class="text-emerald-300 mt-2 bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/30">
                    จุด R ที่เด้งไปตกคือ <b>X: ${resX}</b> ซึ่ง <u class="font-bold">ตรงกับ</u> แกน Target X <span class="text-orange-400">r (${targetR})</span> ที่แนบมาพอดีเป๊ะ!<br>
                    ยืนยันได้ 100% ว่า <b>คนเซ็นมี Private Key ตัวจริงแน่นอน!</b>
                </p>
            </div>
        `;
    } else {
        borderColor = "border-red-500";
        icon = "<i class='fas fa-shield-alt text-red-500 text-5xl mb-2'></i>";
        title = "INVALID SIGNATURE (REJECTED)";

        let errorHighlight;
        if (math.errorType === 'MODIFIED_MSG') {
            errorHighlight = `ข้อความถูกเปลี่ยน! Hash (<span class="text-purple-400">z</span>) จึงเปลี่ยนไปเป็น <span class="text-purple-400 font-bold">${math.z}</span>`;
        } else if (math.errorType === 'MODIFIED_PUBKEY') {
            errorHighlight = `Public Key <span class="text-yellow-400">(K)</span> ถูกแอบแก้ไขกลางทาง ไม่ตรงกับกุญแจคู่ของมัน`;
        } else {
            errorHighlight = `ตรวจสอบพบ <b>Private Key ปลอม!</b> ลายเซ็นนี้ไม่ได้ถูกสร้างจากเจ้าของ Public Key ตัวจริงที่ล็อกไว้ในระบบ`;
        }

        page1Content = `
            <div class="space-y-3 text-[11px] text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto custom-scrollbar pr-3">
                <p class="text-center font-bold text-red-400 mb-2">หน้า 1/2: ความผิดปกติที่ Node ตรวจพบ</p>
                <p>Node ได้รับข้อมูลและพยายามตรวจสอบ แต่พบว่า <b>ข้อมูลไม่สอดคล้องกัน</b> (อาจเกิดจาก Private Key ปลอม หรือโดนแฮ็กกลางทาง)</p>

                <div class="bg-slate-800 p-4 rounded-lg font-mono space-y-3 border border-slate-700 shadow-inner">
                    <div>
                        <p class="text-blue-400 font-bold">// 1. ข้อมูลที่ได้รับ (Inputs)</p>
                        <p class="text-white break-all">Message ที่โหนดเห็น: "${math.currentMsg}"</p>
                        <p class="pl-4">👉 <span class="text-purple-400">z (ค่า Hash)</span> = <span class="text-purple-400">${math.z}</span></p>
                        <p class="pl-4 mt-2">ลายเซ็นที่แนบมา:</p>
                        <p class="pl-8">👉 <span class="text-orange-400">r</span> = ${math.r}</p>
                        <p class="pl-8">👉 <span class="text-emerald-400">s</span> = ${math.s}</p>
                    </div>

                    <hr class="border-slate-600">

                    <div>
                        <p class="text-blue-400 font-bold">// 2. สิ่งที่ผิดพลาดในระดับพื้นฐาน</p>
                        <p class="text-red-300">${errorHighlight}</p>
                        <p class="text-slate-400 mt-2">ลายเซ็น <span class="text-emerald-400">s</span> ถูกล็อคมาอย่างแน่นหนาด้วยข้อมูลชุดเดิม เมื่อข้อมูลถูกเปลี่ยน สมการตรวจสอบทั้งหมดจะพังทลายลงทันที</p>
                    </div>
                </div>
            </div>
        `;

        page2Content = `
            <div class="space-y-3 text-[11px] text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto custom-scrollbar pr-3">
                <p class="text-center font-bold text-red-400 mb-2">หน้า 2/2: ทำไมสมการถึงพังทลาย?</p>
                <p>มาดูความวิบัติของสมการ เมื่อนำข้อมูลที่ผิดเพี้ยนมาคำนวณหาระยะการกระโดด:</p>

                <div class="bg-slate-800 p-4 rounded-lg font-mono space-y-3 border border-slate-700 shadow-inner">

                    <div>
                        <p class="text-blue-400 font-bold">// 3. น้ำหนักการกระโดดผิดเพี้ยน</p>
                        <p class="pl-4 text-white">U₁ = (<span class="text-purple-400">z</span>·<span class="text-emerald-400">s⁻¹</span>) mod n = <span class="text-cyan-400">${math.u1}</span></p>
                        <p class="pl-4 text-white">U₂ = (<span class="text-orange-400">r</span>·<span class="text-emerald-400">s⁻¹</span>) mod n = <span class="text-yellow-400">${math.u2}</span></p>
                        <p class="text-slate-400 text-[10px] mt-1">* ค่า U₁ หรือ U₂ นี้เพี้ยนไปจากเดิม ทำให้ลูกบอลเตรียมกระโดดไปผิดทาง</p>
                    </div>

                    <hr class="border-slate-600">

                    <div>
                        <p class="text-blue-400 font-bold">// 4. จุด R เด้งไปตกมั่วพิกัด</p>
                        <p class="text-white mt-1 text-center bg-slate-900 p-2 rounded">R = <span class="text-cyan-400">U₁</span>G + <span class="text-yellow-400">U₂</span>K</p>
                        <p class="text-slate-400 mt-2">เนื่องจากข้อมูลไม่สัมพันธ์กัน จุด U1 และ U2 จะวิ่งไปบรรจบกันที่จุด R แห่งใหม่ที่ <b>พิกัด X เด้งกระเด็นไปไกลจากเป้าหมาย (Target X) ที่ระบุไว้ในลายเซ็นอย่างสิ้นเชิง!</b></p>
                    </div>
                </div>

                <p class="text-red-300 mt-2 bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                    เมื่อพิกัด <b>R.x ไม่เท่ากับ Target X (r)</b> ยืนยันได้ 100% ว่า <b>ธุรกรรมนี้เป็นโมฆะ (Invalid)</b> ป้องกันการแฮ็กได้สำเร็จ!
                </p>
            </div>
        `;
    }

    modal.innerHTML = `
        <div class="max-w-md w-full bg-slate-900 border-2 ${borderColor} rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] transform scale-95 transition-all duration-500 flex flex-col" id="verify-modal-content">
            <div class="text-center">${icon}</div>
            <h2 class="text-lg font-bold text-white mb-2 text-center tracking-widest uppercase">${title}</h2>

            <div id="verify-page-1" class="flex-grow">
                ${page1Content}
            </div>
            <div id="verify-page-2" class="hidden flex-grow">
                ${page2Content}
            </div>

            <div id="verify-btn-group-1" class="${(math && math.errorType === 'NO_SIGNATURE') ? 'hidden' : 'mt-4'}">
                <button onclick="window.nextVerifyPage()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all uppercase text-xs tracking-widest shadow-lg">
                    ถัดไป (ดูสมการของ Node) ➡️
                </button>
            </div>

            <div id="verify-btn-group-2" class="${(math && math.errorType === 'NO_SIGNATURE') ? 'mt-4' : 'hidden mt-4 flex gap-2'}">
                ${!(math && math.errorType === 'NO_SIGNATURE') ? `
                <button onclick="window.prevVerifyPage()" class="w-1/3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 rounded-xl transition-all uppercase text-xs tracking-widest">
                    ⬅️ กลับ
                </button>
                ` : ''}
                <button onclick="window.closeExplanationModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 rounded-xl transition-all uppercase text-xs tracking-widest shadow-lg">
                    เข้าใจแล้ว
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('verify-modal-content').classList.remove('scale-95');
        document.getElementById('verify-modal-content').classList.add('scale-100');
    });
}

window.nextVerifyPage = function() {
    document.getElementById('verify-page-1').classList.add('hidden');
    document.getElementById('verify-page-2').classList.remove('hidden');

    document.getElementById('verify-btn-group-1').classList.add('hidden');
    document.getElementById('verify-btn-group-2').classList.remove('hidden');
    document.getElementById('verify-btn-group-2').classList.add('flex');
};

window.prevVerifyPage = function() {
    document.getElementById('verify-page-2').classList.add('hidden');
    document.getElementById('verify-page-1').classList.remove('hidden');

    document.getElementById('verify-btn-group-2').classList.add('hidden');
    document.getElementById('verify-btn-group-2').classList.remove('flex');
    document.getElementById('verify-btn-group-1').classList.remove('hidden');
};

window.closeExplanationModal = function() {
    const modal = document.getElementById('verify-explain-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        document.getElementById('verify-modal-content').classList.remove('scale-100');
        document.getElementById('verify-modal-content').classList.add('scale-95');
        setTimeout(() => modal.remove(), 500);
    }
};