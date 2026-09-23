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

function setBotThinking() {
    if (bot.isBankrupt) return; 
    
    gameEngine.currentTurn = 'bot';
    const btnRoll = document.getElementById('btn-roll');
    if (btnRoll && !gameEngine.gameOver) { 
        btnRoll.innerText = '🤖 บอทกำลังตัดสินใจ...'; 
        btnRoll.disabled = true; 
        btnRoll.className = 'w-full py-4 rounded-lg font-bold text-sm tracking-widest shadow-lg bg-slate-700 text-slate-400 cursor-not-allowed'; 
    }
}

function drawProfession() {
    let card = CONTENT.professions[Math.floor(Math.random() * CONTENT.professions.length)];
    player.assignProfession(card); 
    bot.assignProfession(card);

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

function startGame(mode = 'fixed') {
    document.getElementById('welcome-modal').classList.add('hidden');
    uiManager.safeSetText('header-profession', player.profName);
    uiManager.safeSetText('bot-profession', bot.profName);
    
    player.layoffMonths = 0; 
    bot.layoffMonths = 0;
    player.dsrMonths = 0; 
    bot.dsrMonths = 0;

    gameEngine.resetEventCounts(); 
    gameEngine.nextCrisisMonth = 36; 
    gameEngine.cumulativeInflation = 1.0;
    
    gameEngine.ecoGauge = 25; 
    gameEngine.ecoState = 'normal';

    const toggleEl = document.getElementById('inflation-dynamic-toggle');
    const ecoGaugeContainer = document.getElementById('eco-gauge-container');
    const inputEl = document.getElementById('inflation-rate');

    if (mode === 'dynamic') {
        if (toggleEl) toggleEl.checked = true;
        if (inputEl) {
            inputEl.disabled = true;
            inputEl.classList.add('opacity-50', 'cursor-not-allowed');
        }
        if (ecoGaugeContainer) ecoGaugeContainer.classList.remove('hidden');

        player.cash = player.salary * 4;
        bot.cash = bot.salary * 4;

        logActivity(`[เริ่มเกม] เข้าสู่โหมดสมจริง (วัฏจักรเศรษฐกิจ) แจกเงินทุน 4 เท่าของเงินเดือน!`, 'system', 'global');
    } else {
        if (toggleEl) toggleEl.checked = false;
        if (inputEl) {
            inputEl.disabled = false;
            inputEl.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        if (ecoGaugeContainer) ecoGaugeContainer.classList.add('hidden');
        
        gameEngine.bankInterestRate = 0.0125;
        uiManager.safeSetText('ui-bank-rate', '1.25%');
        document.querySelectorAll('.bank-rate-badge').forEach(e => e.innerText = '1.25%/ด');

        logActivity(`[เริ่มเกม] เข้าสู่โหมดปกติ (เงินเฟ้อคงที่)`, 'system', 'global');
    }

    logActivity(`วัดกึ๋น! ผู้เล่นและบอทได้รับอาชีพ ${player.profName} เหมือนกัน`, 'system', 'global');
    logActivity(`ระบบได้นำ 'ภาษีอัตราก้าวหน้า' เข้าไปรวมในรายจ่ายของคุณแล้ว!`, 'system', 'global');
    
    updateMarketPrices(); 
    updateUI();
}

function toggleInflationMode() {
    const isDynamic = document.getElementById('inflation-dynamic-toggle').checked;
    const inputEl = document.getElementById('inflation-rate');
    const ecoGaugeContainer = document.getElementById('eco-gauge-container');
    
    if (isDynamic) {
        inputEl.disabled = true;
        inputEl.classList.add('opacity-50', 'cursor-not-allowed');
        if (ecoGaugeContainer) ecoGaugeContainer.classList.remove('hidden');
    } else {
        inputEl.disabled = false;
        inputEl.classList.remove('opacity-50', 'cursor-not-allowed');
        if (ecoGaugeContainer) ecoGaugeContainer.classList.add('hidden');
        
        gameEngine.bankInterestRate = 0.0125;
        uiManager.safeSetText('ui-bank-rate', '1.25%');
        document.querySelectorAll('.bank-rate-badge').forEach(e => e.innerText = '1.25%/ด');
    }
}

function calculateNetWorth(actor) {
    let nw = actor.cash - (actor.profDebt + actor.bankDebt + (actor.creditDebt || 0));
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

function exportGameReport() {
    let report = `====================================================\n`;
    report += `       CASHFLOW MATRIX - DETAILED GAME REPORT       \n`;
    report += `====================================================\n\n`;
    
    let yrs = Math.floor(gameEngine.gameMonth / 12);
    let mos = gameEngine.gameMonth % 12;
    report += `ระยะเวลาในเกม: ${gameEngine.gameMonth} เดือน (${yrs} ปี ${mos} เดือน)\n`;
    report += `สถานะจบเกม: `;
    if(gameEngine.endReason === 'player') report += `ผู้เล่นชนะ (Fast Track)\n`;
    else if(gameEngine.endReason === 'bot') report += `บอท AI ชนะ (Fast Track)\n`;
    else if(gameEngine.endReason === 'player_survive') report += `ผู้เล่นชนะ (รอดชีวิต, AI ล้มละลาย)\n`;
    else report += `ผู้เล่นล้มละลาย (${gameEngine.endReason})\n`;
    
    report += `\n--- 👤 สรุปพอร์ตผู้เล่น (Player) ---\n`;
    report += `อาชีพ: ${player.profName}\n`;
    report += `ความมั่งคั่งสุทธิ: ${fmt(calculateNetWorth(player))}\n`;
    report += `กระแสเงินสด Passive: ${fmt(player.passive)} / รายจ่าย: ${fmt(player.getExpenses())}\n`;
    report += `สินทรัพย์ที่ถือครอง:\n`;
    if (player.assets.length === 0) report += ` - ไม่มีสินทรัพย์\n`;
    player.assets.forEach(a => {
        report += ` - ${a.name} (ราคา: ${fmt(a.buyPrice)})\n`;
        if (a.type === 'realestate' || a.type === 'business') {
            let dp = a.downPayment || a.buyPrice;
            let roi = dp > 0 ? ((a.cashflow * 12) / dp) * 100 : 0;
            report += `   > Cashflow: ${fmt(a.cashflow)}/เดือน | เงินดาวน์: ${fmt(dp)} | ROI: ${roi.toFixed(2)}%\n`;
        }
    });

    report += `\n--- 🤖 สรุปพอร์ตบอท (AI) ---\n`;
    report += `อาชีพ: ${bot.profName}\n`;
    report += `ความมั่งคั่งสุทธิ: ${fmt(calculateNetWorth(bot))}\n`;
    report += `กระแสเงินสด Passive: ${fmt(bot.passive)} / รายจ่าย: ${fmt(bot.getExpenses())}\n`;
    report += `สินทรัพย์ที่ถือครอง:\n`;
    if (bot.assets.length === 0) report += ` - ไม่มีสินทรัพย์\n`;
    bot.assets.forEach(a => {
        report += ` - ${a.name} (ราคา: ${fmt(a.buyPrice)})\n`;
        if (a.type === 'realestate' || a.type === 'business') {
            let dp = a.downPayment || a.buyPrice;
            let roi = dp > 0 ? ((a.cashflow * 12) / dp) * 100 : 0;
            report += `   > Cashflow: ${fmt(a.cashflow)}/เดือน | เงินดาวน์: ${fmt(dp)} | ROI: ${roi.toFixed(2)}%\n`;
        }
    });

    if (gameEngine.endReason && gameEngine.endReason.startsWith('bankrupt')) {
        report += `\n====================================================\n`;
        report += `💡 คำแนะนำสำหรับเกมถัดไป (วิเคราะห์ความพ่ายแพ้)\n`;
        report += `====================================================\n`;
        if (gameEngine.endReason === 'bankrupt') {
            report += `คุณพ่ายแพ้เพราะเงินสำรองไม่เพียงพอเมื่อเกิดวิกฤตเศรษฐกิจระดับโลก\n`;
            report += `คำแนะนำ: เกมถัดไปควรเตรียมเงินสดสำรองไว้อย่างน้อย 6 เท่าของรายจ่ายรวม\n`;
            report += `หรือแบ่งเงินไปซื้อ "ประกันภัย" เพื่อลดความเสียหายจากรายจ่ายที่ไม่คาดคิด\n`;
        } else if (gameEngine.endReason === 'bankrupt_liquidity') {
            report += `คุณพ่ายแพ้เพราะกระแสเงินสดติดลบจนหมุนเงินไม่ทัน (สภาพคล่องพังทลาย)\n`;
            report += `คำแนะนำ: ควรบริหารกระแสเงินสดให้เป็นบวกเสมอ หลีกเลี่ยงการใช้จ่าย\n`;
            report += `เกินตัว หรือรูดซื้อของฟุ่มเฟือย (Doodads) ด้วยบัตรเครดิตจนหนี้ล้นพ้นตัว\n`;
        } else if (gameEngine.endReason === 'bankrupt_dsr') {
            report += `คุณพ่ายแพ้เพราะก่อหนี้เกินตัว (ภาระหนี้เสีย NPL สูงเกิน 150% ของรายรับ)\n`;
            report += `คำแนะนำ: ระมัดระวังการกู้เงินฉุกเฉินที่มีดอกเบี้ยสูงลิ่ว เกมหน้าควรทยอย\n`;
            report += `"โปะหนี้" เพื่อลดรายจ่ายดอกเบี้ยและรักษาสัดส่วนหนี้ต่อรายได้ให้อยู่ในเกณฑ์ปลอดภัย\n`;
        }
    }

    report += `\n====================================================\n`;
    report += `📜 บันทึกเหตุการณ์และตัดสินใจอย่างละเอียด (Activity Logs)\n`;
    report += `====================================================\n`;
    uiManager.activityLogs.forEach(log => {
        let ctxPrefix = log.ctx === 'player' ? '[ผู้เล่น] ' : (log.ctx === 'bot' ? '[บอท AI] ' : '[ข่าวกรอง] ');
        report += `${log.time} ${ctxPrefix} ${log.msg}\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cashflow_Decision_Report_${player.profName}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function endGame(winner) {
    if (gameEngine.gameOver) return;
    gameEngine.gameOver = true; 
    gameEngine.isAnimating = false; 
    hideDecisions();
    
    gameEngine.endReason = winner; 
    
    const btnRoll = document.getElementById('btn-roll'); 
    if(btnRoll) { 
        btnRoll.disabled = true; 
        btnRoll.innerText = 'จบเกมแล้ว'; 
        btnRoll.className = "w-full py-4 rounded-lg font-bold text-sm tracking-widest shadow-lg bg-slate-700 text-slate-500 cursor-not-allowed"; 
    }
    
    let yrs = Math.floor(gameEngine.gameMonth / 12);
    let mos = gameEngine.gameMonth % 12;
    const goTime = document.getElementById('go-time');
    goTime.innerText = `${gameEngine.gameMonth} เดือน (${yrs} ปี ${mos} เดือน)`;

    let pNetWorth = calculateNetWorth(player);
    document.getElementById('go-networth').innerText = fmt(pNetWorth);

    let reportHtml = '';

    if (winner === 'player') {
        const stEl = document.getElementById('player-status'); 
        if(stEl) { 
            stEl.innerText = 'Fast Track!'; 
            stEl.classList.replace('text-amber-400', 'text-emerald-400'); 
        }
        uiManager.safeSetText('go-icon', '🏆'); 
        uiManager.safeSetText('go-title', 'ชนะเกม!'); 
        document.getElementById('go-title').className = "text-3xl font-extrabold text-amber-400 mb-2";
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
        const stEl = document.getElementById('bot-status'); 
        if(stEl) { 
            stEl.innerText = 'Fast Track!'; 
            stEl.classList.replace('text-amber-400', 'text-emerald-400'); 
        }
        uiManager.safeSetText('go-icon', '💀'); 
        uiManager.safeSetText('go-title', 'พ่ายแพ้!'); 
        document.getElementById('go-title').className = "text-3xl font-extrabold text-rose-500 mb-2";
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
        const stEl = document.getElementById('player-status'); 
        if(stEl) { 
            stEl.innerText = 'ล้มละลาย!'; 
            stEl.classList.replace('text-amber-400', 'text-rose-500'); 
        }
        uiManager.safeSetText('go-icon', '💥'); 
        uiManager.safeSetText('go-title', 'ล้มละลาย!'); 
        document.getElementById('go-title').className = "text-3xl font-extrabold text-rose-500 mb-2";
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
        const stEl = document.getElementById('player-status'); 
        if(stEl) { 
            stEl.innerText = 'ล้มละลาย!'; 
            stEl.classList.replace('text-amber-400', 'text-rose-500'); 
        }
        uiManager.safeSetText('go-icon', '💥'); 
        uiManager.safeSetText('go-title', 'ล้มละลาย! (เงินช็อต)'); 
        document.getElementById('go-title').className = "text-3xl font-extrabold text-rose-500 mb-2";
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
        const stEl = document.getElementById('player-status'); 
        if(stEl) { 
            stEl.innerText = 'ล้มละลาย!'; 
            stEl.classList.replace('text-amber-400', 'text-rose-500'); 
        }
        uiManager.safeSetText('go-icon', '💥'); 
        uiManager.safeSetText('go-title', 'ล้มละลาย! (หนี้ท่วม)'); 
        document.getElementById('go-title').className = "text-3xl font-extrabold text-rose-500 mb-2";
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
        const stEl = document.getElementById('player-status'); 
        if(stEl) { 
            stEl.innerText = 'ผู้ชนะ (รอดชีวิต)!'; 
            stEl.classList.replace('text-amber-400', 'text-emerald-400'); 
        }
        uiManager.safeSetText('go-icon', '🏆'); 
        uiManager.safeSetText('go-title', 'ชนะเกม! (บอทพังทลาย)'); 
        document.getElementById('go-title').className = "text-3xl font-extrabold text-amber-400 mb-2";
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