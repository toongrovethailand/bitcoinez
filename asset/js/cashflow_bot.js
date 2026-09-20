// ./asset/js/cashflow_bot.js

class BotEngine {
    constructor(engineInstance, uiInstance) {
        this.engine = engineInstance;
        this.ui = uiInstance;
    }

    processTurn() {
        if (this.engine.gameOver) return;
        const ind = document.getElementById('turn-indicator');
        if(ind) { ind.innerText = 'บอทกำลังประมวลผลเหตุการณ์...'; ind.classList.remove('bg-amber-900/30', 'text-amber-400'); ind.classList.add('bg-slate-700', 'text-slate-300'); }
        
        setTimeout(() => {
            try { 
                const bot = this.engine.bot;

                const timeAssetsResult = bot.processTimeBasedAssets();
                if (timeAssetsResult.maturedCash > 0) this.log(`ครบกำหนดสัญญา ได้รับเงินก้อน ${GameUtils.fmt(timeAssetsResult.maturedCash)}`, 'income');
                if (timeAssetsResult.finishedInstallments.length > 0) this.log(`ผ่อน ${timeAssetsResult.finishedInstallments.join(', ')} หมดแล้ว!`, 'system');

                this.managePortfolio();
                this.tradeMarket();
                
                if (!bot.isEducated && bot.cash >= 60000) { bot.cash -= 50000; bot.isEducated = true; this.log(`บอททุ่มเงินอัปสกิลการเงินขั้นเทพ!`, 'system'); }
                
                if (!bot.hasSelfCustody && bot.cash >= 25000 && bot.assets.some(a => a.type === 'btc')) {
                    bot.cash -= 10000; bot.hasSelfCustody = true; this.log(`บอทซื้อ Hardware Wallet ป้องกันบิตคอยน์!`, 'system');
                }

                if (bot.cash >= 20000 && typeof INSURANCE_CONTENT !== 'undefined') {
                    INSURANCE_CONTENT.forEach(ins => {
                        let premiumAmt = ins.premium;
                        if (ins.id === 'ins_social') premiumAmt = Math.max(500, Math.min(2500, Math.floor(bot.salary * 0.05)));

                        if (!bot.insurances.some(i => i.id === ins.id) && bot.cash >= 20000) {
                            bot.insurances.push(ins);
                            bot.cash -= premiumAmt; // หักเบี้ยล่วงหน้า 1 เดือน
                            this.log(`บอทตัดสินใจซื้อ ${ins.name} เพื่อป้องกันความเสี่ยง`, 'expense');
                        }
                    });
                }

                if ((bot.creditDebt || 0) > 0 && bot.cash > 5000) { let payAmt = Math.min(bot.cash - 2000, bot.creditDebt); bot.cash -= payAmt; bot.creditDebt -= payAmt; bot.creditGrace = 0; this.log(`บอทโปะหนี้บัตรเครดิต ${GameUtils.fmt(payAmt)}`, 'system'); } 
                else if (bot.bankDebt > 0 && bot.cash > 10000) { let payAmt = Math.min(bot.cash - 5000, bot.bankDebt); bot.cash -= payAmt; bot.bankDebt -= payAmt; this.log(`บอทโปะหนี้ฉุกเฉิน ${GameUtils.fmt(payAmt)}`, 'system'); } 
                else if (bot.bankDebt === 0 && bot.profDebt > 0 && bot.cash > 25000) { let payAmt = Math.min(bot.cash - 10000, bot.profDebt); bot.cash -= payAmt; bot.profDebt -= payAmt; this.log(`บอททยอยโปะหนี้อาชีพ ${GameUtils.fmt(payAmt)}`, 'system'); }

                const ev = this.engine.currentSharedEvent;
                
                let isCovered = false;
                if (ev.type === 'bad_doodad' || ev.type === 'bad_life' || ev.type === 'installment') {
                    bot.insurances.forEach(ins => {
                        if(ins.covers.includes(ev.id)) isCovered = true;
                    });
                }

                if (ev.type === 'crisis') {
                    if (ev.id === 'cr_crypto_crash') {
                        if (bot.hasSelfCustody) {
                            this.log(`บอทรอดพ้นวิกฤตกระดานเทรดล้มละลายเพราะมี Hardware Wallet!`, 'income');
                        } else {
                            let hasBtc = bot.assets.some(a => a.type === 'btc');
                            if (hasBtc) {
                                bot.assets = bot.assets.filter(a => a.type !== 'btc');
                                this.log(`บอทสูญเสียบิตคอยน์ทั้งหมดจากกระดานเทรดล้มละลาย!`, 'expense');
                            } else {
                                this.log(`บอทไม่ได้รับผลกระทบจากกระดานเทรดล้มละลาย`, 'info');
                            }
                        }
                    } else { 
                        if (bot.cash >= (bot.getExpenses() * 6)) {
                            this.log(`บอทเอาตัวรอดจากวิกฤตได้เพราะมีเงินสำรอง!`, 'income');
                        }
                    }
                } else if (ev.type === 'gamble') {
                    if (bot.cash > ev.cost * 5 && Math.random() < 0.3) { bot.cash -= ev.cost; if (Math.random() < ev.prob) { bot.cash += ev.win; this.log(`บอทเสี่ยงโชคและถูกแจ็คพอต! ได้เงิน ${GameUtils.fmt(ev.win)}`, 'income'); } else this.log(`บอทเสียเงินฟรี ${GameUtils.fmt(-ev.cost)}`, 'expense'); } 
                    else this.log(`บอทปฏิเสธการเล่นพนัน`, 'info');
                } else if (ev.type === 'realestate' || ev.type === 'business' || ev.type === 'land') { 
                    let actualDpB = bot.isEducated ? Math.floor(ev.downPayment * 0.8) : ev.downPayment;
                    if (ev.cashflow > 1000 || (ev.cashflow > 0 && actualDpB < 50000)) { 
                        let needed = actualDpB - bot.cash;
                        if (needed > 0 && ev.cashflow > (needed * 0.10) + 200) { 
                            let maxLoan = bot.salary * 5;
                            if (bot.bankDebt + needed <= maxLoan) {
                                bot.cash += needed; bot.bankDebt += needed; 
                            }
                        } 
                        if (bot.cash >= actualDpB) { 
                            bot.cash -= actualDpB; bot.passive += ev.grossCashflow; bot.assets.push({...ev, downPayment: actualDpB, mortgage: ev.cost - actualDpB}); 
                            this.log(`พิจารณาการ์ดใบเดียวกัน แล้วตัดสินใจคว้าโอกาสลงทุนใน ${ev.name}`, 'income'); 
                        } 
                        else this.log(`เงินไม่พอจ่ายดาวน์และกู้เต็มวงเงินแล้ว จึงต้องปล่อยผ่านดีลนี้`, 'info');
                    } else this.log(`วิเคราะห์แล้วดีลนี้ไม่คุ้ม จึงปล่อยผ่าน`, 'info');
                } else if (isCovered && ev.id !== 'layoff') {
                    this.log(`บอทรอดพ้นรายจ่าย ${ev.name} เพราะเคลมบริษัทประกันได้!`, 'income');
                } else if (ev.type === 'bad_life' && ev.id === 'layoff') {
                    this.log(`บอทถูกเลิกจ้างเช่นกัน! ${bot.insurances.some(i=>i.id==='ins_social') ? 'แต่มีประกันสังคมช่วยพยุง' : 'แถมไม่มีประกันสังคม!'}`, 'expense');
                } else if (ev.type === 'bad_doodad') { 
                    if (bot.isEducated && Math.random() < 0.5) this.log(`บอทใช้ภูมิคุ้มกันปฏิเสธรายจ่ายฟุ่มเฟือย`, 'income');
                    else if (bot.cash > ev.cost + 5000) { bot.cash -= ev.cost; this.log(`บอทกัดฟันจ่ายเงินสด: ${ev.name}`, 'expense'); } 
                    else { bot.creditDebt = (bot.creditDebt || 0) + ev.cost; bot.creditGrace = (bot.creditGrace || 0) + ev.cost; this.log(`บอทเงินช็อต! ต้องรูดบัตร: ${ev.name}`, 'expense'); }
                } else if (ev.type === 'installment') {
                    let newInstB = { ...ev, type: 'installment', monthsLeft: ev.months, buyPrice: ev.cost, mortgage: 0, grossCashflow: 0, mortgagePayment: 0, buff: 'none' };
                    bot.assets.push(newInstB);
                    this.log(`บอทสร้างหนี้ผ่อน: ${ev.name}`, 'expense');
                } 
                
                // 🌟 ระบบหนีตายของบอท (เมื่อเงินช็อต)
                while (bot.cash < 0) {
                    let maxLoan = bot.salary * 5;
                    let availableLoan = Math.max(0, maxLoan - bot.bankDebt);
                    if (availableLoan > 0) {
                        let takeAmt = Math.min(availableLoan, Math.ceil(Math.abs(bot.cash)/1000)*1000 + 5000);
                        bot.cash += takeAmt; bot.bankDebt += takeAmt;
                        this.log(`บอทเงินช็อต! ต้องกู้ฉุกเฉินเพิ่ม ${GameUtils.fmt(takeAmt)}`, 'expense');
                    } else {
                        let paper = bot.assets.find(a => ['bank','inv','gold','btc'].includes(a.type));
                        if (paper) {
                            let val = paper.type==='bank'?paper.buyPrice:(paper.type==='inv'?Math.round(this.engine.market.invPrice*paper.units):(paper.type==='gold'?Math.round(this.engine.market.goldPrice*paper.units):Math.round(this.engine.market.btcPrice*paper.units)));
                            bot.cash += val;
                            bot.passive -= paper.grossCashflow || 0;
                            bot.assets = bot.assets.filter(a => a !== paper);
                            this.log(`บอทขาย ${paper.name} หนีตายเงินช็อต!`, 'income');
                        } else {
                            let re = bot.assets.find(a => ['realestate','business'].includes(a.type));
                            if (re) {
                                 let val = Math.floor(re.buyPrice * 0.6);
                                 let net = val - (re.mortgage||0);
                                 bot.cash += net;
                                 bot.passive -= re.grossCashflow || 0;
                                 bot.assets = bot.assets.filter(a => a !== re);
                                 this.log(`บอทเทขายอสังหาฯ ${re.name} หนีตาย!`, 'income');
                            } else {
                                break; 
                            }
                        }
                    }
                }

                // 🌟 ตรวจสอบบอทล้มละลาย
                let botBkr = this.engine.checkBankruptcy(bot);
                if (botBkr) {
                    this.log(`บอทล้มละลาย! (${botBkr})`, 'expense');
                    if(window.endGame) window.endGame('player_survive'); 
                    return;
                }

                this.engine.enforceBankruptcyRule(bot); 
                if(window.updateUI) window.updateUI(); 
                setTimeout(() => { if(window.restorePlayerTurn) window.restorePlayerTurn(); }, 1500);

            } catch(err) { console.error(err); if(window.restorePlayerTurn) window.restorePlayerTurn(); }
        }, 1000);
    }

