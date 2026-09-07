// ../asset/js/cashflow_game.js

// --- 1. Game Flow & Logic ---
function drawProfession() {
    let pIndex = Math.floor(Math.random() * professionCards.length);
    let bIndex = Math.floor(Math.random() * professionCards.length);
    while(bIndex === pIndex) { bIndex = Math.floor(Math.random() * professionCards.length); } 

    const pCard = professionCards[pIndex];
    const bCard = professionCards[bIndex];

    player = { profName: pCard.name, cash: pCard.savings, salary: pCard.salary, baseExpenses: pCard.expenses, profDebt: pCard.profDebt, bankDebt: 0, passive: 0, assets: [] };
    bot = { profName: bCard.name, cash: bCard.savings, salary: bCard.salary, baseExpenses: bCard.expenses, profDebt: bCard.profDebt, bankDebt: 0, passive: 0, assets: [] };

    document.getElementById('prof-player-name').innerText = pCard.name;
    document.getElementById('prof-player-salary').innerText = fmt(pCard.salary);
    document.getElementById('prof-player-exp').innerText = fmt(pCard.expenses);
    document.getElementById('prof-player-debt').innerText = fmt(pCard.profDebt);
    document.getElementById('prof-player-sav').innerText = fmt(pCard.savings);

    document.getElementById('prof-bot-name').innerText = bCard.name;
    document.getElementById('prof-bot-salary').innerText = fmt(bCard.salary);
    document.getElementById('prof-bot-exp').innerText = fmt(bCard.expenses);
    document.getElementById('prof-bot-debt').innerText = fmt(bCard.profDebt);
    document.getElementById('prof-bot-sav').innerText = fmt(bCard.savings);

    document.getElementById('welcome-step-1').classList.add('hidden');
    document.getElementById('welcome-step-2').classList.remove('hidden');
}

function startGame() {
    document.getElementById('welcome-modal').classList.add('hidden');
    document.getElementById('header-profession').innerText = player.profName;
    document.getElementById('bot-profession').innerText = bot.profName;
    
    logActivity(`[เริ่มเกม] ผู้เล่นอาชีพ ${player.profName}`, 'system', 'player');
    logActivity(`[เริ่มเกม] บอทอาชีพ ${bot.profName}`, 'system', 'bot');
    logActivity(`ยินดีต้อนรับสู่ Cashflow Simulation!`, 'system', 'global');
    
    updateMarketPrices();
    updateUI();
}

function enforceBankruptcyRule(actor, isPlayer) {
    if (actor.cash < 0) {
        let needed = Math.abs(actor.cash);
        let loanMultiplier = Math.ceil(needed / 10000);
        let loanAmount = loanMultiplier * 10000;
        
        actor.bankDebt += loanAmount;
        actor.cash += loanAmount; 
        
        const context = isPlayer ? 'player' : 'bot';
        logActivity(`เงินสดติดลบ! ถูกบังคับกู้ฉุกเฉิน ${fmt(loanAmount)}`, 'expense', context);
        
        if (isPlayer) {
            showAlert('🚨 วิกฤตสภาพคล่อง!', `เงินสดคุณติดลบ!\nธนาคารบังคับปล่อยกู้ฉุกเฉิน ${fmt(loanAmount)} บาท\nคำเตือน: หนี้ก้อนนี้ดอกเบี้ย 10% ต่อเดือน (ทบต้นเข้าหนี้ทุกเดือน)!`, '🏦');
            spawnFloatingText('player-cash', loanAmount);
        }
    }
}

function applySalaryIncrease(actor, isPlayer) {
    if (Math.random() > 0.25) return; 
    let percent = 0;
    if(actor.salary < 30000) percent = Math.floor(Math.random() * 5) + 6; 
    else if(actor.salary < 80000) percent = Math.floor(Math.random() * 4) + 4; 
    else percent = Math.floor(Math.random() * 4) + 2; 

    const increase = Math.floor(actor.salary * (percent / 100));
    actor.salary += increase;

    const ctx = isPlayer ? 'player' : 'bot';
    logActivity(`🎉 ปรับฐานเงินเดือนขึ้น ${percent}% (+${fmt(increase)})`, 'income', ctx);
    if(isPlayer) showAlert('🎉 ข่าวดี!', `คุณได้รับการปรับขึ้นเงินเดือน ${percent}% \n(เพิ่มขึ้น ${fmt(increase)} บาท/เดือน)`, '💸');
}

