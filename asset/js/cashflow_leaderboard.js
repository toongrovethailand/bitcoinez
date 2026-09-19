// ./asset/js/cashflow_leaderboard.js

// 🌟 URL ของ Google Apps Script ที่เชื่อมต่อกับ Google Sheet
const LEADERBOARD_API_URL = "https://script.google.com/macros/s/AKfycbzlVX_dfTcnY7m7EJTRkRmxoNMCGNlctRWOfpnnFM0E7vDVLkZgfhv0sJ5Fpjo0-ugE6Q/exec"; 

class LeaderboardManager {
    static async submitScore(name, profession, months, netWorth) {
        if (!LEADERBOARD_API_URL || LEADERBOARD_API_URL === "YOUR_WEB_APP_URL_HERE") {
            console.error("ยังไม่ได้ตั้งค่า LEADERBOARD_API_URL");
            return false;
        }
        try {
            const response = await fetch(LEADERBOARD_API_URL, {
                method: 'POST',
                mode: 'no-cors', // ใช้ no-cors เพื่อป้องกันปัญหา Cross-Origin จากฝั่งเบราว์เซอร์
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ name, profession, months, netWorth })
            });
            // เมื่อใช้ no-cors เราจะไม่สามารถอ่าน response status แบบปกติได้ จึง assume ว่าสำเร็จไว้ก่อนหากไม่เกิด Error ใน catch
            return true; 
        } catch (error) {
            console.error("Submit Error:", error);
            return false;
        }
    }

    static async fetchScores() {
        if (!LEADERBOARD_API_URL || LEADERBOARD_API_URL === "YOUR_WEB_APP_URL_HERE") return [];
        try {
            const response = await fetch(LEADERBOARD_API_URL);
            return await response.json();
        } catch (error) {
            console.error("Fetch Error:", error);
            return [];
        }
    }
}