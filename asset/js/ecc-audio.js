// ==========================================
// ECC Sound System (Web Audio API Synthesizer)
// ==========================================

const ECCAudio = {
    audioCtx: null,
    isInitialized: false,

    // ต้องให้ User กดคลิกอะไรสักอย่างก่อน เบราว์เซอร์ถึงจะยอมให้มีเสียง
    init() {
        if (this.isInitialized) return;
        
        // รองรับหลายเบราว์เซอร์
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return; // ถ้าเบราว์เซอร์เก่าจัดๆ ก็ปล่อยผ่านไป
        
        this.audioCtx = new AudioContext();
        this.isInitialized = true;
    },

    // ฟังก์ชันสร้างเสียงพื้นฐาน
    playTone(frequency, type, duration, volumeLevel = 0.1) {
        if (!this.audioCtx) return;
        
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        oscillator.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        
        // ทำ Fade out ให้เสียงไม่ตัดห้วน
        gainNode.gain.setValueAtTime(volumeLevel, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + duration);
    },

    // 1. เสียงตอนกดยิงลูกบอล (Pew!)
    shoot() {
        this.init();
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        // เสียงลากจากสูงลงต่ำอย่างรวดเร็ว
        osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
        
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
        this.vibrate(50);
    },

    // 2. เสียงพิมพ์คอนโซลรัวๆ (Typing)
    type() {
        this.init();
        this.playTone(800 + Math.random() * 200, 'square', 0.05, 0.02);
    },

    // 3. เสียง Verify สำเร็จ (Success Chime)
    success() {
        this.init();
        // เล่นโน้ต 3 ตัวเรียงกันอย่างรวดเร็ว (C Major Arpeggio)
        setTimeout(() => this.playTone(523.25, 'sine', 0.3, 0.2), 0);   // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.3, 0.2), 100); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.5, 0.2), 200); // G5
        this.vibrate([100, 50, 100]); // สั่นสองจังหวะ
    },

    // 4. เสียง Verify ล้มเหลว (Error Buzzer)
    error() {
        this.init();
        // เสียงคอร์ดต่ำๆ แบบสัญญาณเตือน
        this.playTone(150, 'sawtooth', 0.4, 0.3);
        this.playTone(155, 'sawtooth', 0.4, 0.3); // ใส่คลื่นแทรกให้เสียงแตกๆ
        this.vibrate(300); // สั่นยาว
    },

    // 5. เสียงตอนลูกบอลเด้งบนกระดาน (Tick)
    bounce() {
        this.init();
        this.playTone(1200, 'sine', 0.05, 0.05);
    },

    // ฟังก์ชันสั่งให้มือถือสั่น (Haptic Feedback)
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
};

// ดักจับการคลิกครั้งแรกของจอเพื่อปลุก AudioContext (ระบบป้องกันของ Browser)
document.addEventListener('mousedown', () => ECCAudio.init(), { once: true });
document.addEventListener('touchstart', () => ECCAudio.init(), { once: true });