    tradeMarket() {
        const bot = this.engine.bot; const market = this.engine.market;
        let cost = 0; let assetObj = null; 
        let infRate = parseFloat(document.getElementById('inflation-rate')?.value) || 3;
        let isHighInflation = infRate >= 7;

        let spProb = market.spState !== 'bull' ? 0.6 : 0.4;
        
        if (bot.cash >= Math.round(market.invPrice * 100) + 15000 && Math.random() < spProb) {
            cost = Math.round(market.invPrice * 100); const cf = Math.round((cost * 0.05) / 12);
            assetObj = { id: Date.now(), type: 'inv', name: 'S&P500', units: 100, buyPrice: cost, mortgage: 0, grossCashflow: cf, cashflow: cf, buff: 'none' }; 
            this.log(`DCA ซื้อหุ้น S&P500 สะสมช่วงตลาดซึม`, 'expense');
        } 
        else if (bot.cash >= Math.round(market.btcPrice * 0.01) + 30000 && Math.random() < 0.15) {
            if (market.btcState !== 'bull') {
                cost = Math.round(market.btcPrice * 0.01);
                assetObj = { id: Date.now(), type: 'btc', name: 'บิตคอยน์', units: 0.01, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0, buff: 'none' }; 
                this.log(`เก็งกำไรบิตคอยน์เก็บไว้`, 'expense');
            }
        } 
        else {
            let goldProb = (isHighInflation || market.spState === 'bear') ? 0.50 : 0.25;

            if (bot.cash >= Math.round(market.goldPrice) + 15000 && Math.random() < goldProb) {
                cost = Math.round(market.goldPrice);
                assetObj = { id: Date.now(), type: 'gold', name: 'ทองคำ 1 บาท', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0, buff: 'none' }; 
                this.log(`ซื้อทองคำเก็บเป็น Safe Haven โยกย้ายความเสี่ยง`, 'expense');
            } else if (bot.cash >= 15000 && Math.random() < 0.3) {
                cost = 10000; const cf = Math.round((cost * 0.02) / 12);
                assetObj = { id: Date.now(), type: 'bank', name: 'เงินฝากประจำ', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: cf, cashflow: cf, buff: 'none' }; 
                this.log(`ฝากเงินในแบงก์กินดอกเบี้ย`, 'expense');
            }
        }

        if (assetObj) { bot.cash -= cost; bot.passive += assetObj.grossCashflow; bot.assets.push(assetObj); }
    }

