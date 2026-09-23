// ./asset/js/cashflow_loop.js

// ==========================================
// 1. Market & Engine Updaters
// ==========================================
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

gameEngine.checkBankruptcy = function(actor) {
    let effSalary = actor.salary;
    if (actor.layoffMonths > 0) {
        let hasSS = actor.insurances.some(i => i.id === 'ins_social');
        effSalary = hasSS ? Math.floor(actor.salary * 0.5) : 0;
    }
    let totalIncome = effSalary + actor.passive;
    let expenses = actor.getExpenses();
    
    let isSafeFromNPL = actor.cash >= (expenses * 6);

    if (totalIncome > 0 && expenses > totalIncome * 1.5 && !isSafeFromNPL) {
        actor.dsrMonths = (actor.dsrMonths || 0) + 1;
    } else {
        actor.dsrMonths = 0;
    }
    
    if (actor.dsrMonths >= 6) return 'over_leveraged';

    if (actor.cash < 0) {
        let maxLoan = actor.salary * 5;
        let availableLoan = Math.max(0, maxLoan - actor.bankDebt);
        let sellableValue = 0;
        actor.assets.forEach(a => {
            let val = 0;
            if (a.type === 'bank') val = a.buyPrice;
            else if (a.type === 'inv') val = Math.round(market.invPrice * a.units);
            else if (a.type === 'gold') val = Math.round(market.goldPrice * a.units);
            else if (a.type === 'btc') val = Math.round(market.btcPrice * a.units);
            else if (a.type === 'installment') val = a.salvage;
            else val = Math.floor(a.buyPrice * 0.5); 
            
            let net = val - (a.mortgage || 0);
            if (net > 0) sellableValue += net;
        });
        
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
        !bot.isBankrupt && bot.passive > bot.getExpenses() && bNetCashflow > 0 && bot.profDebt === 0 && bot.bankDebt === 0 && (!bot.creditDebt || bot.creditDebt === 0)
    );

    if (isPlayerWin) { 
        logActivity(`🎉 ชนะแล้ว! คุณเข้าสู่ Fast Track`, 'system', 'global'); 
        endGame('player'); 
    } 
    else if (isBotWin) { 
        logActivity(`💀 แพ้แล้ว! บอทออกจากสนามแข่งหนู`, 'system', 'global'); 
        endGame('bot'); 
    }
}

