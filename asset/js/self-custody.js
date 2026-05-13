// ==========================================
// Act 2 Chapter 3: Hardware Wallet (Self-Custody)
// ==========================================

// BIP39 Common Words Dummy List
const wordlist = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert"];

let currentScreen = 'welcome';
let seedPhrase = [];
let verifyIndex1 = 0;
let verifyIndex2 = 0;
let testWordsOptions = [];

// Screen Renderer
function renderScreen() {
    const screen = document.getElementById('screen-content');
    const ctxText = document.getElementById('context-text');
    const ctxBox = document.getElementById('context-box');
    
    screen.innerHTML = '';
    
    if (currentScreen === 'welcome') {
        screen.innerHTML = `
            <div class="text-3xl mb-2">🛡️</div>
            <h2 class="text-base font-bold text-white mb-2">Welcome</h2>
            <p class="text-[9px] text-cyan-200/70 mb-4 leading-relaxed">Press <b class="text-cyan-400">RIGHT</b> to start setup.</p>
        `;
        ctxText.innerHTML = "กดปุ่ม <b class='text-gold'>NEXT (ขวา)</b> บนอุปกรณ์เพื่อเริ่มสร้างกระเป๋าใบใหม่";
    } 
    else if (currentScreen === 'generate_warn') {
        screen.innerHTML = `
            <div class="text-xl mb-1 text-amber-400">⚠️ WARNING</div>
            <p class="text-[9px] text-cyan-200/90 leading-relaxed px-2">Write down the next 12 words on a piece of paper.<br><br><span class="text-rose-400">DO NOT take a photo!</span></p>
            <div class="mt-4 text-[8px] animate-pulse">Press RIGHT to view words -></div>
        `;
        ctxText.innerHTML = "อุปกรณ์กำลังจะแสดงคำศัพท์ 12 คำ (Seed Phrase) เตรียมกระดาษและปากกาให้พร้อม! <br><b class='text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded'>ห้ามถ่ายรูปเด็ดขาด!</b>";
    }
    else if (currentScreen === 'show_words') {
        let wordsHtml = '';
        seedPhrase.forEach((word, idx) => {
            wordsHtml += `<div class="text-left w-1/2 text-[10px] mb-1"><span class="text-slate-500">${idx+1}.</span> <span class="text-white">${word}</span></div>`;
        });
        
        screen.innerHTML = `
            <div class="text-[9px] text-emerald-400 mb-2 font-bold border-b border-emerald-900 pb-1">Your Recovery Phrase</div>
            <div class="flex flex-wrap justify-between px-2 mb-2">
                ${wordsHtml}
            </div>
            <div class="text-[8px] animate-pulse mt-auto text-amber-400">Written it down? Press RIGHT -></div>
        `;
        ctxText.innerHTML = "จดคำศัพท์ทั้ง 12 คำนี้ลงในกระดาษ เรียงตามลำดับให้ถูกต้อง เมื่อจดเสร็จแล้วให้กดปุ่ม <b class='text-gold'>NEXT (ขวา)</b>";
    }
    else if (currentScreen === 'verify_1') {
        let btnHtml = '';
        testWordsOptions.forEach(word => {
            btnHtml += `<div class="bg-cyan-950/40 border border-cyan-800 rounded text-[9px] py-1 px-2 cursor-pointer hover:bg-cyan-800 transition-colors" onclick="checkWord(1, '${word}')">${word}</div>`;
        });
        
        screen.innerHTML = `
            <div class="text-[9px] text-amber-400 mb-2 font-bold">Verify Phrase</div>
            <p class="text-[10px] text-white mb-3">Select Word #${verifyIndex1 + 1}</p>
            <div class="grid grid-cols-2 gap-2 px-2 pointer-events-auto">
                ${btnHtml}
            </div>
        `;
        ctxText.innerHTML = "ระบบต้องการทดสอบว่าคุณจดถูกจริงหรือไม่ ลองคลิกเลือกคำที่ <b class='text-white bg-slate-800 px-1 rounded'>#${verifyIndex1 + 1}</b> จากหน้าจอบนอุปกรณ์ดูสิ";
    }
    else if (currentScreen === 'verify_2') {
        let btnHtml = '';
        testWordsOptions.forEach(word => {
            btnHtml += `<div class="bg-cyan-950/40 border border-cyan-800 rounded text-[9px] py-1 px-2 cursor-pointer hover:bg-cyan-800 transition-colors" onclick="checkWord(2, '${word}')">${word}</div>`;
        });
        
        screen.innerHTML = `
            <div class="text-[9px] text-amber-400 mb-2 font-bold">Verify Phrase</div>
            <p class="text-[10px] text-white mb-3">Select Word #${verifyIndex2 + 1}</p>
            <div class="grid grid-cols-2 gap-2 px-2 pointer-events-auto">
                ${btnHtml}
            </div>
        `;
        ctxText.innerHTML = "เยี่ยมมาก! ต่อไปช่วยยืนยันคำที่ <b class='text-white bg-slate-800 px-1 rounded'>#${verifyIndex2 + 1}</b> อีกครั้งเพื่อความแน่ใจ";
    }
    else if (currentScreen === 'ready') {
        screen.innerHTML = `
            <div class="text-3xl mb-2 text-emerald-400">✅</div>
            <h2 class="text-sm font-bold text-white mb-2">Device Ready!</h2>
            <p class="text-[9px] text-cyan-200/70 mb-4 leading-relaxed">Your private keys are securely stored offline.</p>
        `;
        
        ctxBox.className = "bg-[#050A14]/80 border border-emerald-500/50 p-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] pop-in";
        ctxText.innerHTML = `
            <b class="text-emerald-400 text-base block mb-2">🎉 ยินดีด้วย! คุณเป็นนายธนาคารของตัวเองแล้ว!</b>
            อุปกรณ์นี้ได้นำ 12 คำของคุณไปเข้ารหัสคณิตศาสตร์สร้างเป็น <b class="text-white">Private Key</b> เก็บซ่อนไว้อย่างปลอดภัย (ไม่มีใครในโลกเห็นแม้แต่คุณเอง)<br><br>
            <button onclick="triggerDestruction()" class="w-full bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.4)] mt-3 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                🔥 กดเพื่อจำลองเหตุการณ์ไฟไหม้บ้าน!
            </button>
        `;
    }
    else if (currentScreen === 'recovery_intro') {
        screen.innerHTML = `
            <div class="text-3xl mb-2 text-cyan-400">🔄</div>
            <h2 class="text-sm font-bold text-white mb-2">Recovery Mode</h2>
            <p class="text-[9px] text-cyan-200/70 mb-4 leading-relaxed">Press <b class="text-cyan-400">RIGHT</b> to begin.</p>
        `;
        ctxText.innerHTML = `
            <div class="text-orange-400 font-bold text-lg mb-2">✨ ปาฏิหาริย์แห่ง Blockchain!</div>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
                คุณตัดสินใจไปซื้อเครื่องใหม่เป็นรุ่น <b>Bitcoin-Only Edition สีส้มสุดเท่!</b> 🧡<br><br>
                ทีนี้เราจะมากู้คืนกระเป๋ากัน กดปุ่ม <b class='text-gold'>NEXT (ขวา)</b> บนอุปกรณ์เพื่อเริ่มขั้นตอน Recovery
            </p>
        `;
        ctxBox.className = "bg-[#050A14]/80 border border-orange-500/50 p-6 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.15)] pop-in";
    }
    else if (currentScreen === 'recovery_warning') {
        screen.innerHTML = `
            <div class="text-xl mb-1 text-rose-500 font-bold">🛑 DANGER</div>
            <p class="text-[8px] text-white leading-relaxed px-1">Never type your real Seed Phrase on a PC or Phone keyboard!</p>
            <div class="mt-4 text-[8px] animate-pulse text-amber-400">Press RIGHT -></div>
        `;
        ctxText.innerHTML = `
            <div class="text-rose-400 font-bold text-lg mb-2 flex items-center gap-2"><span>🚨</span> คำเตือนความปลอดภัยระดับสูงสุด!</div>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
                ในโลกความเป็นจริง <b>ห้ามกรอก Seed Phrase ของคุณลงบนคอมพิวเตอร์ มือถือ หรือถ่ายรูปเก็บไว้เด็ดขาด!</b><br>
                มัลแวร์หรือไวรัสอาจดักจับข้อมูลคีย์บอร์ด (Keylogger) และขโมยเงินคุณไปได้ทันที<br><br>
                การกรอก Seed ที่ปลอดภัย <b>ต้องกรอกหรือกดเลือกผ่านปุ่มบนหน้าจอ Hardware Wallet เท่านั้น</b><br><br>
                <span class="text-slate-500 text-xs bg-slate-900 px-2 py-1 rounded block mt-2 border border-slate-800">(แต่เนื่องจากนี่คือแบบจำลองเว็บ เราจะอนุโลมให้พิมพ์คีย์บอร์ดได้เพื่อให้เห็นภาพ)</span><br>
                กด <b class='text-gold'>NEXT (ขวา)</b> เพื่อไปกรอกคำศัพท์ 12 คำ
            </p>
        `;
    }
    else if (currentScreen === 'recovery_input') {
        screen.innerHTML = `
            <div class="text-[9px] text-amber-400 mb-1 font-bold">Enter Seed Phrase</div>
            <textarea id="seed-input" class="w-[90%] h-14 bg-slate-900 border border-cyan-800 text-white text-[9px] p-1.5 rounded resize-none focus:outline-none focus:border-cyan-400 pointer-events-auto" placeholder="Type 12 words separated by spaces..."></textarea>
            <button onclick="verifyFullSeed()" class="mt-2 bg-cyan-800 hover:bg-cyan-700 text-white text-[9px] py-1.5 px-6 rounded border border-cyan-600 transition-colors pointer-events-auto font-bold uppercase tracking-widest">Verify</button>
        `;
        ctxText.innerHTML = `
            <div class="text-gold font-bold text-lg mb-2 flex items-center gap-2"><span>📝</span> กู้คืนกระเป๋า</div>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
                นำคำศัพท์ทั้ง 12 คำ ที่คุณจดไว้บนกระดาษตอนแรก มาพิมพ์ลงในช่องบนหน้าจออุปกรณ์ โดยเว้นวรรคระหว่างคำ<br>
                เมื่อพิมพ์ครบแล้ว กดปุ่ม <b>Verify</b> บนหน้าจออุปกรณ์
            </p>
            <button onclick="openCheatModal()" class="text-xs text-gold hover:text-white underline transition-colors">ลืมจดใช่ไหม? กดดูคำศัพท์ที่นี่</button>
        `;
    }
    else if (currentScreen === 'recovered') {
        screen.innerHTML = `
            <div class="text-3xl mb-2 text-emerald-400">♻️</div>
            <h2 class="text-sm font-bold text-white mb-2">Recovered!</h2>
            <p class="text-[8px] text-cyan-200/70 leading-relaxed px-2">Account restored successfully from Seed Phrase.</p>
            <div class="bg-emerald-900/50 border border-emerald-500 rounded p-1.5 mt-2 mx-4 text-[10px] font-mono text-emerald-300 font-bold shadow-inner">
                Balance: 1.500 BTC
            </div>
        `;
    }
}

