/**
 * RemitIQ Model Comparison: v1 vs v2 Backtest
 * =============================================
 * Pulls historical data from Neon DB, runs both signal engines on
 * rolling 30-day windows, and compares prediction accuracy.
 *
 * Usage: npx tsx src/scripts/audit-v1-vs-v2.ts
 */

import { getRecentRates } from "../lib/db";
import { computeIntelligenceFromRates } from "../lib/intelligence";
import { computeIntelligenceFromRatesV2 } from "../lib/intelligence-v2";
import type { RateDataPoint } from "../lib/types";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

interface DayResult {
    date: string;
    rate: number;
    v1Signal: string;
    v1Confidence: number;
    v1Outcome: string;
    v2Signal: string;
    v2Confidence: number;
    v2Outcome: string;
    futureAvg: number | null;
    futurePeak: number | null;
    rateChange5dPct: number | null;
}

interface ModelStats {
    totalSignals: number;
    confidentSignals: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    sendNowTotal: number;
    sendNowCorrect: number;
    sendNowAccuracy: number;
    waitTotal: number;
    waitCorrect: number;
    waitAccuracy: number;
    urgentTotal: number;
    urgentCorrect: number;
    urgentAccuracy: number;
    avgConfidence: number;
    forecastCorrect: number;
    forecastTotal: number;
    forecastAccuracy: number;
}

const CORRIDORS = ["AUD", "USD"];
const LOOK_AHEAD = 5;

function evaluateOutcome(
    signal: string,
    confidence: number,
    currentRate: number,
    futureRates: number[]
): string {
    if (confidence < 60 || futureRates.length === 0) return "low-conf";

    const futureAvg = futureRates.reduce((a, b) => a + b, 0) / futureRates.length;
    const futurePeak = Math.max(...futureRates);
    const futureTrough = Math.min(...futureRates);

    if (signal === "SEND_NOW" || signal === "URGENT") {
        // SEND_NOW is "correct" if rate didn't drop > 0.2% vs 5-day trough
        // (relaxed from v1's 0.15% vs average — using trough is fairer)
        return currentRate >= futureTrough * 0.998 ? "correct" : "incorrect";
    } else if (signal === "WAIT") {
        // WAIT is "correct" if rate improved by at least 0.1% within 5 days
        return futurePeak >= currentRate * 1.001 ? "correct" : "incorrect";
    }
    return "neutral";
}

function calcStats(results: DayResult[], modelKey: "v1" | "v2"): ModelStats {
    const signalKey = modelKey === "v1" ? "v1Signal" : "v2Signal";
    const confKey = modelKey === "v1" ? "v1Confidence" : "v2Confidence";
    const outcomeKey = modelKey === "v1" ? "v1Outcome" : "v2Outcome";

    const confident = results.filter((r) => r[confKey] >= 60);
    const correct = confident.filter((r) => r[outcomeKey] === "correct");
    const incorrect = confident.filter((r) => r[outcomeKey] === "incorrect");

    const sendNow = confident.filter((r) => r[signalKey] === "SEND_NOW" || r[signalKey] === "URGENT");
    const sendNowCorrect = sendNow.filter((r) => r[outcomeKey] === "correct");
    const wait = confident.filter((r) => r[signalKey] === "WAIT");
    const waitCorrect = wait.filter((r) => r[outcomeKey] === "correct");
    const urgent = confident.filter((r) => r[signalKey] === "URGENT");
    const urgentCorrect = urgent.filter((r) => r[outcomeKey] === "correct");

    const avgConf = confident.length > 0
        ? confident.reduce((s, r) => s + r[confKey], 0) / confident.length
        : 0;

    return {
        totalSignals: results.length,
        confidentSignals: confident.length,
        correct: correct.length,
        incorrect: incorrect.length,
        accuracy: confident.length > 0 ? parseFloat((correct.length / confident.length * 100).toFixed(1)) : 0,
        sendNowTotal: sendNow.length,
        sendNowCorrect: sendNowCorrect.length,
        sendNowAccuracy: sendNow.length > 0 ? parseFloat((sendNowCorrect.length / sendNow.length * 100).toFixed(1)) : 0,
        waitTotal: wait.length,
        waitCorrect: waitCorrect.length,
        waitAccuracy: wait.length > 0 ? parseFloat((waitCorrect.length / wait.length * 100).toFixed(1)) : 0,
        urgentTotal: urgent.length,
        urgentCorrect: urgentCorrect.length,
        urgentAccuracy: urgent.length > 0 ? parseFloat((urgentCorrect.length / urgent.length * 100).toFixed(1)) : 0,
        avgConfidence: parseFloat(avgConf.toFixed(1)),
        forecastCorrect: 0, forecastTotal: 0, forecastAccuracy: 0, // filled separately
    };
}