// ==========================================
// 2. Core Turn Engine
// ==========================================
function rollDiceWithAnimation() {
    if (gameEngine.gameOver || gameEngine.currentTurn !== 'player' || gameEngine.isAnimating) return;
    
    gameEngine.isAnimating = true;
    document.getElementById('btn-roll').disabled = true; 
    document.getElementById('btn-roll').innerText = 'กำลังดำเนินชีวิต...'; 
    document.getElementById('card-flipper').classList.remove('flipped'); 
    
    if (Math.random() < 0.2) {
        logActivity(gameEngine.generateNews(), 'news', 'global');
    }
    
    gameEngine.gameMonth++; 
    updateMarketPrices(); 

    if (player.bankDebt > 0) player.bankDebt = Math.floor(player.bankDebt * (1 + gameEngine.bankInterestRate));
    if (bot.bankDebt > 0) bot.bankDebt = Math.floor(bot.bankDebt * (1 + gameEngine.bankInterestRate));
    
    // 🌟 ดึงค่าดอกเบี้ยบัตรเครดิตลอยตัว
    let currentCreditRate = gameEngine.creditInterestRate || 0.023;
    let pChargeableCredit = Math.max(0, (player.creditDebt || 0) - (player.creditGrace || 0));
    
    if (pChargeableCredit > 0) {
        let pCreditInt = Math.floor(pChargeableCredit * currentCreditRate);
        player.creditDebt += pCreditInt;
        if (pCreditInt > 0) logActivity(`ชาร์จดอกเบี้ยบัตรเครดิตทบต้น (+฿${fmt(pCreditInt)})`, 'expense', 'player');
    }

    let bChargeableCredit = Math.max(0, (bot.creditDebt || 0) - (bot.creditGrace || 0));
    if (bChargeableCredit > 0) {
        bot.creditDebt += Math.floor(bChargeableCredit * currentCreditRate);
    }

    if (gameEngine.badCooldown > 0) gameEngine.badCooldown--;

    let infRateEl = document.getElementById('inflation-rate');
    let isDynamic = document.getElementById('inflation-dynamic-toggle')?.checked;

    if (gameEngine.gameMonth > 1 && gameEngine.gameMonth % 12 === 1) {
        if (isDynamic) {
            let newRate = 3.0;
            let intRate = 0.0125;
            let credRate = 0.023;
            let stateName = "";
            let intText = "1.25%";
            let credText = "2.3%";

            // 🌟 ปรับเพิ่มดอกเบี้ยบัตรเครดิตตามระดับที่สมจริงขึ้น (2.3% -> 3.2% -> 4.0%)
            if (gameEngine.ecoState === 'recovery') {
                newRate = (Math.random() * 1.0 + 1.0).toFixed(1); 
                intRate = 0.0125; credRate = 0.023; stateName = "🟢 ฟื้นฟู (Recovery)"; intText = "1.25%"; credText = "2.3%";
            } else if (gameEngine.ecoState === 'normal') {
                newRate = (Math.random() * 1.5 + 2.0).toFixed(1); 
                intRate = 0.0125; credRate = 0.023; stateName = "🟡 ปกติ (Normal)"; intText = "1.25%"; credText = "2.3%";
            } else if (gameEngine.ecoState === 'warning') {
                newRate = (Math.random() * 2.0 + 3.5).toFixed(1); 
                intRate = 0.02; credRate = 0.032; stateName = "🟠 ตึงตัว (Warning)"; intText = "2.00%"; credText = "3.2%";
            } else if (gameEngine.ecoState === 'crisis') {
                newRate = (Math.random() * 3.0 + 5.5).toFixed(1); 
                intRate = 0.03; credRate = 0.040; stateName = "🔴 วิกฤต (Crisis)"; intText = "3.00%"; credText = "4.0%";
            }

            infRateEl.value = newRate;
            gameEngine.bankInterestRate = intRate;
            gameEngine.creditInterestRate = credRate;

            logActivity(`📈 [ปีใหม่] สถานะเศรษฐกิจ: ${stateName} | เงินเฟ้อปรับเป็น ${newRate}%`, 'system', 'global');

            if (intRate === 0.03) {
                showAlert('🚨 เงินเฟ้อพุ่งสูง!', `สถานะเศรษฐกิจเข้าสู่สภาวะ "วิกฤต"\nอัตราเงินเฟ้อพุ่งทะยานถึง ${newRate}%\nธนาคารกลางปรับดอกเบี้ยเงินกู้เป็น 3.00% (บัตรเครดิตพุ่งเป็น 4.0% ต่อเดือน!)`, '🔥');
            } else if (intRate === 0.02) {
                showAlert('⚠️ เศรษฐกิจตึงตัว!', `ของเริ่มแพง อัตราเงินเฟ้อ ${newRate}%\nธนาคารกลางปรับดอกเบี้ยขึ้นเป็น 2.00% (บัตรเครดิตพุ่งเป็น 3.2% ต่อเดือน!)`, '📈');
            }

            uiManager.safeSetText('ui-bank-rate', intText);
            document.querySelectorAll('.bank-rate-badge').forEach(e => e.innerText = intText + '/ด');
            document.querySelectorAll('.credit-rate-badge').forEach(e => e.innerText = credText + '/ด');

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
            player.salary += Math.floor(player.salary * (p / 100)); 
            bot.salary += Math.floor(bot.salary * (p / 100));
            logActivity(`🎉 ปรับฐานเงินเดือนขึ้น ${p}% ทั้งระบบ!`, 'system', 'global'); 
            showAlert('🎉 ข่าวดี!', `คุณและบอทได้ขึ้นเงินเดือน ${p}%`, '💸');
        }
    }

    setTimeout(() => {
        try { 
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
            if(pInc < 0) {
                logActivity(`กระแสเงินสดติดลบ ${fmt(pInc)}`, 'expense', 'player');
            } else {
                logActivity(`รับกระแสเงินสดสุทธิ ${fmt(pInc)}`, 'income', 'player');
            }
            
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
            
            player.creditGrace = 0; 
            bot.creditGrace = 0;

            const prob = gameEngine.probabilities;
            let rCrisis = prob.crisis / 100;
            let rDeal = rCrisis + (prob.deal / 100);
            let rBad = rDeal + (prob.bad / 100);
            let rGamble = rBad + (prob.gamble / 100);

            const r = Math.random(); 
            
            let cryptoCrashProb = (gameEngine.cryptoCrashExtraWeight || 0) / 100;
            let isCryptoCrashTriggered = false;
            
            if (cryptoCrashProb > 0 && Math.random() < cryptoCrashProb) {
                isCryptoCrashTriggered = true;
            }

            if (isCryptoCrashTriggered) {
                let ev = CONTENT.crisis.find(c => c.id === 'cr_crypto_crash');
                gameEngine.currentSharedEvent = { type: 'crisis', id: ev.id, name: ev.name, desc: ev.desc, cost: 0 };
                gameEngine.cryptoCrashExtraWeight = 0; 
            } 
            else if (gameEngine.gameMonth >= gameEngine.nextCrisisMonth && r < rCrisis) { 
                gameEngine.currentSharedEvent = gameEngine.generateCrisisEvent(); 
                gameEngine.nextCrisisMonth = gameEngine.gameMonth + Math.floor(Math.random() * 13) + 48; 
            } 
            else if (r < rDeal) {
                gameEngine.currentSharedEvent = gameEngine.generateDynamicDeal();
            }
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
            else if (r < rGamble) {
                gameEngine.currentSharedEvent = gameEngine.generateGambleEvent();
            }
            else {
                gameEngine.currentSharedEvent = { type: 'nothing' }; 
            }

            const ev = gameEngine.currentSharedEvent;
            
            if (isDynamic) {
                gameEngine.updateEcoGauge(ev);
            }

            const ap = document.getElementById('action-panel');
            let isCovered = false;
            if (ev.type === 'bad_doodad' || ev.type === 'bad_life' || ev.type === 'installment') {
                player.insurances.forEach(ins => {
                    if (ins.covers.includes(ev.id)) isCovered = true;
                });
            }

            if (ev.type === 'crisis') { 
                if (ev.id !== 'cr_crypto_crash') {
                    market.spState = 'bear'; market.invPrice = Math.max(10, market.invPrice * 0.6); 
                    market.btcState = 'bear'; market.btcPrice = Math.max(100000, market.btcPrice * 0.5); 
                    market.goldPrice = Math.max(1000, market.goldPrice * 0.9); 
                } else {
                    market.btcState = 'bear'; market.btcPrice = Math.max(100000, market.btcPrice * 0.85); 
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
                uiManager.showCrisisDecisions(); 
                ap.classList.add('shake'); 
                setTimeout(() => ap.classList.remove('shake'), 500); 
                gameEngine.isAnimating = false; 
            } 
            else if (ev.type === 'gamble') { 
                setEventCard(`🎰 โอกาสเสี่ยงโชค!`, ev.desc, '🃏', false); 
                uiManager.showGambleDecisions(); 
                gameEngine.isAnimating = false; 
            } 
            else if (['realestate','business','land'].includes(ev.type)) { 
                setEventCard(`โอกาสลงทุน: ${ev.name}`, 'วิเคราะห์กระแสเงินสดให้ดีก่อนตัดสินใจ!', '🏢', true); 
                uiManager.showDealDecisions(ev, player.isEducated); 
                logActivity(`พบดีลร่วมกัน: ${ev.name}`, 'system', 'global'); 
                gameEngine.isAnimating = false; 
            } 
            else if (isCovered && ev.id !== 'layoff') {
                setEventCard('🛡️ ประกันภัยคุ้มครอง!', `เกิดเหตุการณ์: ${ev.name}\nแต่โชคดีที่คุณซื้อประกันไว้!\n\nบริษัทประกันรับผิดชอบค่าใช้จ่าย/ภาระหนี้ทั้งหมดให้คุณ!`, '✅', true);
                logActivity(`ใช้สิทธิ์ประกันคุ้มครองเคลม: ${ev.name}`, 'income', 'player');
                setTimeout(() => { setBotThinking(); botEngine.processTurn(); }, 2000);
            }
            else if (ev.type === 'bad_life' && ev.id === 'layoff') {
                let duration = Math.floor(Math.random() * 4) + 3; 
                player.layoffMonths = duration;
                bot.layoffMonths = duration; 
                let hasSS = player.insurances.some(i => i.id === 'ins_social');
                
                let desc = `เศรษฐกิจซบเซา! คุณถูกเลิกจ้างกะทันหัน\n\nจะสูญเสียรายได้หลักเป็นเวลา ${duration} เดือนเต็ม`;
                if(hasSS) desc += `\n✅ โชคดีที่คุณทำประกันสังคมไว้! จะได้รับเงินชดเชย 50% ตลอดช่วงว่างงาน`;
                else desc += `\n❌ คุณไม่ได้ทำประกันสังคมไว้! ระวังกระแสเงินสดช็อต!`;

                setEventCard('📉 วิกฤตคนว่างงาน!', desc, '⚠️', true);
                logActivity(`โดนเลิกจ้างเป็นเวลา ${duration} เดือน!`, 'system', 'global');
                ap.classList.add('shake'); 
                setTimeout(() => ap.classList.remove('shake'), 500); 
                setTimeout(() => { setBotThinking(); botEngine.processTurn(); }, 2500);
            }
            else if (ev.type === 'bad_doodad') {
                if (player.isEducated && Math.random() < 0.5) { 
                    setEventCard('🛡️ รอดตัว!', `ทักษะการเงินขั้นสูงทำให้คุณมีสติ! หลีกเลี่ยงรายจ่าย "${ev.name}" ได้สำเร็จ`, '🎓', true); 
                    logActivity(`ใช้ภูมิคุ้มกันการเงินปฏิเสธรายจ่ายกะทันหัน`, 'income', 'player'); 
                    setTimeout(() => { setBotThinking(); botEngine.processTurn(); }, 1800); 
                } else { 
                    setEventCard('💸 ภาระรายจ่ายกะทันหัน', `เกิดเหตุการณ์: ${ev.name}\nยอดชำระ: ${fmt(ev.cost)}`, '⚠️', true); 
                    uiManager.showDoodadDecisions(); 
                    ap.classList.add('shake'); 
                    setTimeout(() => ap.classList.remove('shake'), 500); 
                    gameEngine.isAnimating = false; 
                }
            } 
            else if (ev.type === 'bad_life') { 
                player.baseExpenses += ev.expenseIncrease; 
                bot.baseExpenses += ev.expenseIncrease; 
                setEventCard('📉 วิกฤต/ภาระชีวิต!', `${ev.name} ทำให้รายจ่ายเพิ่ม ${fmt(ev.expenseIncrease)}/เดือน`, '⚠️', true); 
                logActivity(`ทุกคนโดนเพิ่มรายจ่าย: ${ev.name}`, 'system', 'global'); 
                ap.classList.add('shake'); 
                setTimeout(() => ap.classList.remove('shake'), 500); 
                setTimeout(() => { setBotThinking(); botEngine.processTurn(); }, 1800); 
            } 
            else if (ev.type === 'installment') {
                let newInstP = { ...ev, type: 'installment', monthsLeft: ev.months, buyPrice: ev.cost, mortgage: 0, grossCashflow: 0, mortgagePayment: 0, buff: 'none' };
                
                player.assets.push(newInstP);
                
                setEventCard('💳 ภาระผ่อนชิ้นใหม่!', `คุณตัดสินใจซื้อ "${ev.name}"\nทำให้รายจ่ายเพิ่มขึ้น ${fmt(ev.monthly)}/เดือน\nเป็นเวลา ${ev.months} เดือน!\n\n(เมื่อผ่อนหมดสามารถนำไปขายเป็นของมือสองได้)`, '⚠️', true);
                logActivity(`สร้างหนี้ผ่อน: ${ev.name} (-${fmt(ev.monthly)}/ด)`, 'expense', 'global');
                
                ap.classList.add('shake'); 
                setTimeout(() => ap.classList.remove('shake'), 500); 
                setTimeout(() => { setBotThinking(); botEngine.processTurn(); }, 2500);
            }
            else { 
                setEventCard('☕ ชีวิตเรียบง่าย', `เดือนนี้ไม่มีเหตุการณ์พิเศษ\nคุณใช้ชีวิตต่อไปอย่างสงบสุข!`, '☀️', true); 
                setTimeout(() => { setBotThinking(); botEngine.processTurn(); }, 1800); 
            }
            
            updateUI(); 
            document.getElementById('card-flipper').classList.add('flipped');

        } catch(err) { 
            console.error(err); 
            restorePlayerTurn(); 
        }
    }, 400);
}

function restorePlayerTurn() { 
    if (gameEngine.gameOver) return; 
    
    gameEngine.currentTurn = 'player'; 
    gameEngine.isAnimating = false; 
    
    const ind = document.getElementById('turn-indicator'); 
    if (ind) { 
        ind.innerText = 'ตาของคุณ'; 
        ind.classList.remove('bg-slate-700', 'text-slate-300'); 
        ind.classList.add('bg-amber-900/30', 'text-amber-400'); 
    } 
    
    hideDecisions(); 
    updateUI();
}