// Logic Controls
function hwBtnPress(btn) {
    if (currentScreen === 'welcome' && btn === 'right') {
        generateSeed();
        currentScreen = 'generate_warn';
        renderScreen();
    }
    else if (currentScreen === 'generate_warn' && btn === 'right') {
        currentScreen = 'show_words';
        renderScreen();
    }
    else if (currentScreen === 'show_words' && btn === 'right') {
        setupVerification(1);
        currentScreen = 'verify_1';
        renderScreen();
    }
    // เพิ่มการควบคุมปุ่มสำหรับหน้า Recovery
    else if (currentScreen === 'recovery_intro' && btn === 'right') {
        currentScreen = 'recovery_warning';
        renderScreen();
    }
    else if (currentScreen === 'recovery_warning' && btn === 'right') {
        currentScreen = 'recovery_input';
        renderScreen();
    }
}

function generateSeed() {
    seedPhrase = [];
    const tempDict = [...wordlist];
    for(let i=0; i<12; i++) {
        const rIdx = Math.floor(Math.random() * tempDict.length);
        seedPhrase.push(tempDict[rIdx]);
        tempDict.splice(rIdx, 1);
    }
}

function setupVerification(step) {
    let targetIndex;
    if (step === 1) {
        verifyIndex1 = Math.floor(Math.random() * 6);
        targetIndex = verifyIndex1;
    } else {
        verifyIndex2 = Math.floor(Math.random() * 6) + 6;
        targetIndex = verifyIndex2;
    }

    const correctWord = seedPhrase[targetIndex];
    testWordsOptions = [correctWord];
    
    while(testWordsOptions.length < 4) {
        const fakeWord = wordlist[Math.floor(Math.random() * wordlist.length)];
        if(!testWordsOptions.includes(fakeWord) && !seedPhrase.includes(fakeWord)) {
            testWordsOptions.push(fakeWord);
        }
    }
    testWordsOptions.sort(() => Math.random() - 0.5);
}

