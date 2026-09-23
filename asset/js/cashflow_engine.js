// ./asset/js/cashflow_engine.js

class GameEngine {
    constructor() {
        this.player = new Character(false);
        this.bot = new Character(true);
        this.currentTurn = 'player';
        this.currentSharedEvent = null;
        this.gameOver = false;
        this.gameMonth = 1;
        this.isAnimating = false; 
        this.currentQuickPayType = '';
        this.nextCrisisMonth = 36;
        this.eventCounts = {};
        this.badCooldown = 0; 
        
        this.lastPandemicResetMonth = 1;
        this.cryptoCrashExtraWeight = 0;
        this.cryptoCrashCooldown = 0; 
        
        this.bankInterestRate = 0.0125; 
        this.creditInterestRate = 0.023; // 🌟 เพิ่มตัวแปรดอกเบี้ยบัตรเครดิตเริ่มต้น

        this.ecoGauge = 25; 
        this.ecoState = 'normal';

        this.probabilities = {
            crisis: 1,
            deal: 50,
            bad: 15,
            gamble: 10
        };

        let initInvPrice = Math.floor(Math.random() * 50 + 80); 
        let initGoldPrice = Math.floor(Math.random() * 15000 + 30000); 
        let initBtcPrice = Math.floor(Math.random() * 2000000 + 1500000); 

        this.market = {
            invPrice: initInvPrice, 
            goldPrice: initGoldPrice, 
            btcPrice: initBtcPrice,
            nextBias: 'normal',
            btcState: 'sideways', 
            btcMonthsLeft: 0,
            spState: 'sideways',
            spMonthsLeft: 0,
            goldState: 'sideways',
            goldMonthsLeft: 0
        };
    }

    getEventCount(id) { return this.eventCounts[id] || 0; }
    incrementEventCount(id) { this.eventCounts[id] = (this.eventCounts[id] || 0) + 1; }
    resetEventCounts() { this.eventCounts = {}; }

    increaseCryptoRisk() {
        if (this.cryptoCrashCooldown > 0) return; 
        let increase = Math.floor(Math.random() * 31) + 10; 
        this.cryptoCrashExtraWeight = (this.cryptoCrashExtraWeight || 0) + increase;
    }

    generateCrisisEvent() {
        let available = CONTENT.crisis.filter(e => {
            if (e.id === 'cr_crypto_crash' && this.cryptoCrashCooldown > 0) return false;
            return this.getEventCount(e.id) < e.limit || e.limit === null;
        });
        if(available.length === 0) available = CONTENT.crisis.filter(e => e.id !== 'cr_crypto_crash' || this.cryptoCrashCooldown <= 0); 
        
        if (this.ecoGauge >= 100 && Math.random() < 0.5) {
            let bs = CONTENT.crisis.find(c => c.id === 'cr_blackswan');
            if (bs) {
                this.lastPandemicResetMonth = this.gameMonth; 
                this.incrementEventCount(bs.id);
                return { type: 'crisis', id: bs.id, name: bs.name, desc: bs.desc, cost: 0 };
            }
        }

        let weights = available.map(c => {
            let baseWeight = 100;
            if (c.id === 'cr_pandemic') {
                let monthsSinceReset = this.gameMonth - (this.lastPandemicResetMonth || 1);
                let extra = Math.max(0, monthsSinceReset - 60); 
                return baseWeight + (extra * 5); 
            } else if (c.id === 'cr_crypto_crash') {
                return baseWeight + (this.cryptoCrashExtraWeight || 0); 
            } else if (c.id === 'cr_blackswan') {
                return 10; 
            } else {
                return baseWeight; 
            }
        });

        let totalWeight = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalWeight;
        let sum = 0;
        let selected = available[0];
        
        for (let i = 0; i < available.length; i++) {
            sum += weights[i];
            if (r <= sum) {
                selected = available[i];
                break;
            }
        }

        if (selected.id === 'cr_pandemic' || selected.id === 'cr_blackswan') {
            this.lastPandemicResetMonth = this.gameMonth;
        }

        this.incrementEventCount(selected.id);
        return { type: 'crisis', id: selected.id, name: selected.name, desc: selected.desc, cost: 0 };
    }

