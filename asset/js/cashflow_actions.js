// ./asset/js/cashflow_actions.js

function buyDeal() { 
    if (gameEngine.isAnimating) return; 
    let actualDp = player.isEducated ? Math.floor(gameEngine.currentSharedEvent.downPayment * 0.8) : gameEngine.currentSharedEvent.downPayment; 
    if (player.cash < actualDp) return showAlert('❌ ล้มเหลว', `เงินสดไม่พอจ่ายดาวน์ ${fmt(actualDp)}!`, '💸'); 
    gameEngine.isAnimating = true; 
    player.cash -= actualDp; player.passive += gameEngine.currentSharedEvent.grossCashflow; player.assets.push({...gameEngine.currentSharedEvent, downPayment: actualDp, mortgage: gameEngine.currentSharedEvent.cost - actualDp}); 
    spawnFloatingText('player-cash', -actualDp); logActivity(`คุณลงทุน ${gameEngine.currentSharedEvent.name} จ่ายดาวน์ ${fmt(actualDp)}`, 'income', 'player'); 
    hideDecisions(); updateUI(); setBotThinking(); 
    setTimeout(() => botEngine.processTurn(), 1200); 
}

function passDeal() { 
    if (gameEngine.isAnimating) return; 
    gameEngine.isAnimating = true; logActivity(`คุณปฏิเสธดีล`, 'info', 'player'); 
    hideDecisions(); setBotThinking(); 
    setTimeout(() => botEngine.processTurn(), 1000); 
}

function payDoodadCash() { 
    if (player.cash < gameEngine.currentSharedEvent.cost) return showAlert('❌ เงินสดไม่พอ', 'ต้องรูดบัตรเครดิต!', '💳'); 
    gameEngine.isAnimating = true; player.cash -= gameEngine.currentSharedEvent.cost; spawnFloatingText('player-cash', -gameEngine.currentSharedEvent.cost); 
    logActivity(`จ่ายเงินสด: ${gameEngine.currentSharedEvent.name}`, 'expense', 'player'); 
    hideDecisions(); updateUI(); setBotThinking(); 
    setTimeout(() => botEngine.processTurn(), 1000); 
}

function payDoodadCredit() { 
    gameEngine.isAnimating = true; player.creditDebt = (player.creditDebt || 0) + gameEngine.currentSharedEvent.cost; player.creditGrace = (player.creditGrace || 0) + gameEngine.currentSharedEvent.cost; 
    logActivity(`รูดบัตรเครดิต: ${gameEngine.currentSharedEvent.name}`, 'expense', 'player'); 
    hideDecisions(); updateUI(); setBotThinking(); 
    setTimeout(() => botEngine.processTurn(), 1000); 
}

function playGamble() { 
    if (player.cash < gameEngine.currentSharedEvent.cost) return showAlert('❌ เงินไม่พอ', 'เงินสดไม่พอ!', '💸'); 
    gameEngine.isAnimating = true; player.cash -= gameEngine.currentSharedEvent.cost; spawnFloatingText('player-cash', -gameEngine.currentSharedEvent.cost); 
    hideDecisions(); 
    setTimeout(() => { 
        if (Math.random() < gameEngine.currentSharedEvent.prob) { 
            player.cash += gameEngine.currentSharedEvent.win; spawnFloatingText('player-cash', gameEngine.currentSharedEvent.win); 
            logActivity(`🃏 ถูกรางวัล!`, 'income', 'player'); showAlert('🎉 แจ็คพอตแตก!', `ชนะการเดิมพัน ${fmt(gameEngine.currentSharedEvent.win)}`, '🎰'); 
        } else { 
            logActivity(`🃏 เสียพนัน`, 'expense', 'player'); showAlert('😭 เสียใจด้วย', `เสียเงินเดิมพัน บ่อนกินเรียบ!`, '💸'); 
        } 
        updateUI(); setBotThinking(); 
        setTimeout(()=>botEngine.processTurn(), 1000); 
    }, 600); 
}