window.checkWord = function(step, selectedWord) {
    const targetIndex = step === 1 ? verifyIndex1 : verifyIndex2;
    const correctWord = seedPhrase[targetIndex];

    if (selectedWord === correctWord) {
        if (step === 1) {
            setupVerification(2);
            currentScreen = 'verify_2';
        } else {
            currentScreen = 'ready';
        }
        renderScreen();
    } else {
        const screen = document.getElementById('screen-content');
        screen.classList.add('shake', 'text-rose-500');
        screen.innerHTML = `<div class="text-2xl mb-2">❌</div><div class="text-xs font-bold text-rose-500">INCORRECT WORD</div><div class="text-[8px] text-white mt-2">Resetting device...</div>`;
        
        setTimeout(() => {
            screen.classList.remove('shake', 'text-rose-500');
            currentScreen = 'welcome';
            renderScreen();
        }, 2000);
    }
};

window.triggerDestruction = function() {
    const device = document.getElementById('device-wrapper').children[0];
    const ctxText = document.getElementById('context-text');
    const ctxBox = document.getElementById('context-box');

    document.body.classList.add('bg-rose-950/20');
    device.classList.add('destroy-anim');

    ctxBox.className = "bg-[#050A14]/80 border border-rose-600 p-6 rounded-xl shadow-[0_0_30px_rgba(225,29,72,0.2)] transition-all duration-500";
    
    ctxText.innerHTML = `
        <div class="text-rose-500 font-bold text-xl mb-3 flex items-center gap-2"><span>🚨</span> เกิดอุบัติเหตุ! ไฟไหม้บ้าน!</div>
        <p class="text-sm text-slate-300 mb-5 leading-relaxed">อุปกรณ์ Hardware Wallet ของคุณถูกเผาจนหลอมละลายกลายเป็นจุล! บิตคอยน์ทั้งหมดของคุณหายไปแล้วใช่หรือไม่?</p>
        <button onclick="buyNewDevice()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all animate-pulse uppercase tracking-wide text-sm">
            🛒 ไปซื้อเครื่องใหม่มารีคัฟเวอร์ (Recover)
        </button>
    `;
};

