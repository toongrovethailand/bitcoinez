// ==========================================
// Act 1 Chapter 1: The 6 Traits of Money
// ==========================================

// --- Tab Navigation ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(t => {
        t.classList.remove('active', 'bg-indigo-900/20', 'border-indigo-500', 'text-indigo-300');
        t.classList.add('bg-slate-900', 'border-slate-700', 'text-slate-400');
    });

    document.getElementById(tabId).classList.add('active');
    const activeBtn = document.getElementById('btn-' + tabId.split('-')[1]);
    activeBtn.classList.remove('bg-slate-900', 'border-slate-700', 'text-slate-400');
    activeBtn.classList.add('active', 'bg-indigo-900/20', 'border-indigo-500', 'text-indigo-300');
    
    if (tabId === 'tab-acceptability') {
        const nextBtn = document.getElementById('next-chapter-btn');
        if (nextBtn) nextBtn.style.display = 'block';
    }
}

// --- Logic Tab 1: Scarcity ---
let goldSupply = 200000;
let fiatSupply = 1000000;
let btcSupply = 20999997;

function mineGold() {
    const btn = document.getElementById('btn-gold');
    btn.disabled = true;
    btn.innerText = "⏳ กำลังเจาะภูเขา...";
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    
    setTimeout(() => {
        goldSupply += Math.floor(Math.random() * 50) + 10;
        document.getElementById('gold-supply').innerText = goldSupply.toLocaleString() + " ตัน";
        btn.disabled = false;
        btn.innerText = "⛏️ ขุดเหมืองทอง";
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }, 1000); 
}

function printFiat() {
    fiatSupply += 1500000;
    document.getElementById('fiat-supply').innerText = fiatSupply.toLocaleString();
    
    const box = document.getElementById('fiat-box');
    const brrr = document.createElement('div');
    brrr.innerText = "💵";
    brrr.className = "money-brrr";
    brrr.style.left = Math.random() * 80 + 10 + "%";
    brrr.style.top = "50%";
    box.appendChild(brrr);
    setTimeout(() => brrr.remove(), 1000);

    const valEl = document.getElementById('fiat-value');
    if(fiatSupply > 5000000) valEl.innerText = "มูลค่าเงิน: เริ่มลดลง (ของแพงขึ้น)";
    if(fiatSupply > 15000000) valEl.innerText = "มูลค่าเงิน: ก๋วยเตี๋ยวชามละ 500 บาท!";
    if(fiatSupply > 30000000) valEl.innerText = "มูลค่าเงิน: ขยะ! เงินเฟ้อขั้นรุนแรง (Hyperinflation)";
}

function mineBtc() {
    if (btcSupply >= 21000000) {
        const box = document.getElementById('btc-box');
        box.classList.add('shake-err', 'border-rose-500/80');
        setTimeout(() => box.classList.remove('shake-err', 'border-rose-500/80'), 400);
        
        // แสดง Custom Alert Modal แทน alert()
        showCustomAlert();
        return;
    }

    btcSupply += 1;
    document.getElementById('btc-supply').innerText = btcSupply.toLocaleString();
    
    if (btcSupply >= 21000000) {
        btcSupply = 21000000;
        document.getElementById('btc-supply').innerText = btcSupply.toLocaleString();
        document.getElementById('btc-supply').classList.add('text-rose-400');
        document.getElementById('btc-bar').style.width = "100%";
        document.getElementById('btn-btc').innerText = "🚫 ซัพพลายตัน (21M)";
        document.getElementById('btn-btc').classList.replace('bg-emerald-600', 'bg-slate-700');
    }
}

// --- Logic Tab 4: Divisibility (Network Toggle) ---
function toggleBtcNetwork(layer) {
    const btnOnchain = document.getElementById('btn-onchain');
    const btnLightning = document.getElementById('btn-lightning');
    const descOnchain = document.getElementById('desc-onchain');
    const descLightning = document.getElementById('desc-lightning');

    if (layer === 'onchain') {
        btnOnchain.className = "w-1/2 text-xs py-1.5 rounded bg-emerald-900/40 text-emerald-400 font-bold transition-all border border-emerald-500/50";
        btnLightning.className = "w-1/2 text-xs py-1.5 rounded text-slate-500 hover:text-slate-300 transition-all border border-transparent";
        descOnchain.classList.remove('hidden');
        descLightning.classList.add('hidden');
    } else {
        btnLightning.className = "w-1/2 text-xs py-1.5 rounded bg-emerald-900/40 text-emerald-400 font-bold transition-all border border-emerald-500/50";
        btnOnchain.className = "w-1/2 text-xs py-1.5 rounded text-slate-500 hover:text-slate-300 transition-all border border-transparent";
        descLightning.classList.remove('hidden');
        descOnchain.classList.add('hidden');
    }
}