function passGamble() { 
    if (gameEngine.isAnimating) return; gameEngine.isAnimating = true; logActivity(`ปฏิเสธการพนัน`, 'info', 'player'); 
    hideDecisions(); setBotThinking(); 
    setTimeout(() => botEngine.processTurn(), 1000); 
}

function processCrisisPlayer() { 
    gameEngine.isAnimating = true; 
    const ev = gameEngine.currentSharedEvent;

    if (ev.id === 'cr_crypto_crash') {
        if (player.hasSelfCustody) {
            logActivity(`รอดพ้นวิกฤตกระดานเทรดล้มละลายเพราะมี Self Custody`, 'income', 'player');
            showAlert('✅ รอดพ้นวิกฤต', `บิตคอยน์ของคุณปลอดภัยอยู่ใน Hardware Wallet!`, '🛡️');
        } else {
            let hasBtc = player.assets.some(a => a.type === 'btc');
            if (hasBtc) {
                player.assets = player.assets.filter(a => a.type !== 'btc');
                logActivity(`สูญเสียบิตคอยน์ทั้งหมดจากกระดานเทรดล้มละลาย`, 'expense', 'player');
                showAlert('❌ หายนะทางการเงิน', `กระดานเทรดบินไปแล้ว! บิตคอยน์ของคุณกลายเป็นศูนย์`, '📉');
            } else {
                logActivity(`ไม่ได้รับผลกระทบจากกระดานเทรดล้มละลาย`, 'info', 'player');
                showAlert('✅ รอดตัว', `โชคดีที่คุณไม่ได้ถือบิตคอยน์ไว้`, '👌');
            }
        }
    } else {
        let reqReserve = player.getExpenses() * 6;
        if (player.cash >= reqReserve) { 
            logActivity(`รอดพ้นวิกฤตเพราะมีเงินสำรอง`, 'income', 'player'); 
            showAlert('✅ รอดพ้นวิกฤต', `คุณเตรียมเงินสำรองไว้เพียงพอ!`, '🛡️'); 
        } else { 
            logActivity(`ล้มละลาย! เงินสำรองไม่พอรับวิกฤต`, 'expense', 'player'); 
            endGame('bankrupt');
            return; 
        } 
    }
    
    hideDecisions(); updateUI(); setBotThinking(); 
    setTimeout(() => botEngine.processTurn(), 1200); 
}

let tempSelfCustodyCost = 0;

function investInSkill(skillType) { 
    if (gameEngine.gameOver || gameEngine.isAnimating) return; 
    
    if (skillType === 'financial') {
        if (player.isEducated) return;
        const cost = 50000; 
        showConfirm('🎓 ยืนยันการเรียนรู้', `ต้องการจ่าย ${fmt(cost)} เพื่ออัปสกิล ทักษะการเงินขั้นสูง ใช่หรือไม่?`, '🧠', () => { 
            if (player.cash < cost) return showAlert('❌ ยอดเงินไม่พอ', `คุณต้องมีเงินสดอย่างน้อย ${fmt(cost)}`, '💸'); 
            player.cash -= cost; player.isEducated = true; 
            spawnFloatingText('player-cash', -cost); 
            logActivity(`จ่ายค่าอัปสกิล ${fmt(cost)}`, 'expense', 'player'); 
            showAlert('✅ อัปสกิลสำเร็จ!', 'คุณได้รับภูมิคุ้มกันทางการเงินแล้ว!', '🎓'); 
            updateUI(); closeSkillsModal();
        }); 
    } else if (skillType === 'selfcustody') {
        if (player.hasSelfCustody) return;
        const cost = 10000; 
        showConfirm('🔐 ยืนยันการเรียนรู้', `ต้องการจ่าย ${fmt(cost)} เพื่อเรียนรู้ทักษะ Self Custody (ซื้อ Hardware Wallet) ใช่หรือไม่?`, '🧠', () => { 
            if (player.cash < cost) return showAlert('❌ ยอดเงินไม่พอ', `คุณต้องมีเงินสดอย่างน้อย ${fmt(cost)}`, '💸'); 
            
            player.cash -= cost; 
            player.hasSelfCustody = true; 
            spawnFloatingText('player-cash', -cost); 
            logActivity(`ซื้อ Hardware Wallet (Self Custody) ${fmt(cost)}`, 'expense', 'player'); 
            showAlert('✅ อัปสกิลสำเร็จ!', 'บิตคอยน์ของคุณปลอดภัยจากการล้มละลายของกระดานเทรด 100%!', '🔐'); 
            updateUI(); 
            closeSkillsModal();
        }); 
    }
}

