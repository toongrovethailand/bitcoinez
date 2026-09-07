// ./asset/js/cashflow_game.js

function drawProfession() {
    let sharedIndex = Math.floor(Math.random() * professionCards.length);
    const card = professionCards[sharedIndex];

    player = { profName: card.name, cash: card.savings, salary: card.salary, baseExpenses: card.expenses, profDebt: card.profDebt, bankDebt: 0, creditDebt: 0, passive: 0, assets: [], isEducated: false };
    bot = JSON.parse(JSON.stringify(player));

    document.getElementById('prof-player-name').innerText = player.profName;
    document.getElementById('prof-player-salary').innerText = fmt(player.salary);
    document.getElementById('prof-player-exp').innerText = fmt(player.baseExpenses);
    document.getElementById('prof-player-debt').innerText = fmt(player.profDebt);
    document.getElementById('prof-player-sav').innerText = fmt(player.cash);

    document.getElementById('prof-bot-name').innerText = bot.profName;
    document.getElementById('prof-bot-salary').innerText = fmt(bot.salary);
    document.getElementById('prof-bot-exp').innerText = fmt(bot.baseExpenses);
    document.getElementById('prof-bot-debt').innerText = fmt(bot.profDebt);
    document.getElementById('prof-bot-sav').innerText = fmt(bot.cash);

    document.getElementById('welcome-step-1').classList.add('hidden');
    document.getElementById('welcome-step-2').classList.remove('hidden');
}

function startGame() {
    document.getElementById('welcome-modal').classList.add('hidden');
    document.getElementById('header-profession').innerText = player.profName;
    document.getElementById('bot-profession').innerText = bot.profName;
    
    logActivity(`[เริ่มเกม] วัดกึ๋น! ผู้เล่นและบอทได้รับอาชีพ ${player.profName} เหมือนกัน`, 'system', 'global');
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
            showAlert('🚨 วิกฤตสภาพคล่อง!', `เงินสดคุณติดลบ!\nธนาคารบังคับปล่อยกู้ฉุกเฉิน ${fmt(loanAmount)} บาท\nคำเตือน: หนี้ก้อนนี้ดอกเบี้ย 2% ต่อเดือน!`, '🏦');
            spawnFloatingText('player-cash', loanAmount);
        }
    }
}

function applySharedSalaryIncrease() {
    if (Math.random() > 0.25) return; 
    let percent = 0;
    if(player.salary < 30000) percent = Math.floor(Math.random() * 5) + 6; 
    else if(player.salary < 80000) percent = Math.floor(Math.random() * 4) + 4; 
    else percent = Math.floor(Math.random() * 4) + 2; 

    const increaseP = Math.floor(player.salary * (percent / 100));
    player.salary += increaseP;
    const increaseB = Math.floor(bot.salary * (percent / 100));
    bot.salary += increaseB;

    logActivity(`🎉 ปรับฐานเงินเดือนขึ้น ${percent}% ทั้งระบบ!`, 'system', 'global');
    showAlert('🎉 ข่าวดี!', `คุณและบอทได้รับการปรับขึ้นเงินเดือน ${percent}% \n(คุณได้เพิ่ม ${fmt(increaseP)} บาท/เดือน)`, '💸');
}

function generateCrisisEvent() {
    const isPandemic = Math.random() > 0.5;
    return {
        type: 'crisis',
        name: isPandemic ? "🦠 วิกฤตโรคระบาด!" : "⚔️ สงครามเศรษฐกิจ!",
        desc: "ธุรกิจและอสังหาฯ ซบเซาหนัก!\n\nคุณมีเงินสำรองฉุกเฉินเพียงพอ (6 เท่าของรายจ่าย) หรือไม่?\nหากไม่พอ... รายรับจากสินทรัพย์ของคุณจะถูกหั่นทิ้ง 50% ทันที!",
        cost: 0
    };
}

