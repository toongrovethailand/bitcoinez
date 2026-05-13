// ==========================================
// Act 2 Chapter 4: The Gold Furnace (UTXO Model)
// ==========================================

// State Management
let txCounter = 1;
const DEFAULT_FEE = 0.02; 

const STATE = {
    utxos: [
        { id: 'tx0-1', owner: 'Alice', amount: 12.0, status: 'unspent' },
        { id: 'tx0-2', owner: 'Bob', amount: 5.0, status: 'unspent' },
        { id: 'tx0-3', owner: 'Alice', amount: 3.5, status: 'unspent' }
    ],
    characters: ['Alice', 'Bob', 'Charlie', 'Miner'],
    selectedInputs: [] 
};

const charEmojis = { 'Alice': '👩', 'Bob': '👨', 'Charlie': '👱‍♂️', 'Miner': '⛏️' };

// สร้าง HTML ของก้อนทอง
function createNuggetHTML(utxo, isGlobal = false, isInteractive = false) {
    const isSpent = utxo.status === 'spent';
    const baseClass = isSpent ? 'slag-nugget' : 'gold-nugget';
    const action = isInteractive ? `onclick="toggleUtxo('${utxo.id}')"` : '';
    
    let padding = "px-3 py-2";
    let textSize = "text-xs";
    if(utxo.amount >= 10) { padding = "px-4 py-2.5"; textSize = "text-sm"; }
    else if(utxo.amount < 2) { padding = "px-2 py-1.5"; textSize = "text-[10px]"; }

    let ownerBadge = '';
    let marginClass = ''; // เพิ่ม margin เพื่อเว้นที่ให้ป้ายชื่อ
    
    if (isGlobal || isSpent) {
        marginClass = 'mt-3'; // เว้นที่ด้านบนให้ป้ายไม่ชนขอบคอนเทนเนอร์
        
        // เลื่อนป้ายชื่อขึ้นด้านบน (-top-2.5) และจัดให้อยู่ตรงกลาง (left-1/2 -translate-x-1/2)
        ownerBadge = `<div class="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 text-[9px] opacity-100 uppercase bg-[#050A14] px-2.5 py-0.5 rounded-full border ${isSpent ? 'border-rose-500 text-rose-400' : 'border-gold text-gold'} font-bold tracking-widest whitespace-nowrap shadow-[0_2px_4px_rgba(0,0,0,0.5)]">${isSpent ? '🔥 SPENT' : utxo.owner}</div>`;
    }

    // เลเยอร์แสงเงาที่แยกส่วนออกมา (เพื่อลบ overflow:hidden ออกจากกล่องหลัก)
    const shineHtml = isSpent ? '' : '<div class="shine-layer"></div>';

    return `
        <div class="relative pop-in ${marginClass}" ${action} title="${utxo.id}">
            ${ownerBadge}
            <div id="nugget-${utxo.id}" class="${baseClass} ${padding} flex flex-col items-center justify-center relative z-10 h-full w-full">
                ${shineHtml}
                <span class="font-black font-mono ${textSize} drop-shadow-md relative z-10">${utxo.amount.toFixed(2)}</span>
                <span class="text-[9px] font-bold opacity-80 mt-0.5 tracking-widest relative z-10">BTC</span>
            </div>
        </div>
    `;
}

function init() {
    renderGlobalUTXOs();
    renderCharacters();
    updateUtxoSelection();
}

function renderGlobalUTXOs() {
    const container = document.getElementById('global-utxo-container');
    
    document.getElementById('global-utxo-count').innerText = STATE.utxos.length;
    
    const totalUnspent = STATE.utxos
        .filter(u => u.status === 'unspent')
        .reduce((sum, u) => sum + u.amount, 0);
    document.getElementById('global-utxo-total-amount').innerText = totalUnspent.toFixed(2);

    container.innerHTML = '';

    const sortedUtxos = [...STATE.utxos].sort((a, b) => {
        if(a.status === b.status) return b.id.localeCompare(a.id);
        return a.status === 'unspent' ? -1 : 1;
    });

    sortedUtxos.forEach(u => {
        container.innerHTML += createNuggetHTML(u, true, false);
    });
}