function processSelfCustodySuccess() {
    // ปัจจุบันระบบใช้กดปุ่มเรียนรู้แยก ฟังก์ชันนี้จึงไม่ได้หักเงินอีกรอบ (เอาไว้สำหรับการต่อยอดในอนาคต)
    updateUI();
}

function buyInsurance(id) {
    let ins = INSURANCE_CONTENT.find(i => i.id === id);
    player.insurances.push(ins);
    logActivity(`เซ็นสัญญาซื้อ ${ins.name} (-${fmt(ins.premium)}/ด)`, 'expense', 'player');
    updateUI(); openInsuranceModal();
}

function cancelInsurance(id) {
    player.insurances = player.insurances.filter(i => i.id !== id);
    logActivity(`ยกเลิกกรมธรรม์ประกันภัย`, 'info', 'player');
    updateUI(); openInsuranceModal();
}

function takeCustomLoan() { 
    const amt = parseInt(document.getElementById('custom-loan-input').value); 
    if (isNaN(amt) || amt <= 0) return showAlert('❌ ยอดกู้ไม่ถูกต้อง', 'กรุณาระบุจำนวนเงิน', '🏦'); 
    takeLoan(amt); 
    document.getElementById('custom-loan-input').value = ''; 
}

function takeLoan(amt) { 
    let maxLoan = player.salary * 5;
    let availableLoan = Math.max(0, maxLoan - player.bankDebt);
    if (player.bankDebt + amt > maxLoan) return showAlert('❌ กู้ไม่ผ่าน', `ธนาคารจำกัดวงเงินกู้รวมไม่เกิน 5 เท่าของเงินเดือน\n(วงเงินสูงสุดของคุณคือ ${fmt(maxLoan)} บาท\nคุณกู้เพิ่มได้อีก ${fmt(availableLoan)} บาท)`, '🏦');
    if (amt <= 0) return showAlert('❌ ยอดกู้ไม่ถูกต้อง', 'ยอดเงินไม่ถูกต้อง', '🏦'); 
    player.cash += amt; player.bankDebt += amt; spawnFloatingText('player-cash', amt); logActivity(`กู้ฉุกเฉิน +${fmt(amt)}`, 'income', 'player'); updateUI(); closeBankModal(); 
}

function setLoanAmount(percent) {
    let maxLoan = player.salary * 5;
    let availableLoan = Math.max(0, maxLoan - player.bankDebt);
    let amount = Math.floor(availableLoan * (percent / 100));
    if (amount <= 0) {
        showAlert('❌ วงเงินเต็ม', `คุณใช้วงเงินกู้ฉุกเฉินเต็ม ${fmt(maxLoan)} แล้ว\nต้องโปะหนี้เดิมก่อนจึงจะกู้ใหม่ได้`, '🏦');
        document.getElementById('custom-loan-input').value = '';
        return;
    }
    document.getElementById('custom-loan-input').value = amount;
}

function setQuickPayAmount(percent) {
    let debt = gameEngine.currentQuickPayType === 'bank' ? player.bankDebt : (gameEngine.currentQuickPayType === 'prof' ? player.profDebt : player.creditDebt || 0);
    let amount = Math.floor(debt * (percent / 100));
    document.getElementById('qp-input').value = amount;
}

