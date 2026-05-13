// ==========================================
// BIP-39 Simulator Logic
// ==========================================

let entropy = ""; 
let targetBits = 128; 
let isFlipping = false; 
let wordList = [];
let wordChunks = []; 
let currentWordIdx = 0;

// Fetch BIP-39 Dictionary
fetch('https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt')
    .then(r => r.text()).then(data => {
        wordList = data.split('\n').filter(w => w.trim().length > 0);
        initApp(128); 
    });

function initApp(bits) {
    targetBits = bits; 
    
    const btn12 = document.getElementById('btn12');
    const btn24 = document.getElementById('btn24');
    
    // Updated Theme Classes
    const activeClass = "px-6 py-3 rounded-xl border transition-all font-bold tracking-wide bg-gold/10 border-gold text-gold shadow-[0_0_15px_rgba(230,194,122,0.3)]";
    const inactiveClass = "px-6 py-3 rounded-xl border transition-all font-bold tracking-wide border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300 bg-[#050A14]";
    
    if(bits === 128) {
        btn12.className = activeClass;
        btn24.className = inactiveClass;
    } else {
        btn12.className = inactiveClass;
        btn24.className = activeClass;
    }

    document.getElementById('step4-input-checksum').setAttribute('maxlength', bits === 128 ? "4" : "8");
    document.getElementById('modal-bit-len').innerText = (bits === 128) ? "132" : "264";
    document.getElementById('modal-word-len').innerText = (bits === 128) ? "12" : "24";

    resetAll();
    
    document.getElementById('target').innerText = bits;
    document.querySelectorAll('.target-bits-text').forEach(el => el.innerText = bits);
    document.querySelectorAll('.target-chk-text').forEach(el => el.innerText = (bits === 128) ? "4" : "8");
    document.getElementById('chk-len-display').innerText = (bits === 128) ? "4" : "8";
    updateUI();
}

function showGuide(text) {
    const guide = document.getElementById('next-step-guide');
    const guideText = document.getElementById('guide-text');
    guideText.innerText = text;
    guide.classList.remove('hidden');
}

function simulateRandomToss() {
    if (entropy.length >= targetBits || isFlipping) return;
    isFlipping = true;
    const result = Math.random() < 0.5 ? 0 : 1;
    animateCoin(result, 1, () => { 
        tossCoin(result); isFlipping = false; 
        if(entropy.length === targetBits) showGuide("รวบรวมครบแล้ว! โปรดเลื่อนลงไปขั้นตอนที่ 1");
    });
}

function simulateMultipleToss() {
    if (entropy.length >= targetBits || isFlipping) return;
    isFlipping = true;
    let count = Math.min(11, targetBits - entropy.length);
    let bits = ""; for(let i=0; i<count; i++) bits += Math.random() < 0.5 ? "0" : "1";
    animateCoin(bits.slice(-1) === "0" ? 0 : 1, 2, () => {
        entropy += bits; updateUI(); isFlipping = false;
        if(entropy.length === targetBits) {
            checkCompletion();
            showGuide("Entropy เต็มแล้ว! เริ่มขั้นตอนที่ 1 ได้เลย");
        }
    });
}

function animateCoin(val, spins, cb) {
    const coin = document.getElementById('coin');
    const rot = (spins * 360) + (val === 1 ? 180 : 0);
    coin.style.transform = `rotateY(${rot}deg)`;
    setTimeout(cb, 800);
}

function tossCoin(v) { 
    entropy += v; updateUI(); 
    if(entropy.length === targetBits) checkCompletion();
}

function updateUI() {
    document.getElementById('count').innerText = entropy.length;
    document.getElementById('progress-bar').style.width = (entropy.length / targetBits * 100) + "%";
    
    const container = document.getElementById('realtime-chunks');
    container.innerHTML = "";
    
    for(let i=0; i<Math.ceil(entropy.length/11); i++){
        let chunk = entropy.substr(i*11, 11);
        let span = document.createElement('span');
        // Updated Classes for chunks
        span.className = `flex items-center justify-center px-3 h-8 rounded-lg text-xs font-mono tracking-widest border transition-all ${chunk.length===11 ? 'bg-gold/20 border-gold/50 text-gold shadow-sm' : 'bg-[#050A14] border-slate-700 text-slate-500'}`;
        span.innerText = chunk; 
        container.appendChild(span);
    }
}