function generateDynamicDeal() {
    const rand = Math.random(); 
    let type, cost, roiPercent, downPaymentPercent; 
    let isBusiness = false;
    let isLand = false;
    
    if (rand < 0.2) { 
        type = ["ที่ดินชานเมือง", "ที่ดินรอตัดถนน", "ที่ดินทำเลทอง"][Math.floor(Math.random() * 3)];
        cost = Math.floor(Math.random() * 50 + 10) * 10000; 
        downPaymentPercent = 1.0; 
        isLand = true;
    } else if (rand < 0.5) { 
        type = ["ตู้หยอดเหรียญ", "ร้านสะดวกซัก", "แฟรนไชส์เครื่องดื่ม", "สตาร์ทอัพ (Angel)"][Math.floor(Math.random() * 4)];
        cost = Math.floor(Math.random() * 30 + 5) * 10000; 
        downPaymentPercent = Math.random() * 0.3 + 0.3; 
        roiPercent = Math.floor(Math.random() * 40) + 20; 
        isBusiness = true;
    } else if (rand < 0.8) { 
        type = ["คอนโดปล่อยเช่า", "ทาวน์โฮม", "บ้านเดี่ยวหลังเล็ก"][Math.floor(Math.random() * 3)];
        cost = Math.floor(Math.random() * 30 + 10) * 10000; 
        downPaymentPercent = Math.random() * 0.1 + 0.1; 
        roiPercent = Math.floor(Math.random() * 15) + 8; 
    } else { 
        type = ["อพาร์ตเมนต์ 8 ยูนิต", "โกดังให้เช่า", "อาคารพาณิชย์", "ที่จอดรถให้เช่า"][Math.floor(Math.random() * 4)];
        cost = Math.floor(Math.random() * 100 + 40) * 10000; 
        downPaymentPercent = Math.random() * 0.15 + 0.1; 
        roiPercent = Math.floor(Math.random() * 12) + 8; 
    }
    
    let downPayment = Math.ceil((cost * downPaymentPercent) / 1000) * 1000;
    let mortgage = cost - downPayment;
    
    let grossCashflow = 0;
    let mortgagePayment = 0;
    
    if (isLand) {
        mortgagePayment = Math.floor(cost * 0.01 / 12); 
    } else {
        grossCashflow = Math.floor((cost * (roiPercent / 100)) / 12 / 100) * 100;
        mortgagePayment = mortgage > 0 ? Math.floor((mortgage * 0.08) / 12 / 100) * 100 : 0; 
    }
    
    let netCashflow = grossCashflow - mortgagePayment;
    if (!isLand && netCashflow <= 0) {
        grossCashflow += Math.abs(netCashflow) + 500; 
        netCashflow = grossCashflow - mortgagePayment;
    }
    
    return { id: Date.now().toString(), name: type, cost: cost, downPayment: downPayment, mortgage: mortgage, mortgagePayment: mortgagePayment, grossCashflow: grossCashflow, cashflow: netCashflow, type: 'realestate', buyPrice: cost };
}

function generateDynamicBadEvent() {
    if (Math.random() > 0.6) {
        const name = ["มีลูกเพิ่ม (ค่าเลี้ยงดู)", "ประกันปรับเบี้ยขึ้น", "ย้ายไปเช่าบ้านแพงขึ้น", "ผ่อนรถคันใหม่", "ส่งเสียญาติผู้ใหญ่"][Math.floor(Math.random() * 5)];
        const expInc = Math.floor(Math.random() * 3 + 1) * 1000; 
        return { type: 'bad_life', name, expenseIncrease: expInc, cost: 0 };
    } else {
        const name = ["เปลี่ยนแอร์ใหม่ทั้งบ้าน", "ซ่อมหลังคารั่ว", "เข้าโรงพยาบาลฉุกเฉิน", "ซื้อทีวีจอแบน", "ไปเที่ยวต่างประเทศ", "ซ่อมเกียร์รถ", "จ่ายภาษีสังคม"][Math.floor(Math.random() * 7)];
        const cost = Math.floor(Math.random() * 20 + 5) * 1000; 
        return { type: 'bad_doodad', name, cost, expenseIncrease: 0 };
    }
}