function generateDynamicDeal() {
    const isBig = Math.random() > 0.6; 
    let type, cost, cashflow, roiPercent; 
    if (!isBig) {
        type = ["หุ้นนอกตลาด", "บ้านเช่าหลังเล็ก", "ตู้หยอดเหรียญ", "แฟรนไชส์เล็ก"][Math.floor(Math.random() * 4)];
        cost = Math.floor(Math.random() * 50 + 5) * 1000; 
        roiPercent = Math.floor(Math.random() * 40) + 15; 
    } else {
        type = ["อพาร์ตเมนต์ 8 ยูนิต", "แฟรนไชส์อาหาร", "บ้านทำเลทอง", "โกดังให้เช่า"][Math.floor(Math.random() * 4)];
        cost = Math.floor(Math.random() * 40 + 10) * 10000; 
        roiPercent = Math.floor(Math.random() * 25) + 10; 
    }
    cashflow = Math.floor((cost * (roiPercent / 100)) / 12 / 100) * 100;
    if(cashflow <= 0) cashflow = 100; 
    return { id: Date.now().toString(), name: type, cost, cashflow, type: 'realestate', buyPrice: cost };
}

function generateDynamicBadEvent() {
    if (Math.random() > 0.8) {
        const name = ["ป่วยเข้าโรงพยาบาล", "หลังคารั่วต้องซ่อมใหญ่", "เปลี่ยนแอร์ใหม่ทั้งบ้าน"][Math.floor(Math.random() * 3)];
        const expInc = Math.floor(Math.random() * 3 + 1) * 1000; 
        return { type: 'bad_life', name, expenseIncrease: expInc, cost: 0 };
    } else {
        const name = ["ซื้อทีวีจอแบน", "ไปเที่ยวต่างประเทศ", "ซ่อมเกียร์รถยนต์", "ซื้อกระเป๋าแบรนด์เนม", "จัดปาร์ตี้วันเกิด"][Math.floor(Math.random() * 5)];
        const cost = Math.floor(Math.random() * 20 + 2) * 1000; 
        return { type: 'bad_doodad', name, cost, expenseIncrease: 0 };
    }
}

function generateNews() {
    const r = Math.random();
    if (r < 0.25) { market.nextBias = 'bull'; return "📰 ข่าวดี: ธนาคารกลางลดดอกเบี้ยกระตุ้นเศรษฐกิจ! (ตลาดหุ้นอาจขึ้น)"; } 
    else if (r < 0.50) { market.nextBias = 'bear'; return "📰 ข่าวร้าย: ดัชนีเศรษฐกิจชะลอตัว! (ตลาดอาจร่วงหนัก)"; } 
    else if (r < 0.75) { market.nextBias = 'crypto'; return "📰 ข่าวลือ: บริษัทยักษ์ใหญ่เข้าซื้อ Bitcoin! (คริปโตอาจพุ่ง)"; } 
    else { market.nextBias = 'normal'; return "📰 ข่าวเศรษฐกิจ: สภาวะตลาดทรงตัว ไม่มีปัจจัยเปลี่ยนแปลง"; }
}