function checkCompletion() {
    document.getElementById('btn-random').classList.add('hidden');
    document.getElementById('btn-random-batch').classList.add('hidden');
    document.getElementById('raw-entropy-box').classList.remove('hidden');
    document.getElementById('raw-entropy-output').value = entropy;
    document.getElementById('manual-steps-area').classList.remove('hidden');
}

function findEntropySource() {
    const el = document.getElementById('raw-entropy-box');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash-ring');
    
    const tooltip = document.getElementById('entropy-copy-tooltip');
    tooltip.classList.remove('opacity-0', 'translate-y-2');
    tooltip.classList.add('opacity-100', 'translate-y-0');
    
    setTimeout(() => { 
        el.classList.remove('flash-ring'); 
        tooltip.classList.add('opacity-0', 'translate-y-2');
        tooltip.classList.remove('opacity-100', 'translate-y-0');
    }, 4000);
}

function copyToClipboard(id) {
    const el = document.getElementById(id); el.select();
    const val = el.value;
    navigator.clipboard.writeText(val);
    const btn = el.nextElementSibling;
    const original = btn.innerText;
    
    btn.innerText = `คัดลอก ${val.length} ${isNaN(val) ? 'Char' : 'Bits'}!`;
    btn.classList.remove('hover:bg-slate-700', 'hover:text-gold', 'border-slate-600');
    btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-500');
    
    if (id === 'raw-entropy-output') {
        const tooltip = document.getElementById('entropy-copy-tooltip');
        if (tooltip) {
            tooltip.classList.add('opacity-0', 'translate-y-2');
            tooltip.classList.remove('opacity-100', 'translate-y-0');
        }

        const step4Box = document.getElementById('step4-box');
        if (!step4Box.classList.contains('locked')) {
            setTimeout(() => {
                const step4InputEnt = document.getElementById('step4-input-entropy');
                step4InputEnt.scrollIntoView({ behavior: 'smooth', block: 'center' });
                step4InputEnt.classList.add('shadow-[0_0_20px_rgba(230,194,122,0.8)]', 'border-gold');
                setTimeout(() => step4InputEnt.classList.remove('shadow-[0_0_20px_rgba(230,194,122,0.8)]', 'border-gold'), 2000);
            }, 400); 
        }
    } 
    else if (id === 'step3-output-checksum') {
        const step4Box = document.getElementById('step4-box');
        if (!step4Box.classList.contains('locked')) {
            setTimeout(() => {
                const step4InputChk = document.getElementById('step4-input-checksum');
                step4InputChk.scrollIntoView({ behavior: 'smooth', block: 'center' });
                step4InputChk.classList.add('shadow-[0_0_20px_rgba(225,29,72,0.8)]', 'border-rose-500');
                setTimeout(() => step4InputChk.classList.remove('shadow-[0_0_20px_rgba(225,29,72,0.8)]', 'border-rose-500'), 2000);
            }, 400); 
        }
    }

    setTimeout(() => { 
        btn.innerText = original; 
        btn.classList.add('hover:bg-slate-700', 'hover:text-gold', 'border-slate-600');
        btn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-500');
    }, 2000);
}