function renderCharacters() {
    const container = document.getElementById('characters-container');
    container.innerHTML = '';

    STATE.characters.forEach(char => {
        const charUtxos = STATE.utxos.filter(u => u.owner === char && u.status === 'unspent');
        const totalBalance = charUtxos.reduce((sum, u) => sum + u.amount, 0);

        let nuggetsHtml = '';
        if (charUtxos.length === 0) {
            nuggetsHtml = `<div class="text-xs text-slate-600 italic text-center py-4 w-full font-bold">ไม่มีทองคำเหลือเลย</div>`;
        } else {
            charUtxos.forEach(u => { nuggetsHtml += createNuggetHTML(u, false, false); });
        }

        const cardHtml = `
            <div class="glass-panel rounded-xl p-5 flex flex-col shadow-lg bg-[#050A14]/80 border-t-4 ${char==='Miner'?'border-t-emerald-500':'border-t-slate-600'} hover:border-t-gold transition-colors duration-300">
                <div class="flex justify-between items-center border-b border-slate-700/80 pb-3 mb-4">
                    <span class="font-bold text-white text-sm flex items-center gap-2">${charEmojis[char]} <span class="tracking-wide">${char}</span></span>
                </div>
                <div class="text-center mb-4">
                    <span class="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] tracking-tight font-mono">${totalBalance.toFixed(2)} <span class="text-[10px] text-slate-400 font-normal uppercase tracking-widest block mt-1">BTC</span></span>
                </div>
                <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50 flex flex-wrap gap-3 justify-center flex-grow items-center min-h-[70px] shadow-inner">
                    ${nuggetsHtml}
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

function updateUtxoSelection() {
    const sender = document.getElementById('sel-sender').value;
    const availContainer = document.getElementById('available-utxos');
    const furnaceContainer = document.getElementById('furnace-inputs');
    const receiverOverlay = document.getElementById('receiver-overlay');
    const changeEmoji = document.getElementById('change-emoji');
    const changeName = document.getElementById('change-name');
    const labelChange = document.getElementById('label-change');
    
    STATE.selectedInputs = []; 
    furnaceContainer.innerHTML = '';

    if (!sender) {
        availContainer.innerHTML = `<span class="text-xs text-slate-500 italic">โปรดเลือกผู้ส่งก่อน</span>`;
        receiverOverlay.classList.remove('hidden');
        
        changeEmoji.innerText = "❔";
        changeName.innerText = "รอเลือกผู้ส่ง";
        labelChange.innerText = `3. ทองก้อนใหม่ให้ตัวเอง (Output 2 - Change)`;
        
        document.getElementById('input-amount').value = 0;
        document.getElementById('input-change').value = 0;
        document.getElementById('sel-receiver').value = "";
        calculateFee();
        return;
    }

    receiverOverlay.classList.add('hidden');
    
    changeEmoji.innerText = charEmojis[sender];
    changeName.innerText = sender;
    labelChange.innerText = `3. ${charEmojis[sender]} ${sender} (ก้อนใหม่ให้ตัวเอง - Change)`;

    const availableUtxos = STATE.utxos.filter(u => u.owner === sender && u.status === 'unspent');
    
    if (availableUtxos.length === 0) {
        availContainer.innerHTML = `<span class="text-xs text-rose-500 font-bold bg-rose-950/40 px-3 py-1 rounded">หมดตัวแล้ว! ไม่มีก้อนทองให้หลอม</span>`;
    } else {
        availContainer.innerHTML = '';
        availableUtxos.forEach(u => {
            availContainer.innerHTML += createNuggetHTML(u, false, true);
        });
    }
    autoCalculateChange();
}

window.toggleUtxo = function(id) {
    if(isProcessing) return;
    const idx = STATE.selectedInputs.indexOf(id);
    if (idx > -1) {
        STATE.selectedInputs.splice(idx, 1);
    } else {
        STATE.selectedInputs.push(id);
    }
    renderFurnaceArea();
    autoCalculateChange();
}

function renderFurnaceArea() {
    const sender = document.getElementById('sel-sender').value;
    const availContainer = document.getElementById('available-utxos');
    const furnaceContainer = document.getElementById('furnace-inputs');
    
    availContainer.innerHTML = '';
    furnaceContainer.innerHTML = '';

    const availableUtxos = STATE.utxos.filter(u => u.owner === sender && u.status === 'unspent');

    availableUtxos.forEach(u => {
        if (STATE.selectedInputs.includes(u.id)) {
            furnaceContainer.innerHTML += createNuggetHTML(u, false, true);
        } else {
            availContainer.innerHTML += createNuggetHTML(u, false, true);
        }
    });

    if(availContainer.innerHTML === '') availContainer.innerHTML = `<span class="text-[10px] text-slate-600 font-bold uppercase tracking-widest">ว่างเปล่า</span>`;
    if(furnaceContainer.innerHTML === '') furnaceContainer.innerHTML = `<span class="text-[10px] text-orange-600/50 font-bold uppercase tracking-widest">ยังไม่ได้ใส่ทอง</span>`;
}

function setMaxAmount() {
    if (isProcessing) return;
    
    let inputTotal = 0;
    STATE.selectedInputs.forEach(id => {
        const u = STATE.utxos.find(x => x.id === id);
        if(u) inputTotal += u.amount;
    });

    if (inputTotal > 0) {
        let maxAmount = ((inputTotal * 100) - (DEFAULT_FEE * 100)) / 100;
        if (maxAmount < 0) maxAmount = 0;
        
        document.getElementById('input-amount').value = maxAmount.toFixed(2);
        document.getElementById('input-change').value = "0.00";
        
        calculateFee();
    }
}

function autoCalculateChange() {
    let inputTotal = 0;
    STATE.selectedInputs.forEach(id => {
        const u = STATE.utxos.find(x => x.id === id);
        if(u) inputTotal += u.amount;
    });

    const amount = parseFloat(document.getElementById('input-amount').value) || 0;
    const changeInput = document.getElementById('input-change');

    if (inputTotal > 0 && amount > 0) {
        let autoChange = ((inputTotal * 100) - (amount * 100) - (DEFAULT_FEE * 100)) / 100;
        
        if (autoChange < 0) {
            autoChange = ((inputTotal * 100) - (amount * 100)) / 100;
            if (autoChange < 0) autoChange = 0; 
        }
        changeInput.value = autoChange.toFixed(2);
    } else if (inputTotal === 0 || amount === 0) {
        changeInput.value = 0;
    }

    calculateFee();
}

let isProcessing = false;

function calculateFee() {
    if (isProcessing) return;
    
    let inputTotal = 0;
    STATE.selectedInputs.forEach(id => {
        const u = STATE.utxos.find(x => x.id === id);
        if(u) inputTotal += u.amount;
    });
    document.getElementById('total-input-val').innerText = inputTotal.toFixed(2) + " BTC";

    const amount = parseFloat(document.getElementById('input-amount').value) || 0;
    const change = parseFloat(document.getElementById('input-change').value) || 0;
    const receiver = document.getElementById('sel-receiver').value;

    // Fee = Input - Amount - Change
    const fee = ((inputTotal * 100) - (amount * 100) - (change * 100)) / 100;
    
    const feeEl = document.getElementById('fee-amount');
    const warningEl = document.getElementById('fee-warning');
    const statusEl = document.getElementById('fee-status');
    const feeBox = document.getElementById('fee-box');
    const btn = document.getElementById('btn-broadcast');

    feeEl.innerText = fee.toFixed(2) + " BTC";

    let isValid = true;
    if (STATE.selectedInputs.length === 0) isValid = false;
    if (amount <= 0 && change <= 0) isValid = false;
    if (!receiver && amount > 0) isValid = false;

    if (fee < 0) {
        feeEl.classList.replace('text-gold', 'text-rose-500');
        feeEl.classList.replace('text-slate-400', 'text-rose-500');
        warningEl.classList.remove('hidden');
        statusEl.classList.add('hidden');
        feeBox.className = "bg-[#050A14]/80 border border-rose-500 rounded-xl p-4 text-center transition-all duration-300 shadow-[0_0_15px_rgba(225,29,72,0.2)]";
        isValid = false;
    } else {
        warningEl.classList.add('hidden');
        statusEl.classList.remove('hidden');
        
        if (fee === 0) {
            feeEl.className = "text-slate-400 font-bold text-2xl font-mono transition-colors";
            statusEl.innerHTML = "การหลอมครั้งนี้ไม่มีแรงจูงใจ!<br>(อาจค้างอยู่ใน Mempool ตลอดกาล)";
            statusEl.className = "text-slate-400 text-[10px] mt-2 transition-colors font-bold";
            feeBox.className = "bg-slate-900 border border-slate-700 rounded-xl p-4 text-center transition-all duration-300 shadow-inner";
        } else if (fee < 0.02) {
            feeEl.className = "text-amber-400 font-bold text-2xl font-mono transition-colors";
            statusEl.innerHTML = "แรงจูงใจน้อยไปนิด...<br>(นักขุดอาจจะหยิบไปทำช้าหน่อยนะ)";
            statusEl.className = "text-amber-400 text-[10px] mt-2 transition-colors font-bold";
            feeBox.className = "bg-[#050A14]/80 border border-amber-500/50 rounded-xl p-4 text-center transition-all duration-300 shadow-inner";
        } else {
            feeEl.className = "text-emerald-400 font-bold text-2xl font-mono transition-colors drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
            statusEl.innerHTML = "✨ แรงจูงใจดีมาก!<br>(นักขุดพร้อมแย่งกันนำไปทำงาน)";
            statusEl.className = "text-emerald-400 text-[10px] mt-2 transition-colors font-bold";
            feeBox.className = "bg-emerald-950/20 border border-emerald-500/50 rounded-xl p-4 text-center transition-all duration-300 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)]";
        }
    }

    if (isValid) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.classList.add('hover:-translate-y-1', 'shadow-[0_10px_20px_rgba(234,88,12,0.5)]');
    } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.classList.remove('hover:-translate-y-1', 'shadow-[0_10px_20px_rgba(234,88,12,0.5)]');
    }
}

function executeTransaction() {
    isProcessing = true;
    const sender = document.getElementById('sel-sender').value;
    const receiver = document.getElementById('sel-receiver').value;
    const amount = parseFloat(document.getElementById('input-amount').value) || 0;
    const change = parseFloat(document.getElementById('input-change').value) || 0;
    
    const btn = document.getElementById('btn-broadcast');
    btn.innerHTML = `<span class="animate-spin text-xl">⏳</span> กำลังหลอมทองคำ...`;
    btn.classList.add('opacity-80', 'cursor-not-allowed');
    btn.classList.remove('hover:-translate-y-1', 'shadow-[0_10px_20px_rgba(234,88,12,0.5)]');

    // 1. แอนิเมชันละลายก้อนทองในเตา
    const furnaceNuggets = document.getElementById('furnace-inputs').children;
    for(let i=0; i<furnaceNuggets.length; i++) {
        // Find the actual nugget inside the wrapper
        const actualNugget = furnaceNuggets[i].querySelector('.gold-nugget');
        if (actualNugget) actualNugget.classList.add('melt-anim');
    }

    const arrowIcon = document.getElementById('furnace-icon');
    arrowIcon.innerHTML = '🔥';
    arrowIcon.classList.add('animate-pulse', 'scale-150', 'text-orange-500');

    // 2. ประมวลผล Data
    setTimeout(() => {
        STATE.selectedInputs.forEach(id => {
            const u = STATE.utxos.find(x => x.id === id);
            if(u) u.status = 'spent';
        });

        const newTxPrefix = `tx${txCounter}-`;
        txCounter++;
        let outIdx = 1;

        if (amount > 0) {
            STATE.utxos.push({ id: newTxPrefix + outIdx, owner: receiver, amount: amount, status: 'unspent' });
            outIdx++;
        }

        if (change > 0) {
            STATE.utxos.push({ id: newTxPrefix + outIdx, owner: sender, amount: change, status: 'unspent' });
            outIdx++;
        }

        let inputTotal = 0;
        STATE.selectedInputs.forEach(id => {
            const u = STATE.utxos.find(x => x.id === id);
            if(u) inputTotal += u.amount;
        });
        const fee = ((inputTotal * 100) - (amount * 100) - (change * 100)) / 100;
        
        if (fee > 0) {
            STATE.utxos.push({ id: newTxPrefix + outIdx, owner: 'Miner', amount: fee, status: 'unspent' });
        }

        // รีเซ็ต UI
        document.getElementById('input-amount').value = 0;
        document.getElementById('input-change').value = 0;
        STATE.selectedInputs = [];
        
        arrowIcon.innerHTML = '➔';
        arrowIcon.classList.remove('animate-pulse', 'scale-150', 'text-orange-500');
        
        btn.innerHTML = `✅ หลอมสำเร็จ!`;
        btn.classList.replace('from-orange-600', 'from-emerald-600');
        btn.classList.replace('to-red-600', 'to-teal-600');
        btn.classList.replace('shadow-[0_0_20px_rgba(234,88,12,0.4)]', 'shadow-[0_0_20px_rgba(16,185,129,0.5)]');

        renderGlobalUTXOs();
        renderCharacters();
        renderFurnaceArea();
        calculateFee();

        setTimeout(() => {
            btn.innerHTML = `🔥 กดปุ่มหลอมทองคำ!`;
            btn.classList.replace('from-emerald-600', 'from-orange-600');
            btn.classList.replace('to-teal-600', 'to-red-600');
            btn.classList.replace('shadow-[0_0_20px_rgba(16,185,129,0.5)]', 'shadow-[0_0_20px_rgba(234,88,12,0.4)]');
            isProcessing = false;
        }, 1500);

    }, 1000);
}

// Initialize on Load
window.onload = init;