// ./asset/js/cashflow_ui.js

const professionCards = [
    { name: "ภารโรง", salary: 16000, expenses: 10000, savings: 5000, profDebt: 100000 },
    { name: "พนักงานออฟฟิศ", salary: 25000, expenses: 17000, savings: 8000, profDebt: 250000 },
    { name: "ครู", salary: 33000, expenses: 22000, savings: 10000, profDebt: 350000 },
    { name: "วิศวกร", salary: 50000, expenses: 35000, savings: 20000, profDebt: 800000 },
    { name: "ทนายความ", salary: 75000, expenses: 54000, savings: 25000, profDebt: 1200000 },
    { name: "แพทย์", salary: 132000, expenses: 96000, savings: 40000, profDebt: 2500000 }
];

let player = { isEducated: false };
let bot = { isEducated: false };
let currentTurn = 'player';
let currentSharedEvent = null;
let gameOver = false;
let gameMonth = 1;
let isAnimating = false; 
let currentQuickPayType = '';

let market = {
    invPrice: 100, goldPrice: 40000, btcPrice: 2500000,
    history: { inv: Array(15).fill(100), gold: Array(15).fill(40000), btc: Array(15).fill(2500000) },
    nextBias: 'normal' 
};

const kiyosakiQuotes = [
    "คนรวยซื้อทรัพย์สิน คนชั้นกลางซื้อหนี้สินโดยคิดว่ามันคือทรัพย์สิน",
    "หนี้ที่ดีทำให้คุณรวย หนี้ที่เลวทำให้คุณจนลง",
    "วิกฤตเศรษฐกิจเป็นเครื่องมือคัดกรองระหว่างคนมีวินัยและคนประมาท",
    "การลงทุนที่ดีที่สุดคือการลงทุนในความรู้ทางการเงินของคุณเอง"
];

const fmt = (num) => {
    if (num < 0) return '-฿' + Math.abs(num).toLocaleString('th-TH');
    return '฿' + num.toLocaleString('th-TH');
};

function getExpenses(actor) { 
    let profInt = Math.floor((actor.profDebt * 0.025) / 12);
    let bankInt = Math.floor(actor.bankDebt * 0.02); 
    let creditInt = Math.floor((actor.creditDebt || 0) * 0.05); 
    let mortgageExp = actor.assets ? actor.assets.reduce((sum, asset) => sum + (asset.mortgagePayment || 0), 0) : 0;
    return actor.baseExpenses + profInt + bankInt + creditInt + mortgageExp; 
}

function calculateRSI(history) {
    if(history.length < 2) return 50;
    let gains = 0, losses = 0;
    for(let i=1; i<history.length; i++) {
        let diff = history[i] - history[i-1];
        if(diff > 0) gains += diff; else losses += Math.abs(diff);
    }
    let avgGain = gains / (history.length - 1);
    let avgLoss = losses / (history.length - 1);
    if(avgLoss === 0) return 100;
    let rs = avgGain / avgLoss;
    return Math.round(100 - (100 / (1 + rs)));
}

function drawSparkline(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth || 200;
    canvas.height = 50;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const min = Math.min(...data); const max = Math.max(...data);
    const range = (max - min) || 1; const stepX = canvas.width / (data.length - 1);
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    for(let i=0; i<data.length; i++) {
        const x = i * stepX;
        const y = canvas.height - ((data[i] - min) / range * canvas.height * 0.8) - (canvas.height * 0.1);
        if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height);
    ctx.fillStyle = color.replace('1)', '0.2)'); ctx.fill();
}