function submitQuickPay() { const amount = parseInt(document.getElementById('qp-input').value); if (isNaN(amount) || amount <= 0) return showAlert('ข้อมูล', 'ระบุจำนวนเงินที่ถูกต้อง', '❌'); let maxDebt = gameEngine.currentQuickPayType === 'bank' ? player.bankDebt : (gameEngine.currentQuickPayType === 'prof' ? player.profDebt : player.creditDebt || 0); if (amount > maxDebt) return showAlert('ข้อมูล', `ยอดหนี้มีเพียง ${fmt(maxDebt)}`, 'ℹ️'); if (amount > player.cash) return showAlert('❌ ยอดเงินไม่พอ', 'เงินสดไม่พอ!', '💸'); player.cash -= amount; spawnFloatingText('player-cash', -amount); if (gameEngine.currentQuickPayType === 'bank') { player.bankDebt -= amount; logActivity(`ชำระหนี้ฉุกเฉิน -${fmt(amount)}`, 'expense', 'player'); } else if (gameEngine.currentQuickPayType === 'prof') { player.profDebt -= amount; logActivity(`ชำระหนี้อาชีพ -${fmt(amount)}`, 'expense', 'player'); } else { player.creditDebt -= amount; player.creditGrace = Math.max(0, (player.creditGrace || 0) - amount); logActivity(`โปะหนี้บัตรเครดิต -${fmt(amount)}`, 'expense', 'player'); } updateUI(); closeQuickPayModal(); setTimeout(checkWinCondition, 500); }

function payOffMortgage(i) { let asset = player.assets[i]; if (player.cash < asset.mortgage) return showAlert('❌ ยอดเงินไม่พอ', `ต้องมีเงินสด ${fmt(asset.mortgage)}`, '💸'); showConfirm('โปะหนี้พิเศษ', `จ่ายก้อน ${fmt(asset.mortgage)} เพื่อล้างหนี้สินทรัพย์นี้?`, '🏠', () => { player.cash -= asset.mortgage; spawnFloatingText('player-cash', -asset.mortgage); logActivity(`โปะหนี้ ${asset.name} สำเร็จ`, 'income', 'player'); asset.mortgage = 0; asset.mortgagePayment = 0; updateUI(); openPortfolioModal('player'); }); }

function sellAllAssetType(type) {
    if (gameEngine.gameOver || gameEngine.isAnimating) return;

    let assetsToSell = player.assets.filter(a => a.type === type);
    if (assetsToSell.length === 0) return showAlert('ข้อมูล', 'คุณไม่มีสินทรัพย์ประเภทนี้', 'ℹ️');

    if (type === 'inv' && Math.random() < 0.285) {
        return showAlert('❌ ตลาดปิดทำการ', 'วันนี้บังเอิญตรงกับวันหยุดเสาร์-อาทิตย์!\nตลาดหุ้น S&P500 ปิดทำการ คุณไม่สามารถส่งคำสั่งขายได้ โปรดรอโอกาสในเดือนถัดไป', '🛑');
    }

    let typeName = type === 'bank' ? 'เงินฝากประจำ' : (type === 'inv' ? 'S&P500' : (type === 'gold' ? 'ทองคำ' : 'บิตคอยน์'));
    let totalVal = 0;
    let totalCost = 0;
    let totalCF = 0;

    assetsToSell.forEach(a => {
        let val = 0;
        if(a.type==='bank') val=a.buyPrice;
        else if(a.type==='inv') val=Math.round(market.invPrice*a.units);
        else if(a.type==='gold') val=Math.round(market.goldPrice*a.units);
        else if(a.type==='btc') val=Math.round(market.btcPrice*a.units);

        totalVal += val;
        totalCost += a.buyPrice; 
        totalCF += (a.grossCashflow || 0);
    });

    let preTaxProfit = totalVal - totalCost;
    let capGainsTax = preTaxProfit > 0 ? Math.floor(preTaxProfit * 0.15) : 0;
    let finalNetCash = totalVal - capGainsTax;

    let taxText = capGainsTax > 0 ? `\nหักภาษีกำไร (15%): -${fmt(capGainsTax)}` : ``;
    let lossText = preTaxProfit < 0 ? `\n(ขาดทุนสุทธิ ${fmt(preTaxProfit)})` : ``;

    showConfirm(`ขาย ${typeName} ทั้งหมดเหมาเข่ง`, `จำนวน: ${assetsToSell.length} รายการ\nมูลค่ารับซื้อรวม: ${fmt(totalVal)}${taxText}${lossText}\nรับเงินสุทธิ: ${fmt(finalNetCash)}\n\n${totalCF > 0 ? `คำเตือน: คุณจะเสียรายรับรวม ${fmt(totalCF)}/เดือน ถาวร!` : ''}`, '💸', () => { 
        player.passive -= totalCF; 
        player.assets = player.assets.filter(a => a.type !== type);
        
        player.cash += finalNetCash; 
        spawnFloatingText('player-cash', finalNetCash); 
        logActivity(`เทขาย ${typeName} ทั้งหมด รับเงินสุทธิ ${fmt(finalNetCash)}`, 'income', 'player'); 
        
        updateUI(); 
        openPortfolioModal('player'); 
    }); 
}

