// ./asset/js/cashflow_bot.js

class BotEngine {
    constructor(engineInstance, uiInstance) {
        this.engine = engineInstance;
        this.ui = uiInstance;
    }

    processTurn() {
        if (this.engine.gameOver) return;
        const bot = this.engine.bot;

        if (bot.isBankrupt) {
            if(window.restorePlayerTurn) window.restorePlayerTurn();
            return;
        }

        const ind = document.getElementById('turn-indicator');
        if(ind) { ind.innerText = 'บอทกำลังประมวลผลเหตุการณ์...'; ind.classList.remove('bg-amber-900/30', 'text-amber-400'); ind.classList.add('bg-slate-700', 'text-slate-300'); }
        
        setTimeout(() => {
            try { 
                const timeAssetsResult = bot.processTimeBasedAssets();
                if (timeAssetsResult.maturedCash > 0) this.log(`ครบกำหนดสัญญา ได้รับเงินก้อน ${GameUtils.fmt(timeAssetsResult.maturedCash)}`, 'income');
                if (timeAssetsResult.finishedInstallments.length > 0) this.log(`ผ่อน ${timeAssetsResult.finishedInstallments.join(', ')} หมดแล้ว กลายเป็นสินทรัพย์ปลอดภาระ!`, 'system');

                let requiredReserve = bot.getExpenses() * 6;
                let safeCash = bot.cash - requiredReserve;

                this.managePortfolio();
                this.tradeMarket();
                
                if (!bot.isEducated && safeCash >= 50000) { bot.cash -= 50000; bot.isEducated = true; this.log(`บอทเจียดเงินเย็นไปอัปสกิลการเงินขั้นเทพ!`, 'system'); }
                
                if (!bot.hasSelfCustody && safeCash >= 10000 && bot.assets.some(a => a.type === 'btc')) {
                    bot.cash -= 10000; bot.hasSelfCustody = true; this.log(`บอทนำเงินเย็นซื้อ Hardware Wallet ป้องกันบิตคอยน์!`, 'system');
                }

                if (bot.cash >= 20000 && typeof INSURANCE_CONTENT !== 'undefined') {
                    INSURANCE_CONTENT.forEach(ins => {
                        let premiumAmt = ins.premium;
                        if (ins.id === 'ins_social') premiumAmt = Math.max(500, Math.min(2500, Math.floor(bot.salary * 0.05)));

                        if (!bot.insurances.some(i => i.id === ins.id) && bot.cash >= 20000) {
                            bot.insurances.push(ins);
                            bot.cash -= premiumAmt;
                            this.log(`บอทตัดสินใจซื้อ ${ins.name} เพื่อป้องกันความเสี่ยง`, 'expense');
                        }
                    });
                }

                if ((bot.creditDebt || 0) > 0 && bot.cash > bot.getExpenses() * 3) { 
                    let payAmt = Math.min(bot.cash - (bot.getExpenses() * 3), bot.creditDebt); 
                    if(payAmt > 0) {
                        bot.cash -= payAmt; bot.creditDebt -= payAmt; bot.creditGrace = 0; 
                        this.log(`บอทเจียดเงินก้อนไปโปะหนี้บัตรเครดิต ${GameUtils.fmt(payAmt)}`, 'system'); 
                    }
                } 
                else if (bot.bankDebt > 0 && safeCash > 10000) { 
                    let payAmt = Math.min(safeCash, bot.bankDebt); 
                    bot.cash -= payAmt; bot.bankDebt -= payAmt; 
                    this.log(`บอทนำเงินเย็นโปะหนี้ฉุกเฉิน ${GameUtils.fmt(payAmt)}`, 'system'); 
                } 
                else if (bot.bankDebt === 0 && bot.profDebt > 0 && safeCash > 25000) { 
                    let payAmt = Math.min(safeCash - 10000, bot.profDebt); 
                    bot.cash -= payAmt; bot.profDebt -= payAmt; 
                    this.log(`บอทนำเงินเย็นทยอยโปะหนี้อาชีพ ${GameUtils.fmt(payAmt)}`, 'system'); 
                }

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
                        if (bot.cash >= requiredReserve) {
                            this.log(`บอทเอาตัวรอดจากวิกฤตได้ชิลๆ เพราะมีเงินสำรอง!`, 'income');
                        }
                    }
                } else if (ev.type === 'gamble') {
                    if (safeCash > ev.cost * 5 && Math.random() < 0.3) { bot.cash -= ev.cost; if (Math.random() < ev.prob) { bot.cash += ev.win; this.log(`บอทเสี่ยงโชคและถูกแจ็คพอต! ได้เงิน ${GameUtils.fmt(ev.win)}`, 'income'); } else this.log(`บอทเสียเงินฟรี ${GameUtils.fmt(-ev.cost)}`, 'expense'); } 
                    else this.log(`บอทเงินไม่พอเสี่ยง หรือปฏิเสธการเล่นพนัน`, 'info');
                } else if (ev.type === 'realestate' || ev.type === 'business' || ev.type === 'land') { 
                    
                    let actualDpB = bot.isEducated ? Math.floor(ev.downPayment * 0.8) : ev.downPayment;
                    let roi = actualDpB > 0 ? (ev.cashflow * 12 * 100) / actualDpB : 0;
                    
                    let isHighDebt = bot.bankDebt > bot.salary * 3;
                    let isCloseToFT = bot.passive > bot.getExpenses() * 0.8;
                    
                    let willBuy = false;
                    let reason = "";

                    if (ev.type === 'land') {
                        if (safeCash >= actualDpB) {
                            willBuy = true; reason = "เงินสดเหลือเฟือ ซื้อเก็งกำไรที่ดิน";
                        } else {
                            reason = "ไม่ยอมเสี่ยงนำเงินสำรองฉุกเฉินมาจมกับสินทรัพย์ไม่มี Cashflow";
                        }
                    } else {
                        if (isHighDebt) {
                            reason = "หนี้ฉุกเฉินสูงเกินไป ต้องรักษาสภาพคล่องไว้ก่อน";
                        } else if (isCloseToFT && roi >= 15 && ev.cashflow > 1000) {
                            willBuy = true; reason = `ใกล้หลุด Rat Race เต็มที ยอมทุบกระปุกซื้อเพื่อเร่ง Cashflow (ROI ${roi.toFixed(1)}%)`;
                        } else if (safeCash >= actualDpB && roi >= 15) {
                            willBuy = true; reason = `มีเงินเย็นเหลือเฟือ ลงทุนด้วยเงินสดสบายๆ (ROI ${roi.toFixed(1)}%)`;
                        } else if (roi >= 35) { 
                            willBuy = true; reason = `ดีลทองคำหาตัวจับยาก! ยอมกู้เงินฉุกเฉินมาซื้อ (ROI ${roi.toFixed(1)}%)`;
                        } else {
                            reason = `วิเคราะห์แล้วเงินเย็นไม่พอ หรือ ROI (${roi.toFixed(1)}%) ต่ำเกินไปที่จะเสี่ยง`;
                        }
                    }

                    if (willBuy) {
                        let needed = actualDpB - bot.cash;
                        if (needed > 0) { 
                            let maxLoan = bot.salary * 5;
                            let loanCost = Math.floor(needed * 0.0125); 
                            if (ev.cashflow > loanCost + 500 && bot.bankDebt + needed <= maxLoan) {
                                bot.cash += needed; bot.bankDebt += needed; 
                                this.log(`บอทคำนวณแล้วคุ้มชัวร์! ยอมกู้เงินฉุกเฉิน ${GameUtils.fmt(needed)} เพื่อลงทุน`, 'expense');
                            } else {
                                willBuy = false; reason = "ต้องกู้เงินแต่หักดอกเบี้ยแล้วไม่คุ้มค่า หรือวงเงินแบงก์เต็ม";
                            }
                        }

                        if (willBuy && bot.cash >= actualDpB) { 
                            bot.cash -= actualDpB; bot.passive += ev.grossCashflow; bot.assets.push({...ev, downPayment: actualDpB, mortgage: ev.cost - actualDpB}); 
                            this.log(`พิจารณาดีล: ${reason} -> บอทตัดสินใจลงทุน ${ev.name}`, 'income'); 
                        } else {
                            this.log(`พิจารณาดีล: ${reason} -> ปล่อยผ่านดีกว่า`, 'info');
                        }
                    } else {
                        this.log(`พิจารณาดีล: ${reason} -> ปล่อยผ่าน`, 'info');
                    }

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
                
                while (bot.cash < 0) {
                    let maxLoan = bot.salary * 5;
                    let availableLoan = Math.max(0, maxLoan - bot.bankDebt);
                    if (availableLoan > 0) {
                        let takeAmt = Math.min(availableLoan, Math.ceil(Math.abs(bot.cash)/1000)*1000 + 5000);
                        bot.cash += takeAmt; bot.bankDebt += takeAmt;
                        this.log(`บอทหมุนเงินไม่ทัน! ต้องกู้ฉุกเฉินเพิ่ม ${GameUtils.fmt(takeAmt)}`, 'expense');
                    } else {
                        let paper = bot.assets.find(a => ['bank','inv','gold','btc'].includes(a.type));
                        if (paper) {
                            let val = paper.type==='bank'?paper.buyPrice:(paper.type==='inv'?Math.round(this.engine.market.invPrice*paper.units):(paper.type==='gold'?Math.round(this.engine.market.goldPrice*paper.units):Math.round(this.engine.market.btcPrice*paper.units)));
                            bot.cash += val;
                            bot.passive -= paper.grossCashflow || 0;
                            bot.assets = bot.assets.filter(a => a !== paper);
                            this.log(`บอทเทขาย ${paper.name} หนีตายเงินช็อต!`, 'income');
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

                // 🌟 ดิ้นรนเฮือกสุดท้ายก่อนตรวจล้มละลาย NPL: ถ้ารายจ่ายสูงเกินไป บอทจะยอมทิ้งดาวน์
                let preBkrCheckExp = bot.getExpenses();
                let preBkrCheckInc = (bot.layoffMonths > 0 ? (bot.insurances.some(i=>i.id==='ins_social') ? Math.floor(bot.salary*0.5) : 0) : bot.salary) + bot.passive;
                
                if (preBkrCheckInc > 0 && preBkrCheckExp > preBkrCheckInc * 1.5) {
                    let actInst = bot.assets.filter(a => a.type === 'installment' && a.monthsLeft > 0);
                    if (actInst.length > 0) {
                        actInst.sort((a, b) => b.monthly - a.monthly);
                        let dropIt = actInst[0];
                        bot.assets = bot.assets.filter(a => a !== dropIt);
                        this.log(`🚨 บอทหนี้ท่วม NPL! ดิ้นรนทิ้งดาวน์คืนสัญญา "${dropIt.name}" เพื่อหนีตายจากการล้มละลาย`, 'info');
                    }
                }

                let botBkr = this.engine.checkBankruptcy(bot);
                if (botBkr) {
                    bot.isBankrupt = true; 
                    this.log(`บอทล้มละลาย! ออกจากการแข่งขันแล้ว (${botBkr})`, 'expense');
                    if(window.updateUI) window.updateUI(); 
                    if(window.restorePlayerTurn) window.restorePlayerTurn(); 
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
        
        let safeCash = bot.cash - (bot.getExpenses() * 6);
        
        if (safeCash >= Math.round(market.invPrice * 100) + 15000 && Math.random() < spProb) {
            cost = Math.round(market.invPrice * 100); const cf = Math.round((cost * 0.05) / 12);
            assetObj = { id: Date.now(), type: 'inv', name: 'S&P500', units: 100, buyPrice: cost, mortgage: 0, grossCashflow: cf, cashflow: cf, buff: 'none' }; 
            this.log(`DCA นำเงินเย็นซื้อหุ้น S&P500 สะสมช่วงตลาดซึม`, 'expense');
        } 
        else if (safeCash >= Math.round(market.btcPrice * 0.01) + 30000 && Math.random() < 0.15) {
            if (market.btcState !== 'bull') {
                cost = Math.round(market.btcPrice * 0.01);
                assetObj = { id: Date.now(), type: 'btc', name: 'บิตคอยน์', units: 0.01, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0, buff: 'none' }; 
                this.log(`นำเงินเย็นเก็งกำไรบิตคอยน์เก็บไว้`, 'expense');
                this.engine.increaseCryptoRisk();
            }
        } 
        else {
            let goldProb = (isHighInflation || market.spState === 'bear') ? 0.50 : 0.25;

            if (safeCash >= Math.round(market.goldPrice) + 15000 && Math.random() < goldProb) {
                cost = Math.round(market.goldPrice);
                assetObj = { id: Date.now(), type: 'gold', name: 'ทองคำ 1 บาท', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: 0, cashflow: 0, buff: 'none' }; 
                this.log(`นำเงินเย็นซื้อทองคำเก็บเป็น Safe Haven โยกย้ายความเสี่ยง`, 'expense');
            } else if (safeCash >= 15000 && Math.random() < 0.3) {
                cost = 10000; const cf = Math.round((cost * 0.02) / 12);
                assetObj = { id: Date.now(), type: 'bank', name: 'เงินฝากประจำ', units: 1, buyPrice: cost, mortgage: 0, grossCashflow: cf, cashflow: cf, buff: 'none' }; 
                this.log(`นำเงินเย็นฝากในแบงก์กินดอกเบี้ย`, 'expense');
            }
        }

        if (assetObj) { bot.cash -= cost; bot.passive += assetObj.grossCashflow; bot.assets.push(assetObj); }
    }

    managePortfolio() {
        const bot = this.engine.bot; 
        const market = this.engine.market;

        let requiredReserve = bot.getExpenses() * 6;
        let bEffSalary = bot.layoffMonths > 0 ? (bot.insurances.some(i=>i.id==='ins_social') ? Math.floor(bot.salary*0.5) : 0) : bot.salary;
        let netCashflow = (bEffSalary + bot.passive) - bot.getExpenses();
        let isOverLeveraged = bot.getExpenses() > (bEffSalary + bot.passive) * 1.5;

        // 🌟 ตัดสินใจคืนสัญญา (Cancel Installment) ก่อนหมดตัว ถ้ากระแสเงินสดวิกฤต
        let activeInst = bot.assets.filter(a => a.type === 'installment' && a.monthsLeft > 0);
        if (activeInst.length > 0) {
            if (netCashflow < 0 || isOverLeveraged || bot.cash < requiredReserve / 2) {
                activeInst.sort((a, b) => b.monthly - a.monthly); // เลือกชิ้นที่ผ่อนแพงสุด
                let toDrop = activeInst[0];
                bot.assets = bot.assets.filter(a => a !== toDrop);
                this.log(`บอททนแบกภาระไม่ไหว! ตัดสินใจคืนสัญญา/ทิ้งดาวน์ "${toDrop.name}" (ลดรายจ่าย ${GameUtils.fmt(toDrop.monthly)}/ด)`, 'info');
                
                netCashflow = (bEffSalary + bot.passive) - bot.getExpenses();
            }
        }

        let paidOffInst = bot.assets.filter(a => a.type === 'installment' && a.monthsLeft <= 0);
        paidOffInst.forEach(a => {
            if (bot.cash < requiredReserve || Math.random() < 0.3) {
                bot.cash += a.salvage;
                bot.assets = bot.assets.filter(asset => asset !== a);
                this.log(`บอทนำ ${a.name} ที่ผ่อนหมดแล้วไปขายเป็นของมือสอง ได้เงินกู้ชีพ ${GameUtils.fmt(a.salvage)}`, 'income');
            }
        });

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

        let safeCash = bot.cash - requiredReserve;
        for (let i = 0; i < bot.assets.length; i++) {
            let a = bot.assets[i];
            if ((a.mortgage || 0) > 0 && safeCash > a.mortgage * 1.5) {
                bot.cash -= a.mortgage;
                safeCash -= a.mortgage;
                this.log(`นำเงินเย็นก้อนใหญ่ไปโปะหนี้ ${a.name} จำนวน ${GameUtils.fmt(a.mortgage)} จนปลอดภาระ!`, 'income');
                a.mortgage = 0;
                a.mortgagePayment = 0;
            }
        }
    }

    log(msg, type) { this.ui.logActivity(msg, `ด.${this.engine.gameMonth}`, type, 'bot'); }
}