window.buyNewDevice = function() {
    const device = document.getElementById('device-wrapper').children[0];

    document.body.classList.remove('bg-rose-950/20');
    
    // รีเซ็ต UI เครื่อง และเปลี่ยนเป็นเครื่องสีส้ม
    device.classList.remove('destroy-anim');
    device.classList.remove('hw-device');
    device.classList.add('hw-device-orange');
    device.classList.add('pop-in');

    // เปลี่ยนจาก recovered ไปเริ่มหน้าจอ recovery intro
    currentScreen = 'recovery_intro';
    renderScreen();
};

// ตรวจสอบตอนพิมพ์ 12 คำ
window.verifyFullSeed = function() {
    const inputVal = document.getElementById('seed-input').value.trim().toLowerCase();
    // ตัดช่องว่างหลายๆ เคาะให้เหลืออันเดียว
    const inputWords = inputVal.split(/\s+/).filter(w => w.length > 0);
    const correctWords = seedPhrase;
    
    if (inputWords.length === 12 && inputWords.join(' ') === correctWords.join(' ')) {
        currentScreen = 'recovered';
        renderScreen();
        
        const ctxText = document.getElementById('context-text');
        const ctxBox = document.getElementById('context-box');
        
        ctxBox.className = "bg-[#050A14]/80 border border-emerald-500/50 p-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] pop-in";
        
        ctxText.innerHTML = `
            <div class="text-emerald-400 font-bold text-xl mb-3 flex items-center gap-2"><span>✨</span> กู้คืนสำเร็จ!</div>
            <p class="text-sm text-slate-300 leading-relaxed mb-5">
                ยอดเยี่ยมมาก! ทันทีที่คุณนำ <b>กระดาษที่จด 12 คำไว้ (Seed Phrase)</b> มากู้คืน เงินทุก Satoshis ก็ปรากฏขึ้นมาครบถ้วน!<br><br>
                เพราะบิตคอยน์ <b class="text-white">ไม่เคยอยู่ในเครื่อง!</b> มันบันทึกอยู่บนสมุดบัญชีสาธารณะ (Blockchain) ที่กระจายอยู่ทั่วโลก อุปกรณ์นี้ทำหน้าที่แค่ <b>"เก็บกุญแจ"</b> เพื่อไขตู้เซฟบนเครือข่ายเท่านั้น!
            </p>
        `;
    } else {
        // กรณีพิมพ์ผิด หรือไม่ครบ
        const screen = document.getElementById('screen-content');
        screen.classList.add('shake', 'text-rose-500');
        const oldHTML = screen.innerHTML;
        
        screen.innerHTML = `<div class="text-3xl mb-2 mt-4 drop-shadow-md">❌</div><div class="text-xs font-bold text-rose-500 bg-rose-950/50 px-2 py-1 rounded inline-block">INCORRECT SEED</div><div class="text-[8px] text-slate-300 mt-2">Please check your words</div>`;
        
        setTimeout(() => {
            screen.classList.remove('shake', 'text-rose-500');
            screen.innerHTML = oldHTML;
            // ต้องดึงค่า input เก่ากลับมาใส่ให้ด้วย จะได้ไม่ต้องพิมพ์ใหม่หมด
            document.getElementById('seed-input').value = inputVal;
        }, 1500);
    }
};