    managePortfolio() {
        const bot = this.engine.bot; 
        const market = this.engine.market;

        if (market.btcState === 'bull') {
            let btcAssets = bot.assets.filter(a => a.type === 'btc');
            if (btcAssets.length > 0) {
                let totalVal = 0;
                btcAssets.forEach(a => { totalVal += Math.round(market.btcPrice * a.units); });
                let capGainsTax = Math.floor(totalVal * 0.15); 
                let net = totalVal - capGainsTax;
                bot.cash += net;
                bot.assets = bot.assets.filter(a => a.type !== 'btc'); 
                this.log(`🚀 เทขายบิตคอยน์ทำกำไรทั้งหมดในช่วงตลาดกระทิง! รับเงินสุทธิ ${GameUtils.fmt(net)}`, 'income');
            }
        }

        for (let i = 0; i < bot.assets.length; i++) {
            let a = bot.assets[i];
            if ((a.mortgage || 0) > 0 && bot.cash > a.mortgage * 1.5) {
                bot.cash -= a.mortgage;
                this.log(`นำเงินสดก้อนใหญ่ไปโปะหนี้ ${a.name} จำนวน ${GameUtils.fmt(a.mortgage)} จนปลอดภาระ!`, 'income');
                a.mortgage = 0;
                a.mortgagePayment = 0;
            }
        }
    }

    log(msg, type) { this.ui.logActivity(msg, `ด.${this.engine.gameMonth}`, type, 'bot'); }
}