// ./asset/js/cashflow_utils.js

class GameUtils {
    static fmt(num) {
        if (num < 0) return '-฿' + Math.abs(num).toLocaleString('th-TH');
        return '฿' + num.toLocaleString('th-TH');
    }

    static calculateThaiTax(incomeYearly) {
        let tax = 0; let inc = incomeYearly;
        if (inc > 5000000) { tax += (inc - 5000000) * 0.35; inc = 5000000; }
        if (inc > 2000000) { tax += (inc - 2000000) * 0.30; inc = 2000000; }
        if (inc > 1000000) { tax += (inc - 1000000) * 0.25; inc = 1000000; }
        if (inc > 750000) { tax += (inc - 750000) * 0.20; inc = 750000; }
        if (inc > 500000) { tax += (inc - 500000) * 0.15; inc = 500000; }
        if (inc > 300000) { tax += (inc - 300000) * 0.10; inc = 300000; }
        if (inc > 150000) { tax += (inc - 150000) * 0.05; inc = 150000; }
        return tax;
    }
}