function updateMarketPrices() {
    let r = Math.random();
    if (market.nextBias === 'bull') r = r * 0.5; 
    else if (market.nextBias === 'bear') r = r * 0.5 + 0.15; 
    
    if (r < 0.15 || market.nextBias === 'crypto') { 
        market.invPrice *= (1 + (Math.random() * 0.15)); market.btcPrice *= (1 + (Math.random() * 0.30)); market.goldPrice *= (1 + (Math.random() * 0.02 - 0.01)); 
    } else if (r < 0.35) { 
        market.invPrice *= (1 - (Math.random() * 0.12)); market.btcPrice *= (1 - (Math.random() * 0.20)); market.goldPrice *= (1 + (Math.random() * 0.05)); 
    } else { 
        market.invPrice *= (1 + (Math.random() * 0.06 - 0.03)); market.btcPrice *= (1 + (Math.random() * 0.10 - 0.05)); market.goldPrice *= (1 + (Math.random() * 0.02 - 0.01));
    }

    market.history.inv.push(market.invPrice); market.history.inv.shift();
    market.history.gold.push(market.goldPrice); market.history.gold.shift();
    market.history.btc.push(market.btcPrice); market.history.btc.shift();

    const priceInvEl = document.getElementById('price-inv');
    if(priceInvEl) {
        priceInvEl.innerText = fmt(Math.round(market.invPrice * 100)); 
        document.getElementById('price-gold').innerText = fmt(Math.round(market.goldPrice));
        document.getElementById('price-btc').innerText = fmt(Math.round(market.btcPrice * 0.01)); 
        
        const setRSI = (id, rsi) => {
            const el = document.getElementById(`rsi-${id}`);
            if(el) {
                el.innerText = rsi;
                let txt = rsi > 70 ? ' (แพง/ขาย)' : (rsi < 30 ? ' (ถูก/ซื้อ)' : ' (กลาง)');
                let color = rsi > 70 ? 'text-rose-400' : (rsi < 30 ? 'text-emerald-400' : 'text-slate-400');
                document.getElementById(`rsi-${id}-txt`).innerHTML = `<span class="${color}">${txt}</span>`;
            }
        };
        setRSI('inv', calculateRSI(market.history.inv)); setRSI('gold', calculateRSI(market.history.gold)); setRSI('btc', calculateRSI(market.history.btc));
    }
    market.nextBias = 'normal'; 
}

// --- 2. Action Submissions (Player) ---
document.getElementById('qp-btn-submit').addEventListener('click', submitQuickPay);

function submitQuickPay() {
    const input = document.getElementById('qp-input');
    const amount = parseInt(input.value);
    
    if (isNaN(amount) || amount <= 0) return showAlert('ข้อมูล', 'กรุณาระบุจำนวนเงินที่ถูกต้อง', '❌');
    
    const maxDebt = currentQuickPayType === 'bank' ? player.bankDebt : player.profDebt;
    if (amount > maxDebt) return showAlert('ข้อมูล', `ยอดหนี้ประเภทนี้ของคุณมีเพียง ${fmt(maxDebt)}`, 'ℹ️');
    if (amount > player.cash) return showAlert('❌ ยอดเงินไม่พอ', 'เงินสดในมือคุณไม่พอสำหรับการชำระยอดนี้!', '💸');
    
    player.cash -= amount;
    spawnFloatingText('player-cash', -amount);

    if (currentQuickPayType === 'bank') {
        player.bankDebt -= amount;
        logActivity(`ชำระหนี้ฉุกเฉิน -${fmt(amount)}`, 'expense', 'player');
    } else {
        player.profDebt -= amount;
        logActivity(`ชำระหนี้อาชีพ -${fmt(amount)}`, 'expense', 'player');
    }
    
    updateUI();
    closeQuickPayModal();
    setTimeout(checkWinCondition, 500);
}

function sellAsset(index, sellPrice, cashflowLost) {
    showConfirm('ยืนยันการขาย', `สั่งขายในราคา ${fmt(sellPrice)}?\nคำเตือน: คุณจะเสีย Cashflow ${fmt(cashflowLost)}/เดือน ถาวร!`, '💸', () => {
        player.cash += sellPrice; player.passive -= cashflowLost;
        const assetName = player.assets[index].name;
        player.assets.splice(index, 1);
        spawnFloatingText('player-cash', sellPrice);
        logActivity(`เทขาย ${assetName} ได้เงิน ${fmt(sellPrice)}`, 'income', 'player');
        updateUI(); openPortfolioModal('player'); 
    });
}