async function runComparison(currency: string): Promise<DayResult[]> {
    const rates = await getRecentRates(600, currency); // Fetch max history
    if (rates.length < 35) {
        console.log(`  [${currency}] Insufficient data (${rates.length} days). Skipping.`);
        return [];
    }

    const ratePoints: RateDataPoint[] = rates.map((r) => {
        const dt = new Date(r.date + "T00:00:00");
        return {
            date: r.date,
            day: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
            rate: r.best_rate,
            midMarket: r.mid_market,
        };
    });

    const results: DayResult[] = [];
    const startIndex = 30;
    const endIndex = ratePoints.length - LOOK_AHEAD;

    for (let i = startIndex; i < endIndex; i++) {
        const windowData = ratePoints.slice(0, i + 1);
        const currentRate = windowData[i].rate;
        const midMarket = windowData[i].midMarket;

        // Run v1
        const v1Intel = computeIntelligenceFromRates(windowData, midMarket, currency);
        // Run v2
        const v2Intel = computeIntelligenceFromRatesV2(windowData, midMarket, currency);

        const futureSlice = ratePoints.slice(i + 1, i + 1 + LOOK_AHEAD);
        const futureRates = futureSlice.map((d) => d.rate);
        const futureAvg = futureRates.length > 0
            ? parseFloat((futureRates.reduce((a, b) => a + b, 0) / futureRates.length).toFixed(4))
            : null;
        const futurePeak = futureRates.length > 0 ? Math.max(...futureRates) : null;

        const rateChange5dPct = futureAvg !== null
            ? parseFloat(((futureAvg - currentRate) / currentRate * 100).toFixed(3))
            : null;

        const v1Outcome = evaluateOutcome(
            v1Intel.recommendation.signal,
            v1Intel.recommendation.confidence,
            currentRate,
            futureRates
        );
        const v2Outcome = evaluateOutcome(
            v2Intel.recommendation.signal,
            v2Intel.recommendation.confidence,
            currentRate,
            futureRates
        );

        results.push({
            date: windowData[i].date,
            rate: parseFloat(currentRate.toFixed(4)),
            v1Signal: v1Intel.recommendation.signal,
            v1Confidence: v1Intel.recommendation.confidence,
            v1Outcome,
            v2Signal: v2Intel.recommendation.signal,
            v2Confidence: v2Intel.recommendation.confidence,
            v2Outcome,
            futureAvg,
            futurePeak,
            rateChange5dPct,
        });
    }

    return results;
}