let confirmCallback = null;
function showAlert(title, message, icon = '🚨') {
    document.getElementById('custom-alert-title').innerText = title;
    document.getElementById('custom-alert-message').innerText = message;
    document.getElementById('custom-alert-icon').innerText = icon;
    document.getElementById('custom-alert-modal').classList.remove('hidden');
}
function closeCustomAlert() { document.getElementById('custom-alert-modal').classList.add('hidden'); }
function showConfirm(title, message, icon, onConfirm) {
    document.getElementById('custom-confirm-title').innerText = title;
    document.getElementById('custom-confirm-message').innerText = message;
    document.getElementById('custom-confirm-icon').innerText = icon;
    confirmCallback = onConfirm;
    document.getElementById('custom-confirm-modal').classList.remove('hidden');
}
function closeCustomConfirm() { document.getElementById('custom-confirm-modal').classList.add('hidden'); confirmCallback = null; }
document.getElementById('custom-confirm-yes').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeCustomConfirm();
});

function logActivity(message, type = 'info', context = 'global') {
    const targetId = context === 'player' ? 'player-log' : (context === 'bot' ? 'bot-log' : 'global-log');
    const logList = document.getElementById(targetId);
    if (!logList) return;
    const time = `ด.${gameMonth}`;
    let colorClass = 'text-slate-300';
    if (type === 'income') colorClass = 'text-emerald-400';
    if (type === 'expense') colorClass = 'text-rose-400';
    if (type === 'system') colorClass = 'text-amber-400 font-bold';
    if (type === 'news') colorClass = 'text-indigo-300 font-bold';
    const entry = document.createElement('div');
    entry.className = `text-[10.5px] font-mono py-1.5 border-b border-slate-800/50 ${colorClass} leading-tight`;
    entry.innerHTML = `<span class="text-slate-500 mr-1">[${time}]</span> ${message}`;
    logList.appendChild(entry);
    logList.scrollTop = logList.scrollHeight;
}

function spawnFloatingText(elementId, amount) {
    const target = document.getElementById(elementId);
    if (!target) return;
    const floater = document.createElement('div');
    floater.className = 'floating-text ' + (amount >= 0 ? 'text-emerald-400' : 'text-rose-400');
    floater.innerText = (amount >= 0 ? '+' : '') + fmt(amount);
    const rect = target.getBoundingClientRect();
    floater.style.left = (rect.left + rect.width / 2 - 30) + 'px';
    floater.style.top = (rect.top - 10) + 'px';
    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 1500);
}

function setEventCard(title, desc, icon, showQuote = false) {
    document.getElementById('event-title').innerText = title;
    document.getElementById('event-desc').innerText = desc;
    document.getElementById('event-icon').innerText = icon;
    const quoteEl = document.getElementById('kiyosaki-quote');
    if(showQuote) {
        quoteEl.innerHTML = `<b>พ่อรวยสอนว่า:</b> "${kiyosakiQuotes[Math.floor(Math.random() * kiyosakiQuotes.length)]}"`;
        quoteEl.classList.remove('hidden');
    } else quoteEl.classList.add('hidden');
}

function showDealDecisions(deal) {
    document.getElementById('action-buttons').classList.add('hidden');
    document.getElementById('deal-decision-buttons').classList.remove('hidden');
    document.getElementById('doodad-decision-buttons').classList.add('hidden');
    document.getElementById('crisis-decision-buttons').classList.add('hidden');
    document.getElementById('deal-info').classList.remove('hidden');
    
    document.getElementById('deal-full-cost').innerText = fmt(deal.cost);
    
    // แสดงส่วนลดถ้าผู้เล่นอัปสกิลแล้ว
    let actualDp = player.isEducated ? Math.floor(deal.downPayment * 0.8) : deal.downPayment;
    let dpText = player.isEducated ? `<span class="text-fuchsia-400 text-xs font-normal mr-1">(ลด 20%)</span>${fmt(actualDp)}` : fmt(actualDp);
    document.getElementById('deal-downpayment').innerHTML = dpText;
    
    document.getElementById('deal-gross').innerText = '+' + fmt(deal.grossCashflow);
    document.getElementById('deal-mortgage-pay').innerText = '-' + fmt(deal.mortgagePayment);
    
    const cfEl = document.getElementById('deal-cashflow');
    cfEl.innerText = (deal.cashflow >= 0 ? '+' : '') + fmt(deal.cashflow);
    cfEl.className = deal.cashflow < 0 ? 'text-rose-400 font-bold text-sm bg-rose-900/30 px-2 py-0.5 rounded' : 'text-emerald-400 font-bold text-sm bg-emerald-900/30 px-2 py-0.5 rounded';
}