function tradeMarket(type) {
    if (gameOver || isAnimating) return;
    let cost = 0; let assetObj = null;

    if (type === 'bank') {
        cost = 10000;
        if (player.cash >= cost) {
            const cf = Math.round((cost * 0.02) / 12);
            assetObj = { id: Date.now(), type: 'bank', name: 'เงินฝากประจำ', units: 1, buyPrice: cost, cashflow: cf };
            showAlert('✅ สำเร็จ!', `ฝากเงิน ฿10,000 เรียบร้อย (CF +${cf}/ด)`, '🏦');
            logActivity(`ฝากเงินแบงก์ -${fmt(cost)}`, 'expense', 'player');
        }
    } else if (type === 'inv') {
        cost = Math.round(market.invPrice * 100); 
        if (player.cash >= cost) {
            const cf = Math.round((cost * 0.05) / 12);
            assetObj = { id: Date.now(), type: 'inv', name: 'กองทุนหุ้น (Index)', units: 100, buyPrice: cost, cashflow: cf };
            showAlert('✅ สำเร็จ!', `ซื้อกองทุน 1 Lot สำเร็จ!`, '📊');
            logActivity(`ซื้อกองทุน -${fmt(cost)}`, 'expense', 'player');
        }
    } else if (type === 'gold') {
        cost = Math.round(market.goldPrice);
        if (player.cash >= cost) {
            assetObj = { id: Date.now(), type: 'gold', name: 'ทองคำ (Gold) 1 บาท', units: 1, buyPrice: cost, cashflow: 0 };
            showAlert('✅ สำเร็จ!', `ซื้อทองคำสำเร็จ 1 บาท!`, '🪙');
            logActivity(`ซื้อทองคำ -${fmt(cost)}`, 'expense', 'player');
        }
    } else if (type === 'btc') {
        cost = Math.round(market.btcPrice * 0.01);
        if (player.cash >= cost) {
            assetObj = { id: Date.now(), type: 'btc', name: 'บิตคอยน์ (0.01 BTC)', units: 0.01, buyPrice: cost, cashflow: 0 };
            showAlert('✅ สำเร็จ!', `ช้อนบิตคอยน์สำเร็จ 0.01 BTC!`, '₿');
            logActivity(`ซื้อบิตคอยน์ -${fmt(cost)}`, 'expense', 'player');
        }
    }

    if (assetObj) {
        player.cash -= cost; player.passive += assetObj.cashflow; player.assets.push(assetObj); updateUI();
    } else {
        showAlert('❌ ล้มเหลว', 'เงินสดไม่พอ! ไปกู้ธนาคารก่อน (ปุ่ม 🏦)', '💸');
    }
}

function buyDeal() {
    if (isAnimating || !currentDeal) return;
    if (player.cash < currentDeal.cost) {
        showAlert('❌ ล้มเหลว', 'เงินสดไม่พอ! ไปกู้ธนาคารก่อน (ปุ่ม 🏦)', '💸');
        return;
    }
    isAnimating = true;
    player.cash -= currentDeal.cost; player.passive += currentDeal.cashflow; player.assets.push({...currentDeal});
    spawnFloatingText('player-cash', -currentDeal.cost);
    logActivity(`ลงทุน ${currentDeal.name} (CF +${fmt(currentDeal.cashflow)}/ด)`, 'income', 'player');
    const msg = currentDeal.cashflow > 0 ? `ได้กระแสเงินสด +${fmt(currentDeal.cashflow)}/ด` : `คุณซื้อหนี้สินเข้าพอร์ต! (CF ${fmt(currentDeal.cashflow)}/ด)`;
    setEventCard(currentDeal.cashflow > 0 ? '✅ ซื้อสำเร็จ!' : '❌ หายนะ!', msg, currentDeal.cashflow > 0 ? '🏠' : '🏚️');
    
    hideDecisions(); updateUI();
    setTimeout(() => { endPlayerTurn(); }, 1200);
}

function passDeal() {
    if (isAnimating) return;
    isAnimating = true;
    logActivity(`ปฏิเสธดีล ${currentDeal.name}`, 'info', 'player');
    setEventCard('⏭️ ปฏิเสธดีล', 'คุณเลือกที่จะเก็บเงินสดไว้', '👀');
    hideDecisions();
    setTimeout(() => { endPlayerTurn(); }, 1000);
}

