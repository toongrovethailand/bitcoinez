// ==========================================
// Act 1 Chapter 2: The Exchange & IOU
// ==========================================

let isBought = false;
let realTimeBtcPrice = 0;

// ฟังก์ชันดึงราคา BTC/THB ปัจจุบันจาก CoinGecko API (แม่นยำและเสถียรสำหรับเงินบาท)
async function initRealtimePrice() {
    const btnBuy = document.getElementById('btn-buy');
    btnBuy.disabled = true; // ปิดปุ่มไว้ก่อนจนกว่าจะโหลดราคาเสร็จ

    try {
        // ดึงข้อมูลราคาล่าสุดจาก CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=thb');
        const data = await response.json();
        
        // ดึงค่าเงินบาทออกมาจาก Object
        realTimeBtcPrice = parseFloat(data.bitcoin.thb);

        // จัด Format ตัวเลขให้มีลูกน้ำและทศนิยม 2 ตำแหน่ง
        const formattedPrice = realTimeBtcPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedPriceNoDec = realTimeBtcPrice.toLocaleString('th-TH');

        // อัปเดต UI หน้ากระดานเทรด
        document.getElementById('current-btc-price-display').innerText = `ราคา: ${formattedPriceNoDec} THB/BTC`;
        document.getElementById('portfolio-value').innerText = `฿ ${formattedPrice}`;
        document.getElementById('thb-balance').innerText = formattedPriceNoDec;
        
        // อัปเดต UI หน้า Database
        document.getElementById('db-thb').innerText = formattedPriceNoDec;

        // อัปเดตปุ่มซื้อ
        document.getElementById('btn-buy-text').innerHTML = `🛒 ซื้อ 1.00 BTC ด้วยเงินสดทั้งหมด`;
        btnBuy.disabled = false;

    } catch (error) {
        console.error("Failed to fetch BTC price:", error);
        
        // กรณีดึงไม่สำเร็จ (เช่น อินเทอร์เน็ตมีปัญหา หรือ API ล่ม) ให้ใช้ราคาสำรอง
        realTimeBtcPrice = 2500000;
        const fallbackPrice = realTimeBtcPrice.toLocaleString('th-TH');
        const fallbackPriceFull = realTimeBtcPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        document.getElementById('current-btc-price-display').innerText = `ราคา: ${fallbackPrice} THB/BTC (ออฟไลน์)`;
        document.getElementById('portfolio-value').innerText = `฿ ${fallbackPriceFull}`;
        document.getElementById('thb-balance').innerText = fallbackPrice;
        document.getElementById('db-thb').innerText = fallbackPrice;
        
        document.getElementById('btn-buy-text').innerHTML = `🛒 ซื้อ 1.00 BTC ด้วยเงินสดทั้งหมด`;
        btnBuy.disabled = false;
    }
}

// โหลดราคาอัตโนมัติเมื่อเปิดหน้าต่างขึ้นมา
document.addEventListener('DOMContentLoaded', initRealtimePrice);

function buyBitcoin() {
    if (isBought) return;
    isBought = true;

    const btn = document.getElementById('btn-buy');
    document.getElementById('btn-buy-text').innerHTML = `<span class="animate-spin text-xl">⏳</span> กำลังจับคู่คำสั่งซื้อ...`;
    btn.classList.add('opacity-80', 'cursor-not-allowed');

    // Simulate Processing Time
    setTimeout(() => {
        // Update Exchange UI
        document.getElementById('thb-balance').innerText = "0.00";
        document.getElementById('btc-balance').innerText = "1.00000000";
        
        document.getElementById('btn-buy-text').innerHTML = `✅ ซื้อสำเร็จ! คุณมี 1 BTC`;
        
        // เปลี่ยนคลาสปุ่มจากสีทองเป็นสีเขียวเมื่อซื้อสำเร็จ
        btn.classList.replace('btn-gold-solid', 'bg-emerald-600');
        btn.classList.replace('text-navy', 'text-white');
        btn.classList.remove('hover:bg-[#f5d693]', 'shadow-[0_0_15px_rgba(230,194,122,0.3)]');
        btn.classList.add('shadow-[0_0_15px_rgba(16,185,129,0.4)]');

        // Update Truth Panel (Internal DB)
        const dbBox = document.getElementById('db-box');
        
        dbBox.classList.replace('border-slate-700', 'border-emerald-500/50');
        dbBox.classList.add('shadow-[0_0_20px_rgba(16,185,129,0.15)]');
        
        document.getElementById('db-thb').innerText = "0.00";
        document.getElementById('db-btc').innerText = "1.00000000";

        // Emphasize that Blockchain DID NOT change
        const bcStatus = document.getElementById('blockchain-status');
        bcStatus.innerHTML = `
            <div class="text-[10px] text-slate-400 mb-1.5">สถานะธุรกรรมของคุณบนเชน:</div>
            <div class="text-xs font-bold text-amber-400 bg-amber-950/30 py-1 rounded">⚠️ ไม่มีธุรกรรม (เงินอยู่ในกระเป๋าบริษัท)</div>
        `;

        // Reveal the truth
        setTimeout(() => {
            document.getElementById('truth-reveal').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('crisis-action').classList.remove('hidden');
            }, 2500);
        }, 1000);

    }, 1500);
}

function triggerCrisis() {
    // 1. Shake the screen and change background
    const body = document.getElementById('main-body');
    const container = document.getElementById('app-container');
    
    body.classList.add('hacked-overlay');
    container.classList.add('screen-shake');

    // 2. Break the Exchange UI
    const exPanel = document.getElementById('exchange-panel');
    exPanel.classList.replace('border-t-gold', 'border-t-rose-600');
    exPanel.classList.add('border-2', 'border-rose-600');
    
    document.getElementById('exchange-header').innerHTML = `
        <div class="font-bold text-lg text-rose-500 flex items-center gap-2 glitch">
            🚨 503 SERVICE UNAVAILABLE
        </div>
        <div class="text-xs font-bold text-rose-500 animate-pulse bg-rose-950/50 px-2 py-0.5 rounded">OFFLINE</div>
    `;

    // 3. Zero out balances (The Rug Pull)
    document.getElementById('portfolio-value').innerText = "฿ 0.00";
    document.getElementById('portfolio-value').classList.replace('text-white', 'text-rose-500');
    document.getElementById('portfolio-value').classList.add('glitch');
    
    document.getElementById('btc-balance').innerText = "ERROR";
    document.getElementById('btc-balance').classList.replace('text-gold', 'text-rose-500');

    document.getElementById('trading-box').classList.replace('border-gold/30', 'border-rose-600/50');
    document.getElementById('trading-box').classList.replace('shadow-[inset_0_0_20px_rgba(230,194,122,0.05)]', 'shadow-[inset_0_0_20px_rgba(225,29,72,0.1)]');
    document.getElementById('trading-box').innerHTML = `
        <div class="text-center text-rose-500 font-bold py-3 text-lg glitch">
            ❌ ระงับการถอนเงินทุกกรณี
        </div>
    `;

    // 4. Show the Modal after dramatic effect
    setTimeout(() => {
        container.classList.remove('screen-shake');
        
        const modal = document.getElementById('crisis-modal');
        const box = document.getElementById('crisis-box');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Trigger animation
        setTimeout(() => {
            box.classList.remove('scale-95', 'opacity-0');
            box.classList.add('scale-100', 'opacity-100');
        }, 50);
        
    }, 1500);
}

// --- Custom Alert Logic ---
function showNextChapterAlert() {
    const modal = document.getElementById('custom-alert');
    const box = document.getElementById('custom-alert-box');
    
    modal.classList.remove('hidden');
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