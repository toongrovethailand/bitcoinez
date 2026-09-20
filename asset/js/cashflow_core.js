// ./asset/js/cashflow_core.js

const gameEngine = new GameEngine();
const uiManager = new UIManager();
const botEngine = new BotEngine(gameEngine, uiManager);

let player = gameEngine.player;
let bot = gameEngine.bot;
let market = gameEngine.market;

let currentPortfolioTab = 'all';
let portfolioSearchQuery = '';
let portfolioTarget = 'player';
let cachedLeaderboardData = []; 

function fmt(num) { return GameUtils.fmt(num); }
function logActivity(msg, type, ctx) { uiManager.logActivity(msg, `ด.${gameEngine.gameMonth}`, type, ctx); }
function spawnFloatingText(id, amt) { uiManager.spawnFloatingText(id, amt); }
function showAlert(title, msg, icon) { uiManager.showAlert(title, msg, icon); }
function closeCustomAlert() { uiManager.closeCustomAlert(); }
function showConfirm(title, msg, icon, onConfirm) { uiManager.showConfirm(title, msg, icon, onConfirm); }
function closeCustomConfirm() { uiManager.closeCustomConfirm(); }
function setEventCard(title, desc, icon, quote) { uiManager.setEventCard(title, desc, icon, quote); }
function hideDecisions() { uiManager.hideDecisions(gameEngine.gameOver); }

function drawProfession() {
    let card = CONTENT.professions[Math.floor(Math.random() * CONTENT.professions.length)];
    player.assignProfession(card); bot.assignProfession(card);

    player.expenseBreakdown = JSON.parse(JSON.stringify(card.expenseBreakdown));
    bot.expenseBreakdown = JSON.parse(JSON.stringify(card.expenseBreakdown));

    uiManager.safeSetText('prof-player-name', player.profName);
    uiManager.safeSetText('prof-player-salary', fmt(player.salary));
    uiManager.safeSetText('prof-player-exp', fmt(player.baseExpenses));
    uiManager.safeSetText('prof-player-debt', fmt(player.profDebt));
    uiManager.safeSetText('prof-player-sav', fmt(player.cash));

    uiManager.safeSetText('prof-bot-name', bot.profName);
    uiManager.safeSetText('prof-bot-salary', fmt(bot.salary));
    uiManager.safeSetText('prof-bot-exp', fmt(bot.baseExpenses));
    uiManager.safeSetText('prof-bot-debt', fmt(bot.profDebt));
    uiManager.safeSetText('prof-bot-sav', fmt(bot.cash));

    document.getElementById('welcome-step-1').classList.add('hidden');
    document.getElementById('welcome-step-2').classList.remove('hidden');
}

function startGame() {
    document.getElementById('welcome-modal').classList.add('hidden');
    uiManager.safeSetText('header-profession', player.profName);
    uiManager.safeSetText('bot-profession', bot.profName);
    
    // 🌟 รีเซ็ตตัวแปรสถานะ Layoff และ DSR
    player.layoffMonths = 0; bot.layoffMonths = 0;
    player.dsrMonths = 0; bot.dsrMonths = 0;

    gameEngine.resetEventCounts(); gameEngine.nextCrisisMonth = 36; 
    gameEngine.cumulativeInflation = 1.0;

    logActivity(`[เริ่มเกม] วัดกึ๋น! ผู้เล่นและบอทได้รับอาชีพ ${player.profName} เหมือนกัน`, 'system', 'global');
    logActivity(`ระบบได้นำ 'ภาษีอัตราก้าวหน้า' เข้าไปรวมในรายจ่ายของคุณแล้ว!`, 'system', 'global');
    
    updateMarketPrices(); updateUI();
}