// --- 3. Core Loop ---
function rollDiceWithAnimation() {
    if (gameOver || currentTurn !== 'player' || isAnimating) return;
    
    try {
        isAnimating = true;
        const btn = document.getElementById('btn-roll');
        const flipper = document.getElementById('card-flipper');
        const actionPanel = document.getElementById('action-panel');
        
        btn.disabled = true; btn.innerText = 'กำลังดำเนินชีวิต...';
        flipper.classList.remove('flipped'); 
        
        if(Math.random() < 0.2) logActivity(generateNews(), 'news', 'global');

        gameMonth++;
        updateMarketPrices(); 

        if (player.bankDebt > 0) {
            player.bankDebt = Math.floor(player.bankDebt * 1.10);
            logActivity(`หนี้ฉุกเฉินทบต้น 10% (ยอด: ${fmt(player.bankDebt)})`, 'expense', 'player');
        }
        if (bot.bankDebt > 0) bot.bankDebt = Math.floor(bot.bankDebt * 1.10);
        
        const infRateEl = document.getElementById('inflation-rate');
        const infRate = infRateEl ? parseFloat(infRateEl.value) || 3 : 3;

        if (gameMonth > 1 && gameMonth % 12 === 1) {
            const infImpactP = Math.floor(player.baseExpenses * (infRate / 100));
            const infImpactB = Math.floor(bot.baseExpenses * (infRate / 100));
            
            player.baseExpenses += infImpactP; bot.baseExpenses += infImpactB;
            if(infImpactP > 0) {
                logActivity(`[ปีใหม่] เงินเฟ้อทำงาน ของแพงขึ้น!`, 'system', 'global');
                logActivity(`รายจ่ายพื้นฐานเพิ่ม ${fmt(infImpactP)}/ด`, 'expense', 'player');
            }
            
            if (player.profDebt > 0) {
                player.profDebt = Math.floor(player.profDebt * 1.025);
                logActivity(`[ปีใหม่] หนี้อาชีพทบต้น 2.5% (ยอด: ${fmt(player.profDebt)})`, 'expense', 'player');
            }
            if (bot.profDebt > 0) bot.profDebt = Math.floor(bot.profDebt * 1.025);

            applySalaryIncrease(player, true);
            applySalaryIncrease(bot, false);
        }

        setTimeout(() => {
            // 💡 1. รับกระแสเงินสดประจำเดือนอัตโนมัติ (Auto-Payday)
            const income = player.salary + player.passive - getExpenses(player);
            player.cash += income;
            if (income < 0) {
                logActivity(`กระแสเงินสดติดลบ! จ่ายเพิ่ม ${fmt(Math.abs(income))}`, 'expense', 'player');
                spawnFloatingText('player-cash', income);
            } else {
                logActivity(`รับกระแสเงินสดสุทธิ +${fmt(income)}`, 'income', 'player');
                spawnFloatingText('player-cash', income);
            }

            // 💡 2. สุ่มเหตุการณ์ในเดือนนี้
            const rand = Math.random(); 
            let ev;
            if (rand < 0.50) ev = generateDynamicDeal(); // 50% เจอดีลลงทุน
            else if (rand < 0.80) ev = generateDynamicBadEvent(); // 30% เจอรายจ่าย
            else ev = { type: 'nothing' }; // 20% เดือนที่เงียบสงบ

            if (ev.type === 'realestate') {
                currentDeal = ev;
                setEventCard(`โอกาสลงทุน: ${ev.name}`, 'วิเคราะห์กระแสเงินสดให้ดีก่อนตัดสินใจ!', '🏢', true);
                showDecisions(ev);
                logActivity(`พบดีล: ${ev.name} ราคา ${fmt(ev.cost)}`, 'system', 'global');
            } else if (ev.type === 'bad_doodad') {
                player.cash -= ev.cost;
                setEventCard('💸 เสียเงิน', `รายจ่ายเข้า: ${ev.name} ${fmt(ev.cost)}\n(ระบบรับเงินเดือนเข้ากระเป๋าให้คุณแล้ว)`, '🛒', true);
                spawnFloatingText('player-cash', -ev.cost);
                logActivity(`จ่ายค่า: ${ev.name} ${fmt(-ev.cost)}`, 'expense', 'player');
                actionPanel.classList.add('shake'); setTimeout(() => actionPanel.classList.remove('shake'), 500);
            } else if (ev.type === 'bad_life') {
                player.baseExpenses += ev.expenseIncrease;
                setEventCard('📉 ภาระชีวิต!', `${ev.name} ทำให้รายจ่ายเพิ่ม ${fmt(ev.expenseIncrease)}/เดือน\n(ระบบรับเงินเดือนเข้ากระเป๋าให้คุณแล้ว)`, '👶', true);
                logActivity(`ภาระเพิ่ม: ${ev.name} (รายจ่าย +${fmt(ev.expenseIncrease)}/ด)`, 'expense', 'player');
                actionPanel.classList.add('shake'); setTimeout(() => actionPanel.classList.remove('shake'), 500);
            } else {
                setEventCard('☕ ชีวิตเรียบง่าย', `เดือนนี้ไม่มีเหตุการณ์พิเศษ\nรับเงินเดือนแล้วใช้ชีวิตต่อไปอย่างสงบสุข!`, '☀️', true);
            }
            
            enforceBankruptcyRule(player, true); 
            updateUI();
            
            flipper.classList.add('flipped');
            if (ev.type !== 'realestate') { setTimeout(() => { endPlayerTurn(); }, 1800); } 
            else { isAnimating = false; }
        }, 400);

    } catch(err) {
        console.error("Game Loop Error Caught:", err);
        restorePlayerTurn();
    }
}

