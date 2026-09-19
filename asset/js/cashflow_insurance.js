// ./asset/js/cashflow_insurance.js

const INSURANCE_CONTENT = [
    { 
        id: "ins_health", 
        name: "🏥 ประกันสุขภาพและอุบัติเหตุ", 
        premium: 500, 
        covers: ["hospital"], 
        desc: "คุ้มครองค่ารักษาพยาบาลฉุกเฉินส่วนเกินสิทธิทั้งหมด" 
    },
    { 
        id: "ins_home", 
        name: "🏠 ประกันอัคคีภัยและซ่อมแซม", 
        premium: 800, 
        covers: ["roof", "ac"], 
        desc: "คุ้มครองค่าซ่อมแซมบ้าน ซ่อมหลังคารั่ว และเครื่องปรับอากาศ" 
    },
    { 
        id: "ins_car", 
        name: "🚗 ประกันภัยรถยนต์ชั้น 1", 
        premium: 1000, 
        covers: ["gear", "inst_car", "inst_bike"], 
        desc: "คุ้มครองค่าซ่อมแซมยานพาหนะ ยกเครื่องยนต์ และอุบัติเหตุบนท้องถนน" 
    }
];