// --- Shared Result Logic for Tab 2, 3, 5, 6 ---
function checkResult(tabName, type, btnElement) {
    document.querySelectorAll(`#tab-${tabName} .bg-slate-900\\/60`).forEach(el => {
        el.classList.remove('border-amber-500/50', 'border-rose-500/50', 'border-emerald-500/50');
        el.classList.add('border-slate-700');
    });
    
    const parentBox = btnElement.parentElement;
    if(type === 'gold') parentBox.classList.replace('border-slate-700', 'border-amber-500/50');
    if(type === 'fiat') parentBox.classList.replace('border-slate-700', 'border-rose-500/50');
    if(type === 'btc') parentBox.classList.replace('border-slate-700', 'border-emerald-500/50');

    const resBox = document.getElementById(`${tabName}-result`);
    const icon = document.getElementById(`${tabName}-icon`);
    const title = document.getElementById(`${tabName}-title`);
    const desc = document.getElementById(`${tabName}-desc`);

    resBox.classList.remove('hidden');
    resBox.className = `mt-6 bg-[#050A14] border p-6 rounded-lg text-center pop-in shadow-inner`;

    if (tabName === 'portability') {
        if (type === 'gold') {
            resBox.classList.add('border-amber-500/50');
            icon.innerText = "🚫👮‍♂️";
            title.innerText = "ไม่ผ่านตม.! น้ำหนักเกินและน่าสงสัย";
            title.className = "text-lg font-bold text-amber-500 mb-2";
            desc.innerHTML = "การพยายามขนทองคำแท่งหนัก 40 กิโลกรัมข้ามประเทศ เป็นเรื่องที่เป็นไปไม่ได้ในทางปฏิบัติ คุณถูกกักตัวและถูกตรวจสอบยึดทรัพย์สิน";
        } 
        else if (type === 'fiat') {
            resBox.classList.add('border-rose-500/50');
            icon.innerText = "🚨💸";
            title.innerText = "ถูกยึดทรัพย์! (Civil Asset Forfeiture)";
            title.className = "text-lg font-bold text-rose-500 mb-2";
            desc.innerHTML = "คุณไม่สามารถถือเงินสด 100 ล้านบาทขึ้นเครื่องบินได้ กฎหมายป้องกันการฟอกเงินจะทำการอายัดกระเป๋าเงินของคุณทันทีที่จุดตรวจ!";
        } 
        else if (type === 'btc') {
            resBox.classList.add('border-emerald-500/50');
            icon.innerText = "✈️🌍";
            title.innerText = "ผ่านฉลุย! เดินตัวเปล่าข้ามพรมแดน";
            title.className = "text-lg font-bold text-emerald-500 mb-2";
            desc.innerHTML = "ไม่มีใครรู้ว่าคุณมีความมั่งคั่ง 100 ล้านบาทติดตัวมาด้วย! เพราะความมั่งคั่งทั้งหมดถูกเก็บรักษาไว้ใน <b class='text-white'>รหัส 12 คำในหัวของคุณ (Brain Wallet)</b> คุณเดินทางถึงที่หมายอย่างปลอดภัย!";
        }
    } 
    else if (tabName === 'durability') {
        if (type === 'gold') {
            resBox.classList.add('border-amber-500/50');
            icon.innerText = "✨🧱";
            title.innerText = "หลอมละลาย แต่ยังเป็นทองคำ";
            title.className = "text-lg font-bold text-amber-500 mb-2";
            desc.innerHTML = "ทองคำมีจุดหลอมเหลวสูงและไม่ทำปฏิกิริยากับออกซิเจน ต่อให้บ้านไฟไหม้หรือจมอยู่ใต้ทะเลพันปี ทองคำก็ยังคงเป็นทองคำ (ความทนทานสูงมาก)";
        } 
        else if (type === 'fiat') {
            resBox.classList.add('border-rose-500/50');
            icon.innerText = "🔥💨";
            title.innerText = "กลายเป็นเถ้าถ่าน!";
            title.className = "text-lg font-bold text-rose-500 mb-2";
            desc.innerHTML = "เงินกระดาษเปื่อยยุ่ยเมื่อโดนน้ำ และไหม้ไฟจนหมดสิ้น มูลค่า 100 ล้านบาทของคุณหายไปในกองเพลิงและไม่สามารถกู้คืนได้!";
        } 
        else if (type === 'btc') {
            resBox.classList.add('border-emerald-500/50');
            icon.innerText = "🌐💾";
            title.innerText = "ฮาร์ดแวร์พัง แต่เงินยังอยู่!";
            title.className = "text-lg font-bold text-emerald-500 mb-2";
            desc.innerHTML = "บิตคอยน์ไม่ได้อยู่ในอุปกรณ์! มันถูกบันทึกไว้ในสมุดบัญชี (Blockchain) ที่กระจายอยู่บนคอมพิวเตอร์นับหมื่นเครื่องทั่วโลก คุณแค่ไปซื้ออุปกรณ์ใหม่ แล้วกรอกรหัส <b class='text-white'>Seed Phrase 12 คำ</b> เงินทั้งหมดก็จะกลับมาครบทุก Satoshis!";
        }
    }
    else if (tabName === 'fungibility') {
        if (type === 'gold') {
            resBox.classList.add('border-amber-500/50');
            icon.innerText = "🔍⚖️";
            title.innerText = "เสียเวลาพิสูจน์ (ตรวจสอบยาก)";
            title.className = "text-lg font-bold text-amber-500 mb-2";
            desc.innerHTML = "ทองคำ 1 บาทเหมือนกัน แต่ร้านต้องใช้ไฟรน ใช้น้ำกรดพิสูจน์ (Assay) ว่าทองแท้ 96.5% หรือถูกยัดไส้ตะกั่วมาหลอกขาย เสียเวลาและมีค่าใช้จ่าย";
        } 
        else if (type === 'fiat') {
            resBox.classList.add('border-emerald-500/50');
            icon.innerText = "♻️✅";
            title.innerText = "ใช้แทนกันได้ 100% (แต่ติดตามได้)";
            title.className = "text-lg font-bold text-emerald-500 mb-2";
            desc.innerHTML = "แบงก์ร้อยขาดๆ ยับๆ ก็มีมูลค่า 100 บาทเท่ากับแบงก์ใหม่กริบ ถือว่ามีความสม่ำเสมอสูง <span class='text-slate-500'>(แต่อาจถูกรัฐบาลแบน Serial Number ได้ถ้าเป็นเงินโจรกรรม)</span>";
        } 
        else if (type === 'btc') {
            resBox.classList.add('border-emerald-500/50');
            icon.innerText = "💻✨";
            title.innerText = "สมบูรณ์แบบระดับโค้ดคอมพิวเตอร์!";
            title.className = "text-lg font-bold text-emerald-500 mb-2";
            desc.innerHTML = "1 ซาโตชิ มีค่าเท่ากับ 1 ซาโตชิเสมอ เครือข่ายใช้คณิตศาสตร์ระดับการเข้ารหัสตรวจสอบความถูกต้องแบบ <b class='text-white'>100% ในพริบตา</b> ไม่ต้องจ้างคนมาพิสูจน์ความแท้ปลอม!";
        }
    }
    else if (tabName === 'acceptability') {
        if (type === 'gold') {
            resBox.classList.add('border-amber-500/50');
            icon.innerText = "🤷‍♂️🔎";
            title.innerText = "ร้านค้าปฏิเสธ! ตรวจสอบไม่ได้";
            title.className = "text-lg font-bold text-amber-500 mb-2";
            desc.innerHTML = "บาริสต้าไม่รู้ว่าเศษทองนี้มีมูลค่าเท่าไหร่ และไม่รู้ด้วยซ้ำว่าข้างในยัดไส้ตะกั่วมาหรือไม่ (ตรวจสอบความแท้จริงยากมาก ต้องใช้ผู้เชี่ยวชาญ)";
        } 
        else if (type === 'fiat') {
            resBox.classList.add('border-rose-500/50');
            icon.innerText = "💱📉";
            title.innerText = "ร้านค้าปฏิเสธ! รับแต่เงินเยน";
            title.className = "text-lg font-bold text-rose-500 mb-2";
            desc.innerHTML = "เงินเฟียตมีอำนาจแค่ในอาณาเขตประเทศของตัวเอง คุณต้องเสียเวลาและเสียค่าธรรมเนียมแพงๆ เพื่อไปหาร้านแลกเปลี่ยนเงินตรา (Money Changer) ก่อนถึงจะซื้อกาแฟได้";
        } 
        else if (type === 'btc') {
            resBox.classList.add('border-emerald-500/50');
            icon.innerText = "📱✅";
            title.innerText = "รับชำระสำเร็จ! ข้ามพรมแดนทันที";
            title.className = "text-lg font-bold text-emerald-500 mb-2";
            desc.innerHTML = "บิตคอยน์เป็นเงินตราของอินเทอร์เน็ต ร้านค้าสามารถสร้าง QR Code และรับเงินจากคุณได้โดยตรง เครือข่ายใช้คณิตศาสตร์ <b class='text-white'>ตรวจสอบความถูกต้องให้แบบ 100% ทันที</b> โดยไม่ต้องมีธนาคารตัวกลางคอยอนุมัติข้ามประเทศ!";
        }
    }
}

// --- Custom Alert Logic ---
function showCustomAlert() {
    const modal = document.getElementById('custom-alert');
    const box = document.getElementById('custom-alert-box');
    
    modal.classList.remove('hidden');
    
    // บังคับให้เบราว์เซอร์วาด UI ก่อนทำแอนิเมชัน
    void modal.offsetWidth; 
    
    modal.classList.replace('opacity-0', 'opacity-100');
    box.classList.replace('scale-95', 'scale-100');
}

function closeCustomAlert() {
    const modal = document.getElementById('custom-alert');
    const box = document.getElementById('custom-alert-box');
    
    modal.classList.replace('opacity-100', 'opacity-0');
    box.classList.replace('scale-100', 'scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}