    generateDynamicDeal() {
        const rand = Math.random(); 
        let typeName, cost, targetRoi, downPaymentPercent; 
        let isBusiness = false, isLand = false; let buff = 'none', buffDesc = '', taxDeduct = 0;
        
        const getAvailableName = (pool) => {
            let available = pool.filter(e => e.limit === null || this.getEventCount(e.id) < e.limit);
            if(available.length === 0) available = pool.filter(e => e.limit === null); 
            if(available.length === 0) available = pool; 
            let selected = available[Math.floor(Math.random() * available.length)];
            this.incrementEventCount(selected.id);
            return selected.name;
        };
        
        if (rand < 0.2) { 
            typeName = getAvailableName(CONTENT.deals.land); cost = Math.floor(Math.random() * 50 + 10) * 10000; downPaymentPercent = 1.0; isLand = true;
        } else if (rand < 0.5) { 
            typeName = getAvailableName(CONTENT.deals.business); cost = Math.floor(Math.random() * 30 + 5) * 10000; downPaymentPercent = Math.random() * 0.3 + 0.3; targetRoi = Math.floor(Math.random() * 51) + 10; isBusiness = true;
            buff = 'business'; buffDesc = '✨ นิติบุคคล: ภาษีเงินเดือนลด 50%';
        } else if (rand < 0.8) { 
            typeName = getAvailableName(CONTENT.deals.smallRE); cost = Math.floor(Math.random() * 30 + 10) * 10000; downPaymentPercent = Math.random() * 0.1 + 0.1; targetRoi = Math.floor(Math.random() * 51) + 10; 
            buff = 'realestate'; taxDeduct = 1000; buffDesc = `✨ ค่าเสื่อมราคา: ลดหย่อนภาษี ฿${taxDeduct.toLocaleString()}/ด`;
        } else { 
            typeName = getAvailableName(CONTENT.deals.largeRE); cost = Math.floor(Math.random() * 100 + 40) * 10000; downPaymentPercent = Math.random() * 0.15 + 0.1; targetRoi = Math.floor(Math.random() * 51) + 10; 
            buff = 'realestate'; taxDeduct = 2500; buffDesc = `✨ ค่าเสื่อมราคา: ลดหย่อนภาษี ฿${taxDeduct.toLocaleString()}/ด`;
        }
        
        let downPayment = Math.ceil((cost * downPaymentPercent) / 1000) * 1000;
        let mortgage = cost - downPayment;
        let grossCashflow = 0; let mortgagePayment = 0; let netCashflow = 0;
        
        if (isLand) { 
            mortgagePayment = Math.floor(cost * 0.01 / 12); 
            netCashflow = -mortgagePayment;
        } else {
            netCashflow = Math.floor((downPayment * (targetRoi / 100)) / 12 / 100) * 100;
            if (netCashflow <= 0) netCashflow = 100; 
            
            mortgagePayment = mortgage > 0 ? Math.floor((mortgage * 0.08) / 12 / 100) * 100 : 0; 
            grossCashflow = netCashflow + mortgagePayment;
        }
        
        return { id: Date.now().toString(), name: typeName, cost: cost, downPayment: downPayment, mortgage: mortgage, mortgagePayment: mortgagePayment, grossCashflow: grossCashflow, cashflow: netCashflow, type: isLand ? 'land' : (isBusiness ? 'business' : 'realestate'), buyPrice: cost, buff: buff, taxDeduct: taxDeduct, buffDesc: buffDesc };
    }

    generateDynamicBadEvent() {
        const rand = Math.random();
        
        if (rand < 0.20) {
            let pool = CONTENT.badEvents.installment;
            let available = pool.filter(e => this.getEventCount(e.id) < e.limit);
            if(available.length === 0) available = pool;
            let selected = available[Math.floor(Math.random() * available.length)];
            this.incrementEventCount(selected.id);
            
            let totalCost = selected.baseCost + Math.floor(this.player.salary * selected.salaryMult);
            totalCost = Math.round(totalCost / 1000) * 1000;
            let monthlyPay = Math.floor(totalCost / selected.months);
            let salvageVal = Math.floor(totalCost * 0.4); 
            
            return { type: 'installment', id: selected.id, name: selected.name, cost: totalCost, monthly: monthlyPay, months: selected.months, salvage: salvageVal };
        } else {
            const isLifeEvent = Math.random() > 0.5; 
            let pool = isLifeEvent ? CONTENT.badEvents.life : CONTENT.badEvents.doodad;
            
            let available = pool.filter(e => e.limit === null || this.getEventCount(e.id) < e.limit);
            if(available.length === 0) available = pool.filter(e => e.limit === null); 
            let selected = available[Math.floor(Math.random() * available.length)];
            this.incrementEventCount(selected.id);
            
            if (isLifeEvent) {
                let expInc = selected.baseExp + Math.floor(this.player.salary * selected.salaryMult);
                expInc = Math.round(expInc / 100) * 100; 
                return { type: 'bad_life', id: selected.id, name: selected.name, expenseIncrease: expInc, cost: 0 };
            } else {
                let cost = selected.baseCost + Math.floor(this.player.salary * selected.salaryMult);
                cost = Math.round(cost / 1000) * 1000; 
                return { type: 'bad_doodad', id: selected.id, name: selected.name, cost: cost, expenseIncrease: 0 };
            }
        }
    }