function generateNews() {
    const r = Math.random();
    if (r < 0.25) { market.nextBias = 'bull'; return "📰 ข่าวดี: ธนาคารลดดอกเบี้ย! (ตลาดหุ้นอาจขึ้น)"; } 
    else if (r < 0.50) { market.nextBias = 'bear'; return "📰 ข่าวร้าย: ดัชนีเศรษฐกิจชะลอตัว! (ตลาดอาจร่วงหนัก)"; } 
    else if (r < 0.75) { market.nextBias = 'crypto'; return "📰 ข่าวลือ: บริษัทยักษ์ใหญ่ซื้อ Bitcoin! (คริปโตอาจพุ่ง)"; } 
    else { market.nextBias = 'normal'; return "📰 ข่าวเศรษฐกิจ: สภาวะตลาดทรงตัว"; }
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

// --- 🌟 Player / Actions ---
function investInEducation() {
    if (gameOver || isAnimating || player.isEducated) return;
    const cost = 50000;
    showConfirm('🎓 อัปสกิลการเงินระดับสูง', `จ่าย ${fmt(cost)} เพื่อเรียนรู้ทักษะการเงินขั้นเทพ?\n\nสิทธิประโยชน์ติดตัวถาวร:\n1. ได้รับส่วนลดเงินดาวน์อสังหาฯ และธุรกิจ 20% ทุกดีล!\n2. มีโอกาส 50% ที่จะรู้ทันและปฏิเสธ "รายจ่ายฟุ่มเฟือย" ได้แบบฟรีๆ!`, '🧠', () => {
        if (player.cash < cost) {
            return showAlert('❌ ยอดเงินไม่พอ', `คุณต้องมีเงินสดอย่างน้อย ${fmt(cost)} เพื่อลงคอร์สนี้!`, '💸');
        }
        player.cash -= cost;
        player.isEducated = true;
        spawnFloatingText('player-cash', -cost);
        logActivity(`จ่ายค่าอัปสกิลการเงิน ${fmt(cost)}`, 'expense', 'player');
        showAlert('✅ อัปสกิลสำเร็จ!', 'คุณได้รับภูมิคุ้มกันทางการเงินแล้ว!\nการลงทุนครั้งนี้จะคืนทุนให้คุณมหาศาล', '🎓');
        updateUI();
    });
}

document.getElementById('qp-btn-submit').addEventListener('click', submitQuickPay);

function submitQuickPay() {
    const input = document.getElementById('qp-input');
    const amount = parseInt(input.value);
    if (isNaN(amount) || amount <= 0) return showAlert('ข้อมูล', 'กรุณาระบุจำนวนเงินที่ถูกต้อง', '❌');
    
    let maxDebt = 0;
    if (currentQuickPayType === 'bank') maxDebt = player.bankDebt;
    else if (currentQuickPayType === 'prof') maxDebt = player.profDebt;
    else if (currentQuickPayType === 'credit') maxDebt = player.creditDebt || 0;

    if (amount > maxDebt) return showAlert('ข้อมูล', `ยอดหนี้ประเภทนี้ของคุณมีเพียง ${fmt(maxDebt)}`, 'ℹ️');
    if (amount > player.cash) return showAlert('❌ ยอดเงินไม่พอ', 'เงินสดในมือคุณไม่พอสำหรับการชำระยอดนี้!', '💸');
    
    player.cash -= amount;
    spawnFloatingText('player-cash', -amount);

    if (currentQuickPayType === 'bank') {
        player.bankDebt -= amount;
        logActivity(`ชำระหนี้ฉุกเฉิน -${fmt(amount)}`, 'expense', 'player');
    } else if (currentQuickPayType === 'prof') {
        player.profDebt -= amount;
        logActivity(`ชำระหนี้อาชีพ -${fmt(amount)}`, 'expense', 'player');
    } else {
        player.creditDebt -= amount;
        logActivity(`โปะหนี้บัตรเครดิต -${fmt(amount)}`, 'expense', 'player');
    }
    
    updateUI(); closeQuickPayModal(); setTimeout(checkWinCondition, 500);
}

function payOffMortgage(index) {
    let asset = player.assets[index];
    if (player.cash < asset.mortgage) {
        return showAlert('❌ ยอดเงินไม่พอ', `คุณต้องมีเงินสดอย่างน้อย ${fmt(asset.mortgage)} เพื่อโปะหนี้ก้อนนี้`, '💸');
    }
    showConfirm('โปะหนี้พิเศษ', `ต้องการจ่ายเงินก้อน ${fmt(asset.mortgage)} เพื่อล้างหนี้สินทรัพย์นี้หรือไม่?\n\nการโปะหนี้จะทำให้รายจ่ายรวมของคุณลดลง ${fmt(asset.mortgagePayment)}/เดือน ทันที!`, '🏠', () => {
        player.cash -= asset.mortgage;
        spawnFloatingText('player-cash', -asset.mortgage);
        logActivity(`โปะหนี้ ${asset.name} สำเร็จ (ภาระผ่อนลดลง ${fmt(asset.mortgagePayment)}/ด)`, 'income', 'player');
        asset.mortgage = 0;
        asset.mortgagePayment = 0;
        updateUI(); openPortfolioModal('player');
    });
}

function sellAsset(index, val) {
    let asset = player.assets[index];
    let mortgage = asset.mortgage || 0;
    let netProceeds = val - mortgage;

    showConfirm('ยืนยันการขาย', `มูลค่าตลาด: ${fmt(val)}\nหักลบหนี้ผูกพัน: -${fmt(mortgage)}\nรับเงินส่วนต่างสุทธิ: ${fmt(netProceeds)}\n\nคำเตือน: คุณจะเสียรายรับ ${fmt(asset.grossCashflow)}/เดือน ถาวร!`, '💸', () => {
        player.cash += netProceeds; 
        player.passive -= asset.grossCashflow; 
        const assetName = asset.name;
        player.assets.splice(index, 1);
        spawnFloatingText('player-cash', netProceeds);
        logActivity(`เทขาย ${assetName} รับส่วนต่างสุทธิ ${fmt(netProceeds)}`, 'income', 'player');
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
            assetObj = { id: Date.now(), type: 'bank', name: 'เงินฝากประจำ', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: cf, cashflow: cf };
            showAlert('✅ สำเร็จ!', `ฝากเงิน ฿10,000 เรียบร้อย (CF +${cf}/ด)`, '🏦');
            logActivity(`ฝากเงินแบงก์ -${fmt(cost)}`, 'expense', 'player');
        }
    } else if (type === 'inv') {
        cost = Math.round(market.invPrice * 100); 
        if (player.cash >= cost) {
            const cf = Math.round((cost * 0.05) / 12);
            assetObj = { id: Date.now(), type: 'inv', name: 'กองทุนหุ้น (Index)', units: 100, buyPrice: cost, mortgage: 0, grossCashflow: cf, cashflow: cf };
            showAlert('✅ สำเร็จ!', `ซื้อกองทุน 1 Lot สำเร็จ!`, '📊');
            logActivity(`ซื้อกองทุน -${fmt(cost)}`, 'expense', 'player');
        }
    } else if (type === 'gold') {
        cost = Math.round(market.goldPrice);
        if (player.cash >= cost) {
            assetObj = { id: Date.now(), type: 'gold', name: 'ทองคำ (Gold) 1 บาท', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0 };
            showAlert('✅ สำเร็จ!', `ซื้อทองคำสำเร็จ 1 บาท!`, '🪙');
            logActivity(`ซื้อทองคำ -${fmt(cost)}`, 'expense', 'player');
        }
    } else if (type === 'btc') {
        cost = Math.round(market.btcPrice * 0.01);
        if (player.cash >= cost) {
            assetObj = { id: Date.now(), type: 'btc', name: 'บิตคอยน์ (0.01 BTC)', units: 0.01, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0 };
            showAlert('✅ สำเร็จ!', `ช้อนบิตคอยน์สำเร็จ 0.01 BTC!`, '₿');
            logActivity(`ซื้อบิตคอยน์ -${fmt(cost)}`, 'expense', 'player');
        }
    }

    if (assetObj) {
        player.cash -= cost; player.passive += assetObj.grossCashflow; player.assets.push(assetObj); updateUI();
    } else {
        showAlert('❌ ล้มเหลว', 'เงินสดไม่พอ! ไปกู้ธนาคารก่อน (ปุ่ม 🏦)', '💸');
    }
}

function buyDeal() {
    if (isAnimating || !currentSharedEvent) return;
    
    let actualDp = player.isEducated ? Math.floor(currentSharedEvent.downPayment * 0.8) : currentSharedEvent.downPayment;
    
    if (player.cash < actualDp) {
        showAlert('❌ ล้มเหลว', `เงินสดไม่พอจ่ายดาวน์ ${fmt(actualDp)}!`, '💸');
        return;
    }
    isAnimating = true;
    player.cash -= actualDp; 
    player.passive += currentSharedEvent.grossCashflow; 
    
    let finalMortgage = currentSharedEvent.cost - actualDp;
    let finalAsset = {...currentSharedEvent, downPayment: actualDp, mortgage: finalMortgage};
    player.assets.push(finalAsset);
    
    spawnFloatingText('player-cash', -actualDp);
    logActivity(`คุณลงทุน ${currentSharedEvent.name} จ่ายดาวน์ ${fmt(actualDp)}`, 'income', 'player');
    
    hideDecisions(); updateUI();
    setTimeout(() => { processBotSharedTurn(); }, 1200);
}

function passDeal() {
    if (isAnimating) return;
    isAnimating = true;
    logActivity(`คุณปฏิเสธดีล ${currentSharedEvent.name}`, 'info', 'player');
    hideDecisions();
    setTimeout(() => { processBotSharedTurn(); }, 1000);
}

function payDoodadCash() {
    if (player.cash < currentSharedEvent.cost) {
        return showAlert('❌ เงินสดไม่พอ', 'คุณมีเงินสดไม่พอจ่าย ต้องรูดบัตรเครดิตเท่านั้น!', '💳');
    }
    isAnimating = true;
    player.cash -= currentSharedEvent.cost;
    spawnFloatingText('player-cash', -currentSharedEvent.cost);
    logActivity(`คุณจ่ายเงินสดซื้อ: ${currentSharedEvent.name} ${fmt(-currentSharedEvent.cost)}`, 'expense', 'player');
    hideDecisions(); updateUI();
    setTimeout(() => { processBotSharedTurn(); }, 1000);
}

function payDoodadCredit() {
    isAnimating = true;
    player.creditDebt = (player.creditDebt || 0) + currentSharedEvent.cost;
    logActivity(`คุณรูดบัตรเครดิต: ${currentSharedEvent.name} ${fmt(currentSharedEvent.cost)}`, 'expense', 'player');
    hideDecisions(); updateUI();
    setTimeout(() => { processBotSharedTurn(); }, 1000);
}

function processCrisisPlayer() {
    isAnimating = true;
    const requiredReserve = getExpenses(player) * 6;
    
    if (player.cash >= requiredReserve) {
        logActivity(`คุณรอดพ้นวิกฤตเพราะมีเงินสำรอง 6 เดือน (${fmt(player.cash)})`, 'income', 'player');
        showAlert('✅ รอดพ้นวิกฤต', `คุณมีเงินสดสำรองเพียงพอ (${fmt(player.cash)})\nวิกฤตนี้ทำอะไรคุณไม่ได้!`, '🛡️');
    } else {
        player.assets.forEach(asset => {
            if (asset.type === 'realestate' || asset.type === 'business') {
                const penalty = Math.floor(asset.grossCashflow * 0.5);
                asset.grossCashflow -= penalty;
                asset.cashflow -= penalty; 
                player.passive -= penalty;
            }
        });
        logActivity(`คุณรับแรงกระแทก! รายรับสินทรัพย์ลด 50% เพราะเงินสำรองไม่พอ`, 'expense', 'player');
        showAlert('❌ หายนะทางการเงิน', `คุณมีเงินสำรองไม่ถึง 6 เดือน!\nผู้เช่าหนี ธุรกิจซบเซา รายได้ Passive ของคุณหายไปครึ่งนึง!\nคุณอาจต้องขายสินทรัพย์ทิ้งเพื่อพยุง Cashflow`, '📉');
    }
    
    hideDecisions(); updateUI();
    setTimeout(() => { processBotSharedTurn(); }, 1200);
}

// --- 3. Core Loop (Shared Events) ---
function rollDiceWithAnimation() {
    if (gameOver || currentTurn !== 'player' || isAnimating) return;
    
    isAnimating = true;
    const btn = document.getElementById('btn-roll');
    const flipper = document.getElementById('card-flipper');
    const actionPanel = document.getElementById('action-panel');
    
    btn.disabled = true; btn.innerText = 'กำลังดำเนินชีวิต...';
    flipper.classList.remove('flipped'); 
    
    if(Math.random() < 0.2) logActivity(generateNews(), 'news', 'global');

    gameMonth++;
    updateMarketPrices(); 

    if (player.bankDebt > 0) player.bankDebt = Math.floor(player.bankDebt * 1.02);
    if (bot.bankDebt > 0) bot.bankDebt = Math.floor(bot.bankDebt * 1.02);
    
    const infRateEl = document.getElementById('inflation-rate');
    const infRate = infRateEl ? parseFloat(infRateEl.value) || 3 : 3;

    if (gameMonth > 1 && gameMonth % 12 === 1) {
        const infImpactP = Math.floor(player.baseExpenses * (infRate / 100));
        const infImpactB = Math.floor(bot.baseExpenses * (infRate / 100));
        
        player.baseExpenses += infImpactP; bot.baseExpenses += infImpactB;
        if(infImpactP > 0) logActivity(`[ปีใหม่] เงินเฟ้อทำงาน ของแพงขึ้น!`, 'system', 'global');
        
        if (player.profDebt > 0) player.profDebt = Math.floor(player.profDebt * 1.025);
        if (bot.profDebt > 0) bot.profDebt = Math.floor(bot.profDebt * 1.025);

        applySharedSalaryIncrease();
    }

    setTimeout(() => {
        try {
            const pIncome = player.salary + player.passive - getExpenses(player);
            player.cash += pIncome;
            if (pIncome < 0) spawnFloatingText('player-cash', pIncome);
            else spawnFloatingText('player-cash', pIncome);
            logActivity(`คุณรับกระแสเงินสดสุทธิ ${fmt(pIncome)}`, 'income', 'player');

            const bIncome = bot.salary + bot.passive - getExpenses(bot);
            bot.cash += bIncome;
            logActivity(`บอทรับกระแสเงินสดสุทธิ ${fmt(bIncome)}`, 'income', 'bot');

            const rand = Math.random(); 
            
            // 🌟 ลอจิกการสุ่มเหตุการณ์ (รวมวิกฤต)
            if (gameMonth >= 36 && rand < 0.05) {
                currentSharedEvent = generateCrisisEvent();
            } else if (rand < 0.50) {
                currentSharedEvent = generateDynamicDeal();
            } else if (rand < 0.80) {
                currentSharedEvent = generateDynamicBadEvent();
            } else {
                currentSharedEvent = { type: 'nothing' }; 
            }

            if (currentSharedEvent.type === 'crisis') {
                setEventCard(`🚨 ${currentSharedEvent.name}`, currentSharedEvent.desc, '⚠️', false);
                showCrisisDecisions();
                actionPanel.classList.add('shake'); setTimeout(() => actionPanel.classList.remove('shake'), 500);
                isAnimating = false;
            } else if (currentSharedEvent.type === 'realestate' || currentSharedEvent.type === 'business' || currentSharedEvent.type === 'land') {
                setEventCard(`โอกาสลงทุน: ${currentSharedEvent.name}`, 'วิเคราะห์กระแสเงินสดให้ดีก่อนตัดสินใจ!\n(บอทกำลังพิจารณาดีลนี้อยู่เช่นกัน)', '🏢', true);
                showDealDecisions(currentSharedEvent);
                logActivity(`พบดีลร่วมกัน: ${currentSharedEvent.name}`, 'system', 'global');
                isAnimating = false;
            } else if (currentSharedEvent.type === 'bad_doodad') {
                if (player.isEducated && Math.random() < 0.5) {
                    setEventCard('🛡️ รอดตัว!', `ทักษะการเงินขั้นสูงทำให้คุณมีสติ!\nคุณสามารถระงับกิเลสไม่ซื้อ "${currentSharedEvent.name}" สำเร็จ!`, '🎓', true);
                    logActivity(`ใช้ภูมิคุ้มกันการเงินปฏิเสธรายจ่ายฟุ่มเฟือย`, 'income', 'player');
                    setTimeout(() => { processBotSharedTurn(); }, 1800);
                } else {
                    setEventCard('💸 เสียเงิน', `คุณพบของล่อตาล่อใจ: ${currentSharedEvent.name}\nราคา: ${fmt(currentSharedEvent.cost)}\n\n(บอทก็เจอเหตุการณ์นี้เช่นกัน)`, '🛒', true);
                    showDoodadDecisions();
                    actionPanel.classList.add('shake'); setTimeout(() => actionPanel.classList.remove('shake'), 500);
                    isAnimating = false;
                }
            } else if (currentSharedEvent.type === 'bad_life') {
                player.baseExpenses += currentSharedEvent.expenseIncrease;
                bot.baseExpenses += currentSharedEvent.expenseIncrease;
                setEventCard('📉 วิกฤต/ภาระชีวิต!', `${currentSharedEvent.name} ทำให้รายจ่ายทุกคนเพิ่ม ${fmt(currentSharedEvent.expenseIncrease)}/เดือน`, '⚠️', true);
                logActivity(`ทุกคนโดนเพิ่มรายจ่าย: ${currentSharedEvent.name}`, 'system', 'global');
                actionPanel.classList.add('shake'); setTimeout(() => actionPanel.classList.remove('shake'), 500);
                setTimeout(() => { processBotSharedTurn(); }, 1800);
            } else {
                setEventCard('☕ ชีวิตเรียบง่าย', `เดือนนี้ไม่มีเหตุการณ์พิเศษ\nรับเงินเดือนแล้วใช้ชีวิตต่อไปอย่างสงบสุข!`, '☀️', true);
                setTimeout(() => { processBotSharedTurn(); }, 1800);
            }
            
            enforceBankruptcyRule(player, true); 
            updateUI();
            flipper.classList.add('flipped');

        } catch(err) {
            console.error("Game Loop Error Caught:", err);
            restorePlayerTurn();
        }
    }, 400);
}

// 🌟 4. Bot Processing Shared Event
function processBotSharedTurn() {
    if (gameOver) return;
    
    const ind = document.getElementById('turn-indicator');
    if(ind) {
        ind.innerText = 'บอทกำลังประมวลผลเหตุการณ์...';
        ind.classList.remove('bg-amber-900/30', 'text-amber-400');
        ind.classList.add('bg-slate-700', 'text-slate-300');
    }
    
    setTimeout(() => {
        try {
            tradeMarketForBot();

            // 🎓 1. บอทประเมินการอัปสกิลตัวเอง
            if (!bot.isEducated && bot.cash >= 60000) { 
                bot.cash -= 50000;
                bot.isEducated = true;
                logActivity(`บอททุ่มเงินอัปสกิลการเงินขั้นเทพ!`, 'system', 'bot');
            }

            // 2. ลำดับการโปะหนี้ของบอท: บัตรเครดิต -> ฉุกเฉิน -> อาชีพ
            if ((bot.creditDebt || 0) > 0 && bot.cash > 5000) {
                let payAmt = Math.min(bot.cash - 2000, bot.creditDebt);
                bot.cash -= payAmt; bot.creditDebt -= payAmt;
                logActivity(`บอทโปะหนี้บัตรเครดิต ${fmt(payAmt)}`, 'system', 'bot');
            } else if (bot.bankDebt > 0 && bot.cash > 10000) { 
                let payAmt = Math.min(bot.cash - 5000, bot.bankDebt);
                bot.cash -= payAmt; bot.bankDebt -= payAmt; 
                logActivity(`บอทโปะหนี้ฉุกเฉิน ${fmt(payAmt)}`, 'system', 'bot');
            } else if (bot.bankDebt === 0 && bot.profDebt > 0 && bot.cash > 25000) { 
                let payAmt = Math.min(bot.cash - 10000, bot.profDebt);
                bot.cash -= payAmt; bot.profDebt -= payAmt; 
                logActivity(`บอททยอยโปะหนี้อาชีพ ${fmt(payAmt)}`, 'system', 'bot');
            }

            // 3. บอทเจอเหตุการณ์ร่วม
            const ev = currentSharedEvent;
            
            if (ev.type === 'crisis') {
                const requiredReserveB = getExpenses(bot) * 6;
                if (bot.cash >= requiredReserveB) {
                    logActivity(`บอทเอาตัวรอดจากวิกฤตได้เพราะมีเงินสำรอง!`, 'income', 'bot');
                } else {
                    bot.assets.forEach(asset => {
                        if (asset.type === 'realestate' || asset.type === 'business') {
                            const penalty = Math.floor(asset.grossCashflow * 0.5);
                            asset.grossCashflow -= penalty;
                            asset.cashflow -= penalty;
                            bot.passive -= penalty;
                        }
                    });
                    logActivity(`บอทบาดเจ็บหนัก! รายรับสินทรัพย์ถูกหั่น 50%`, 'expense', 'bot');
                }
            } else if (ev.type === 'realestate' || ev.type === 'business' || ev.type === 'land') { 
                // คัดกรองส่วนลดถ้าบอทอัปสกิลแล้ว
                let actualDpB = bot.isEducated ? Math.floor(ev.downPayment * 0.8) : ev.downPayment;

                if (ev.cashflow > 1000 || (ev.cashflow > 0 && actualDpB < 50000)) { 
                    let needed = actualDpB - bot.cash;
                    if (needed > 0 && ev.cashflow > (needed * 0.10) + 200) { bot.cash += needed; bot.bankDebt += needed; } 
                    
                    if (bot.cash >= actualDpB) {
                        bot.cash -= actualDpB; 
                        bot.passive += ev.grossCashflow; 
                        let finalMortgageB = ev.cost - actualDpB;
                        bot.assets.push({...ev, downPayment: actualDpB, mortgage: finalMortgageB});
                        logActivity(`บอทแย่งลงทุน ${ev.name} ได้สำเร็จ! (จ่ายดาวน์ ${fmt(actualDpB)})`, 'income', 'bot');
                    } else {
                        logActivity(`บอทเงินไม่พอจ่ายดาวน์ดีลนี้`, 'info', 'bot');
                    }
                } else {
                    logActivity(`บอทมองว่าดีลนี้ไม่คุ้ม จึงปล่อยผ่าน`, 'info', 'bot');
                }
            } else if (ev.type === 'bad_doodad') { 
                if (bot.isEducated && Math.random() < 0.5) {
                    logActivity(`บอทใช้ภูมิคุ้มกันการเงินปฏิเสธรายจ่ายฟุ่มเฟือย`, 'income', 'bot');
                } else if (bot.cash > ev.cost + 5000) {
                    bot.cash -= ev.cost;
                    logActivity(`บอทกัดฟันจ่ายเงินสดซื้อ: ${ev.name} ${fmt(-ev.cost)}`, 'expense', 'bot');
                } else {
                    bot.creditDebt = (bot.creditDebt || 0) + ev.cost;
                    logActivity(`บอทเงินช็อต! ต้องรูดบัตรเครดิต: ${ev.name} ${fmt(ev.cost)}`, 'expense', 'bot');
                }
            } 
            
            enforceBankruptcyRule(bot, false); 
            updateUI();
            
            setTimeout(() => { restorePlayerTurn(); }, 1500);

        } catch(err) {
            console.error("Bot Logic Error:", err);
            restorePlayerTurn();
        }
    }, 1000);
}

function checkWinCondition() {
    const isPlayerDebtFree = (player.profDebt === 0);
    const isBotDebtFree = (bot.profDebt === 0);

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
        goDesc.innerText = "สุดยอดมาก!\nคุณสร้าง Passive Income แซงรายจ่ายและล้างหนี้อาชีพได้สำเร็จ!\n\nการตัดสินใจของคุณเฉียบคมกว่า AI อย่างแท้จริง!";
    } else {
        goIcon.innerText = '💀';
        goTitle.innerText = 'พ่ายแพ้!';
        goTitle.className = "text-3xl font-extrabold text-rose-500 mb-2";
        goDesc.innerText = "บอท (AI) สามารถเผชิญเหตุการณ์เดียวกัน แต่บริหารเงินและเคลียร์หนี้ได้ฉลาดกว่าจนชนะไปก่อน!\n\nไม่เป็นไร ลองเล่นใหม่และวิเคราะห์จังหวะการลงทุนให้ดีขึ้นนะ";
    }

    setTimeout(() => { goModal.classList.remove('hidden'); }, 1000);
}

