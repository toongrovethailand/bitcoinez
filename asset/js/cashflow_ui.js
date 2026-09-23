// ./asset/js/cashflow_ui.js

class UIManager {
    constructor() {
        this.confirmCallback = null;
        this.activityLogs = []; // 🌟 เก็บ Log ไว้สำหรับ Export
    }

    safeSetText(id, val) {
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    }

    showAlert(title, message, icon = '🚨') {
        this.safeSetText('custom-alert-title', title);
        this.safeSetText('custom-alert-message', message);
        this.safeSetText('custom-alert-icon', icon);
        document.getElementById('custom-alert-modal').classList.remove('hidden');
    }

    closeCustomAlert() { document.getElementById('custom-alert-modal').classList.add('hidden'); }

    showConfirm(title, message, icon, onConfirm) {
        this.safeSetText('custom-confirm-title', title);
        this.safeSetText('custom-confirm-message', message);
        this.safeSetText('custom-confirm-icon', icon);
        this.confirmCallback = onConfirm;
        document.getElementById('custom-confirm-modal').classList.remove('hidden');
    }

    closeCustomConfirm() { 
        document.getElementById('custom-confirm-modal').classList.add('hidden'); 
        this.confirmCallback = null; 
    }

    logActivity(message, timeStr, type = 'info', context = 'global') {
        // บันทึกลง Array สำหรับ Export TXT
        this.activityLogs.push({ time: timeStr, msg: message, type: type, ctx: context });

        const targetId = context === 'player' ? 'player-log' : (context === 'bot' ? 'bot-log' : 'global-log');
        const logList = document.getElementById(targetId);
        if (!logList) return;
        let colorClass = 'text-slate-300';
        if (type === 'income') colorClass = 'text-emerald-400';
        if (type === 'expense') colorClass = 'text-rose-400';
        if (type === 'system') colorClass = 'text-amber-400 font-bold';
        if (type === 'news') colorClass = 'text-indigo-300 font-bold';
        const entry = document.createElement('div');
        entry.className = `text-[10.5px] font-mono py-1.5 border-b border-slate-800/50 ${colorClass} leading-tight`;
        entry.innerHTML = `<span class="text-slate-500 mr-1">[${timeStr}]</span> ${message}`;
        logList.appendChild(entry);
        logList.scrollTop = logList.scrollHeight;
    }

    spawnFloatingText(elementId, amount) {
        const target = document.getElementById(elementId);
        if (!target) return;
        const floater = document.createElement('div');
        floater.className = 'floating-text ' + (amount >= 0 ? 'text-emerald-400' : 'text-rose-400');
        floater.innerText = (amount >= 0 ? '+' : '') + GameUtils.fmt(amount);
        const rect = target.getBoundingClientRect();
        floater.style.left = (rect.left + rect.width / 2 - 30) + 'px';
        floater.style.top = (rect.top - 10) + 'px';
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 1500);
    }

    setEventCard(title, desc, icon, showQuote = false) {
        this.safeSetText('event-title', title);
        this.safeSetText('event-desc', desc);
        this.safeSetText('event-icon', icon);
        const quoteEl = document.getElementById('kiyosaki-quote');
        if(showQuote) {
            quoteEl.innerHTML = `<b>พ่อรวยสอนว่า:</b> "${CONTENT.quotes[Math.floor(Math.random() * CONTENT.quotes.length)]}"`;
            quoteEl.classList.remove('hidden');
        } else quoteEl.classList.add('hidden');
    }

    toggleDecisionPanels(panelIdToShow) {
        const panels = ['action-buttons', 'deal-decision-buttons', 'doodad-decision-buttons', 'crisis-decision-buttons', 'gamble-decision-buttons'];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                if(id === panelIdToShow) el.classList.remove('hidden');
                else el.classList.add('hidden');
            }
        });
        
        const dealInfo = document.getElementById('deal-info');
        if (dealInfo) {
            if (panelIdToShow === 'deal-decision-buttons') dealInfo.classList.remove('hidden');
            else dealInfo.classList.add('hidden');
        }
    }

    showDealDecisions(deal, isPlayerEducated) {
        this.toggleDecisionPanels('deal-decision-buttons');
        const buffEl = document.getElementById('deal-buff');
        if (deal.buff !== 'none') {
            buffEl.innerText = deal.buffDesc;
            buffEl.classList.remove('hidden');
        } else {
            buffEl.classList.add('hidden');
        }
        this.safeSetText('deal-full-cost', GameUtils.fmt(deal.cost));
        
        let actualDp = isPlayerEducated ? Math.floor(deal.downPayment * 0.8) : deal.downPayment;
        let dpText = isPlayerEducated ? `<span class="text-fuchsia-400 text-xs font-normal mr-1">(ลด 20%)</span>${GameUtils.fmt(actualDp)}` : GameUtils.fmt(actualDp);
        document.getElementById('deal-downpayment').innerHTML = dpText;
        
        this.safeSetText('deal-gross', '+' + GameUtils.fmt(deal.grossCashflow));
        this.safeSetText('deal-mortgage-pay', '-' + GameUtils.fmt(deal.mortgagePayment));
        
        const cfEl = document.getElementById('deal-cashflow');
        cfEl.innerText = (deal.cashflow >= 0 ? '+' : '') + GameUtils.fmt(deal.cashflow);
        cfEl.className = deal.cashflow < 0 ? 'text-rose-400 font-bold text-sm bg-rose-900/30 px-2 py-0.5 rounded' : 'text-emerald-400 font-bold text-sm bg-emerald-900/30 px-2 py-0.5 rounded';
    }

    showDoodadDecisions() { this.toggleDecisionPanels('doodad-decision-buttons'); }
    showCrisisDecisions() { this.toggleDecisionPanels('crisis-decision-buttons'); }
    showGambleDecisions() { this.toggleDecisionPanels('gamble-decision-buttons'); }
    
    hideDecisions(gameOver) {
        if(!gameOver) {
            this.toggleDecisionPanels('action-buttons');
        } else {
            this.toggleDecisionPanels(''); 
        }
    }
}