function printComparison(results: DayResult[], currency: string): void {
    const v1Stats = calcStats(results, "v1");
    const v2Stats = calcStats(results, "v2");

    const delta = (v2: number, v1: number): string => {
        const d = v2 - v1;
        return d > 0 ? `+${d.toFixed(1)}%` : d < 0 ? `${d.toFixed(1)}%` : "=";
    };

    console.log(`\n${"═".repeat(72)}`);
    console.log(`  ${currency}/INR — v1 vs v2 Signal Comparison`);
    console.log(`${"═".repeat(72)}`);
    console.log(`  Data window:  ${results[0]?.date} → ${results[results.length - 1]?.date} (${results.length} days)`);

    console.log(`\n  ${"Metric".padEnd(30)} ${"v1".padEnd(12)} ${"v2".padEnd(12)} ${"Delta"}`);
    console.log(`  ${"─".repeat(66)}`);
    console.log(`  ${"Overall Accuracy".padEnd(30)} ${(v1Stats.accuracy + "%").padEnd(12)} ${(v2Stats.accuracy + "%").padEnd(12)} ${delta(v2Stats.accuracy, v1Stats.accuracy)}`);
    console.log(`  ${"SEND_NOW Accuracy".padEnd(30)} ${(v1Stats.sendNowAccuracy + "%").padEnd(12)} ${(v2Stats.sendNowAccuracy + "%").padEnd(12)} ${delta(v2Stats.sendNowAccuracy, v1Stats.sendNowAccuracy)}`);
    console.log(`  ${"WAIT Accuracy".padEnd(30)} ${(v1Stats.waitAccuracy + "%").padEnd(12)} ${(v2Stats.waitAccuracy + "%").padEnd(12)} ${delta(v2Stats.waitAccuracy, v1Stats.waitAccuracy)}`);
    console.log(`  ${"URGENT Accuracy".padEnd(30)} ${(v1Stats.urgentAccuracy + "%").padEnd(12)} ${(v2Stats.urgentAccuracy + "%").padEnd(12)} ${delta(v2Stats.urgentAccuracy, v1Stats.urgentAccuracy)}`);
    console.log(`  ${"─".repeat(66)}`);
    console.log(`  ${"Confident Signals".padEnd(30)} ${String(v1Stats.confidentSignals).padEnd(12)} ${String(v2Stats.confidentSignals).padEnd(12)}`);
    console.log(`  ${"SEND_NOW Count".padEnd(30)} ${String(v1Stats.sendNowTotal).padEnd(12)} ${String(v2Stats.sendNowTotal).padEnd(12)}`);
    console.log(`  ${"WAIT Count".padEnd(30)} ${String(v1Stats.waitTotal).padEnd(12)} ${String(v2Stats.waitTotal).padEnd(12)}`);
    console.log(`  ${"URGENT Count".padEnd(30)} ${String(v1Stats.urgentTotal).padEnd(12)} ${String(v2Stats.urgentTotal).padEnd(12)}`);
    console.log(`  ${"URGENT % of Signals".padEnd(30)} ${(v1Stats.confidentSignals > 0 ? (v1Stats.urgentTotal / v1Stats.confidentSignals * 100).toFixed(1) + "%" : "N/A").padEnd(12)} ${(v2Stats.confidentSignals > 0 ? (v2Stats.urgentTotal / v2Stats.confidentSignals * 100).toFixed(1) + "%" : "N/A").padEnd(12)}`);
    console.log(`  ${"Avg Confidence".padEnd(30)} ${(v1Stats.avgConfidence + "%").padEnd(12)} ${(v2Stats.avgConfidence + "%").padEnd(12)}`);

    // Print last 30 days comparison
    const recent = results.slice(-30);
    console.log(`\n  ── Last 30 Days ──`);
    console.log(`  ${"Date".padEnd(12)} ${"v1 Signal".padEnd(12)} ${"v1 Conf".padEnd(8)} ${"v1 Out".padEnd(10)} ${"v2 Signal".padEnd(12)} ${"v2 Conf".padEnd(8)} ${"v2 Out".padEnd(10)} ${"5d%"}`);
    console.log(`  ${"─".repeat(82)}`);
    for (const r of recent) {
        const chg = r.rateChange5dPct !== null ? `${r.rateChange5dPct > 0 ? "+" : ""}${r.rateChange5dPct}%` : "N/A";
        console.log(
            `  ${r.date.padEnd(12)} ${r.v1Signal.padEnd(12)} ${String(r.v1Confidence).padEnd(8)} ${r.v1Outcome.padEnd(10)} ${r.v2Signal.padEnd(12)} ${String(r.v2Confidence).padEnd(8)} ${r.v2Outcome.padEnd(10)} ${chg}`
        );
    }

    // Highlight disagreements (v1 wrong, v2 right)
    const v2Wins = results.filter((r) =>
        r.v1Confidence >= 60 && r.v2Confidence >= 60
        && r.v1Outcome === "incorrect" && r.v2Outcome === "correct"
    );
    const v1Wins = results.filter((r) =>
        r.v1Confidence >= 60 && r.v2Confidence >= 60
        && r.v1Outcome === "correct" && r.v2Outcome === "incorrect"
    );

    console.log(`\n  ── Disagreements ──`);
    console.log(`  v2 corrected v1: ${v2Wins.length} days`);
    console.log(`  v1 was right, v2 wrong: ${v1Wins.length} days`);
    console.log(`  Net improvement: ${v2Wins.length - v1Wins.length > 0 ? "+" : ""}${v2Wins.length - v1Wins.length} correct decisions`);
}

async function main() {
    console.log("RemitIQ — v1 vs v2 Model Comparison");
    console.log("=====================================\n");

    const allResults: Record<string, DayResult[]> = {};

    for (const currency of CORRIDORS) {
        console.log(`Processing ${currency}/INR...`);
        try {
            const results = await runComparison(currency);
            if (results.length > 0) {
                allResults[currency] = results;
                printComparison(results, currency);
            }
        } catch (err) {
            console.error(`  [${currency}] Error: ${(err as Error).message}`);
        }
    }

    // Save detailed results to file
    const outDir = path.join(process.cwd(), "training-data");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "v1-vs-v2-results.json");
    fs.writeFileSync(outFile, JSON.stringify(allResults, null, 2));
    console.log(`\nDetailed results saved to: training-data/v1-vs-v2-results.json`);

    console.log("\nComparison complete.");
}

main();