function doStep1() {
    let input = document.getElementById('step1-input').value.trim();
    input = input.replace(/\s+/g, ''); 
    if(input.length !== targetBits) return alert(`ต้องการ ${targetBits} bits`);
    
    let hex = ""; 
    let breakdownHTML = '<div class="w-full mb-3"><span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">การจับคู่ 4-Bit เป็น Hexadecimal</span></div>';
    
    let colors = ['text-gold', 'text-cyan-400'];
    let bgColors = ['bg-gold/10 border-gold/30', 'bg-cyan-900/20 border-cyan-500/30'];

    for(let i=0; i<input.length; i+=4) { 
        let chunk = input.substr(i, 4);
        let h = parseInt(chunk, 2).toString(16).toUpperCase();
        hex += h; 
        
        let colorIdx = (i/4) % 2;
        breakdownHTML += `
            <div class="flex flex-col items-center justify-center p-2 rounded-lg border ${bgColors[colorIdx]} min-w-[42px] shadow-inner">
                <span class="text-[10px] ${colors[colorIdx]} font-mono">${chunk}</span>
                <span class="text-sm font-black text-white font-mono uppercase mt-1 drop-shadow-md">${h}</span>
            </div>
        `;
    }
    
    document.getElementById('step1-output').value = hex;
    document.getElementById('step1-visual-breakdown').innerHTML = breakdownHTML;
    document.getElementById('step1-visual-breakdown').classList.remove('hidden');
    document.getElementById('step1-result-area').classList.remove('hidden');
    document.getElementById('step2-box').classList.remove('locked');
    showGuide("ยอดเยี่ยม! คัดลอก HEX ไปยังขั้นตอนที่ 2");
}

async function doStep2() {
    let input = document.getElementById('step2-input').value.trim();
    const buffer = new Uint8Array(input.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0').toUpperCase()).join('');
    document.getElementById('step2-output').value = hex;
    document.getElementById('step2-result-area').classList.remove('hidden');
    document.getElementById('step3-box').classList.remove('locked');
    showGuide("Hash สำเร็จ! นำไปสกัด Checksum ในข้อ 3");
}

function doStep3() {
    let input = document.getElementById('step3-input').value.trim();
    input = input.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]+$/.test(input)) return alert("กรุณาใส่ค่า Hex ให้ถูกต้อง");

    let bin = ""; 
    for(let i=0; i<input.length; i++) {
        bin += parseInt(input[i], 16).toString(2).padStart(4,'0');
    }

    const chkLen = targetBits / 32;
    const hexChkLen = targetBits / 128; 
    
    const checksum = bin.substr(0, chkLen);
    const rest = bin.substr(chkLen);
    
    const hexChecksum = input.substr(0, hexChkLen);
    const hexRest = input.substr(hexChkLen);
    
    document.getElementById('step3-input').classList.add('hidden');
    const displayDiv = document.getElementById('step3-input-display');
    displayDiv.innerHTML = `<span class="inline-block border border-rose-500 text-rose-400 font-extrabold px-1 rounded bg-rose-950/50 mx-px shadow-[0_0_5px_rgba(225,29,72,0.4)]">${hexChecksum}</span>${hexRest}`;
    displayDiv.classList.remove('hidden');

    displayDiv.onclick = function() {
        this.classList.add('hidden');
        const inputEl = document.getElementById('step3-input');
        inputEl.classList.remove('hidden');
        inputEl.focus();
    };
    
    document.getElementById('step3-full-bin').innerHTML = `<span class="inline-block border border-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded bg-rose-600 mr-1 shadow-[0_0_10px_rgba(225,29,72,0.5)]">${checksum}</span><span class="opacity-50">${rest}</span>`;
    
    document.getElementById('step3-output-checksum').value = checksum;
    document.getElementById('step3-result-area').classList.remove('hidden');
    document.getElementById('step4-box').classList.remove('locked');
    showGuide("ได้ Checksum แล้ว! ไปประกอบร่างในข้อ 4");
}