function showDoodadDecisions() {
    document.getElementById('action-buttons').classList.add('hidden');
    document.getElementById('deal-decision-buttons').classList.add('hidden');
    document.getElementById('doodad-decision-buttons').classList.remove('hidden');
    document.getElementById('crisis-decision-buttons').classList.add('hidden');
    document.getElementById('deal-info').classList.add('hidden');
}

function showCrisisDecisions() {
    document.getElementById('action-buttons').classList.add('hidden');
    document.getElementById('deal-decision-buttons').classList.add('hidden');
    document.getElementById('doodad-decision-buttons').classList.add('hidden');
    document.getElementById('crisis-decision-buttons').classList.remove('hidden');
    document.getElementById('deal-info').classList.add('hidden');
}

function hideDecisions() {
    if(!gameOver) {
        document.getElementById('action-buttons').classList.remove('hidden');
        const btnRoll = document.getElementById('btn-roll');
        if(btnRoll) { btnRoll.innerText = '🎲 ผ่านไป 1 เดือน'; btnRoll.disabled = false; }
    }
    document.getElementById('deal-decision-buttons').classList.add('hidden');
    document.getElementById('doodad-decision-buttons').classList.add('hidden');
    document.getElementById('crisis-decision-buttons').classList.add('hidden');
    document.getElementById('deal-info').classList.add('hidden');
}

function updateUI() {
    const safeSetText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

    // อัปเดต UI ผู้เล่น
    safeSetText('player-cash', fmt(player.cash));
    safeSetText('player-salary', fmt(player.salary));
    safeSetText('player-prof-debt', fmt(player.profDebt));
    safeSetText('player-bank-debt', fmt(player.bankDebt));
    safeSetText('player-credit-debt', fmt(player.creditDebt || 0));
    safeSetText('player-expenses', fmt(getExpenses(player)));
    safeSetText('player-passive', fmt(player.passive));
    
    if (player.isEducated) {
        document.getElementById('player-education-badge').classList.remove('hidden');
        const btnEd = document.getElementById('btn-educate');
        if(btnEd) { btnEd.disabled = true; btnEd.innerText = "🎓 อัปสกิลแล้ว"; btnEd.classList.replace('bg-fuchsia-900/40', 'bg-slate-800'); btnEd.classList.replace('text-fuchsia-300', 'text-slate-500'); }
    }
    
    const netCashflowPlayer = (player.salary + player.passive) - getExpenses(player);
    const netElPlayer = document.getElementById('player-net-cashflow');
    if(netElPlayer) {
        netElPlayer.innerText = fmt(netCashflowPlayer);
        netElPlayer.className = netCashflowPlayer >= 0 ? "text-blue-400 font-bold" : "text-rose-400 font-bold";
    }
    
    let pProg = Math.min((player.passive / (getExpenses(player) || 1)) * 100, 100) || 0;
    const pProgEl = document.getElementById('player-progress');
    const pProgTxt = document.getElementById('player-progress-text');
    if(pProgEl) pProgEl.style.width = pProg + '%';
    if(pProgTxt) pProgTxt.innerText = pProg.toFixed(1) + '%';
    if(pProg >= 100 && player.profDebt === 0 && pProgEl) {
        pProgEl.classList.add('glow-pulse');
    }

    // อัปเดต UI บอท
    safeSetText('bot-cash', fmt(bot.cash));
    safeSetText('bot-salary', fmt(bot.salary));
    safeSetText('bot-prof-debt', fmt(bot.profDebt));
    safeSetText('bot-bank-debt', fmt(bot.bankDebt));
    safeSetText('bot-credit-debt', fmt(bot.creditDebt || 0));
    safeSetText('bot-expenses', fmt(getExpenses(bot)));
    safeSetText('bot-passive', fmt(bot.passive));
    
    if (bot.isEducated) {
        document.getElementById('bot-education-badge').classList.remove('hidden');
    }
    
    const netCashflowBot = (bot.salary + bot.passive) - getExpenses(bot);
    const netElBot = document.getElementById('bot-net-cashflow');
    if(netElBot) {
        netElBot.innerText = fmt(netCashflowBot);
        netElBot.className = netCashflowBot >= 0 ? "text-blue-400 font-bold" : "text-rose-400 font-bold";
    }
    
    let bProg = Math.min((bot.passive / (getExpenses(bot) || 1)) * 100, 100) || 0;
    const bProgEl = document.getElementById('bot-progress');
    const bProgTxt = document.getElementById('bot-progress-text');
    if(bProgEl) bProgEl.style.width = bProg + '%';
    if(bProgTxt) bProgTxt.innerText = bProg.toFixed(1) + '%';

    safeSetText('game-month', `เดือนที่ ${gameMonth} (ปีที่ ${Math.ceil(gameMonth/12)})`);

    if (typeof checkWinCondition === 'function') checkWinCondition();
}