// --- 4. Win/Loss Logic ---
function checkWinCondition() {
    const isPlayerDebtFree = (player.bankDebt === 0 && player.profDebt === 0);
    const isBotDebtFree = (bot.bankDebt === 0 && bot.profDebt === 0);

    const isPlayerWin = (player.passive >= getExpenses(player) && getExpenses(player) > 0 && isPlayerDebtFree);
    const isBotWin = (bot.passive >= getExpenses(bot) && getExpenses(bot) > 0 && isBotDebtFree);

    if (isPlayerWin) {
        logActivity(`🎉 ชนะแล้ว! คุณเข้าสู่ Fast Track`, 'system', 'global');
        endGame('player');
    } else if (isBotWin) {
        logActivity(`💀 แพ้แล้ว! บอทออกจากสนามแข่งหนู`, 'system', 'global');
        endGame('bot');
    }
}

function endGame(winner) {
    if (gameOver) return;
    gameOver = true; isAnimating = false; hideDecisions();
    
    const btnRoll = document.getElementById('btn-roll');
    if(btnRoll) { btnRoll.disabled = true; btnRoll.innerText = 'จบเกมแล้ว'; }
    
    const stId = winner === 'player' ? 'player-status' : 'bot-status';
    const stEl = document.getElementById(stId);
    if(stEl) {
        stEl.innerText = 'Fast Track!';
        stEl.classList.replace('text-amber-400', 'text-emerald-400');
    }

    const goModal = document.getElementById('gameover-modal');
    const goIcon = document.getElementById('go-icon');
    const goTitle = document.getElementById('go-title');
    const goDesc = document.getElementById('go-desc');
    const goTime = document.getElementById('go-time');
    
    const years = Math.floor(gameMonth / 12);
    const months = gameMonth % 12;
    const timeText = `${gameMonth} เดือน (ราวๆ ${years} ปี ${months} เดือน)`;
    goTime.innerText = timeText;

    if (winner === 'player') {
        goIcon.innerText = '🏆';
        goTitle.innerText = 'ชนะเกม!';
        goTitle.className = "text-3xl font-extrabold text-amber-400 mb-2";
        goDesc.innerText = "สุดยอดมาก!\nคุณสร้าง Passive Income แซงรายจ่ายและปลดหนี้สินทั้งหมดได้สำเร็จ\nก้าวสู่อิสรภาพทางการเงินอย่างแท้จริง!";
    } else {
        goIcon.innerText = '💀';
        goTitle.innerText = 'พ่ายแพ้!';
        goTitle.className = "text-3xl font-extrabold text-rose-500 mb-2";
        goDesc.innerText = "บอท (AI) สามารถเคลียร์หนี้และสร้างรายได้ทะลุเป้าหมายตัดหน้าคุณไปแล้ว!\n\nไม่เป็นไร ลองวิเคราะห์กระแสเงินสดของคุณใหม่นะ";
    }

    setTimeout(() => { goModal.classList.remove('hidden'); }, 1000);
}