function sellAsset(i, val) { 
    let asset = player.assets[i]; 
    if (asset.type === 'inv' && Math.random() < 0.285) {
        return showAlert('❌ ตลาดปิดทำการ', 'วันนี้บังเอิญตรงกับวันหยุดเสาร์-อาทิตย์!\nตลาดหุ้น S&P500 ปิดทำการ คุณไม่สามารถส่งคำสั่งขายได้ โปรดรอโอกาสในเดือนถัดไป', '🛑');
    }

    let mortgage = asset.mortgage || 0; 
    let netProceeds = val - mortgage; 
    let isPhysical = ['realestate', 'business', 'land'].includes(asset.type);
    
    let brokerFee = isPhysical ? Math.floor(val * 0.05) : 0;
    let costBasis = asset.downPayment || asset.buyPrice;
    let preTaxProfit = netProceeds - costBasis;
    
    let capGainsTax = preTaxProfit > 0 ? Math.floor(preTaxProfit * 0.15) : 0;
    let finalNetCash = netProceeds - brokerFee - capGainsTax;
    
    let feeText = isPhysical ? `\nหักค่านายหน้า (5%): -${fmt(brokerFee)}` : ``;
    let taxText = capGainsTax > 0 ? `\nหักภาษีกำไร (15%): -${fmt(capGainsTax)}` : ``;
    let escrowText = isPhysical ? `\n\n⏳ หมายเหตุ: สินทรัพย์สภาพคล่องต่ำ เงินจะโอนเข้ากระเป๋าในอีก 6 เดือน (รอทำสัญญา)` : ``;

    showConfirm('ยืนยันการขาย', `มูลค่าประเมิน/รับซื้อ: ${fmt(val)}\nหักลบหนี้ผูกพัน: -${fmt(mortgage)}${feeText}${taxText}\nรับเงินสุทธิ: ${fmt(finalNetCash)}${escrowText}\n\n${asset.grossCashflow > 0 ? `คำเตือน: คุณจะเสียรายรับ ${fmt(asset.grossCashflow)}/เดือน ถาวร!` : ''}`, '💸', () => { 
        player.passive -= (asset.grossCashflow || 0); 
        const assetName = asset.name;
        player.assets.splice(i, 1); 
        
        if (isPhysical) {
            player.escrows.push({ amount: finalNetCash, monthsLeft: 6, name: assetName });
            logActivity(`ขาย ${assetName} รอทำสัญญา 6 เดือน (ยอดสุทธิ ${fmt(finalNetCash)})`, 'info', 'player');
            showAlert('⏳ รอทำสัญญา', `ขาย ${assetName} เรียบร้อยแล้ว!\nเงินจำนวน ${fmt(finalNetCash)} จะเข้ากระเป๋าคุณในอีก 6 เดือน`, '📝');
        } else {
            player.cash += finalNetCash; 
            spawnFloatingText('player-cash', finalNetCash); 
            logActivity(`ขาย ${assetName} รับเงินสุทธิ ${fmt(finalNetCash)}`, 'income', 'player'); 
        }
        updateUI(); openPortfolioModal('player'); 
    }); 
}