function tradeMarketForBot() {
    let cost = 0; let assetObj = null;
    const rsiInv = calculateRSI(market.history.inv); const rsiBtc = calculateRSI(market.history.btc);

    if (rsiInv < 40 && bot.cash >= Math.round(market.invPrice * 100)) {
        cost = Math.round(market.invPrice * 100); const cf = Math.round((cost * 0.05) / 12);
        assetObj = { id: Date.now(), type: 'inv', name: 'กองทุนหุ้น', units: 100, buyPrice: cost, mortgage: 0, grossCashflow: cf, cashflow: cf };
        logActivity(`ช้อนซื้อกองทุนหุ้นตอนถูก`, 'expense', 'bot');
    } else if (rsiBtc < 40 && bot.cash >= Math.round(market.btcPrice * 0.01)) {
        cost = Math.round(market.btcPrice * 0.01);
        assetObj = { id: Date.now(), type: 'btc', name: 'บิตคอยน์', units: 0.01, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0 };
        logActivity(`ช้อนซื้อบิตคอยน์ตอนตลาดร่วง`, 'expense', 'bot');
    } else if (bot.cash >= Math.round(market.goldPrice)) {
        cost = Math.round(market.goldPrice);
        assetObj = { id: Date.now(), type: 'gold', name: 'ทองคำ 1 บาท', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0 };
        logActivity(`ซื้อทองคำเก็บไว้เพื่อป้องกันความเสี่ยง`, 'expense', 'bot');
    } else if (bot.cash >= 15000) {
        cost = 10000; const cf = Math.round((cost * 0.02) / 12);
        assetObj = { id: Date.now(), type: 'bank', name: 'เงินฝากประจำ', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: cf, cashflow: cf };
        logActivity(`ฝากเงินในแบงก์กินดอกเบี้ย`, 'expense', 'bot');
    }

    if (assetObj) {
        bot.cash -= cost; bot.passive += assetObj.grossCashflow; bot.assets.push(assetObj);
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