// --- 5. Bot Logic ---
function tradeMarketForBot() {
    let cost = 0; let assetObj = null;
    const rsiInv = calculateRSI(market.history.inv); const rsiBtc = calculateRSI(market.history.btc);

    if (rsiInv < 40 && bot.cash >= Math.round(market.invPrice * 100)) {
        cost = Math.round(market.invPrice * 100); const cf = Math.round((cost * 0.05) / 12);
        assetObj = { id: Date.now(), type: 'inv', name: 'กองทุนหุ้น', units: 100, buyPrice: cost, cashflow: cf };
        logActivity(`ช้อนซื้อกองทุนหุ้นตอนถูก`, 'expense', 'bot');
    } else if (rsiBtc < 40 && bot.cash >= Math.round(market.btcPrice * 0.01)) {
        cost = Math.round(market.btcPrice * 0.01);
        assetObj = { id: Date.now(), type: 'btc', name: 'บิตคอยน์', units: 0.01, buyPrice: cost, cashflow: 0 };
        logActivity(`ช้อนซื้อบิตคอยน์ตอนตลาดร่วง`, 'expense', 'bot');
    } else if (bot.cash >= Math.round(market.goldPrice)) {
        cost = Math.round(market.goldPrice);
        assetObj = { id: Date.now(), type: 'gold', name: 'ทองคำ 1 บาท', units: 1, buyPrice: cost, cashflow: 0 };
        logActivity(`ซื้อทองคำเก็บไว้`, 'expense', 'bot');
    } else if (bot.cash >= 10000) {
        cost = 10000; const cf = Math.round((cost * 0.02) / 12);
        assetObj = { id: Date.now(), type: 'bank', name: 'เงินฝากประจำ', units: 1, buyPrice: cost, cashflow: cf };
        logActivity(`เปิดบัญชีเงินฝาก`, 'expense', 'bot');
    }

    if (assetObj) {
        bot.cash -= cost; bot.passive += assetObj.cashflow; bot.assets.push(assetObj);
        setEventCard('🤖 บอทเข้าตลาดทุน', `บอทโยกเงินเข้าซื้อ ${assetObj.name}`, '📊');
    } else {
        setEventCard('🤖 บอทข้ามเทิร์น', `รอสะสมเงินสดเพิ่มเติม`, '⏳');
    }
}

function restorePlayerTurn() {
    if(gameOver) return;
    currentTurn = 'player';
    isAnimating = false; 
    const ind = document.getElementById('turn-indicator');
    if(ind) {
        ind.innerText = 'ตาของคุณ';
        ind.classList.remove('bg-slate-700', 'text-slate-300');
        ind.classList.add('bg-amber-900/30', 'text-amber-400');
    }
    hideDecisions();
}

function endPlayerTurn() {
    if(gameOver) return;
    currentTurn = 'bot';
    const ind = document.getElementById('turn-indicator');
    if(ind) {
        ind.innerText = 'ตาของบอท';
        ind.classList.remove('bg-amber-900/30', 'text-amber-400');
        ind.classList.add('bg-slate-700', 'text-slate-300');
    }
    const btn = document.getElementById('btn-roll');
    if(btn) { btn.innerText = 'บอทกำลังคิด...'; btn.disabled = true; }
    setTimeout(botPlay, 1000);
}

