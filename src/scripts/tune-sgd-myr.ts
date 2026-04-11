import { getRecentRates } from "../lib/db";
import { computeIntelligenceFromRates } from "../lib/intelligence";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function tune(currency: string) {
    const rates = await getRecentRates(600, currency);
    const ratePoints = rates.map((r) => {
        const dt = new Date(r.date + "T00:00:00");
        return {
            date: r.date,
            day: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
            rate: r.best_rate,
            midMarket: r.mid_market,
            rsi: 0,
        };
    });

    let correctSendNow = 0;
    let incorrectSendNow = 0;
    
    // Test parameters
    let filteredCorrect = 0;
    let filteredIncorrect = 0;

    const accCorrect = { rsi: 0, smaDiff: 0, percentile: 0, momentum: 0, z30: 0, macd: 0 };
    const accIncorrect = { rsi: 0, smaDiff: 0, percentile: 0, momentum: 0, z30: 0, macd: 0 };

    for (let i = 30; i < ratePoints.length - 5; i++) {
        const windowData = ratePoints.slice(0, i + 1);
        const intel = computeIntelligenceFromRates(windowData, windowData[i].midMarket!, currency);
        const { signal, confidence } = intel.recommendation;
        const currentRate = windowData[i].rate;
        const futureRates = ratePoints.slice(i + 1, i + 1 + 5).map((d) => d.rate);
        const futureTrough = Math.min(...futureRates);

        if ((signal === "SEND_NOW" || signal === "URGENT") && confidence >= 60) {
            const userCorrect = currentRate >= futureTrough;
            const { rsi14, sma7, sma20, percentile30d, momentum, macdLine } = intel.stats;
            const smaDiff = ((sma7 - sma20) / sma20) * 100;
            const rates30 = windowData.slice(-30).map((d) => d.rate);
            const m = rates30.reduce((a,b)=>a+b,0)/rates30.length;
            const s = Math.sqrt(rates30.reduce((sum, v) => sum + (v - m) ** 2, 0) / rates30.length);
            const z30 = s > 0 ? (currentRate - m) / s : 0;
            
            if (userCorrect) {
                correctSendNow++;
                accCorrect.rsi += rsi14;
                accCorrect.smaDiff += smaDiff;
                accCorrect.percentile += percentile30d;
                accCorrect.momentum += momentum;
                accCorrect.z30 += z30;
                accCorrect.macd += macdLine;
            } else {
                incorrectSendNow++;
                accIncorrect.rsi += rsi14;
                accIncorrect.smaDiff += smaDiff;
                accIncorrect.percentile += percentile30d;
                accIncorrect.momentum += momentum;
                accIncorrect.z30 += z30;
                accIncorrect.macd += macdLine;
            }
        }
    }
    
    console.log(`\n${currency} SEND_NOW Baseline: ${correctSendNow} correct / ${incorrectSendNow} incorrect (${(correctSendNow / (correctSendNow + incorrectSendNow) * 100).toFixed(1)}%)`);
    if (correctSendNow > 0 && incorrectSendNow > 0) {
        console.log(`  Incorrect Avg: RSI=${(accIncorrect.rsi/incorrectSendNow).toFixed(1)}, Z30=${(accIncorrect.z30/incorrectSendNow).toFixed(2)}, Pctile=${(accIncorrect.percentile/incorrectSendNow).toFixed(0)}, SMA_Diff=${(accIncorrect.smaDiff/incorrectSendNow).toFixed(3)}, Momentum=${(accIncorrect.momentum/incorrectSendNow).toFixed(3)}, MACD=${(accIncorrect.macd/incorrectSendNow).toFixed(4)}`);
        console.log(`  Correct   Avg: RSI=${(accCorrect.rsi/correctSendNow).toFixed(1)}, Z30=${(accCorrect.z30/correctSendNow).toFixed(2)}, Pctile=${(accCorrect.percentile/correctSendNow).toFixed(0)}, SMA_Diff=${(accCorrect.smaDiff/correctSendNow).toFixed(3)}, Momentum=${(accCorrect.momentum/correctSendNow).toFixed(3)}, MACD=${(accCorrect.macd/correctSendNow).toFixed(4)}`);
    }
}

async function main() {
    await tune("SGD");
    await tune("MYR");
}
main();