// ----------------------------------------------------
// Custom Modals Logic
// ----------------------------------------------------

window.openCheatModal = function() {
    const modal = document.getElementById('cheat-modal');
    const box = document.getElementById('cheat-modal-box');
    const content = document.getElementById('cheat-seed-content');
    
    // Fill words
    content.innerHTML = '';
    seedPhrase.forEach((word, idx) => {
        content.innerHTML += `<div><span class="text-slate-500 text-xs">${idx+1}.</span> <span class="text-gold font-bold">${word}</span></div>`;
    });

    modal.classList.remove('hidden');
    void modal.offsetWidth; 
    
    modal.classList.replace('opacity-0', 'opacity-100');
    box.classList.replace('scale-95', 'scale-100');
};

window.closeCheatModal = function() {
    const modal = document.getElementById('cheat-modal');
    const box = document.getElementById('cheat-modal-box');
    
    modal.classList.replace('opacity-100', 'opacity-0');
    box.classList.replace('scale-100', 'scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

window.showNextChapterAlert = function() {
    const modal = document.getElementById('custom-alert');
    const box = document.getElementById('custom-alert-box');
    
    modal.classList.remove('hidden');
    void modal.offsetWidth; 
    
    modal.classList.replace('opacity-0', 'opacity-100');
    box.classList.replace('scale-95', 'scale-100');
};

window.closeCustomAlert = function() {
    const modal = document.getElementById('custom-alert');
    const box = document.getElementById('custom-alert-box');
    
    modal.classList.replace('opacity-100', 'opacity-0');
    box.classList.replace('scale-100', 'scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

// Initialize
window.onload = renderScreen;