// 🌟 ฟังก์ชันจัดการการคืนสัญญา หรือปล่อยยึดของที่กำลังผ่อน
function cancelInstallment(i) {
    if (gameEngine.gameOver || gameEngine.isAnimating) return;
    let asset = player.assets[i];
    
    showConfirm('คืนสัญญา/ปล่อยยึด', `คุณแน่ใจหรือไม่ที่จะคืนสัญญา "${asset.name}" ให้กับไฟแนนซ์?\n\nคำเตือน:\n• คุณจะไม่ได้รับเงินที่ผ่อนไปแล้วคืนเลยแม้แต่บาทเดียว\n• แต่ภาระรายจ่าย ${fmt(asset.monthly)}/เดือน จะหายไปทันที`, '🗑️', () => {
        const assetName = asset.name;
        const monthlyRelief = asset.monthly;
        
        player.assets.splice(i, 1);
        
        logActivity(`คืนสัญญา ${assetName} (ลดภาระ ${fmt(monthlyRelief)}/ด)`, 'info', 'player');
        showAlert('✅ คืนสัญญาสำเร็จ', `คุณได้ปล่อยยึด ${assetName} เรียบร้อยแล้ว\nภาระรายจ่ายต่อเดือนของคุณลดลง ${fmt(monthlyRelief)}`, '📝');
        
        updateUI();
        openPortfolioModal('player');
    });
}

function tradeMarket(type) { 
    if (gameEngine.gameOver || gameEngine.isAnimating) return; 
    let cost = 0; let assetObj = null; 
    
    if (type === 'bank') { 
        cost = 10000; 
        if (player.cash >= cost) { 
            assetObj = { id: Date.now(), type: 'bank', name: 'เงินฝากประจำ', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: Math.round((cost*0.02)/12), cashflow: Math.round((cost*0.02)/12), buff: 'none' }; 
            showAlert('✅ สำเร็จ!', `ฝากเงิน ฿10,000`, '🏦'); logActivity(`ฝากเงินแบงก์ -${fmt(cost)}`, 'expense', 'player'); 
        } 
    } else if (type === 'inv') { 
        cost = Math.round(market.invPrice * 100); 
        if (player.cash >= cost) { 
            assetObj = { id: Date.now(), type: 'inv', name: 'S&P500', units: 100, buyPrice: cost, mortgage: 0, grossCashflow: Math.round((cost*0.05)/12), cashflow: Math.round((cost*0.05)/12), buff: 'none' }; 
            showAlert('✅ สำเร็จ!', `ซื้อกองทุน 1 Lot`, '📊'); logActivity(`ซื้อกองทุน S&P500 -${fmt(cost)}`, 'expense', 'player'); 
        } 
    } else if (type === 'gold') { 
        cost = Math.round(market.goldPrice); 
        if (player.cash >= cost) { 
            assetObj = { id: Date.now(), type: 'gold', name: 'ทองคำ (Gold) 1 บาท', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0, buff: 'none' }; 
            showAlert('✅ สำเร็จ!', `ซื้อทองคำ 1 บาท`, '🪙'); logActivity(`ซื้อทองคำ -${fmt(cost)}`, 'expense', 'player'); 
        } 
    } else if (type === 'btc') { 
        cost = Math.round(market.btcPrice * 0.01); 
        if (player.cash >= cost) { 
            assetObj = { id: Date.now(), type: 'btc', name: 'บิตคอยน์ (0.01 BTC)', units: 0.01, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0, buff: 'none' }; 
            showAlert('✅ สำเร็จ!', `ช้อนบิตคอยน์`, '₿'); 
            logActivity(`ซื้อบิตคอยน์ -${fmt(cost)}`, 'expense', 'player'); 
            gameEngine.increaseCryptoRisk();
        } 
    } 
    
    if (assetObj) { player.cash -= cost; player.passive += assetObj.grossCashflow; player.assets.push(assetObj); updateUI(); } 
    else showAlert('❌ ล้มเหลว', 'เงินสดไม่พอ!', '💸'); 
}