function openBankModal() { if(!gameOver && !isAnimating) document.getElementById('bank-modal').classList.remove('hidden'); }
function closeBankModal() { document.getElementById('bank-modal').classList.add('hidden'); }

function openStatementModal(target) {
    if(gameOver || isAnimating) return;
    const actor = target === 'player' ? player : bot;
    document.getElementById('stmt-title').innerHTML = target === 'player' ? '📊 งบการเงินของคุณ (Player)' : '🤖 งบการเงินของบอท (AI)';
    
    const profInt = Math.floor((actor.profDebt * 0.025) / 12);
    const bankInt = Math.floor(actor.bankDebt * 0.02); 
    const creditInt = Math.floor((actor.creditDebt || 0) * 0.05); 
    const mortgageExp = actor.assets ? actor.assets.reduce((sum, asset) => sum + (asset.mortgagePayment || 0), 0) : 0;
    
    const totalInc = actor.salary + actor.passive;
    const totalExp = actor.baseExpenses + profInt + bankInt + creditInt + mortgageExp;
    const net = totalInc - totalExp;

    document.getElementById('stmt-salary').innerText = fmt(actor.salary);
    document.getElementById('stmt-passive').innerText = fmt(actor.passive);
    document.getElementById('stmt-total-inc').innerText = fmt(totalInc);
    
    document.getElementById('stmt-base-exp').innerText = fmt(actor.baseExpenses);
    document.getElementById('stmt-prof-int').innerText = fmt(profInt);
    document.getElementById('stmt-bank-int').innerText = fmt(bankInt);
    document.getElementById('stmt-credit-int').innerText = fmt(creditInt);
    document.getElementById('stmt-mortgage-exp').innerText = fmt(mortgageExp);
    document.getElementById('stmt-total-exp').innerText = fmt(totalExp);
    
    const netEl = document.getElementById('stmt-net');
    netEl.innerText = fmt(net);
    netEl.className = net >= 0 ? "text-emerald-400 font-bold text-lg font-mono text-right" : "text-rose-400 font-bold text-lg font-mono text-right";
    document.getElementById('statement-modal').classList.remove('hidden');
}
function closeStatementModal() { document.getElementById('statement-modal').classList.add('hidden'); }

