window.switchLogTab = function(tab) {
    const btnGossip = document.getElementById('tab-btn-gossip');
    const btnValidation = document.getElementById('tab-btn-validation');
    const contentGossip = document.getElementById('tab-content-gossip');
    const contentValidation = document.getElementById('tab-content-validation');

    if (tab === 'gossip') {
        btnGossip.className = "text-cyan-400 font-bold border-b-2 border-cyan-400 pb-2 px-1 transition-colors text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:text-cyan-300";
        btnValidation.className = "text-slate-500 hover:text-slate-300 font-bold border-b-2 border-transparent pb-2 px-1 transition-colors text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer";
        contentGossip.classList.remove('hidden');
        contentValidation.classList.add('hidden');
        
        const box = document.getElementById('live-node-chat-box');
        if (box) box.scrollTop = box.scrollHeight;
    } else if (tab === 'validation') {
        btnValidation.className = "text-cyan-400 font-bold border-b-2 border-cyan-400 pb-2 px-1 transition-colors text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:text-cyan-300";
        btnGossip.className = "text-slate-500 hover:text-slate-300 font-bold border-b-2 border-transparent pb-2 px-1 transition-colors text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer";
        contentValidation.classList.remove('hidden');
        contentGossip.classList.add('hidden');
        
        const logBox = document.getElementById('event-log');
        if (logBox) logBox.scrollTop = logBox.scrollHeight;
    }
};

// รายชื่อไฟล์ HTML ที่ต้องโหลดมาประกอบเป็นหน้าเว็บ
const COMPONENTS = [
    { id: 'part1-mempool', file: 'mempool.html', required: true },
    { id: 'part2-miner', file: 'miner.html', required: true },
    { id: 'part3-validator', file: 'validator.html', required: true }
];

const MODALS = [
    'modal_difficulty.html', 'modal_nonce.html', 'modal_subsidy.html', 
    'modal_fee.html', 'modal_mempool.html', 'modal_miner.html', 
    'modal_validator.html', 'modal_tx_sort.html', 'modal_block_size.html', 
    'modal_p2p_network.html', 'modal_p2p_gossip.html'
];

// ฟังก์ชันสำหรับโหลดไฟล์ HTML
const fetchText = (file) => fetch(file).then(res => {
    if (!res.ok) throw new Error(`ไม่พบไฟล์ ${file}`);
    return res.text();
});

// เริ่มต้นโหลดไฟล์ทั้งหมด
Promise.all([
    ...COMPONENTS.map(c => fetchText(c.file)),
    ...MODALS.map(m => fetchText(m).catch(() => '')) // Modals ไม่ซีเรียสถ้าโหลดไม่เข้า
]).then((results) => {
    // แยกผลลัพธ์ของ Components และ Modals
    const componentHtml = results.slice(0, COMPONENTS.length);
    const modalHtml = results.slice(COMPONENTS.length);

    // แทรกเนื้อหาลงในจุดที่กำหนด
    COMPONENTS.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (el) el.innerHTML = componentHtml[i];
    });
    
    // แทรก Modals ทั้งหมดลงไปใน Body
    document.body.insertAdjacentHTML('beforeend', modalHtml.join(''));

    const loadScript = (src) => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`โหลดไฟล์ ${src} ไม่สำเร็จ`));
        document.body.appendChild(script);
    });

    return loadScript('./asset/js/core.js')
        .then(() => loadScript('./asset/js/ui_tour.js'))
        .then(() => loadScript('./asset/js/ui_core_base.js'))
        .then(() => loadScript('./asset/js/ui_core_blockchain_details.js'))
        .then(() => loadScript('./asset/js/ui_core_blockchain_mempool_logic.js'))
        .then(() => loadScript('./asset/js/ui_core_blockchain_merkle_tree.js'))
        .then(() => loadScript('./asset/js/ui_leaderboard.js'))
        .then(() => loadScript('./asset/js/modal_logic.js'))
        .then(() => loadScript('./asset/js/engine_core_main.js'))
        .then(() => loadScript('./asset/js/engine_core_network.js'))
        .then(() => loadScript('./asset/js/engine_mining_bot_core.js'))
        .then(() => loadScript('./asset/js/engine_mining_bot_broadcast.js'))
        .then(() => loadScript('./asset/js/engine_mining_player_core.js'))
        .then(() => loadScript('./asset/js/engine_mining_player_broadcast.js'))
        .then(() => loadScript('./asset/js/main.js'));

}).then(() => {
    if (typeof App !== 'undefined') {
        const origToggleModal = App.toggleModal;
        App.toggleModal = function(modalId, show) {
            if (modalId === 'log-modal' && show && typeof switchLogTab === 'function') {
                switchLogTab('gossip');
            }
            if (origToggleModal) origToggleModal.apply(this, arguments);
        };

        App.init(); 

        // Script เพื่อรันนาฬิกา Timestamp ที่อยู่ในหน้า miner.html ให้ทำงานตลอดเวลา
        setInterval(() => {
            const tsEl = document.getElementById('ui-header-timestamp');
            if (tsEl) {
                const now = Math.floor(Date.now() / 1000);
                const human = new Date().toLocaleString('th-TH');
                tsEl.innerText = now + ' (' + human + ')';
            }
        }, 1000);
        
        if (sessionStorage.getItem('skipWelcome') !== 'true') { 
            const welcomeModal = document.getElementById('welcome-modal'); 
            if (welcomeModal) { 
                welcomeModal.classList.remove('hidden'); 
                setTimeout(() => { welcomeModal.classList.remove('opacity-0'); }, 50); 
            } 
        } 
    }
}).catch(err => {
    console.error("เกิดข้อผิดพลาด:", err);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:rgba(225,29,72,0.9); color:white; padding:15px 30px; border-radius:10px; z-index:9999; font-weight:bold;";
    errorDiv.innerHTML = `⚠️ <b>Error Loading:</b> ${err.message}<br><span style="font-size:12px; font-weight:normal;">เช็คการตั้งชื่อและ Path ของไฟล์ให้ถูกต้อง</span>`;
    document.body.appendChild(errorDiv);
});