function botPlay() {
    if (gameOver) return;
    const rand = Math.random();
    const flipper = document.getElementById('card-flipper');
    if(flipper) flipper.classList.remove('flipped');
    
    setTimeout(() => {
        try {
            // 💡 1. บอทรับกระแสเงินสดประจำเดือนอัตโนมัติ (Auto-Payday)
            const income = bot.salary + bot.passive - getExpenses(bot);
            bot.cash += income;
            logActivity(`รับกระแสเงินสดสุทธิ ${fmt(income)}`, 'income', 'bot');
            
            // ให้บอทฉลาดขึ้น: ใช้เงินที่เพิ่งได้รับมาทยอยโปะหนี้ทันที
            if (bot.bankDebt > 0 && bot.cash > 10000) { 
                let payAmt = Math.min(bot.cash - 5000, bot.bankDebt);
                bot.cash -= payAmt; bot.bankDebt -= payAmt; 
                logActivity(`บอทโปะหนี้ฉุกเฉิน ${fmt(payAmt)}`, 'system', 'bot');
            } else if (bot.bankDebt === 0 && bot.profDebt > 0 && bot.cash > 25000) { 
                let payAmt = Math.min(bot.cash - 10000, bot.profDebt);
                bot.cash -= payAmt; bot.profDebt -= payAmt; 
                logActivity(`บอททยอยโปะหนี้อาชีพ ${fmt(payAmt)}`, 'system', 'bot');
            }

            // 💡 2. บอทสุ่มเจอเหตุการณ์ประจำเดือน
            if (rand < 0.5) { // 50% เจอโอกาสลงทุน
                const ev = generateDynamicDeal();
                if (ev.cashflow > 1000 || (ev.cashflow > 0 && ev.cost < 50000)) { 
                    let needed = ev.cost - bot.cash;
                    if (needed > 0 && ev.cashflow > (needed * 0.10) + 200) { bot.cash += needed; bot.bankDebt += needed; } 
                    if (bot.cash >= ev.cost) {
                        bot.cash -= ev.cost; bot.passive += ev.cashflow; bot.assets.push(ev);
                        setEventCard('🤖 บอทลงทุนอสังหาฯ!', `บอทคว้าดีล CF +${fmt(ev.cashflow)}`, '🏠');
                        logActivity(`ลงทุนอสังหาฯ (CF +${fmt(ev.cashflow)}/ด)`, 'income', 'bot');
                    } else setEventCard('🤖 บอทข้ามดีล', `เงินไม่พอ`, '⏭️');
                } else setEventCard('🤖 บอทปฏิเสธดีล', `เห็นว่าการลงทุนนี้ไม่คุ้ม`, '🙅‍♂️');
            } else if (rand < 0.7) { // 20% เจอตลาดทุน
                tradeMarketForBot();
            } else if (rand < 0.9) { // 20% เจอรายจ่าย
                const ev = generateDynamicBadEvent();
                if (ev.cost) {
                    bot.cash -= ev.cost;
                    logActivity(`จ่ายค่า: ${ev.name} ${fmt(-ev.cost)}`, 'expense', 'bot');
                } else {
                    bot.baseExpenses += ev.expenseIncrease;
                    logActivity(`ภาระเพิ่ม: ${ev.name} (จ่าย +${fmt(ev.expenseIncrease)}/ด)`, 'expense', 'bot');
                }
                setEventCard('🤖 บอทเสียเงิน', `โดนรายจ่ายเล่นงาน`, '📉');
            } else { // 10% ไม่มีอะไรเกิดขึ้น
                setEventCard('🤖 บอทใช้ชีวิตปกติ', `เดือนนี้ไม่มีการลงทุนเพิ่มเติม`, '☕');
            }
            
            enforceBankruptcyRule(bot, false); 
            if(flipper) flipper.classList.add('flipped');
            updateUI();
            
            setTimeout(() => { restorePlayerTurn(); }, 1800);

        } catch(err) {
            console.error("Bot Loop Error Caught:", err);
            restorePlayerTurn();
        }
    }, 400);
}