function startDecoding() {
    let ent = document.getElementById('step4-input-entropy').value.trim();
    let chk = document.getElementById('step4-input-checksum').value.trim();
    
    ent = ent.replace(/\s+/g, '');
    chk = chk.replace(/\s+/g, '');
    
    let errorBox = document.getElementById('step4-error-box');
    let errorText = document.getElementById('step4-error-text');
    let errors = [];
    const expectedChkLen = targetBits / 32;

    const actualEntropy = entropy; 
    const actualChecksum = document.getElementById('step3-output-checksum').value.trim();

    if (!ent) {
        errors.push(`<div><strong class="text-rose-400">Entropy ขาดหาย:</strong> คุณยังไม่ได้กรอกข้อมูลบิตดิบเลย</div>`);
    } else if (!/^[01]+$/.test(ent)) {
        errors.push(`<div><strong class="text-rose-400">รูปแบบ Entropy ไม่ถูกต้อง:</strong> ข้อมูลต้องมีเฉพาะตัวเลข 0 และ 1 เท่านั้น</div>`);
    } else if (ent.length !== targetBits) {
        errors.push(`<div><strong class="text-rose-400">ความยาว Entropy ผิดพลาด:</strong> คุณวางมา <span class="text-white font-bold bg-rose-900 px-1 rounded">${ent.length}</span> บิต (ระบบต้องการ <span class="text-white font-bold">${targetBits}</span> บิต)</div>`);
    } else if (ent !== actualEntropy) {
        errors.push(`<div><strong class="text-rose-400">Entropy ไม่ตรงกับต้นฉบับ:</strong> ข้อมูลที่คุณวาง ไม่ตรงกับผลลัพธ์จากการโยนเหรียญที่คุณทำไว้</div>`);
    }

    if (!chk) {
        errors.push(`<div><strong class="text-rose-400">Checksum ขาดหาย:</strong> คุณยังไม่ได้กรอกค่าตรวจสอบ</div>`);
    } else if (!/^[01]+$/.test(chk)) {
        errors.push(`<div><strong class="text-rose-400">รูปแบบ Checksum ไม่ถูกต้อง:</strong> ข้อมูลต้องมีเฉพาะเลข 0 และ 1 เท่านั้น</div>`);
    } else if (chk.length !== expectedChkLen) {
        errors.push(`<div><strong class="text-rose-400">ความยาว Checksum ผิดพลาด:</strong> คุณวางมา <span class="text-white font-bold bg-rose-900 px-1 rounded">${chk.length}</span> บิต (ระบบต้องการ <span class="text-white font-bold">${expectedChkLen}</span> บิต)</div>`);
    } else if (chk !== actualChecksum) {
        errors.push(`<div><strong class="text-rose-400">Checksum ไม่ถูกต้อง:</strong> ค่าตรวจสอบที่คุณวางมา ไม่ตรงกับค่าที่ระบบคำนวณได้ในข้อ 3</div>`);
    }

    if (errors.length > 0) {
        errorText.innerHTML = errors.join('<hr class="border-rose-900/50 my-3">');
        errorBox.classList.remove('hidden');
        errorBox.classList.add('animate-pulse');
        setTimeout(() => errorBox.classList.remove('animate-pulse'), 1000);
        return;
    }

    errorBox.classList.add('hidden');
    
    wordChunks = (ent + chk).match(/.{1,11}/g);
    currentWordIdx = 0;
    
    document.getElementById('step4-setup-area').classList.add('hidden');
    document.getElementById('step4-interactive-area').classList.remove('hidden');
    document.getElementById('word-list-result').innerHTML = ''; 

    const streamContainer = document.getElementById('full-binary-stream');
    streamContainer.innerHTML = '';

    wordChunks.forEach((chunk, index) => {
        const span = document.createElement('span');
        span.id = `chunk-stream-${index}`;
        
        if (index === wordChunks.length - 1) {
            const entPart = chunk.slice(0, 11 - expectedChkLen);
            const chkPart = chunk.slice(11 - expectedChkLen);
            span.innerHTML = `${entPart}<span class="checksum-highlight">${chkPart}</span>`;
        } else {
            span.innerText = chunk;
        }
        streamContainer.appendChild(span);
    });

    renderCurrentWord();
}