function toggleInflationMode() {
    const isDynamic = document.getElementById('inflation-dynamic-toggle').checked;
    const inputEl = document.getElementById('inflation-rate');
    if (isDynamic) {
        inputEl.disabled = true;
        inputEl.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        inputEl.disabled = false;
        inputEl.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function updateMarketPrices() {
    let bias = market.nextBias;
    let infRate = parseFloat(document.getElementById('inflation-rate')?.value) || 3;
    let isHighInflation = infRate >= 7;

    if (market.spMonthsLeft <= 0) {
        const r = Math.random();
        if (r < 0.25) { market.spState = 'bear'; market.spMonthsLeft = Math.floor(Math.random() * 6) + 3; }
        else if (r < 0.65) { market.spState = 'sideways'; market.spMonthsLeft = Math.floor(Math.random() * 6) + 3; }
        else { market.spState = 'bull'; market.spMonthsLeft = Math.floor(Math.random() * 6) + 3; }
    }
    market.spMonthsLeft--;

    let spChange = 0;
    if (market.spState === 'bear') spChange = (Math.random() * 0.03) - 0.03; 
    else if (market.spState === 'sideways') spChange = (Math.random() * 0.04) - 0.02; 
    else if (market.spState === 'bull') spChange = (Math.random() * 0.03) + 0.01; 

    if (bias === 'bull') spChange += 0.02;
    if (bias === 'bear' || isHighInflation) spChange -= 0.03;

    if (market.goldMonthsLeft <= 0) {
        const r = Math.random();
        if (isHighInflation || market.spState === 'bear') {
            if (r < 0.60) { market.goldState = 'bull'; market.goldMonthsLeft = Math.floor(Math.random() * 6) + 3; }
            else if (r < 0.90) { market.goldState = 'sideways'; market.goldMonthsLeft = Math.floor(Math.random() * 6) + 3; }
            else { market.goldState = 'bear'; market.goldMonthsLeft = Math.floor(Math.random() * 4) + 2; }
        } else {
            if (r < 0.20) { market.goldState = 'bull'; market.goldMonthsLeft = Math.floor(Math.random() * 6) + 3; }
            else if (r < 0.70) { market.goldState = 'sideways'; market.goldMonthsLeft = Math.floor(Math.random() * 6) + 3; }
            else { market.goldState = 'bear'; market.goldMonthsLeft = Math.floor(Math.random() * 6) + 3; }
        }
    }
    market.goldMonthsLeft--;

    let goldChange = 0;
    if (market.goldState === 'bear') goldChange = (Math.random() * 0.03) - 0.025;
    else if (market.goldState === 'sideways') goldChange = (Math.random() * 0.03) - 0.015;
    else if (market.goldState === 'bull') goldChange = (Math.random() * 0.04) + 0.01;

    if (bias === 'bear' || isHighInflation) goldChange += 0.02;

    if (market.btcMonthsLeft <= 0) {
        const r = Math.random();
        if (r < 0.60) { market.btcState = 'bear'; market.btcMonthsLeft = Math.floor(Math.random() * 13) + 6; } 
        else if (r < 0.90) { market.btcState = 'sideways'; market.btcMonthsLeft = Math.floor(Math.random() * 10) + 3; } 
        else { market.btcState = 'bull'; market.btcMonthsLeft = Math.floor(Math.random() * 3) + 1; }
    }
    market.btcMonthsLeft--;

    let btcChange = 0;
    if (market.btcState === 'bear') btcChange = (Math.random() * 0.20) - 0.15; 
    else if (market.btcState === 'sideways') btcChange = (Math.random() * 0.20) - 0.10; 
    else if (market.btcState === 'bull') btcChange = (Math.random() * 1.50) + 0.50; 

    if (bias === 'crypto') btcChange += 0.20;
    if (isHighInflation && market.btcState !== 'bull') btcChange += (Math.random() > 0.5 ? 0.15 : -0.15); 

    market.invPrice = Math.max(10, market.invPrice * (1 + spChange));
    market.goldPrice = Math.max(1000, market.goldPrice * (1 + goldChange));
    market.btcPrice = Math.max(100000, market.btcPrice * (1 + btcChange)); 

    uiManager.safeSetText('price-inv', fmt(Math.round(market.invPrice * 100))); 
    uiManager.safeSetText('price-gold', fmt(Math.round(market.goldPrice)));
    uiManager.safeSetText('price-btc', fmt(Math.round(market.btcPrice * 0.01))); 
    
    market.nextBias = 'normal'; 
}

// 🌟 Engine ตรวจสอบการล้มละลาย (เงินช็อต / หนี้ท่วมหัว)
gameEngine.checkBankruptcy = function(actor) {
    let effSalary = actor.salary;
    if (actor.layoffMonths > 0) {
        let hasSS = actor.insurances.some(i => i.id === 'ins_social');
        effSalary = hasSS ? Math.floor(actor.salary * 0.5) : 0;
    }
    let totalIncome = effSalary + actor.passive;
    let expenses = actor.getExpenses();
    
    // 1. ตรวจสอบ NPL หนี้ท่วมหัว (รายจ่าย > รายรับ 1.5 เท่า)
    if (totalIncome > 0 && expenses > totalIncome * 1.5) {
        actor.dsrMonths = (actor.dsrMonths || 0) + 1;
    } else {
        actor.dsrMonths = 0;
    }
    if (actor.dsrMonths >= 3) return 'over_leveraged';

    // 2. ตรวจสอบเงินสดช็อต (Liquidity Crash) - ตายแบบคณิตศาสตร์ (กู้ไม่ได้ ขายไม่ได้แล้ว)
    if (actor.cash < 0) {
        let maxLoan = actor.salary * 5;
        let availableLoan = Math.max(0, maxLoan - actor.bankDebt);
        let sellableValue = 0;
        actor.assets.forEach(a => {
            let val = 0;
            if(a.type==='bank') val=a.buyPrice;
            else if(a.type==='inv') val=Math.round(market.invPrice*a.units);
            else if(a.type==='gold') val=Math.round(market.goldPrice*a.units);
            else if(a.type==='btc') val=Math.round(market.btcPrice*a.units);
            else if(a.type==='installment') val=a.salvage;
            else val = Math.floor(a.buyPrice * 0.5); // ประเมินราคาเทขายด่วน
            let net = val - (a.mortgage || 0);
            if (net > 0) sellableValue += net;
        });
        
        // ถ้าเอาเงินกู้มารวมกับของขายหมดบ้านแล้วยังไม่พอจ่ายหนี้ = ตายสนิท
        if (actor.cash + availableLoan + sellableValue < 0) {
            return 'liquidity_crash';
        }
    }
    return null;
}

function checkWinCondition() {
    let pEffSalary = player.layoffMonths > 0 ? (player.insurances.some(i=>i.id==='ins_social') ? Math.floor(player.salary*0.5) : 0) : player.salary;
    let bEffSalary = bot.layoffMonths > 0 ? (bot.insurances.some(i=>i.id==='ins_social') ? Math.floor(bot.salary*0.5) : 0) : bot.salary;
    
    let pNetCashflow = (pEffSalary + player.passive) - player.getExpenses();
    let bNetCashflow = (bEffSalary + bot.passive) - bot.getExpenses();

    const isPlayerWin = (
        player.passive > player.getExpenses() && pNetCashflow > 0 && player.profDebt === 0 && player.bankDebt === 0 && (!player.creditDebt || player.creditDebt === 0)
    );
    const isBotWin = (
        bot.passive > bot.getExpenses() && bNetCashflow > 0 && bot.profDebt === 0 && bot.bankDebt === 0 && (!bot.creditDebt || bot.creditDebt === 0)
    );

    if (isPlayerWin) { logActivity(`🎉 ชนะแล้ว! คุณเข้าสู่ Fast Track`, 'system', 'global'); endGame('player'); } 
    else if (isBotWin) { logActivity(`💀 แพ้แล้ว! บอทออกจากสนามแข่งหนู`, 'system', 'global'); endGame('bot'); }
}

function calculateNetWorth(actor) {
    let nw = actor.cash - (actor.profDebt + actor.bankDebt + (actor.creditDebt||0));
    actor.assets.forEach(a => {
        if(a.type==='bank') nw += a.buyPrice;
        else if(a.type==='inv') nw += Math.round(market.invPrice*a.units);
        else if(a.type==='gold') nw += Math.round(market.goldPrice*a.units);
        else if(a.type==='btc') nw += Math.round(market.btcPrice*a.units);
        else if(a.type==='installment') nw += a.salvage;
        else nw += (a.buyPrice - (a.mortgage||0));
    });
    actor.escrows.forEach(e => nw += e.amount);
    return nw;
}

function shareToFacebook() {
    let text = document.getElementById('post-game-report-text').innerText;
    let url = window.location.href; 
    let fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
}

function downloadReportImage() {
    const btn = document.getElementById('btn-download-report');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '⏳ กำลังสร้างรูปภาพ...';
    btn.disabled = true;

    const watermark = document.getElementById('watermark-report');
    if (watermark) watermark.classList.remove('hidden');

    setTimeout(() => {
        const container = document.getElementById('report-container');
        html2canvas(container, {
            backgroundColor: '#0f172a',
            scale: 2, 
            useCORS: true,
            logging: false
        }).then(canvas => {
            if (watermark) watermark.classList.add('hidden');
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `Cashflow_Report_${player.profName}_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click(); 
            document.body.removeChild(link);

            btn.innerHTML = '✅ บันทึกภาพสำเร็จ!';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 3000);
            
        }).catch(err => {
            console.error("Error generating image", err);
            btn.innerHTML = '❌ เกิดข้อผิดพลาด';
            if (watermark) watermark.classList.add('hidden');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 3000);
        });
    }, 300);
}

function endGame(winner) {
    if (gameEngine.gameOver) return;
    gameEngine.gameOver = true; gameEngine.isAnimating = false; hideDecisions();
    const btnRoll = document.getElementById('btn-roll'); if(btnRoll) { btnRoll.disabled = true; btnRoll.innerText = 'จบเกมแล้ว'; btnRoll.className = "w-full py-4 rounded-lg font-bold text-sm tracking-widest shadow-lg bg-slate-700 text-slate-500 cursor-not-allowed"; }
    
    let yrs = Math.floor(gameEngine.gameMonth / 12);
    let mos = gameEngine.gameMonth % 12;
    const goTime = document.getElementById('go-time');
    goTime.innerText = `${gameEngine.gameMonth} เดือน (${yrs} ปี ${mos} เดือน)`;

    let pNetWorth = calculateNetWorth(player);
    document.getElementById('go-networth').innerText = fmt(pNetWorth);

    let reportHtml = '';

    if (winner === 'player') {
        const stEl = document.getElementById('player-status'); if(stEl) { stEl.innerText = 'Fast Track!'; stEl.classList.replace('text-amber-400', 'text-emerald-400'); }
        uiManager.safeSetText('go-icon', '🏆'); uiManager.safeSetText('go-title', 'ชนะเกม!'); document.getElementById('go-title').className = "text-3xl font-extrabold text-amber-400 mb-2";
        uiManager.safeSetText('go-desc', "คุณสร้าง Passive Income แซงรายจ่าย\nและเคลียร์หนี้เลวทั้งหมดได้สำเร็จ!");
        
        reportHtml = `
            <div class="text-emerald-400 font-bold text-center text-sm mb-3">🎉 THE FAST TRACK 🎉</div>
            <div class="space-y-1.5 px-2">
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>อาชีพเริ่มต้น:</span> <span class="text-white">${player.profName}</span></div>
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>เวลาแห่งอิสรภาพ:</span> <span class="text-amber-400 font-bold">${yrs} ปี ${mos} เดือน</span></div>
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>Passive Income:</span> <span class="text-emerald-400">+${fmt(player.passive)}/เดือน</span></div>
                <div class="flex justify-between pb-1"><span>หนี้เลวคงค้าง:</span> <span class="text-white">฿0</span></div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-600 text-center text-[10px] text-slate-400 italic">"ผมสามารถหนีออกจากสนามแข่งหนูได้สำเร็จ ลองมาแข่งด้วยกันไหมล่ะ?"</div>
            <div id="post-game-report-text" class="hidden">ผมเพิ่งหนีออกจาก "สนามแข่งหนู" ได้สำเร็จในเกม Cashflow Matrix! 🏆\n\n📌 อาชีพ: ${player.profName}\n⏱️ ใช้เวลา: ${yrs} ปี ${mos} เดือน\n💰 ความมั่งคั่งสุทธิ: ${fmt(pNetWorth)} บาท\n\nมาทดสอบทักษะการเงินของคุณ และแข่งกับ AI ดูสิ!</div>
        `;
        document.getElementById('submit-score-section').classList.remove('hidden'); 
    } else if (winner === 'bot') {
        const stEl = document.getElementById('bot-status'); if(stEl) { stEl.innerText = 'Fast Track!'; stEl.classList.replace('text-amber-400', 'text-emerald-400'); }
        uiManager.safeSetText('go-icon', '💀'); uiManager.safeSetText('go-title', 'พ่ายแพ้!'); document.getElementById('go-title').className = "text-3xl font-extrabold text-rose-500 mb-2";
        uiManager.safeSetText('go-desc', "บอท (AI) สามารถเผชิญเหตุการณ์เดียวกัน\nแต่บริหารเงินได้ดีกว่าจนชนะไปก่อน!");
        
        reportHtml = `
            <div class="text-rose-400 font-bold text-center text-sm mb-3">💀 GAME OVER 💀</div>
            <div class="space-y-1.5 px-2">
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>อาชีพที่ท้าทาย:</span> <span class="text-white">${player.profName}</span></div>
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>เวลาที่บอท AI ชนะ:</span> <span class="text-rose-400 font-bold">${yrs} ปี ${mos} เดือน</span></div>
                <div class="flex justify-between pb-1"><span>ความมั่งคั่งตอนจบเกม:</span> <span class="text-white">${fmt(pNetWorth)} บาท</span></div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-600 text-center text-[10px] text-slate-400 italic">"โดน AI ตบยับ! ใครคิดว่าเจ๋ง ลองมาแก้แค้น AI แทนผมหน่อย"</div>
            <div id="post-game-report-text" class="hidden">โดน AI ตบยับในเกม Cashflow Matrix! 💀\n\nบอทบริหารเงินเก่งกว่าผม แย่งเข้า Fast Track ไปก่อนใน ${yrs} ปี ${mos} เดือน\n\nใครคิดว่าเจ๋ง ลองมาแก้แค้น AI แทนผมหน่อย!</div>
        `;
    } else if (winner === 'bankrupt') {
        const stEl = document.getElementById('player-status'); if(stEl) { stEl.innerText = 'ล้มละลาย!'; stEl.classList.replace('text-amber-400', 'text-rose-500'); }
        uiManager.safeSetText('go-icon', '💥'); uiManager.safeSetText('go-title', 'ล้มละลาย!'); document.getElementById('go-title').className = "text-3xl font-extrabold text-rose-500 mb-2";
        uiManager.safeSetText('go-desc', "เกิดวิกฤตเศรษฐกิจ แต่คุณเตรียมเงินสำรองไว้ไม่พอ\n\nกระแสเงินสดพังทลาย คุณถูกฟ้องล้มละลายและยึดทรัพย์ทั้งหมด!");
        
        reportHtml = `
            <div class="text-rose-400 font-bold text-center text-sm mb-3">💥 BANKRUPTCY 💥</div>
            <div class="space-y-1.5 px-2">
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>อาชีพที่ท้าทาย:</span> <span class="text-white">${player.profName}</span></div>
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>จุดจบสายแข็ง:</span> <span class="text-rose-400 font-bold">${yrs} ปี ${mos} เดือน</span></div>
                <div class="flex justify-between pb-1"><span>สาเหตุ:</span> <span class="text-white">เงินสำรองไม่พอตอนเจอวิกฤต</span></div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-600 text-center text-[10px] text-slate-400 italic">"ประมาทไปหน่อย เจอวิกฤตซัดจนล้มละลายเลย ใครเอาตัวรอดเก่งมาลองดู"</div>
            <div id="post-game-report-text" class="hidden">ล้มละลายในเกม Cashflow Matrix! 💥\n\nเจอวิกฤตเศรษฐกิจเข้าไป แต่เตรียมเงินสำรองไว้ไม่พอ เลยโดนยึดทรัพย์หมดตัวในเวลา ${yrs} ปี ${mos} เดือน 😭\n\nใครอยากลองทดสอบทักษะการเอาตัวรอดทางการเงิน มาลองเล่นกันดู!</div>
        `;
    } else if (winner === 'bankrupt_liquidity') {
        const stEl = document.getElementById('player-status'); if(stEl) { stEl.innerText = 'ล้มละลาย!'; stEl.classList.replace('text-amber-400', 'text-rose-500'); }
        uiManager.safeSetText('go-icon', '💥'); uiManager.safeSetText('go-title', 'ล้มละลาย! (เงินช็อต)'); document.getElementById('go-title').className = "text-3xl font-extrabold text-rose-500 mb-2";
        uiManager.safeSetText('go-desc', "กระแสเงินสดของคุณติดลบต่อเนื่อง!\nคุณไม่มีวงเงินกู้ หรือสินทรัพย์เหลือให้ขายอีกแล้ว\n\nศาลสั่งฟ้องล้มละลายและยึดทรัพย์ทั้งหมด!");
        
        reportHtml = `
            <div class="text-rose-400 font-bold text-center text-sm mb-3">💥 BANKRUPTCY (LIQUIDITY) 💥</div>
            <div class="space-y-1.5 px-2">
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>อาชีพที่ท้าทาย:</span> <span class="text-white">${player.profName}</span></div>
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>จุดจบสายแข็ง:</span> <span class="text-rose-400 font-bold">${yrs} ปี ${mos} เดือน</span></div>
                <div class="flex justify-between pb-1"><span>สาเหตุ:</span> <span class="text-white">หมุนเงินไม่ทันจนหมดตัว (ช็อต!)</span></div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-600 text-center text-[10px] text-slate-400 italic">"เงินสดช็อตหนักจนไปต่อไม่ไหว ล้มละลายคากระดาน!"</div>
            <div id="post-game-report-text" class="hidden">หมุนเงินไม่ทันจนล้มละลายใน Cashflow Matrix! 💥\n\nใช้เงินเกินตัวจนช็อต หาเงินมาอุดรอยรั่วไม่ได้ โดนยึดทรัพย์หมดตัวใน ${yrs} ปี ${mos} เดือน 😭\n\nใครบริหารเงินเก่งกว่านี้ มาโชว์สเตปหน่อย!</div>
        `;
    } else if (winner === 'bankrupt_dsr') {
        const stEl = document.getElementById('player-status'); if(stEl) { stEl.innerText = 'ล้มละลาย!'; stEl.classList.replace('text-amber-400', 'text-rose-500'); }
        uiManager.safeSetText('go-icon', '💥'); uiManager.safeSetText('go-title', 'ล้มละลาย! (หนี้ท่วม)'); document.getElementById('go-title').className = "text-3xl font-extrabold text-rose-500 mb-2";
        uiManager.safeSetText('go-desc', "ภาระหนี้สินของคุณสูงเกิน 150% ของรายรับติดต่อกัน 3 เดือน!\n\nธนาคารจัดคุณเป็นหนี้เสีย (NPL) และยึดทรัพย์ทั้งหมด!");
        
        reportHtml = `
            <div class="text-rose-400 font-bold text-center text-sm mb-3">💥 BANKRUPTCY (OVER-LEVERAGED) 💥</div>
            <div class="space-y-1.5 px-2">
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>อาชีพที่ท้าทาย:</span> <span class="text-white">${player.profName}</span></div>
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>จุดจบสายแข็ง:</span> <span class="text-rose-400 font-bold">${yrs} ปี ${mos} เดือน</span></div>
                <div class="flex justify-between pb-1"><span>สาเหตุ:</span> <span class="text-white">กู้หนี้เกินตัว (NPL) ธนาคารยึดทรัพย์</span></div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-600 text-center text-[10px] text-slate-400 italic">"หนี้ท่วมหัวเอาตัวไม่รอด ธนาคารยึดเกลี้ยง!"</div>
            <div id="post-game-report-text" class="hidden">ก่อหนี้เกินตัวจนพังทลายใน Cashflow Matrix! 💥\n\nภาระหนี้บวมทะลุ 150% ของรายได้ โดนแบงก์ฟ้องล้มละลาย NPL ใน ${yrs} ปี ${mos} เดือน 😭\n\nใครอยากรู้ว่าหนี้เลวน่ากลัวแค่ไหน มาลองเล่นกันดู!</div>
        `;
    } else if (winner === 'player_survive') {
        const stEl = document.getElementById('player-status'); if(stEl) { stEl.innerText = 'ผู้ชนะ (รอดชีวิต)!'; stEl.classList.replace('text-amber-400', 'text-emerald-400'); }
        uiManager.safeSetText('go-icon', '🏆'); uiManager.safeSetText('go-title', 'ชนะเกม! (บอทพังทลาย)'); document.getElementById('go-title').className = "text-3xl font-extrabold text-amber-400 mb-2";
        uiManager.safeSetText('go-desc', "สุดยอดมาก!\nคุณรับมือเหตุการณ์เลวร้ายได้ยอดเยี่ยม ในขณะที่บอท (AI) ทนพิษบาดแผลไม่ไหวและถูกฟ้องล้มละลายไปก่อน!\n\nคุณคือผู้รอดชีวิตที่แท้จริง!");
        
        reportHtml = `
            <div class="text-emerald-400 font-bold text-center text-sm mb-3">🏆 THE SURVIVOR 🏆</div>
            <div class="space-y-1.5 px-2">
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>อาชีพเริ่มต้น:</span> <span class="text-white">${player.profName}</span></div>
                <div class="flex justify-between border-b border-slate-700 pb-1"><span>เวลาที่บอทล้มละลาย:</span> <span class="text-amber-400 font-bold">${yrs} ปี ${mos} เดือน</span></div>
                <div class="flex justify-between pb-1"><span>ความมั่งคั่งสุทธิ:</span> <span class="text-white">${fmt(pNetWorth)} บาท</span></div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-600 text-center text-[10px] text-slate-400 italic">"ผมวางแผนรับมือความเสี่ยงจน AI ล้มละลายไปก่อนได้สำเร็จ! มาทดสอบกันหน่อยไหม?"</div>
            <div id="post-game-report-text" class="hidden">ผมเอาตัวรอดจน AI ล้มละลายไปก่อนในเกม Cashflow Matrix! 🏆\n\n📌 อาชีพ: ${player.profName}\n⏱️ ใช้เวลา: ${yrs} ปี ${mos} เดือน\n💰 ความมั่งคั่งสุทธิ: ${fmt(pNetWorth)} บาท\n\nมาทดสอบทักษะการบริหารความเสี่ยงของคุณดูสิ!</div>
        `;
        document.getElementById('submit-score-section').classList.remove('hidden'); 
    }

    document.getElementById('post-game-report').innerHTML = reportHtml;
    setTimeout(() => { document.getElementById('gameover-modal').classList.remove('hidden'); }, 1000);
}

function rollDiceWithAnimation() {
    if (gameEngine.gameOver || gameEngine.currentTurn !== 'player' || gameEngine.isAnimating) return;
    gameEngine.isAnimating = true;
    document.getElementById('btn-roll').disabled = true; document.getElementById('btn-roll').innerText = 'กำลังดำเนินชีวิต...'; 
    document.getElementById('card-flipper').classList.remove('flipped'); 
    
    if(Math.random() < 0.2) logActivity(gameEngine.generateNews(), 'news', 'global');
    gameEngine.gameMonth++; updateMarketPrices(); 

    if (player.bankDebt > 0) player.bankDebt = Math.floor(player.bankDebt * (1 + gameEngine.bankInterestRate));
    if (bot.bankDebt > 0) bot.bankDebt = Math.floor(bot.bankDebt * (1 + gameEngine.bankInterestRate));
    
    if (gameEngine.badCooldown > 0) gameEngine.badCooldown--;

    let infRateEl = document.getElementById('inflation-rate');
    let isDynamic = document.getElementById('inflation-dynamic-toggle')?.checked;

    if (gameEngine.gameMonth > 1 && gameEngine.gameMonth % 12 === 1) {
        if (isDynamic) {
            let newRate = Math.floor(Math.random() * 15) + 1; 
            infRateEl.value = newRate;
            logActivity(`📈 [ปีใหม่] อัตราเงินเฟ้อผันผวน! ปรับเป็น ${newRate}%`, 'system', 'global');
            if (newRate >= 8) showAlert('🚨 เงินเฟ้อพุ่งสูง!', `อัตราเงินเฟ้อปีนี้พุ่งทะยานถึง ${newRate}%\nส่งผลให้ข้าวของแพงขึ้น และตลาดทุน (หุ้น/คริปโต) อาจผันผวนอย่างหนัก!`, '🔥');
            
            if (newRate >= 6) {
                gameEngine.bankInterestRate = 0.03; 
                logActivity(`🚨 ดอกเบี้ยนโยบายปรับขึ้น! หนี้ฉุกเฉินดอกเบี้ยพุ่งเป็น 3.00% ต่อเดือน`, 'expense', 'global');
                uiManager.safeSetText('ui-bank-rate', '3.00%');
            } else if (newRate >= 4) {
                gameEngine.bankInterestRate = 0.02; 
                logActivity(`⚠️ ดอกเบี้ยนโยบายปรับขึ้น! หนี้ฉุกเฉินดอกเบี้ยเป็น 2.00% ต่อเดือน`, 'expense', 'global');
                uiManager.safeSetText('ui-bank-rate', '2.00%');
            } else {
                gameEngine.bankInterestRate = 0.0125;
                logActivity(`✅ ดอกเบี้ยนโยบายปกติ หนี้ฉุกเฉิน 1.25% ต่อเดือน`, 'info', 'global');
                uiManager.safeSetText('ui-bank-rate', '1.25%');
            }
        } else {
            logActivity(`[ปีใหม่] เงินเฟ้อทำงาน ของแพงขึ้น!`, 'system', 'global');
        }

        let infRate = parseFloat(infRateEl.value) || 3;
        let infMult = 1 + (infRate / 100);
        
        gameEngine.cumulativeInflation = (gameEngine.cumulativeInflation || 1.0) * infMult;

        let pNewBaseExp = 0;
        ['food', 'housing', 'transport', 'personal'].forEach(k => {
            player.expenseBreakdown[k] = Math.floor(player.expenseBreakdown[k] * infMult);
            pNewBaseExp += player.expenseBreakdown[k];
        });
        player.baseExpenses = pNewBaseExp;

        let bNewBaseExp = 0;
        ['food', 'housing', 'transport', 'personal'].forEach(k => {
            bot.expenseBreakdown[k] = Math.floor(bot.expenseBreakdown[k] * infMult);
            bNewBaseExp += bot.expenseBreakdown[k];
        });
        bot.baseExpenses = bNewBaseExp;
        
        if (player.profDebt > 0) player.profDebt = Math.floor(player.profDebt * 1.025);
        if (bot.profDebt > 0) bot.profDebt = Math.floor(bot.profDebt * 1.025);
        if (Math.random() <= 0.25) { 
            let p = player.salary < 30000 ? 6 : (player.salary < 80000 ? 4 : 2);
            player.salary += Math.floor(player.salary * (p / 100)); bot.salary += Math.floor(bot.salary * (p / 100));
            logActivity(`🎉 ปรับฐานเงินเดือนขึ้น ${p}% ทั้งระบบ!`, 'system', 'global'); showAlert('🎉 ข่าวดี!', `คุณและบอทได้ขึ้นเงินเดือน ${p}%`, '💸');
        }
    }

    setTimeout(() => {
        try { 
            // 🌟 คำนวณเงินเดือนแบบใหม่ โดยหักลบถ้ามีการตกงาน
            if (player.layoffMonths > 0) {
                player.layoffMonths--;
                if (player.layoffMonths === 0) {
                    logActivity(`สิ้นสุดระยะเวลาตกงาน คุณได้งานใหม่แล้ว!`, 'info', 'player');
                    showAlert('ได้งานใหม่!', 'ระยะเวลาตกงานสิ้นสุดลง คุณกลับมามีรายได้ตามปกติแล้ว', '💼');
                }
            }

            let pEffSalary = player.salary;
            if (player.layoffMonths > 0) {
                let hasSS = player.insurances.some(i => i.id === 'ins_social');
                pEffSalary = hasSS ? Math.floor(player.salary * 0.5) : 0;
            }

            const pInc = pEffSalary + player.passive - player.getExpenses(); 
            player.cash += pInc; 
            spawnFloatingText('player-cash', pInc); 
            if(pInc < 0) logActivity(`กระแสเงินสดติดลบ ${fmt(pInc)}`, 'expense', 'player');
            else logActivity(`รับกระแสเงินสดสุทธิ ${fmt(pInc)}`, 'income', 'player');
            
            const timeAssetsResult = player.processTimeBasedAssets();
            if (timeAssetsResult.maturedCash > 0) {
                spawnFloatingText('player-cash', timeAssetsResult.maturedCash);
                logActivity(`💰 สัญญาเสร็จสิ้น! รับเงินขาย ${timeAssetsResult.maturedNames.join(', ')} จำนวน ${fmt(timeAssetsResult.maturedCash)}`, 'income', 'player');
                showAlert('💰 เงินเข้าแล้ว!', `สัญญาซื้อขายเสร็จสิ้น!\nคุณได้รับเงินก้อน ${fmt(timeAssetsResult.maturedCash)} จากการขาย ${timeAssetsResult.maturedNames.join(', ')}`, '💵');
            }
            if (timeAssetsResult.finishedInstallments.length > 0) {
                logActivity(`🎉 ผ่อน ${timeAssetsResult.finishedInstallments.join(', ')} หมดแล้ว! กลายเป็นทรัพย์สินปลอดภาระ`, 'system', 'player');
                showAlert('🎉 ผ่อนหมดแล้ว!', `ยินดีด้วย!\nคุณผ่อน ${timeAssetsResult.finishedInstallments.join(', ')} หมดแล้ว\nภาระรายจ่ายลดลง และสามารถนำไปขายเป็นของมือสองได้!`, '🥳');
            }

            if (bot.layoffMonths > 0) bot.layoffMonths--;
            let bEffSalary = bot.salary;
            if (bot.layoffMonths > 0) {
                let hasSSBot = bot.insurances.some(i => i.id === 'ins_social');
                bEffSalary = hasSSBot ? Math.floor(bot.salary * 0.5) : 0;
            }
            const bInc = bEffSalary + bot.passive - bot.getExpenses(); 
            bot.cash += bInc; 
            logActivity(`บอทรับกระแสเงินสดสุทธิ ${fmt(bInc)}`, 'income', 'bot');
            player.creditGrace = 0; bot.creditGrace = 0;

            const prob = gameEngine.probabilities;
            let rCrisis = prob.crisis / 100;
            let rDeal = rCrisis + (prob.deal / 100);
            let rBad = rDeal + (prob.bad / 100);
            let rGamble = rBad + (prob.gamble / 100);

            const r = Math.random(); 
            if (gameEngine.gameMonth >= gameEngine.nextCrisisMonth && r < rCrisis) { 
                gameEngine.currentSharedEvent = gameEngine.generateCrisisEvent(); 
                gameEngine.nextCrisisMonth = gameEngine.gameMonth + Math.floor(Math.random() * 13) + 48; 
            } 
            else if (r < rDeal) gameEngine.currentSharedEvent = gameEngine.generateDynamicDeal();
            else if (r < rBad) {
                if (gameEngine.gameMonth <= 3 || gameEngine.badCooldown > 0) {
                    gameEngine.currentSharedEvent = { type: 'nothing' }; 
                } else {
                    let ev = gameEngine.generateDynamicBadEvent();
                    
                    let isInstalling = player.assets.some(a => a.type === 'installment' && a.monthsLeft > 0) || 
                                       bot.assets.some(a => a.type === 'installment' && a.monthsLeft > 0);
                    
                    let attempts = 0;
                    while (ev.type === 'installment' && isInstalling && attempts < 10) {
                        ev = gameEngine.generateDynamicBadEvent();
                        attempts++;
                    }
                    
                    if (ev.type === 'installment' && isInstalling) {
                        ev = { type: 'nothing' }; 
                    }

                    gameEngine.currentSharedEvent = ev;
                    if (ev.type !== 'nothing') gameEngine.badCooldown = 2; 
                }
            }
            else if (r < rGamble) gameEngine.currentSharedEvent = gameEngine.generateGambleEvent();
            else gameEngine.currentSharedEvent = { type: 'nothing' }; 

            const ev = gameEngine.currentSharedEvent;
            const ap = document.getElementById('action-panel');
            
            let isCovered = false;
            if (ev.type === 'bad_doodad' || ev.type === 'bad_life' || ev.type === 'installment') {
                player.insurances.forEach(ins => {
                    if(ins.covers.includes(ev.id)) isCovered = true;
                });
            }

            if (ev.type === 'crisis') { 
                if (ev.id !== 'cr_crypto_crash') {
                    market.spState = 'bear'; market.invPrice = Math.max(10, market.invPrice * 0.6); 
                    market.btcState = 'bear'; market.btcPrice = Math.max(100000, market.btcPrice * 0.5); 
                    market.goldPrice = Math.max(1000, market.goldPrice * 0.9); 
                } else {
                    market.btcState = 'bear'; market.btcPrice = Math.max(100000, market.btcPrice * 0.3); 
                }
                updateUI(); 

                let dynamicDesc = ev.desc;
                if (ev.id === 'cr_crypto_crash') {
                    if (player.hasSelfCustody) {
                        dynamicDesc += `\n\n✅ คุณมีทักษะ Self Custody บิตคอยน์ของคุณปลอดภัย 100%`;
                    } else if (player.assets.some(a => a.type === 'btc')) {
                        dynamicDesc += `\n\n❌ หายนะ! คุณไม่มีทักษะ Self Custody และจะสูญเสียบิตคอยน์ทั้งหมดทันที! (จะไปเรียนตอนนี้ก็ไม่ทันแล้ว!)`;
                    } else {
                        dynamicDesc += `\n\nโชคดีที่คุณไม่ได้ถือครองบิตคอยน์ไว้เลย`;
                    }
                } else {
                    let reqReserve = player.getExpenses() * 6;
                    dynamicDesc += `\n\n🎯 เป้าหมายเงินสำรอง: ${fmt(reqReserve)}`;
                    if(player.cash < reqReserve) {
                        dynamicDesc += `\n❌ เงินสดคุณขาดอีก ${fmt(reqReserve - player.cash)}\n(สามารถไปเปิดหน้าพอร์ตเทขายสินทรัพย์ด่วนตอนนี้ได้ แต่ราคาประเมินจะขาดทุนหนักมาก! และถ้าคุณหาเงินมาตุนไม่ได้... คุณจะถูกฟ้องล้มละลายทันที!)`;
                    } else {
                        dynamicDesc += `\n✅ ยินดีด้วย! คุณมีเงินสดสำรองเพียงพอ`;
                    }
                }
                
                setEventCard(`🚨 ${ev.name}`, dynamicDesc, '⚠️', false); 
                uiManager.showCrisisDecisions(); ap.classList.add('shake'); setTimeout(() => ap.classList.remove('shake'), 500); gameEngine.isAnimating = false; 
            } 
            else if (ev.type === 'gamble') { setEventCard(`🎰 โอกาสเสี่ยงโชค!`, ev.desc, '🃏', false); uiManager.showGambleDecisions(); gameEngine.isAnimating = false; } 
            else if (['realestate','business','land'].includes(ev.type)) { setEventCard(`โอกาสลงทุน: ${ev.name}`, 'วิเคราะห์กระแสเงินสดให้ดีก่อนตัดสินใจ!', '🏢', true); uiManager.showDealDecisions(ev, player.isEducated); logActivity(`พบดีลร่วมกัน: ${ev.name}`, 'system', 'global'); gameEngine.isAnimating = false; } 
            else if (isCovered && ev.id !== 'layoff') {
                setEventCard('🛡️ ประกันภัยคุ้มครอง!', `เกิดเหตุการณ์: ${ev.name}\nแต่โชคดีที่คุณซื้อประกันไว้!\n\nบริษัทประกันรับผิดชอบค่าใช้จ่าย/ภาระหนี้ทั้งหมดให้คุณ!`, '✅', true);
                logActivity(`ใช้สิทธิ์ประกันคุ้มครองเคลม: ${ev.name}`, 'income', 'player');
                setTimeout(() => botEngine.processTurn(), 2000);
            }
            else if (ev.type === 'bad_life' && ev.id === 'layoff') {
                // 🌟 ระบบแจกการ์ด Layoff
                let duration = Math.floor(Math.random() * 4) + 3; 
                player.layoffMonths = duration;
                bot.layoffMonths = duration; 
                let hasSS = player.insurances.some(i => i.id === 'ins_social');
                
                let desc = `เศรษฐกิจซบเซา! คุณถูกเลิกจ้างกะทันหัน\n\nจะสูญเสียรายได้หลักเป็นเวลา ${duration} เดือนเต็ม`;
                if(hasSS) desc += `\n✅ โชคดีที่คุณทำประกันสังคมไว้! จะได้รับเงินชดเชย 50% ตลอดช่วงว่างงาน`;
                else desc += `\n❌ คุณไม่ได้ทำประกันสังคมไว้! ระวังกระแสเงินสดช็อต!`;

                setEventCard('📉 วิกฤตคนว่างงาน!', desc, '⚠️', true);
                logActivity(`โดนเลิกจ้างเป็นเวลา ${duration} เดือน!`, 'system', 'global');
                ap.classList.add('shake'); setTimeout(() => ap.classList.remove('shake'), 500); setTimeout(() => botEngine.processTurn(), 2500);
            }
            else if (ev.type === 'bad_doodad') {
                if (player.isEducated && Math.random() < 0.5) { setEventCard('🛡️ รอดตัว!', `ทักษะการเงินขั้นสูงทำให้คุณมีสติ! ไม่ซื้อ "${ev.name}"`, '🎓', true); logActivity(`ใช้ภูมิคุ้มกันการเงินปฏิเสธรายจ่ายฟุ่มเฟือย`, 'income', 'player'); setTimeout(() => botEngine.processTurn(), 1800); } 
                else { setEventCard('💸 เสียเงิน', `คุณพบของล่อตาล่อใจ: ${ev.name}\nราคา: ${fmt(ev.cost)}`, '🛒', true); uiManager.showDoodadDecisions(); ap.classList.add('shake'); setTimeout(() => ap.classList.remove('shake'), 500); gameEngine.isAnimating = false; }
            } 
            else if (ev.type === 'bad_life') { 
                player.baseExpenses += ev.expenseIncrease; bot.baseExpenses += ev.expenseIncrease; setEventCard('📉 วิกฤต/ภาระชีวิต!', `${ev.name} ทำให้รายจ่ายเพิ่ม ${fmt(ev.expenseIncrease)}/เดือน`, '⚠️', true); logActivity(`ทุกคนโดนเพิ่มรายจ่าย: ${ev.name}`, 'system', 'global'); ap.classList.add('shake'); setTimeout(() => ap.classList.remove('shake'), 500); setTimeout(() => botEngine.processTurn(), 1800); 
            } 
            else if (ev.type === 'installment') {
                let newInstP = { ...ev, type: 'installment', monthsLeft: ev.months, buyPrice: ev.cost, mortgage: 0, grossCashflow: 0, mortgagePayment: 0, buff: 'none' };
                let newInstB = { ...ev, type: 'installment', monthsLeft: ev.months, buyPrice: ev.cost, mortgage: 0, grossCashflow: 0, mortgagePayment: 0, buff: 'none' };
                
                player.assets.push(newInstP);
                bot.assets.push(newInstB);
                
                setEventCard('💳 ภาระผ่อนชิ้นใหม่!', `คุณตัดสินใจซื้อ "${ev.name}"\nทำให้รายจ่ายเพิ่มขึ้น ${fmt(ev.monthly)}/เดือน\nเป็นเวลา ${ev.months} เดือน!\n\n(เมื่อผ่อนหมดสามารถนำไปขายเป็นของมือสองได้)`, '⚠️', true);
                logActivity(`สร้างหนี้ผ่อน: ${ev.name} (-${fmt(ev.monthly)}/ด)`, 'expense', 'global');
                
                ap.classList.add('shake'); setTimeout(() => ap.classList.remove('shake'), 500); 
                setTimeout(() => botEngine.processTurn(), 2500);
            }
            else { setEventCard('☕ ชีวิตเรียบง่าย', `เดือนนี้ไม่มีเหตุการณ์พิเศษ\nคุณใช้ชีวิตต่อไปอย่างสงบสุข!`, '☀️', true); setTimeout(() => botEngine.processTurn(), 1800); }
            
            updateUI(); document.getElementById('card-flipper').classList.add('flipped');
        } catch(err) { console.error(err); restorePlayerTurn(); }
    }, 400);
}

function restorePlayerTurn() { 
    if(gameEngine.gameOver) return; 
    gameEngine.currentTurn = 'player'; 
    gameEngine.isAnimating = false; 
    const ind = document.getElementById('turn-indicator'); 
    if(ind) { 
        ind.innerText = 'ตาของคุณ'; 
        ind.classList.remove('bg-slate-700', 'text-slate-300'); 
        ind.classList.add('bg-amber-900/30', 'text-amber-400'); 
    } 
    hideDecisions(); 
}