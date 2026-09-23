// ./asset/js/cashflow_character.js

class Character {
    constructor(isBot = false) {
        this.isBot = isBot;
        this.profName = "";
        this.cash = 0;
        this.salary = 0;
        this.baseExpenses = 0;
        this.profDebt = 0;
        this.bankDebt = 0;
        this.creditDebt = 0;
        this.creditGrace = 0;
        this.passive = 0;
        this.assets = [];
        this.isEducated = false;
        this.hasSelfCustody = false; 
        this.insurances = []; 
        this.currentTax = 0;
        this.escrows = []; 
    }

    assignProfession(card) {
        this.profName = card.name;
        this.cash = card.savings;
        this.salary = card.salary;
        this.baseExpenses = card.expenses;
        this.profDebt = card.profDebt;
    }

    getExpenses() {
        let currentBankRate = window.gameEngine ? window.gameEngine.bankInterestRate : 0.0125;
        let currentCreditRate = window.gameEngine ? window.gameEngine.creditInterestRate : 0.023;
        
        let profInt = Math.floor((this.profDebt * 0.025) / 12);
        let bankInt = Math.floor(this.bankDebt * currentBankRate); 
        let subjectToCreditInt = Math.max(0, (this.creditDebt || 0) - (this.creditGrace || 0));
        let creditInt = Math.floor(subjectToCreditInt * currentCreditRate); 
        let mortgageExp = this.assets.reduce((sum, asset) => sum + (asset.mortgagePayment || 0), 0);
        let installmentExp = this.assets.filter(a => a.type === 'installment' && a.monthsLeft > 0).reduce((sum, a) => sum + (a.monthly || 0), 0);
        
        let insuranceExp = this.insurances.reduce((sum, ins) => sum + ins.premium, 0);
        
        let activeTaxYearly = GameUtils.calculateThaiTax(this.salary * 12);
        let passiveIncomeYearly = this.assets.reduce((sum, a) => sum + (a.grossCashflow || 0), 0) * 12;
        let passiveTaxYearly = GameUtils.calculateThaiTax(passiveIncomeYearly);
        
        let hasBusiness = this.assets.some(a => a.buff === 'business');
        if (hasBusiness) activeTaxYearly = activeTaxYearly * 0.5; 
        
        let monthlyTax = Math.floor((activeTaxYearly + passiveTaxYearly) / 12);
        let realEstateDeduct = this.assets.filter(a => a.buff === 'realestate').reduce((sum, a) => sum + (a.taxDeduct || 0), 0);
        
        monthlyTax -= realEstateDeduct;
        if (monthlyTax < 0) monthlyTax = 0;

        this.currentTax = monthlyTax;
        return this.baseExpenses + profInt + bankInt + creditInt + mortgageExp + monthlyTax + installmentExp + insuranceExp;
    }

    processTimeBasedAssets() {
        let maturedCash = 0;
        let maturedNames = [];
        for (let i = this.escrows.length - 1; i >= 0; i--) {
            this.escrows[i].monthsLeft--;
            if (this.escrows[i].monthsLeft <= 0) {
                maturedCash += this.escrows[i].amount;
                maturedNames.push(this.escrows[i].name);
                this.escrows.splice(i, 1);
            }
        }
        if (maturedCash > 0) this.cash += maturedCash;

        let finishedInstallments = [];
        this.assets.forEach(a => {
            if (a.type === 'installment' && a.monthsLeft > 0) {
                a.monthsLeft--;
                if (a.monthsLeft === 0) {
                    finishedInstallments.push(a.name);
                }
            }
        });

        return { maturedCash, maturedNames, finishedInstallments };
    }
}