// script.js

// --------------------------------------------------------
// 1. ระบบ 3D Tilt (เอียงการ์ดตามเมาส์)
// --------------------------------------------------------
if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll(".card"), {
        max: 5,
        speed: 400,
        glare: true,
        "max-glare": 0.1
    });
}

// --------------------------------------------------------
// 2. ระบบ Reveal on Scroll (เลื่อนลงมาแล้วค่อยๆ โผล่)
// --------------------------------------------------------
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

reveals.forEach(reveal => revealObserver.observe(reveal));

// --------------------------------------------------------
// 3. ระบบ Modal และ Loading Animation (Iframe)
// --------------------------------------------------------
const modal = document.getElementById("mainModal");
const modalBody = document.getElementById("modal-body");

function openModal(url) {
    modal.style.display = "block";
    
    // ปรับ Padding แต่เว้นระยะด้านบนไว้ให้ปุ่มปิด
    const modalContent = document.querySelector('.modal-content');
    modalContent.style.padding = '35px 20px 20px 20px'; 
    modalContent.style.overflow = 'hidden'; 

    // ดันปุ่มกากบาท (Close) ให้อยู่เลเยอร์บนสุดเสมอ ป้องกัน iframe บัง
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.style.zIndex = "9999";
        closeBtn.style.top = "15px";
        closeBtn.style.right = "25px";
    }

    // สร้างกล่อง (Wrapper) ครอบ iframe กับ Loading ให้อยู่ในกรอบเดียวกัน
    modalBody.innerHTML = `
        <div style="position: relative; width: 100%; height: 80vh; margin-top: 15px;">
            <div id="modal-loader" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.3s ease; pointer-events: none; z-index: 2;">
                <div style="width: 50px; height: 50px; border: 3px solid rgba(230, 194, 122, 0.2); border-top: 3px solid #E6C27A; border-radius: 50%; animation: spin 1s linear infinite; box-shadow: 0 0 15px rgba(230, 194, 122, 0.4);"></div>
                <p style="color: #E6C27A; margin-top: 20px; font-weight: 500; font-size: 0.9rem; letter-spacing: 2px; animation: pulse 1.5s infinite;">INITIALIZING...</p>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            </style>
            
            <iframe 
                id="modal-iframe"
                src="${url}" 
                style="width: 100%; height: 100%; border: none; border-radius: 8px; background: transparent; opacity: 0; transition: opacity 0.6s ease; position: relative; z-index: 1;"
            ></iframe>
        </div>
    `;

    const iframe = document.getElementById('modal-iframe');
    const loader = document.getElementById('modal-loader');

    // เมื่อ iframe โหลดข้อมูลหน้าเว็บเสร็จ ค่อยซ่อน Loader และโชว์ iframe
    iframe.onload = function() {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            iframe.style.opacity = '1';
        }, 300);
    };
}

function closeModal() {
    modal.style.display = "none";
    modalBody.innerHTML = ""; // ล้างเนื้อหาออกเพื่อประหยัดหน่วยความจำ
    
    // คืนค่า padding กลับเป็น 50px เพื่อไม่ให้กระทบดีไซน์กล่องอื่นๆ ในอนาคต
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) modalContent.style.padding = '50px';
}