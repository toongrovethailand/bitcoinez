// ./asset/js/cashflow_content.js

const CONTENT = {
    professions: [
        { name: "ภารโรง", salary: 16000, expenses: 10000, savings: 5000, profDebt: 100000, expenseBreakdown: { food: 4500, housing: 3000, transport: 1500, personal: 1000 } },
        { name: "พนักงานออฟฟิศ", salary: 25000, expenses: 17000, savings: 8000, profDebt: 250000, expenseBreakdown: { food: 6000, housing: 6500, transport: 2500, personal: 2000 } },
        { name: "ครู", salary: 33000, expenses: 22000, savings: 10000, profDebt: 350000, expenseBreakdown: { food: 7000, housing: 8500, transport: 3500, personal: 3000 } },
        { name: "วิศวกร", salary: 50000, expenses: 35000, savings: 20000, profDebt: 800000, expenseBreakdown: { food: 10000, housing: 14000, transport: 6000, personal: 5000 } },
        { name: "ทนายความ", salary: 75000, expenses: 54000, savings: 25000, profDebt: 1200000, expenseBreakdown: { food: 14000, housing: 22000, transport: 9000, personal: 9000 } },
        { name: "แพทย์", salary: 132000, expenses: 96000, savings: 40000, profDebt: 2500000, expenseBreakdown: { food: 20000, housing: 40000, transport: 16000, personal: 20000 } }
    ],
    quotes: [
        "คนรวยไม่ได้ทำงานเพื่อเงิน แต่ทำงานเพื่อสร้างสินทรัพย์",
        "หนี้ที่ดีทำให้คุณรวย หนี้ที่เลวทำให้คุณจนลง",
        "วิกฤตเศรษฐกิจเป็นเครื่องมือคัดกรองระหว่างคนมีวินัยและคนประมาท",
        "การเล่นการพนันคือภาษีคนโง่ แต่การลงทุนในความรู้คือทางสู่ความรวย"
    ],
    deals: {
        land: [{id:"land_1", name:"ที่ดินชานเมือง", limit:3}, {id:"land_2", name:"ที่ดินรอตัดถนน", limit:2}, {id:"land_3", name:"ที่ดินทำเลทอง", limit:2}, {id:"land_4", name:"ที่ดินใกล้แนวรถไฟฟ้าใหม่", limit:2}, {id:"land_5", name:"ที่ดินหลุดจำนองกรมบังคับคดี", limit:1}],
        business: [{id:"biz_1", name:"ตู้หยอดเหรียญอัตโนมัติ", limit:3}, {id:"biz_2", name:"ร้านสะดวกซัก 24 ชม.", limit:2}, {id:"biz_3", name:"แฟรนไชส์ชานมไข่มุก", limit:1}, {id:"biz_4", name:"ร่วมหุ้นสตาร์ทอัพ (Angel Investor)", limit:1}, {id:"biz_5", name:"เปิดร้านอาหารกับเพื่อน", limit:1}, {id:"biz_6", name:"โกดังสินค้า E-commerce", limit:1}, {id:"biz_7", name:"สถานีชาร์จรถไฟฟ้า (EV Charger)", limit:1}],
        smallRE: [{id:"sre_1", name:"คอนโดปล่อยเช่าย่านออฟฟิศ", limit:null}, {id:"sre_2", name:"ทาวน์โฮมชานเมือง", limit:null}, {id:"sre_3", name:"บ้านเดี่ยวหลังเล็ก", limit:null}, {id:"sre_4", name:"คอนโดมือสองใกล้มหาวิทยาลัย", limit:3}, {id:"sre_5", name:"บ้านพักตากอากาศปล่อยเช่ารายวัน", limit:2}],
        largeRE: [{id:"lre_1", name:"อพาร์ตเมนต์ 8 ยูนิต", limit:null}, {id:"lre_2", name:"อาคารพาณิชย์ทำเลทอง", limit:2}, {id:"lre_3", name:"ลานจอดรถให้เช่ารายเดือน", limit:2}, {id:"lre_4", name:"อพาร์ตเมนต์ 20 ยูนิต", limit:2}, {id:"lre_5", name:"โฮสเทลขนาดเล็ก (Boutique)", limit:1}, {id:"lre_6", name:"มินิมอลล์ (Community Mall)", limit:1}]
    },
    crisis: [
        { id: "cr_pandemic", name: "🦠 วิกฤตโรคระบาดระดับโลก!", desc: "เศรษฐกิจหยุดชะงัก มูลค่าสินทรัพย์ทุกอย่างดิ่งเหว!\n\nหากไม่มีเงินสำรอง (6 เท่าของรายจ่าย) คุณจะล้มละลายและแพ้เกมทันที!", limit: null },
        { id: "cr_war", name: "⚔️ วิกฤตสงครามและซัพพลายเชน!", desc: "เกิดความตื่นตระหนกทั่วโลก ตลาดทุนพังทลาย!\n\nหากไม่มีเงินสำรอง (6 เท่าของรายจ่าย) คุณจะล้มละลายและแพ้เกมทันที!", limit: null },
        { id: "cr_blackswan", name: "🦢 Black Swan (ฟองสบู่แตก)!", desc: "เหตุการณ์ช็อกโลกที่ไม่มีใครคาดคิด ฟองสบู่สินทรัพย์แตกกระจาย!\n\nหากไม่มีเงินสำรอง (6 เท่าของรายจ่าย) คุณจะล้มละลายและแพ้เกมทันที!", limit: null },
        { id: "cr_crypto_crash", name: "🚨 กระดานเทรดคริปโตล้มละลาย!", desc: "เกิดการทุจริตครั้งใหญ่ในกระดานเทรด!\n\nนักลงทุนที่เก็บเหรียญไว้ในเว็บเทรดจะสูญเสียบิตคอยน์ทั้งหมด (เว้นแต่จะมีทักษะ Self Custody)", limit: null }
    ],
    badEvents: {
        life: [
            { id: "layoff", name: "💼 บริษัทเลิกจ้าง (Layoff)!", baseExp: 0, salaryMult: 0, limit: null }, // 🌟 การ์ดตกงาน 🌟
            { id: "baby", name: "👶 ยินดีด้วย! คุณมีลูกเพิ่ม", baseExp: 2000, salaryMult: 0.08, limit: 2 },
            { id: "insurance", name: "🏥 ประกันสุขภาพปรับเบี้ยขึ้น", baseExp: 1000, salaryMult: 0.02, limit: 3 },
            { id: "family", name: "👴👵 ต้องส่งเสียดูแลญาติผู้ใหญ่", baseExp: 2500, salaryMult: 0.05, limit: 1 }, 
            { id: "rent", name: "🏠 ค่าเช่าบ้าน/ค่าครองชีพ ปรับตัวสูงขึ้น", baseExp: 1500, salaryMult: 0.03, limit: 2 }
        ],
        doodad: [
            { id: "ac", name: "❄️ แอร์พัง! ต้องเปลี่ยนแอร์ใหม่", baseCost: 10000, salaryMult: 0.2, limit: 2 }, 
            { id: "roof", name: "🛠️ บ้านพัง/หลังคารั่ว ต้องซ่อมใหญ่", baseCost: 15000, salaryMult: 0.4, limit: 2 }, 
            { id: "hospital", name: "🚑 เจ็บป่วยฉุกเฉิน (ส่วนเกินสิทธิ)", baseCost: 5000, salaryMult: 0.3, limit: null },
            { id: "tv", name: "📺 กิเลสครอบงำ! ซื้อสมาร์ททีวีรุ่นใหม่", baseCost: 10000, salaryMult: 0.15, limit: 2 },
            { id: "travel", name: "✈️ ทริปเที่ยวต่างประเทศพักผ่อน", baseCost: 15000, salaryMult: 0.6, limit: null }, 
            { id: "gear", name: "⚙️ รถเสียหนัก ต้องยกเครื่องใหม่", baseCost: 10000, salaryMult: 0.3, limit: 2 },
            { id: "social", name: "💌 จ่ายภาษีสังคม (ซองกฐิน, งานแต่ง)", baseCost: 2000, salaryMult: 0.1, limit: null },
            { id: "phone", name: "📱 สมาร์ทโฟนพัง ซื้อเครื่องใหม่", baseCost: 10000, salaryMult: 0.25, limit: 3 },
            { id: "brandname", name: "👜 ช้อปปิ้งของแบรนด์เนม", baseCost: 5000, salaryMult: 0.5, limit: null },
            { id: "wedding", name: "💍 จัดงานแต่งงาน!", baseCost: 50000, salaryMult: 1.5, limit: 1 }, 
            { id: "lawsuit", name: "⚖️ โดนฟ้องร้อง/จ่ายค่าทนายความ", baseCost: 30000, salaryMult: 1.0, limit: 1 } 
        ],
        installment: [
            { id: "inst_car", name: "🚗 ซื้อรถยนต์คันใหม่", baseCost: 500000, salaryMult: 10.0, months: 48, limit: 1 },
            { id: "inst_bike", name: "🏍️ ซื้อบิ๊กไบค์", baseCost: 150000, salaryMult: 3.0, months: 36, limit: 1 },
            { id: "inst_tv", name: "📺 ซื้อชุดโฮมเธียเตอร์", baseCost: 30000, salaryMult: 1.5, months: 10, limit: 1 }
        ]
    },
    gambles: [
        { id: "gb_ball", name: "⚽ แทงบอลคู่เด็ด (สายต่อ)", baseCost: 2000, salaryMult: 0.2, winMult: 4.0, prob: 0.25, limit: null },
        { id: "gb_stock", name: "📈 ซื้อหุ้นปั่นกระแส (เก็งกำไร)", baseCost: 5000, salaryMult: 0.5, winMult: 5.0, prob: 0.20, limit: null },
        { id: "gb_slot", name: "🎰 คาสิโนสล็อตแมชชีน", baseCost: 1000, salaryMult: 0.1, winMult: 10.0, prob: 0.10, limit: null },
        { id: "gb_ponzi", name: "🔮 แชร์ลูกโซ่เพื่อนแนะนำ", baseCost: 10000, salaryMult: 0.8, winMult: 3.0, prob: 0.30, limit: null }
    ]
};