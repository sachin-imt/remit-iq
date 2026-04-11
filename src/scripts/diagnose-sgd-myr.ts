/**
 * Diagnose SGD/MYR SEND_NOW over-firing
 * =======================================
 * For each incorrect SEND_NOW signal (User metric), shows:
 *   - date, confidence, z30, vol30d, percentile30d, rateVsAvg%
 *   - actual 5-day rate change
 * This tells us exactly WHERE the signal generation is going wrong
 * and what threshold would fix it.
 *
 * Usage: npx tsx src/scripts/diagnose-sgd-myr.ts
 */

import { getRecentRates } from "../lib/db";
import { computeIntelligenceFromRates } from "../lib/intelligence";
import type { RateDataPoint } from "../lib/types";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function mean(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stdDev(arr: number[]): number {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}
function zScore(value: number, arr: number[]): number {
    const s = stdDev(arr);
    return s > 0 ? (value - mean(arr)) / s : 0;
}

const CORRIDORS = ["SGD", "MYR", "HKD"];
const LOOK_AHEAD = 5;

async function diagnose(currency: string): Promise<void> {
    const rates = await getRecentRates(600, currency);
    if (rates.length < 35) {
        console.log(`  [${currency}] Insufficient data. Skipping.`);
        return;
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

    type Row = {
        date: string; conf: number; signal: string;
        z30: number; rateVsAvg: number; percentile30d: number;
        vol30d: number; futureChange: number; outcome: string;
    };
    const incorrectSendNow: Row[] = [];
    const correctSendNow: Row[] = [];
    let totalConfident = 0;

    for (let i = 30; i < ratePoints.length - LOOK_AHEAD; i++) {
        const windowData = ratePoints.slice(0, i + 1);
        const intel = computeIntelligenceFromRates(windowData, windowData[i].midMarket!, currency);
        const { signal, confidence } = intel.recommendation;
        if (confidence < 60) continue;

        totalConfident++;
        const currentRate = windowData[i].rate;
        const rates30 = windowData.slice(-30).map((d) => d.rate);
        const z30 = parseFloat(zScore(currentRate, rates30).toFixed(2));
        const avg30 = mean(rates30);
        const rateVsAvg = parseFloat(((currentRate - avg30) / avg30 * 100).toFixed(3));
        const futureRates = ratePoints.slice(i + 1, i + 1 + LOOK_AHEAD).map((d) => d.rate);
        const futureTrough = Math.min(...futureRates);
        const futureChange = parseFloat(((mean(futureRates) - currentRate) / currentRate * 100).toFixed(3));
        const userCorrect = signal === "SEND_NOW" || signal === "URGENT"
            ? currentRate >= futureTrough
            : Math.max(...futureRates) > currentRate;

        const row: Row = {
            date: windowData[i].date,
            conf: confidence,
            signal,
            z30,
            rateVsAvg,
            percentile30d: intel.stats.percentile30d,
            vol30d: intel.stats.volatility30d,
            futureChange,
            outcome: userCorrect ? "correct" : "incorrect",
        };

        if ((signal === "SEND_NOW" || signal === "URGENT") && !userCorrect) {
            incorrectSendNow.push(row);
        } else if (signal === "SEND_NOW" || signal === "URGENT") {
            correctSendNow.push(row);
        }
    }

    const allSendNow = [...incorrectSendNow, ...correctSendNow];
    const sendNowTotal = allSendNow.length;
    const userPct = sendNowTotal > 0
        ? (correctSendNow.length / sendNowTotal * 100).toFixed(1)
        : "N/A";

    console.log(`\n${"═".repeat(80)}`);
    console.log(`  ${currency}/INR — SEND_NOW Diagnostic`);
    console.log(`${"═".repeat(80)}`);
    console.log(`  Total confident signals: ${totalConfident}`);
    console.log(`  SEND_NOW/URGENT total:   ${sendNowTotal} (correct: ${correctSendNow.length} / ${sendNowTotal} = ${userPct}%)`);
    console.log(`  Incorrect SEND_NOW:      ${incorrectSendNow.length}`);

    // Distribution of z30 among incorrect SEND_NOWs
    const incorrectZ = incorrectSendNow.map((r) => r.z30);
    const correctZ = correctSendNow.map((r) => r.z30);
    console.log(`\n  ── z30 distribution (SEND_NOW) ──`);
    console.log(`  Incorrect SEND_NOW: avg z30=${incorrectZ.length > 0 ? (incorrectZ.reduce((a, b) => a + b, 0) / incorrectZ.length).toFixed(2) : "N/A"}, min=${Math.min(...incorrectZ).toFixed(2)}, max=${Math.max(...incorrectZ).toFixed(2)}`);
    console.log(`  Correct SEND_NOW:   avg z30=${correctZ.length > 0 ? (correctZ.reduce((a, b) => a + b, 0) / correctZ.length).toFixed(2) : "N/A"}, min=${Math.min(...correctZ).toFixed(2)}, max=${Math.max(...correctZ).toFixed(2)}`);

    // Confidence distribution among incorrect SEND_NOWs
    const buckets = [
        { label: "60–65", fn: (r: Row) => r.conf >= 60 && r.conf < 65 },
        { label: "65–70", fn: (r: Row) => r.conf >= 65 && r.conf < 70 },
        { label: "70–75", fn: (r: Row) => r.conf >= 70 && r.conf < 75 },
        { label: "75–80", fn: (r: Row) => r.conf >= 75 && r.conf < 80 },
        { label: "80+",   fn: (r: Row) => r.conf >= 80 },
    ];
    console.log(`\n  ── Confidence breakdown — Incorrect SEND_NOW ──`);
    for (const b of buckets) {
        const count = incorrectSendNow.filter(b.fn).length;
        const pct = incorrectSendNow.length > 0 ? (count / incorrectSendNow.length * 100).toFixed(0) : "0";
        console.log(`  Conf ${b.label}: ${count} (${pct}%)`);
    }

    // How many incorrect SEND_NOW could be caught by raising WAIT z-score
    console.log(`\n  ── Incorrect SEND_NOW: z30 bucket breakdown ──`);
    const zBuckets = [
        { label: "z30 > 0.5 (well above avg)", fn: (r: Row) => r.z30 > 0.5 },
        { label: "z30 0.0–0.5",                fn: (r: Row) => r.z30 >= 0 && r.z30 <= 0.5 },
        { label: "z30 -0.4–0.0",               fn: (r: Row) => r.z30 >= -0.4 && r.z30 < 0 },
        { label: "z30 -0.6–-0.4",              fn: (r: Row) => r.z30 >= -0.6 && r.z30 < -0.4 },
        { label: "z30 < -0.6",                 fn: (r: Row) => r.z30 < -0.6 },
    ];
    for (const b of zBuckets) {
        const count = incorrectSendNow.filter(b.fn).length;
        const pct = incorrectSendNow.length > 0 ? (count / incorrectSendNow.length * 100).toFixed(0) : "0";
        console.log(`  ${b.label}: ${count} (${pct}%)`);
    }

    // Rate vs avg among incorrect SEND_NOWs
    const aboveAvgWrong = incorrectSendNow.filter((r) => r.rateVsAvg > 0).length;
    const belowAvgWrong = incorrectSendNow.filter((r) => r.rateVsAvg <= 0).length;
    console.log(`\n  ── Rate position in incorrect SEND_NOWs ──`);
    console.log(`  Above 30d avg: ${aboveAvgWrong} (${(aboveAvgWrong / incorrectSendNow.length * 100).toFixed(0)}%)`);
    console.log(`  Below 30d avg: ${belowAvgWrong} (${(belowAvgWrong / incorrectSendNow.length * 100).toFixed(0)}%)`);

    // Worst 10 incorrect SEND_NOWs
    const worst10 = incorrectSendNow
        .sort((a, b) => a.futureChange - b.futureChange)
        .slice(0, 10);
    console.log(`\n  ── Worst 10 Incorrect SEND_NOWs ──`);
    console.log(`  ${"Date".padEnd(12)} ${"Conf".padEnd(6)} ${"z30".padEnd(7)} ${"vs avg%".padEnd(9)} ${"Pctile".padEnd(8)} ${"5d chg%"}`);
    console.log(`  ${"─".repeat(58)}`);
    for (const r of worst10) {
        console.log(
            `  ${r.date.padEnd(12)} ${String(r.conf).padEnd(6)} ${String(r.z30).padEnd(7)} ${String(r.rateVsAvg).padEnd(9)} ${String(r.percentile30d).padEnd(8)} ${r.futureChange > 0 ? "+" : ""}${r.futureChange}%`
        );
    }
}

async function main() {
    console.log("RemitIQ — SGD/MYR/HKD SEND_NOW Diagnostic");
    console.log("===========================================\n");
    for (const currency of CORRIDORS) {
        try {
            await diagnose(currency);
        } catch (err) {
            console.error(`  [${currency}] Error: ${(err as Error).message}`);
        }
    }
    console.log("\n\nDiagnostic complete.");
}

main();