function renderCurrentWord() {
    document.getElementById('current-word-index-display').innerText = currentWordIdx + 1;
    document.getElementById('total-words-display').innerText = wordChunks.length;
    
    document.getElementById('btn-reveal-decimal').classList.remove('hidden');
    document.getElementById('arrow-1').classList.add('hidden');
    
    document.getElementById('decimal-result-area').classList.add('hidden');
    document.getElementById('dict-action-area').classList.add('hidden');
    document.getElementById('arrow-2').classList.add('hidden');
    document.getElementById('word-result-area').classList.add('hidden');
    document.getElementById('next-action-area').classList.add('hidden');
    document.getElementById('manual-search-tooltip').classList.add('hidden');
    
    const chunk = wordChunks[currentWordIdx];
    const activeBox = document.getElementById('active-11bit');
    const checksumLen = targetBits / 32;

    if (currentWordIdx === wordChunks.length - 1) {
        const entPart = chunk.slice(0, 11 - checksumLen);
        const chkPart = chunk.slice(11 - checksumLen);
        activeBox.innerHTML = `${entPart}<span class="checksum-highlight" style="margin-left: 6px;">${chkPart}</span>`;
    } else {
        activeBox.innerHTML = chunk;
    }

    wordChunks.forEach((_, index) => {
        const el = document.getElementById(`chunk-stream-${index}`);
        let baseClass = 'stream-chunk flex items-center relative';
        if (index === currentWordIdx) {
            el.className = `${baseClass} active-chunk`; 
        } else if (index < currentWordIdx) {
            el.className = `${baseClass} decoded-chunk`; 
        } else {
            el.className = baseClass; 
        }
    });
}

function revealDecimal() {
    document.getElementById('btn-reveal-decimal').classList.add('hidden');
    document.getElementById('arrow-1').classList.remove('hidden');
    
    document.getElementById('active-decimal').innerText = parseInt(wordChunks[currentWordIdx], 2);
    document.getElementById('decimal-result-area').classList.remove('hidden');
    
    document.getElementById('dict-action-area').classList.remove('hidden');
    document.getElementById('btn-reveal-word').classList.remove('hidden');
    
    document.getElementById('manual-search-tooltip').classList.remove('hidden');
}

function revealWord() {
    document.getElementById('btn-reveal-word').classList.add('hidden');
    document.getElementById('arrow-2').classList.remove('hidden');
    document.getElementById('manual-search-tooltip').classList.add('hidden'); 
    
    const word = wordList[parseInt(wordChunks[currentWordIdx], 2)];
    document.getElementById('active-word').innerText = word;
    document.getElementById('word-result-area').classList.remove('hidden');
    
    const cardId = `word-card-${currentWordIdx}`;
    if (!document.getElementById(cardId)) {
        const card = document.createElement('div');
        card.id = cardId;
        card.className = "p-4 rounded-xl bg-[#050A14] border border-slate-700 fade-in flex flex-col justify-center items-center shadow-inner";
        card.innerHTML = `<div class="text-[9px] md:text-[10px] text-slate-500 mb-1 tracking-widest font-bold">#${currentWordIdx+1}</div><div class="font-bold text-gold tracking-wide text-sm md:text-base">${word.toUpperCase()}</div>`;
        document.getElementById('word-list-result').appendChild(card);
    }

    const nextBtn = document.getElementById('btn-next-word');
    if(currentWordIdx === wordChunks.length - 1) {
        nextBtn.innerText = "🎉 ดูผลลัพธ์ทั้งหมด";
        nextBtn.classList.replace('btn-gold-solid', 'bg-emerald-600');
        nextBtn.classList.add('text-white', 'shadow-[0_0_20px_rgba(16,185,129,0.4)]');
    } else {
        nextBtn.innerText = "ถัดไป ➔";
        nextBtn.classList.replace('bg-emerald-600', 'btn-gold-solid');
        nextBtn.classList.remove('text-white', 'shadow-[0_0_20px_rgba(16,185,129,0.4)]');
    }
    
    document.getElementById('next-action-area').classList.remove('hidden');
}

function nextWord() {
    if(currentWordIdx < wordChunks.length - 1) { 
        currentWordIdx++; 
        renderCurrentWord(); 
    } else {
        showSuccessModal();
    }
}

function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    const seedContainer = document.getElementById('modal-seed-display');
    
    seedContainer.innerHTML = '';
    wordChunks.forEach((chunk, index) => {
        const word = wordList[parseInt(chunk, 2)];
        const wordEl = document.createElement('div');
        wordEl.className = "bg-slate-900 rounded-xl p-3 text-center border border-slate-700 shadow-inner";
        wordEl.innerHTML = `
            <div class="text-[9px] md:text-[10px] text-slate-500 mb-1 tracking-widest font-bold">#${index + 1}</div>
            <div class="text-gold font-extrabold text-xs md:text-sm uppercase tracking-wider">${word}</div>
        `;
        seedContainer.appendChild(wordEl);
    });

    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.add('show'); }, 10);
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('show');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function openReasonModal() {
    const modal = document.getElementById('reason-modal');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.add('show'); }, 10);
}