    generateGambleEvent() {
        const g = CONTENT.gambles[Math.floor(Math.random() * CONTENT.gambles.length)];
        this.incrementEventCount(g.id);

        let cost = g.baseCost + Math.floor(this.player.salary * g.salaryMult);
        cost = Math.round(cost / 1000) * 1000;
        let win = cost * g.winMult;
        
        return { type: 'gamble', id: g.id, name: g.name, cost: cost, win: win, prob: g.prob, desc: `เดิมพันด้วยเงิน ${GameUtils.fmt(cost)}\nมีโอกาสชนะ ${Math.round(g.prob*100)}% ที่จะได้รับเงินก้อน ${GameUtils.fmt(win)}!\n\n"คุณจะลองเสี่ยงโชค หรือจะปล่อยผ่าน?"` };
    }

    generateNews() {
        const r = Math.random();
        if (r < 0.25) { this.market.nextBias = 'bull'; return "📰 ข่าวดี: ธนาคารลดดอกเบี้ย! (ตลาดหุ้นอาจขึ้น)"; } 
        else if (r < 0.50) { this.market.nextBias = 'bear'; return "📰 ข่าวร้าย: ดัชนีเศรษฐกิจชะลอตัว! (ตลาดอาจร่วงหนัก)"; } 
        else if (r < 0.75) { this.market.nextBias = 'crypto'; return "📰 ข่าวลือ: บริษัทยักษ์ใหญ่ซื้อ Bitcoin! (คริปโตอาจพุ่ง)"; } 
        else { this.market.nextBias = 'normal'; return "📰 ข่าวเศรษฐกิจ: สภาวะตลาดทรงตัว"; }
    }

    enforceBankruptcyRule(actor) {
        if (actor.cash < 0) {
            let needed = Math.abs(actor.cash);
            let loanAmount = Math.ceil(needed / 10000) * 10000;
            actor.bankDebt += loanAmount; actor.cash += loanAmount; 
            
            if(window.uiManager) window.uiManager.logActivity(`เงินสดติดลบ! ถูกบังคับกู้ฉุกเฉิน ${GameUtils.fmt(loanAmount)}`, `ด.${this.gameMonth}`, 'expense', actor.isBot ? 'bot' : 'player');
            
            if (!actor.isBot && window.uiManager) {
                window.uiManager.showAlert('🚨 วิกฤตสภาพคล่อง!', `เงินสดคุณติดลบ!\nธนาคารบังคับปล่อยกู้ฉุกเฉิน ${GameUtils.fmt(loanAmount)} บาท\nคำเตือน: หนี้ก้อนนี้ดอกเบี้ยแพง!`, '🏦');
                window.uiManager.spawnFloatingText('player-cash', loanAmount);
            }
        }
    }

    updateEcoGauge(event) {
        if (!event) return;
        let change = 0;
        if (['realestate', 'business', 'land'].includes(event.type)) change = Math.floor(Math.random() * 4) + 2; 
        else if (event.type === 'installment' || event.type === 'bad_doodad') change = Math.floor(Math.random() * 3) + 1; 
        else if (event.type === 'bad_life') change = -(Math.floor(Math.random() * 4) + 2); 
        else if (event.type === 'gamble') change = Math.floor(Math.random() * 3) + 2; 
        else if (event.type === 'nothing') change = -1;
        else if (event.type === 'crisis') {
            if (event.id === 'cr_crypto_crash') change = 0; 
            else if (event.id === 'cr_blackswan') change = -100; // Reset
            else change = -(Math.floor(Math.random() * 16) + 15); // -15 to -30
        }

        this.ecoGauge += change;
        if (this.ecoGauge < 0) this.ecoGauge = 0;
        if (this.ecoGauge > 100) this.ecoGauge = 100;

        if (this.ecoGauge < 25) this.ecoState = 'recovery';
        else if (this.ecoGauge < 50) this.ecoState = 'normal';
        else if (this.ecoGauge < 75) this.ecoState = 'warning';
        else this.ecoState = 'crisis';
    }
}