function openQuickPayModal(type) {
    if(gameOver || isAnimating) return;
    let debtAmount = 0;
    if (type === 'bank') debtAmount = player.bankDebt;
    else if (type === 'prof') debtAmount = player.profDebt;
    else if (type === 'credit') debtAmount = player.creditDebt || 0;
    
    if (debtAmount <= 0) return showAlert('ข้อมูล', 'คุณไม่มีหนี้ประเภทนี้คงค้าง', '✅');

    currentQuickPayType = type;
    if (type === 'bank') {
        document.getElementById('qp-title').innerHTML = '💸 โปะหนี้ฉุกเฉิน (Bank)';
        document.getElementById('qp-desc').innerText = 'ลดภาระดอกเบี้ยมหาโหด 2% ต่อเดือน';
    } else if (type === 'prof') {
        document.getElementById('qp-title').innerHTML = '🎓 โปะหนี้อาชีพ (Prof.)';
        document.getElementById('qp-desc').innerText = 'เคลียร์ให้เป็น 0 เพื่อเอาชนะเกม!';
    } else {
        document.getElementById('qp-title').innerHTML = '💳 โปะหนี้บัตรเครดิต';
        document.getElementById('qp-desc').innerText = 'ลดยอดผ่อนขั้นต่ำ 5% ต่อเดือน';
    }
    
    document.getElementById('qp-debt-amount').innerText = fmt(debtAmount);
    document.getElementById('qp-cash-amount').innerText = fmt(player.cash);
    document.getElementById('qp-input').value = '';
    
    closeBankModal();
    document.getElementById('quickpay-modal').classList.remove('hidden');
}
function closeQuickPayModal() { document.getElementById('quickpay-modal').classList.add('hidden'); currentQuickPayType = ''; }