function closeReasonModal() {
    const modal = document.getElementById('reason-modal');
    modal.classList.remove('show');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function scrollToStep(id) {
    const el = document.getElementById(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-gold');
    setTimeout(() => el.classList.remove('ring-2', 'ring-gold'), 2000);
}

function openDictionary() {
    renderDictionary();
    const modal = document.getElementById('dict-modal');
    modal.classList.remove('hidden');
    document.getElementById('dict-search').value = ''; 
    setTimeout(() => { modal.classList.add('show'); }, 10);
}

function closeDictionary() {
    const modal = document.getElementById('dict-modal');
    modal.classList.remove('show');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function renderDictionary(filter = '') {
    const container = document.getElementById('dict-list-container');
    container.innerHTML = '';
    filter = filter.toLowerCase();
    
    let html = '';
    wordList.forEach((word, index) => {
        if (word.toLowerCase().includes(filter) || index.toString().includes(filter)) {
            html += `
                <div class="bg-[#050A14] border border-slate-800 p-2 md:p-3 rounded-xl flex flex-col items-center justify-center hover:border-gold/50 transition-colors shadow-inner">
                    <span class="text-[9px] md:text-[10px] text-slate-500 font-mono mb-1">Index: <span class="text-cyan-400 font-bold">${index}</span></span>
                    <span class="text-white font-bold tracking-wide text-xs md:text-sm">${word}</span>
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

function filterDictionary() {
    const query = document.getElementById('dict-search').value;
    renderDictionary(query);
}

function resetAll() {
    entropy = ""; isFlipping = false;
    
    document.getElementById('raw-entropy-box').classList.add('hidden');
    document.getElementById('manual-steps-area').classList.add('hidden');
    document.getElementById('next-step-guide').classList.add('hidden');
    
    const errorBox = document.getElementById('step4-error-box');
    if (errorBox) errorBox.classList.add('hidden');

    const tooltip = document.getElementById('entropy-copy-tooltip');
    if (tooltip) {
        tooltip.classList.add('opacity-0', 'translate-y-2');
        tooltip.classList.remove('opacity-100', 'translate-y-0');
    }
    
    const searchTooltip = document.getElementById('manual-search-tooltip');
    if (searchTooltip) searchTooltip.classList.add('hidden');

    document.getElementById('btn-random').classList.remove('hidden');
    document.getElementById('btn-random-batch').classList.remove('hidden');
    document.getElementById('raw-entropy-output').value = '';
    
    ['step1', 'step2', 'step3'].forEach(step => {
        const inputEl = document.getElementById(`${step}-input`);
        const outputEl = document.getElementById(`${step}-output`);
        const resultArea = document.getElementById(`${step}-result-area`);
        
        if (inputEl) {
            inputEl.value = '';
            inputEl.classList.remove('hidden');
        }
        if (outputEl) outputEl.value = '';
        if (resultArea) resultArea.classList.add('hidden');
    });

    const step3Display = document.getElementById('step3-input-display');
    if (step3Display) {
        step3Display.classList.add('hidden');
        step3Display.innerHTML = '';
    }

    document.getElementById('step3-output-checksum').value = '';
    document.getElementById('step3-full-bin').innerHTML = '';
    document.getElementById('step1-visual-breakdown').innerHTML = '';
    
    document.getElementById('step4-input-entropy').value = '';
    document.getElementById('step4-input-checksum').value = '';
    document.getElementById('step4-setup-area').classList.remove('hidden');
    document.getElementById('step4-interactive-area').classList.add('hidden');
    document.getElementById('full-binary-stream').innerHTML = '';
    document.getElementById('word-list-result').innerHTML = '';
    
    document.getElementById('step2-box').classList.add('locked');
    document.getElementById('step3-box').classList.add('locked');
    document.getElementById('step4-box').classList.add('locked');

    document.getElementById('coin').style.transform = `rotateY(0deg)`;

    closeModal();
    closeReasonModal();
    updateUI();
}