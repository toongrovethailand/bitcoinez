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
        
        this.bankInterestRate = 0.0125; 

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
            // 🌟 เพิ่มระบบจดจำวัฏจักร S&P500 และ Gold
            spState: 'sideways',
            spMonthsLeft: 0,
            goldState: 'sideways',
            goldMonthsLeft: 0
        };
    }

    getEventCount(id) { return this.eventCounts[id] || 0; }
    incrementEventCount(id) { this.eventCounts[id] = (this.eventCounts[id] || 0) + 1; }
    resetEventCounts() { this.eventCounts = {}; }

    generateCrisisEvent() {
        let available = CONTENT.crisis.filter(e => this.getEventCount(e.id) < e.limit);
        if(available.length === 0) available = CONTENT.crisis; 
        let selected = available[Math.floor(Math.random() * available.length)];
        this.incrementEventCount(selected.id);
        return { type: 'crisis', id: selected.id, name: selected.name, desc: selected.desc, cost: 0 };
    }

    generateDynamicDeal() {
        const rand = Math.random(); 
        let typeName, cost, roiPercent, downPaymentPercent; 
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
            typeName = getAvailableName(CONTENT.deals.business); cost = Math.floor(Math.random() * 30 + 5) * 10000; downPaymentPercent = Math.random() * 0.3 + 0.3; roiPercent = Math.floor(Math.random() * 40) + 20; isBusiness = true;
            buff = 'business'; buffDesc = '✨ นิติบุคคล: ภาษีเงินเดือนลด 50%';
        } else if (rand < 0.8) { 
            typeName = getAvailableName(CONTENT.deals.smallRE); cost = Math.floor(Math.random() * 30 + 10) * 10000; downPaymentPercent = Math.random() * 0.1 + 0.1; roiPercent = Math.floor(Math.random() * 15) + 8; 
            buff = 'realestate'; taxDeduct = 1000; buffDesc = `✨ ค่าเสื่อมราคา: ลดหย่อนภาษี ฿${taxDeduct.toLocaleString()}/ด`;
        } else { 
            typeName = getAvailableName(CONTENT.deals.largeRE); cost = Math.floor(Math.random() * 100 + 40) * 10000; downPaymentPercent = Math.random() * 0.15 + 0.1; roiPercent = Math.floor(Math.random() * 12) + 8; 
            buff = 'realestate'; taxDeduct = 2500; buffDesc = `✨ ค่าเสื่อมราคา: ลดหย่อนภาษี ฿${taxDeduct.toLocaleString()}/ด`;
        }
        
        let downPayment = Math.ceil((cost * downPaymentPercent) / 1000) * 1000;
        let mortgage = cost - downPayment;
        let grossCashflow = 0; let mortgagePayment = 0;
        
        if (isLand) { mortgagePayment = Math.floor(cost * 0.01 / 12); } 
        else {
            grossCashflow = Math.floor((cost * (roiPercent / 100)) / 12 / 100) * 100;
            mortgagePayment = mortgage > 0 ? Math.floor((mortgage * 0.08) / 12 / 100) * 100 : 0; 
        }
        
        let netCashflow = grossCashflow - mortgagePayment;
        if (!isLand && netCashflow <= 0) { grossCashflow += Math.abs(netCashflow) + 500; netCashflow = grossCashflow - mortgagePayment; }
        
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
}