function openPortfolioModal(target = 'player') {
    if(gameOver || isAnimating) return;
    const list = document.getElementById('portfolio-list');
    const title = document.getElementById('portfolio-title');
    list.innerHTML = '';
    
    const targetData = target === 'player' ? player : bot;
    title.innerText = target === 'player' ? '💼 พอร์ตการลงทุนของคุณ' : '🤖 พอร์ตการลงทุนของบอท';
    
    if (targetData.assets.length === 0) {
        list.innerHTML = '<div class="text-center text-slate-500 py-4">ไม่มีสินทรัพย์ในพอร์ตเลย</div>';
    } else {
        let realEstateHTML = '';
        let marketHTML = '';

        targetData.assets.forEach((asset, index) => {
            let val = 0;
            if (asset.type === 'bank') val = asset.buyPrice; 
            else if (asset.type === 'inv') val = Math.round(market.invPrice * asset.units);
            else if (asset.type === 'gold') val = Math.round(market.goldPrice * asset.units);
            else if (asset.type === 'btc') val = Math.round(market.btcPrice * asset.units);
            else val = Math.floor(asset.buyPrice * ((Math.random() * 0.6) + 0.7)); 
            
            let mortgage = asset.mortgage || 0;
            let mortgagePayment = asset.mortgagePayment || 0;
            let netProceeds = val - mortgage;
            
            const profit = netProceeds - (asset.downPayment || asset.buyPrice);
            const profitStr = profit >= 0 ? `<span class="text-emerald-400 text-[10px]">(กำไร +${fmt(profit)})</span>` : `<span class="text-rose-400 text-[10px]">(ขาดทุน ${fmt(profit)})</span>`;
            
            const sellBtnHTML = target === 'player' ? `<button onclick="sellAsset(${index}, ${val})" class="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow mt-2 md:mt-0">สั่งขายรับส่วนต่าง</button>` : '';

            if (asset.type === 'realestate' || asset.type === 'business' || asset.type === 'land') {
                realEstateHTML += `
                    <div class="bg-slate-800 p-3 rounded border ${asset.type==='land' ? 'border-amber-700' : 'border-amber-500/30'} flex flex-col gap-2">
                        <div class="flex flex-col md:flex-row justify-between items-start">
                            <div>
                                <div class="font-bold text-white text-sm">${asset.name} <span class="text-emerald-400 text-[10px] font-normal border border-emerald-500/30 px-1 rounded ml-1">Gross CF: +${fmt(asset.grossCashflow)}/ด</span></div>
                                <div class="text-[11px] text-slate-400 mt-1">เงินดาวน์ (จ่ายจริง): ${fmt(asset.downPayment)}</div>
                                <div class="text-[11px] text-amber-400">มูลค่ารับซื้อ (หักหนี้แล้ว): ${fmt(netProceeds)} ${profitStr}</div>
                            </div>
                            <div class="mt-2 md:mt-0 w-full md:w-auto">${sellBtnHTML}</div>
                        </div>
                        ${mortgage > 0 ? `
                        <div class="bg-slate-900/80 p-2 rounded border border-rose-500/20 mt-1 flex flex-col md:flex-row justify-between items-center gap-2">
                            <div class="w-full">
                                <div class="text-[11px] text-rose-400">⚠️ หนี้บ้าน/ธุรกิจ คงค้าง: ${fmt(mortgage)}</div>
                                <div class="text-[10px] text-slate-500">ยอดส่งแบงก์ต่อเดือน: ${fmt(mortgagePayment)}</div>
                            </div>
                            ${target === 'player' ? `<button onclick="payOffMortgage(${index})" class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow transition-colors whitespace-nowrap">โปะหนี้แบงก์</button>` : ''}
                        </div>
                        ` : `
                        <div class="bg-slate-900/80 p-2 rounded border border-emerald-500/20 mt-1 text-center md:text-left">
                            <span class="text-xs text-emerald-400 font-bold">✅ ปลอดหนี้ (Free & Clear) ทำให้รายจ่ายคุณลดลง!</span>
                        </div>
                        `}
                    </div>
                `;
            } else {
                marketHTML += `
                    <div class="bg-slate-800 p-3 rounded border border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div class="w-full">
                            <div class="font-bold text-white text-sm">${asset.name} <span class="text-emerald-400 text-[10px] font-normal border border-emerald-500/30 px-1 rounded ml-1">CF: +${fmt(asset.grossCashflow)}/ด</span></div>
                            <div class="text-[11px] text-slate-400 mt-1">ต้นทุน: ${fmt(asset.buyPrice)}</div>
                            <div class="text-[11px] text-indigo-300">มูลค่าตลาดตอนนี้: ${fmt(val)} ${profitStr}</div>
                        </div>
                        <div class="w-full md:w-auto mt-1 md:mt-0">${sellBtnHTML}</div>
                    </div>
                `;
            }
        });

        if (realEstateHTML) {
            list.innerHTML += `<h4 class="text-amber-400 font-bold mb-2 border-b border-slate-700 pb-1 mt-1">🏢 สินทรัพย์จับต้องได้ (อสังหาฯ, ธุรกิจ, ที่ดิน)</h4>${realEstateHTML}`;
        }
        if (marketHTML) {
            list.innerHTML += `<h4 class="text-indigo-400 font-bold mb-2 border-b border-slate-700 pb-1 ${realEstateHTML ? 'mt-4' : 'mt-1'}">📈 สินทรัพย์กระดาษ (หุ้น, ทอง, คริปโต)</h4>${marketHTML}`;
        }
    }
    document.getElementById('portfolio-modal').classList.remove('hidden');
}
function closePortfolioModal() { document.getElementById('portfolio-modal').classList.add('hidden'); }

function openMarketModal() { 
    if(gameOver || isAnimating) return; 
    document.getElementById('market-modal').classList.remove('hidden'); 
    setTimeout(() => {
        drawSparkline('chart-inv', market.history.inv, 'rgba(52, 211, 153, 1)'); 
        drawSparkline('chart-gold', market.history.gold, 'rgba(230, 194, 122, 1)'); 
        drawSparkline('chart-btc', market.history.btc, 'rgba(251, 146, 60, 1)'); 
    }, 100);
}

function closeMarketModal() { document.getElementById('market-modal').classList.add('hidden'); }