// ./asset/js/cashflow_menus.js

let currentTutorialSlide = 1;

window.onload = () => {
    if (!localStorage.getItem('cashflow_tutorial')) {
        openTutorial();
    }
};

function openTutorial() {
    document.getElementById('tutorial-modal').classList.remove('hidden');
    document.getElementById('tutorial-modal').classList.add('flex');
    showTutorialSlide(1);
}

function closeTutorial() {
    localStorage.setItem('cashflow_tutorial', 'true');
    document.getElementById('tutorial-modal').classList.add('hidden');
    document.getElementById('tutorial-modal').classList.remove('flex');
}

function changeTutorialSlide(direction) {
    showTutorialSlide(currentTutorialSlide + direction);
}

function showTutorialSlide(n) {
    const totalSlides = 4;
    if (n < 1) n = 1;
    if (n > totalSlides) {
        closeTutorial();
        return;
    }
    
    currentTutorialSlide = n;
    
    for (let i = 1; i <= totalSlides; i++) {
        document.getElementById(`slide-${i}`).classList.add('hidden');
    }
    document.getElementById(`slide-${currentTutorialSlide}`).classList.remove('hidden');
    
    const btnPrev = document.getElementById('btn-tut-prev');
    if (currentTutorialSlide === 1) {
        btnPrev.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        btnPrev.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    const btnNext = document.getElementById('btn-tut-next');
    if (currentTutorialSlide === totalSlides) {
        btnNext.innerText = "เริ่มเกม!";
        btnNext.classList.replace('bg-blue-600', 'bg-emerald-600');
        btnNext.classList.replace('hover:bg-blue-500', 'hover:bg-emerald-500');
    } else {
        btnNext.innerText = "ถัดไป";
        btnNext.classList.replace('bg-emerald-600', 'bg-blue-600');
        btnNext.classList.replace('hover:bg-emerald-500', 'hover:bg-blue-500');
    }

    const dotsContainer = document.getElementById('tut-dots');
    dotsContainer.innerHTML = '';
    for (let i = 1; i <= totalSlides; i++) {
        let dotClass = i === currentTutorialSlide ? 'bg-blue-500 w-3 h-3' : 'bg-slate-600 w-2 h-2';
        dotsContainer.innerHTML += `<div class="rounded-full transition-all duration-300 ${dotClass}"></div>`;
    }
}

function updateUI() {
    // 🌟 1. ตรวจสอบสถานะล้มละลายทันทีที่ UpdateUI
    let pBkr = gameEngine.checkBankruptcy(player);
    if (pBkr) {
        if(pBkr === 'liquidity_crash') return window.endGame('bankrupt_liquidity');
        if(pBkr === 'over_leveraged') return window.endGame('bankrupt_dsr');
    }

    uiManager.safeSetText('player-cash', fmt(player.cash)); 
    document.getElementById('player-cash').className = player.cash >= 0 ? "text-2xl font-mono font-bold text-emerald-400 transition-colors duration-300" : "text-2xl font-mono font-bold text-rose-500 transition-colors duration-300";

    // 🌟 2. อัปเดตเงินเดือน (กรณี Layoff) และโชว์คำเตือนบนหน้าปัด Player
    let pEffSalary = player.salary;
    if (player.layoffMonths > 0) {
        let hasSS = player.insurances.some(i => i.id === 'ins_social');
        pEffSalary = hasSS ? Math.floor(player.salary * 0.5) : 0;
        uiManager.safeSetText('player-salary', `฿${fmt(pEffSalary)} (ชดเชย)`);
    } else {
        uiManager.safeSetText('player-salary', fmt(player.salary));
    }

    // 🌟 3. แสดง Badge แจ้งเตือน DSR/Layoff
    let warningHtml = '';
    if (player.dsrMonths > 0) warningHtml += `<div class="text-[10px] text-white bg-rose-600 px-2 py-1 rounded animate-pulse text-center mb-2">⚠️ ภาระหนี้ NPL เกิน 150% (เดือนที่ ${player.dsrMonths}/3)</div>`;
    if (player.layoffMonths > 0) warningHtml += `<div class="text-[10px] text-white bg-orange-600 px-2 py-1 rounded animate-pulse text-center mb-2">💼 ว่างงาน! (เหลืออีก ${player.layoffMonths} เดือน)</div>`;
    
    let warnContainer = document.getElementById('player-warnings');
    if (!warnContainer) {
        warnContainer = document.createElement('div');
        warnContainer.id = 'player-warnings';
        document.getElementById('cash-display').parentNode.insertBefore(warnContainer, document.getElementById('cash-display'));
    }
    warnContainer.innerHTML = warningHtml;

    // 🌟 4. ล็อกปุ่มทอยเต๋า ถ้าเงินช็อต
    const btnRoll = document.getElementById('btn-roll');
    if (btnRoll && !gameEngine.gameOver) {
        if (player.cash < 0) {
            btnRoll.disabled = true;
            btnRoll.innerText = '❌ เงินสดช็อต! กู้เงินหรือขายสินทรัพย์ด่วน';
            btnRoll.className = 'w-full py-4 rounded-lg font-bold text-sm tracking-widest shadow-lg bg-rose-600 text-white cursor-not-allowed';
        } else {
            btnRoll.disabled = false;
            btnRoll.innerText = '🎴 จั่วการ์ด (1 เดือน)';
            btnRoll.className = 'btn-gold-outline w-full py-4 rounded-lg font-bold text-sm tracking-widest shadow-lg';
        }
    }

    uiManager.safeSetText('player-prof-debt', fmt(player.profDebt)); uiManager.safeSetText('player-bank-debt', fmt(player.bankDebt)); uiManager.safeSetText('player-credit-debt', fmt(player.creditDebt || 0)); uiManager.safeSetText('player-expenses', fmt(player.getExpenses())); uiManager.safeSetText('player-passive', fmt(player.passive));
    
    if (player.isEducated) document.getElementById('player-education-badge').classList.remove('hidden'); 
    if (player.hasSelfCustody) document.getElementById('player-custody-badge').classList.remove('hidden');
    
    const btnEd = document.getElementById('btn-educate-main'); 
    if(btnEd && (player.isEducated || player.hasSelfCustody)) { 
        btnEd.className = "bg-emerald-900/40 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-300 text-xs py-2 rounded font-bold transition-colors shadow-md"; 
        btnEd.innerText = "🎓 ดูสกิลของคุณ"; 
    } 
    
    let insCost = player.insurances.reduce((s, i) => s + i.premium, 0);
    uiManager.safeSetText('stmt-insurance-exp', fmt(insCost));

    const pNet = (pEffSalary + player.passive) - player.getExpenses(); const pNetEl = document.getElementById('player-net-cashflow'); if(pNetEl) { pNetEl.innerText = fmt(pNet); pNetEl.className = pNet >= 0 ? "text-blue-400 font-bold" : "text-rose-400 font-bold"; }
    let pProg = Math.min((player.passive / (player.getExpenses() || 1)) * 100, 100) || 0; const pProgEl = document.getElementById('player-progress'); if(pProgEl) pProgEl.style.width = pProg + '%'; uiManager.safeSetText('player-progress-text', pProg.toFixed(1) + '%'); 
    
    const isPlayerWinReady = (player.passive > player.getExpenses() && pNet > 0 && player.profDebt === 0 && player.bankDebt === 0 && (!player.creditDebt || player.creditDebt === 0));
    if(isPlayerWinReady && pProgEl) pProgEl.classList.add('glow-pulse');

    uiManager.safeSetText('bot-cash', fmt(bot.cash)); uiManager.safeSetText('bot-salary', fmt(bot.salary)); uiManager.safeSetText('bot-prof-debt', fmt(bot.profDebt)); uiManager.safeSetText('bot-bank-debt', fmt(bot.bankDebt)); uiManager.safeSetText('bot-credit-debt', fmt(bot.creditDebt || 0)); uiManager.safeSetText('bot-expenses', fmt(bot.getExpenses())); uiManager.safeSetText('bot-passive', fmt(bot.passive));
    
    document.getElementById('bot-cash').className = bot.cash >= 0 ? "text-2xl font-mono font-bold text-emerald-400 transition-colors duration-300" : "text-2xl font-mono font-bold text-rose-500 transition-colors duration-300";

    if (bot.isEducated) document.getElementById('bot-education-badge').classList.remove('hidden');
    if (bot.hasSelfCustody) document.getElementById('bot-custody-badge').classList.remove('hidden');

    let bEffSalary = bot.layoffMonths > 0 ? (bot.insurances.some(i=>i.id==='ins_social') ? Math.floor(bot.salary*0.5) : 0) : bot.salary;
    const bNet = (bEffSalary + bot.passive) - bot.getExpenses(); const bNetEl = document.getElementById('bot-net-cashflow'); if(bNetEl) { bNetEl.innerText = fmt(bNet); bNetEl.className = bNet >= 0 ? "text-blue-400 font-bold" : "text-rose-400 font-bold"; }
    let bProg = Math.min((bot.passive / (bot.getExpenses() || 1)) * 100, 100) || 0; const bProgEl = document.getElementById('bot-progress'); if(bProgEl) bProgEl.style.width = bProg + '%'; uiManager.safeSetText('bot-progress-text', bProg.toFixed(1) + '%');

    uiManager.safeSetText('game-month', `เดือนที่ ${gameEngine.gameMonth} (ปีที่ ${Math.ceil(gameEngine.gameMonth/12)})`);
    checkWinCondition();
}

function openSkillsModal() {
    if(gameEngine.gameOver || gameEngine.isAnimating) return;
    if(gameEngine.currentSharedEvent && gameEngine.currentSharedEvent.type === 'crisis') return showAlert('❌ ไม่อนุญาต', 'ไม่สามารถอัปสกิลได้ในขณะเกิดวิกฤต (สายเกินไปแล้ว)!', '⚠️');

    const btn1 = document.getElementById('btn-buy-skill-1');
    if (player.isEducated) {
        btn1.disabled = true;
        btn1.innerText = 'เรียนรู้แล้ว';
        btn1.className = 'w-full sm:w-auto bg-slate-700 text-slate-400 py-1.5 px-4 rounded text-xs font-bold shadow-md cursor-not-allowed';
    }
    
    const btn2 = document.getElementById('btn-buy-skill-selfcustody');
    if (player.hasSelfCustody && btn2) {
        btn2.disabled = true;
        btn2.innerText = 'เรียนรู้แล้ว';
        btn2.className = 'w-full sm:w-auto bg-slate-700 text-slate-400 py-1.5 px-4 rounded text-xs font-bold shadow-md cursor-not-allowed';
    }
    document.getElementById('skills-modal').classList.remove('hidden');
}
function closeSkillsModal() { document.getElementById('skills-modal').classList.add('hidden'); }

function openInsuranceModal() {
    if(gameEngine.gameOver || gameEngine.isAnimating) return;
    const list = document.getElementById('insurance-list');
    list.innerHTML = '';
    
    INSURANCE_CONTENT.forEach(ins => {
        let premiumAmt = ins.premium;
        // 🌟 คำนวณเบี้ยประกันสังคม 5% อัตโนมัติตามเงินเดือนอาชีพ (Max 2500, Min 500)
        if (ins.id === 'ins_social') {
            premiumAmt = Math.max(500, Math.min(2500, Math.floor(player.salary * 0.05)));
            ins.premium = premiumAmt; 
        }

        const hasIns = player.insurances.some(i => i.id === ins.id);
        list.innerHTML += `
            <div class="bg-slate-800 border border-slate-600 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h4 class="font-bold text-white mb-1">${ins.name}</h4>
                    <p class="text-[11px] text-slate-400">${ins.desc}</p>
                </div>
                <div class="flex flex-col items-end w-full md:w-auto mt-2 md:mt-0">
                    <span class="text-rose-400 font-bold font-mono text-sm mb-2">-${fmt(premiumAmt)}/ด</span>
                    ${hasIns 
                        ? `<button onclick="cancelInsurance('${ins.id}')" class="w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white py-1 px-3 rounded text-xs font-bold transition-colors">ยกเลิกกรมธรรม์</button>`
                        : `<button onclick="buyInsurance('${ins.id}')" class="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white py-1 px-4 rounded text-xs font-bold shadow-md transition-colors">ซื้อประกัน</button>`
                    }
                </div>
            </div>
        `;
    });
    document.getElementById('insurance-modal').classList.remove('hidden');
}
function closeInsuranceModal() { document.getElementById('insurance-modal').classList.add('hidden'); }

function openBankModal() { 
    if(gameEngine.gameOver || gameEngine.isAnimating) return; 
    if(gameEngine.currentSharedEvent && gameEngine.currentSharedEvent.type === 'crisis') return showAlert('❌ ธนาคารระงับการกู้', 'ธนาคารระงับการอนุมัติสินเชื่อทุกประเภทในช่วงวิกฤตเศรษฐกิจ!', '🏦');
    
    document.getElementById('bank-modal').classList.remove('hidden'); 
}
function closeBankModal() { document.getElementById('bank-modal').classList.add('hidden'); }

function openStatementModal(t) { 
    if(gameEngine.gameOver || gameEngine.isAnimating) return; 
    const act = t === 'player' ? player : bot; 
    document.getElementById('stmt-title').innerHTML = t === 'player' ? '📊 งบการเงินของคุณ (Player)' : '🤖 งบการเงินของบอท (AI)'; 
    
    let effSalary = act.layoffMonths > 0 ? (act.insurances.some(i=>i.id==='ins_social') ? Math.floor(act.salary*0.5) : 0) : act.salary;
    const totalInc = effSalary + act.passive; 
    const totalExp = act.getExpenses(); 
    
    uiManager.safeSetText('stmt-salary', fmt(effSalary)); 
    uiManager.safeSetText('stmt-passive', fmt(act.passive)); 
    uiManager.safeSetText('stmt-total-inc', fmt(totalInc)); 
    uiManager.safeSetText('stmt-base-exp', fmt(act.baseExpenses)); 

    let bd = act.expenseBreakdown;
    if (bd) {
        document.getElementById('stmt-breakdown-container').innerHTML = `
            <div class="text-[11px] text-slate-400 ml-4 mb-2 border-l border-slate-700 pl-2 space-y-0.5">
                <div class="flex justify-between"><span>- ค่าอาหาร:</span> <span>${fmt(bd.food)}</span></div>
                <div class="flex justify-between"><span>- ค่าที่พัก:</span> <span>${fmt(bd.housing)}</span></div>
                <div class="flex justify-between"><span>- ค่าเดินทาง:</span> <span>${fmt(bd.transport)}</span></div>
                <div class="flex justify-between"><span>- จิปาถะ:</span> <span>${fmt(bd.personal)}</span></div>
            </div>
        `;
    }

    uiManager.safeSetText('stmt-prof-int', fmt(Math.floor((act.profDebt*0.025)/12))); 
    uiManager.safeSetText('stmt-bank-int', fmt(Math.floor(act.bankDebt*gameEngine.bankInterestRate))); 
    uiManager.safeSetText('stmt-credit-int', fmt(Math.floor(Math.max(0, (act.creditDebt||0)-(act.creditGrace||0))*0.023))); 
    uiManager.safeSetText('stmt-mortgage-exp', fmt(act.assets?act.assets.reduce((s,a)=>s+(a.mortgagePayment||0),0):0)); 
    uiManager.safeSetText('stmt-tax-exp', fmt(act.currentTax)); 
    uiManager.safeSetText('stmt-total-exp', fmt(totalExp)); 
    
    const net = document.getElementById('stmt-net'); 
    net.innerText = fmt(totalInc - totalExp); 
    net.className = (totalInc - totalExp) >= 0 ? "text-emerald-400 font-bold text-lg font-mono text-right" : "text-rose-400 font-bold text-lg font-mono text-right"; 
    
    document.getElementById('statement-modal').classList.remove('hidden'); 
}
function closeStatementModal() { document.getElementById('statement-modal').classList.add('hidden'); }

function openQuickPayModal(t) { if(gameEngine.gameOver || gameEngine.isAnimating) return; let debt = t==='bank'?player.bankDebt:(t==='prof'?player.profDebt:player.creditDebt||0); if (debt <= 0) return showAlert('ข้อมูล', 'คุณไม่มีหนี้ประเภทนี้คงค้าง', '✅'); gameEngine.currentQuickPayType = t; uiManager.safeSetText('qp-title', t==='bank'?'💸 โปะหนี้ฉุกเฉิน (Bank)':(t==='prof'?'🎓 โปะหนี้อาชีพ (Prof.)':'💳 โปะหนี้บัตรเครดิต')); uiManager.safeSetText('qp-desc', t==='bank'?`ลดภาระดอกเบี้ยมหาโหด ${(gameEngine.bankInterestRate*100).toFixed(2)}% ต่อเดือน`:(t==='prof'?'เคลียร์ให้เป็น 0 เพื่อเอาชนะเกม!':'โปะก่อนจบเดือน จะไม่โดนดอกเบี้ย 2.3%')); uiManager.safeSetText('qp-debt-amount', fmt(debt)); uiManager.safeSetText('qp-cash-amount', fmt(player.cash)); document.getElementById('qp-input').value = ''; closeBankModal(); document.getElementById('quickpay-modal').classList.remove('hidden'); }
function closeQuickPayModal() { document.getElementById('quickpay-modal').classList.add('hidden'); gameEngine.currentQuickPayType = ''; }

function openMarketModal() { 
    if(gameEngine.gameOver || gameEngine.isAnimating) return; 
    if(gameEngine.currentSharedEvent && gameEngine.currentSharedEvent.type === 'crisis') return showAlert('❌ ตลาดปิดชั่วคราว', 'ตลาดทุนพังทลายและถูกระงับการซื้อขายชั่วคราว (Circuit Breaker)! คุณทำได้แค่ "เทขาย" จากหน้าพอร์ตเท่านั้น', '📉');
    
    document.getElementById('market-modal').classList.remove('hidden'); 
}
function closeMarketModal() { document.getElementById('market-modal').classList.add('hidden'); }

function setPortfolioTab(tab) {
    currentPortfolioTab = tab;
    ['all', 'physical', 'paper', 'escrow'].forEach(t => {
        let el = document.getElementById(`tab-${t}`);
        if(el) {
            el.className = t === tab ? "whitespace-nowrap px-4 py-1.5 bg-amber-600 text-white rounded text-xs font-bold shadow transition-colors" : "whitespace-nowrap px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded text-xs font-bold transition-colors";
        }
    });
    renderPortfolioList();
}
function searchPortfolio(query) { portfolioSearchQuery = query.toLowerCase(); renderPortfolioList(); }
function openPortfolioModal(t = 'player') { 
    if(gameEngine.gameOver || gameEngine.isAnimating) return; 
    portfolioTarget = t; currentPortfolioTab = 'all'; portfolioSearchQuery = '';
    let searchEl = document.getElementById('portfolio-search'); if(searchEl) searchEl.value = '';
    setPortfolioTab('all'); document.getElementById('portfolio-modal').classList.remove('hidden'); 
}

function renderPortfolioList() {
    const list = document.getElementById('portfolio-list'); list.innerHTML = ''; 
    const act = portfolioTarget === 'player' ? player : bot; 
    uiManager.safeSetText('portfolio-title', portfolioTarget === 'player' ? '💼 พอร์ตการลงทุนของคุณ' : '🤖 พอร์ตการลงทุนของบอท'); 

    let filteredEscrows = (act.escrows || []).filter(e => e.name.toLowerCase().includes(portfolioSearchQuery));
    let filteredAssets = act.assets.filter(a => a.name.toLowerCase().includes(portfolioSearchQuery));

    let sumPhysical = 0;
    let sumLiquid = 0;
    let sumEscrow = 0;

    let escrowHTML = '';
    if (filteredEscrows.length > 0) {
        escrowHTML = `<h4 class="text-amber-400 font-bold mb-2 border-b border-slate-700 pb-1 mt-2 flex items-center gap-2">⏳ รอทำสัญญา (Escrow) <span class="bg-amber-900/50 text-amber-200 px-2 py-0.5 rounded text-[10px]">${filteredEscrows.length} รายการ</span></h4>`;
        filteredEscrows.forEach(esc => {
            sumEscrow += esc.amount; 
            escrowHTML += `<div class="bg-slate-800/80 p-3 rounded border border-amber-500/50 flex justify-between items-center mb-2 shadow-inner">
                <div><div class="font-bold text-slate-300 text-sm">${esc.name}</div><div class="text-[11px] text-amber-400">เงินสุทธิที่จะได้รับ: ${fmt(esc.amount)}</div></div>
                <div class="bg-slate-900 px-3 py-1.5 rounded text-xs font-bold text-amber-500 border border-amber-700/50 animate-pulse">รออีก ${esc.monthsLeft} เดือน</div>
            </div>`;
        });
    }

    let isCrisis = gameEngine.currentSharedEvent && gameEngine.currentSharedEvent.type === 'crisis';

    let reHTML = ''; let mHTML = ''; 
    filteredAssets.forEach((a) => { 
        let originalIndex = act.assets.indexOf(a);
        
        let isPaidOff = (a.type === 'installment' && a.monthsLeft <= 0);
        let val = 0; 
        if(a.type==='bank') val=a.buyPrice;
        else if(a.type==='inv') val=Math.round(market.invPrice*a.units);
        else if(a.type==='gold') val=Math.round(market.goldPrice*a.units);
        else if(a.type==='btc') val=Math.round(market.btcPrice*a.units);
        else if(a.type==='installment') val=a.salvage;
        else {
            let multiplier = isCrisis ? ((Math.random()*0.2) + 0.3) : ((Math.random()*0.6)+0.7);
            val = Math.floor(a.buyPrice * multiplier);
        }

        let mortgage=a.mortgage||0; 
        let netProceeds=val-mortgage; 
        let isPhysical = ['realestate', 'business', 'land'].includes(a.type);
        
        let brokerFee = isPhysical ? Math.floor(val * 0.05) : 0; 
        let costBasis = a.downPayment || a.buyPrice; 
        let preTaxProfit = netProceeds - costBasis; 
        let capGainsTax = preTaxProfit > 0 ? Math.floor(preTaxProfit * 0.15) : 0;
        
        let finalNet = netProceeds - brokerFee - capGainsTax; 
        let finalProfit = finalNet - costBasis;
        
        if (a.type === 'installment') {
            if (isPaidOff) sumPhysical += val; 
        } else {
            if (isPhysical) sumPhysical += finalNet;
            else sumLiquid += finalNet;
        }

        let showThis = true;
        if (currentPortfolioTab === 'physical' && !['realestate', 'business', 'land', 'installment'].includes(a.type)) showThis = false;
        if (currentPortfolioTab === 'paper' && !['bank', 'inv', 'gold', 'btc'].includes(a.type)) showThis = false;
        if (currentPortfolioTab === 'escrow') showThis = false;

        if (showThis) {
            if (a.type === 'installment') {
                let statusText = isPaidOff ? `<span class="text-emerald-400 font-bold">✅ ผ่อนหมดแล้ว (ปลอดภาระ)</span>` : `<span class="text-rose-400 font-bold">⏳ กำลังผ่อน (เหลือ ${a.monthsLeft} เดือน)</span>`;
                let sellBtnHTML = '';
                
                if (portfolioTarget === 'player') {
                    if (isPaidOff) sellBtnHTML = `<button onclick="sellAsset(${originalIndex}, ${val})" class="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow mt-2 md:mt-0">ขายเป็นของมือสอง</button>`;
                    else sellBtnHTML = `<button class="w-full md:w-auto bg-slate-700 text-slate-500 px-3 py-1.5 rounded text-xs font-bold mt-2 md:mt-0 cursor-not-allowed" disabled>ยังผ่อนไม่หมด</button>`;
                }
                reHTML += `<div class="bg-slate-800 p-3 rounded border border-rose-500/30 flex flex-col gap-2"><div class="flex flex-col md:flex-row justify-between items-start"><div><div class="font-bold text-white text-sm">${a.name}</div><div class="text-[11px] mt-1">${statusText}</div>${!isPaidOff ? `<div class="text-[11px] text-rose-400">ภาระผ่อน: ${fmt(a.monthly)}/เดือน</div>` : ''}<div class="text-[11px] text-amber-400 mt-1">ราคาประเมินมือสอง: ${fmt(val)}</div></div><div class="mt-2 md:mt-0 w-full md:w-auto">${sellBtnHTML}</div></div></div>`;
            } else {
                let pfStr = finalProfit >= 0 ? `<span class="text-emerald-400 text-[10px]">(กำไรสุทธิ +${fmt(finalProfit)})</span>` : `<span class="text-rose-400 text-[10px]">(ขาดทุนสุทธิ ${fmt(finalProfit)})</span>`; 
                let btn = portfolioTarget==='player' ? `<button onclick="sellAsset(${originalIndex}, ${val})" class="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow mt-2 md:mt-0">สั่งขาย</button>` : ''; 
                let buff = a.buff!=='none' ? `<div class="text-[10px] text-fuchsia-400 mt-1"> ${a.buffDesc}</div>` : ''; 

                if(isPhysical) { 
                    reHTML+=`<div class="bg-slate-800 p-3 rounded border ${a.type==='land'?'border-amber-700':'border-amber-500/30'} flex flex-col gap-2"><div class="flex flex-col md:flex-row justify-between items-start"><div><div class="font-bold text-white text-sm">${a.name} <span class="text-emerald-400 text-[10px] font-normal border border-emerald-500/30 px-1 rounded ml-1">Gross CF: +${fmt(a.grossCashflow)}/ด</span></div>${buff}<div class="text-[11px] text-slate-400 mt-1">เงินดาวน์: ${fmt(a.downPayment)}</div><div class="text-[11px] text-amber-400 cursor-help" title="หักลบหนี้ ภาษี และค่านายหน้าแล้ว">รับซื้อคืนสุทธิ: ${fmt(finalNet)} ${pfStr}</div></div><div class="mt-2 md:mt-0 w-full md:w-auto">${btn}</div></div>${(a.mortgage||0)>0?`<div class="bg-slate-900/80 p-2 rounded border border-rose-500/20 mt-1 flex flex-col md:flex-row justify-between items-center gap-2"><div class="w-full"><div class="text-[11px] text-rose-400">⚠️ หนี้บ้าน/ธุรกิจ คงค้าง: ${fmt(a.mortgage)}</div><div class="text-[10px] text-slate-500">ยอดส่งแบงก์ต่อเดือน: ${fmt(a.mortgagePayment)}</div></div>${portfolioTarget==='player'?`<button onclick="payOffMortgage(${originalIndex})" class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow transition-colors whitespace-nowrap">โปะหนี้แบงก์</button>`:''}</div>`:`<div class="bg-slate-900/80 p-2 rounded border border-emerald-500/20 mt-1"><span class="text-xs text-emerald-400 font-bold">✅ ปลอดหนี้ (Free & Clear)!</span></div>`}</div>`; 
                } else { 
                    let pPowerHtml = '';
                    if (a.type === 'bank') {
                        let currentInf = gameEngine.cumulativeInflation || 1.0;
                        let pPower = Math.floor(val / currentInf);
                        let loss = val - pPower;
                        let infRateDisplay = ((currentInf - 1) * 100).toFixed(1);
                        if (currentInf > 1.0) {
                            pPowerHtml = `<div class="text-[10px] text-rose-400 mt-1 cursor-help" title="หักเงินเฟ้อสะสม ${infRateDisplay}%">อำนาจซื้อจริง (Purchasing Power): ${fmt(pPower)} <span class="text-xs">(เสื่อมค่า -${fmt(loss)})</span></div>`;
                        }
                    }

                    mHTML+=`<div class="bg-slate-800 p-3 rounded border border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-2"><div class="w-full"><div class="font-bold text-white text-sm">${a.name} <span class="text-emerald-400 text-[10px] font-normal border border-emerald-500/30 px-1 rounded ml-1">CF: +${fmt(a.grossCashflow)}/ด</span></div><div class="text-[11px] text-slate-400 mt-1">เงินต้น: ${fmt(a.buyPrice)}</div>${pPowerHtml}<div class="text-[11px] text-indigo-300 cursor-help mt-1" title="หักภาษีกำไร 15% แล้ว">มูลค่าขาย/ถอน สุทธิ: ${fmt(finalNet)} ${pfStr}</div></div><div class="w-full md:w-auto mt-1 md:mt-0">${btn}</div></div>`; 
                } 
            }
        }
    }); 
    
    let sellAllHtml = '';
    if (portfolioTarget === 'player' && mHTML !== '') {
        let hasBank = player.assets.some(a => a.type === 'bank');
        let hasInv = player.assets.some(a => a.type === 'inv');
        let hasGold = player.assets.some(a => a.type === 'gold');
        let hasBtc = player.assets.some(a => a.type === 'btc');
        
        let btns = '';
        if (hasBank) btns += `<button onclick="sellAllAssetType('bank')" class="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-2 py-1.5 rounded text-[10px] font-bold shadow transition-colors">ขายเงินฝากเกลี้ยง</button>`;
        if (hasInv) btns += `<button onclick="sellAllAssetType('inv')" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1.5 rounded text-[10px] font-bold shadow transition-colors">ขาย S&P500 เกลี้ยง</button>`;
        if (hasGold) btns += `<button onclick="sellAllAssetType('gold')" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white px-2 py-1.5 rounded text-[10px] font-bold shadow transition-colors">ขายทองคำเกลี้ยง</button>`;
        if (hasBtc) btns += `<button onclick="sellAllAssetType('btc')" class="flex-1 bg-orange-600 hover:bg-orange-500 text-white px-2 py-1.5 rounded text-[10px] font-bold shadow transition-colors">ขาย BTC เกลี้ยง</button>`;

        if (btns !== '') {
            sellAllHtml = `<div class="flex flex-wrap gap-2 mb-3 bg-slate-800/40 p-2 rounded-lg border border-slate-700/50">${btns}</div>`;
        }
    }

    let totalAssetValue = sumPhysical + sumLiquid + sumEscrow;
    let summaryHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 bg-slate-900/60 p-3 rounded-lg border border-slate-700 shadow-inner">
            <div class="text-center border-r border-slate-700/50">
                <div class="text-[10px] text-slate-400">มูลค่าสินทรัพย์รวม</div>
                <div class="text-sm font-bold text-amber-400">${fmt(totalAssetValue)}</div>
            </div>
            <div class="text-center border-r border-slate-700/50 md:border-r-0 lg:border-r">
                <div class="text-[10px] text-slate-400">🏢 อสังหาฯ/ธุรกิจ</div>
                <div class="text-sm font-bold text-emerald-400">${fmt(sumPhysical)}</div>
            </div>
            <div class="text-center border-r border-slate-700/50">
                <div class="text-[10px] text-slate-400">📈 สภาพคล่อง</div>
                <div class="text-sm font-bold text-indigo-400">${fmt(sumLiquid)}</div>
            </div>
            <div class="text-center">
                <div class="text-[10px] text-slate-400">⏳ รอสัญญา</div>
                <div class="text-sm font-bold text-amber-500">${fmt(sumEscrow)}</div>
            </div>
        </div>
    `;

    list.innerHTML = summaryHTML;

    if (currentPortfolioTab === 'all' || currentPortfolioTab === 'escrow') list.innerHTML += escrowHTML;
    if (reHTML) list.innerHTML+=`<h4 class="text-amber-400 font-bold mb-2 border-b border-slate-700 pb-1 ${escrowHTML?'mt-4':'mt-1'}">🏢 สินทรัพย์จับต้องได้ (และผ่อนชำระ)</h4>${reHTML}`; 
    if (mHTML) list.innerHTML+=`<h4 class="text-indigo-400 font-bold mb-2 border-b border-slate-700 pb-1 ${reHTML?'mt-4':'mt-1'}">📈 สภาพคล่อง</h4>${sellAllHtml}${mHTML}`; 

    if (!escrowHTML && !reHTML && !mHTML) list.innerHTML += '<div class="text-center text-slate-500 py-6">ไม่มีข้อมูลที่ตรงกับการค้นหา</div>';
}
function closePortfolioModal() { document.getElementById('portfolio-modal').classList.add('hidden'); }

function openDeckModal() {
    if(gameEngine.gameOver || gameEngine.isAnimating) return;
    document.getElementById('prob-crisis').value = gameEngine.probabilities.crisis;
    document.getElementById('prob-deal').value = gameEngine.probabilities.deal;
    document.getElementById('prob-bad').value = gameEngine.probabilities.bad;
    document.getElementById('prob-gamble').value = gameEngine.probabilities.gamble;
    updateProbRemaining();

    let listHtml = '';
    const buildList = (title, items, color) => {
        let html = `<h5 class="text-${color}-400 font-bold mt-4 mb-2 pl-2 border-l-2 border-${color}-500">${title}</h5><div class="grid grid-cols-1 md:grid-cols-2 gap-2">`;
        items.forEach(item => {
            let limitStr = item.limit ? item.limit : '∞';
            let count = gameEngine.getEventCount(item.id || item.name);
            let disabled = item.limit && count >= item.limit ? 'opacity-40 grayscale' : '';
            html += `<div class="bg-slate-800 p-2 rounded flex justify-between items-center text-xs border border-slate-700 ${disabled}"><span class="text-slate-300 truncate pr-2">${item.name}</span><span class="text-${color}-400 font-bold whitespace-nowrap bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/50">${count}/${limitStr}</span></div>`;
        });
        html += `</div>`;
        return html;
    };

    let dealsList = [...CONTENT.deals.land, ...CONTENT.deals.business, ...CONTENT.deals.smallRE, ...CONTENT.deals.largeRE];
    let badEventsList = [...CONTENT.badEvents.life, ...CONTENT.badEvents.doodad, ...CONTENT.badEvents.installment];

    listHtml += buildList('⚠️ วิกฤตเศรษฐกิจ (Crisis)', CONTENT.crisis, 'rose');
    listHtml += buildList('🏢 โอกาสลงทุน (Deals)', dealsList, 'emerald');
    listHtml += buildList('🛒 ภาระ/รายจ่าย (Expenses & Doodads)', badEventsList, 'orange');
    listHtml += buildList('🎰 โอกาสเสี่ยงโชค (Gambles)', CONTENT.gambles, 'fuchsia');

    document.getElementById('deck-cards-list').innerHTML = listHtml;
    document.getElementById('deck-modal').classList.remove('hidden');
}

function closeDeckModal() { document.getElementById('deck-modal').classList.add('hidden'); }

function updateProbRemaining() {
    let c = parseInt(document.getElementById('prob-crisis').value) || 0;
    let d = parseInt(document.getElementById('prob-deal').value) || 0;
    let b = parseInt(document.getElementById('prob-bad').value) || 0;
    let g = parseInt(document.getElementById('prob-gamble').value) || 0;
    let sum = c + d + b + g;
    let nothing = 100 - sum;
    let el = document.getElementById('prob-nothing');
    el.innerText = nothing + '%';
    el.className = nothing < 0 ? 'font-bold text-lg ml-1 text-rose-500' : 'font-bold text-lg ml-1 text-white';
}

function saveDeckProbabilities() {
    let c = parseInt(document.getElementById('prob-crisis').value) || 0;
    let d = parseInt(document.getElementById('prob-deal').value) || 0;
    let b = parseInt(document.getElementById('prob-bad').value) || 0;
    let g = parseInt(document.getElementById('prob-gamble').value) || 0;
    if (c + d + b + g > 100) return showAlert('❌ ข้อมูลไม่ถูกต้อง', 'ผลรวมของโอกาสต้องไม่เกิน 100%\n(ต้องเหลือที่ว่างให้เหตุการณ์ปกติบ้าง)', '⚠️');
    gameEngine.probabilities = { crisis: c, deal: d, bad: b, gamble: g };
    closeDeckModal(); showAlert('✅ บันทึกสำเร็จ', 'อัปเดตโอกาสสุ่มการ์ดเรียบร้อยแล้ว\nผลจะมีผลในเทิร์นถัดไปทันที!', '⚙️');
}

async function openLeaderboardModal() {
    document.getElementById('leaderboard-modal').classList.remove('hidden');
    document.getElementById('leaderboard-loading').classList.remove('hidden');
    document.getElementById('leaderboard-content').classList.add('hidden');
    document.getElementById('leaderboard-filter').value = 'all';
    
    cachedLeaderboardData = await LeaderboardManager.fetchScores();
    filterLeaderboard('all');
}

function filterLeaderboard(professionFilter) {
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '';
    
    let scores = cachedLeaderboardData;
    if (professionFilter !== 'all') scores = scores.filter(s => s.profession === professionFilter);

    if (scores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-slate-500">ยังไม่มีข้อมูลในหมวดหมู่นี้</td></tr>`;
    } else {
        scores.sort((a, b) => parseInt(a.months) - parseInt(b.months));
        scores.forEach((s, i) => {
            let rankClass = "text-slate-400";
            if (i === 0) rankClass = "text-amber-400 font-bold text-lg";
            else if (i === 1) rankClass = "text-slate-300 font-bold";
            else if (i === 2) rankClass = "text-amber-600 font-bold";
            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/50 transition-colors">
                    <td class="px-4 py-2 border-b border-slate-700/50 ${rankClass}">${i + 1}</td>
                    <td class="px-4 py-2 border-b border-slate-700/50 font-bold text-white">${s.name}</td>
                    <td class="px-4 py-2 border-b border-slate-700/50 text-xs">${s.profession}</td>
                    <td class="px-4 py-2 border-b border-slate-700/50 text-right font-mono">${s.months}</td>
                    <td class="px-4 py-2 border-b border-slate-700/50 text-right text-emerald-400 font-mono">${fmt(parseInt(s.netWorth))}</td>
                </tr>
            `;
        });
    }
    document.getElementById('leaderboard-loading').classList.add('hidden');
    document.getElementById('leaderboard-content').classList.remove('hidden');
    document.getElementById('leaderboard-content').classList.add('flex');
}

function closeLeaderboardModal() { document.getElementById('leaderboard-modal').classList.add('hidden'); }

async function submitToLeaderboard() {
    const nameInput = document.getElementById('player-name-input');
    const name = nameInput.value.trim();
    if (!name) return showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อของคุณก่อนบันทึกคะแนน', '⚠️');

    const btn = document.getElementById('btn-submit-score');
    btn.disabled = true; btn.innerText = 'กำลังบันทึก...';
    
    let nw = calculateNetWorth(player);
    const success = await LeaderboardManager.submitScore(name, player.profName, gameEngine.gameMonth, nw);
    
    if (success) {
        document.getElementById('submit-score-section').innerHTML = `<p class="text-emerald-400 font-bold text-center">✅ บันทึกชื่อของคุณลงกระดานผู้นำเรียบร้อยแล้ว!</p>`;
        openLeaderboardModal();
    } else {
        showAlert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบ Web App URL', '❌');
        btn.disabled = false; btn.innerText = 'ลองใหม่';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('custom-confirm-yes').addEventListener('click', () => {
        if (uiManager.confirmCallback) uiManager.confirmCallback();
        uiManager.closeCustomConfirm();
    });
    document.getElementById('qp-btn-submit').addEventListener('click', submitQuickPay);
});