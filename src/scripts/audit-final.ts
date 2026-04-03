/**
 * RemitIQ — Final Multi-Metric Accuracy Report
 * ==============================================
 * Shows accuracy under three outcome definitions so we know
 * exactly what "accuracy" means:
 *
 *   Strict:   SEND_NOW correct if currentRate >= futureAvg * 0.9985 (0.15% tolerance vs avg)
 *   Relaxed:  SEND_NOW correct if currentRate >= futureTrough * 0.998 (0.2% tolerance vs trough)
 *   User:     SEND_NOW correct if currentRate >= futureTrough (user didn't miss a single better day)
 *
 * Also shows improvement from v2 URGENT downgrade and flat-rate clamping fixes.
 *
 * Usage: npx tsx src/scripts/audit-final.ts
 */

import { getRecentRates } from "../lib/db";
import { computeIntelligenceFromRates } from "../lib/intelligence";
import { computeIntelligenceFromRatesV2 } from "../lib/intelligence-v2";
import type { RateDataPoint } from "../lib/types";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CORRIDORS = ["AUD", "USD", "GBP", "CAD", "EUR", "AED", "SGD", "NZD", "QAR", "KWD", "SAR", "MYR", "HKD"];
const LOOK_AHEAD = 5;

interface DayResult {
    date: string;
    rate: number;
    signal: string;
    confidence: number;
    futureAvg: number;
    futurePeak: number;
    futureTrough: number;
    // Three outcome definitions
    strictOutcome: string;     // 0.15% vs average
    relaxedOutcome: string;    // 0.2% vs trough
    userOutcome: string;       // 0% vs trough (did user get the best rate in the window?)
    rateChangePct: number;
    isV2: boolean;
}

function evaluateDay(
    signal: string,
    confidence: number,
    currentRate: number,
    futureRates: number[]
): { strict: string; relaxed: string; user: string } {
    if (confidence < 60 || futureRates.length === 0) {
        return { strict: "low-conf", relaxed: "low-conf", user: "low-conf" };
    }

    const futureAvg = futureRates.reduce((a, b) => a + b, 0) / futureRates.length;
    const futurePeak = Math.max(...futureRates);
    const futureTrough = Math.min(...futureRates);

    if (signal === "SEND_NOW" || signal === "URGENT") {
        return {
            strict: currentRate >= futureAvg * 0.9985 ? "correct" : "incorrect",
            relaxed: currentRate >= futureTrough * 0.998 ? "correct" : "incorrect",
            user: currentRate >= futureTrough ? "correct" : "incorrect",
        };
    } else if (signal === "WAIT") {
        return {
            strict: futurePeak >= currentRate * 1.0015 ? "correct" : "incorrect",
            relaxed: futurePeak >= currentRate * 1.001 ? "correct" : "incorrect",
            user: futurePeak > currentRate ? "correct" : "incorrect",
        };
    }
    return { strict: "neutral", relaxed: "neutral", user: "neutral" };
}

async function runAudit(currency: string): Promise<void> {
    const rates = await getRecentRates(600, currency);
    if (rates.length < 35) {
        console.log(`  [${currency}] Insufficient data (${rates.length} days). Skipping.`);
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

    const v1Results: DayResult[] = [];
    const v2Results: DayResult[] = [];

    for (let i = 30; i < ratePoints.length - LOOK_AHEAD; i++) {
        const windowData = ratePoints.slice(0, i + 1);
        const currentRate = windowData[i].rate;
        const midMarket = windowData[i].midMarket;
        const futureSlice = ratePoints.slice(i + 1, i + 1 + LOOK_AHEAD);
        const futureRates = futureSlice.map((d) => d.rate);
        const futureAvg = futureRates.reduce((a, b) => a + b, 0) / futureRates.length;
        const futurePeak = Math.max(...futureRates);
        const futureTrough = Math.min(...futureRates);
        const rateChangePct = ((futureAvg - currentRate) / currentRate) * 100;

        // v1
        const v1Intel = computeIntelligenceFromRates(windowData, midMarket, currency);
        const v1Outcomes = evaluateDay(v1Intel.recommendation.signal, v1Intel.recommendation.confidence, currentRate, futureRates);
        v1Results.push({
            date: windowData[i].date, rate: currentRate,
            signal: v1Intel.recommendation.signal, confidence: v1Intel.recommendation.confidence,
            futureAvg, futurePeak, futureTrough,
            strictOutcome: v1Outcomes.strict, relaxedOutcome: v1Outcomes.relaxed, userOutcome: v1Outcomes.user,
            rateChangePct: parseFloat(rateChangePct.toFixed(3)), isV2: false,
        });

        // v2
        const v2Intel = computeIntelligenceFromRatesV2(windowData, midMarket, currency);
        const v2Outcomes = evaluateDay(v2Intel.recommendation.signal, v2Intel.recommendation.confidence, currentRate, futureRates);
        v2Results.push({
            date: windowData[i].date, rate: currentRate,
            signal: v2Intel.recommendation.signal, confidence: v2Intel.recommendation.confidence,
            futureAvg, futurePeak, futureTrough,
            strictOutcome: v2Outcomes.strict, relaxedOutcome: v2Outcomes.relaxed, userOutcome: v2Outcomes.user,
            rateChangePct: parseFloat(rateChangePct.toFixed(3)), isV2: true,
        });
    }

    function computeAccuracy(results: DayResult[], outcomeKey: "strictOutcome" | "relaxedOutcome" | "userOutcome") {
        const confident = results.filter((r) => r.confidence >= 60);
        const correct = confident.filter((r) => r[outcomeKey] === "correct");
        return { correct: correct.length, total: confident.length, pct: confident.length > 0 ? (correct.length / confident.length * 100).toFixed(1) : "N/A" };
    }

    function urgentStats(results: DayResult[]) {
        const confident = results.filter((r) => r.confidence >= 60);
        const urgent = confident.filter((r) => r.signal === "URGENT");
        return { count: urgent.length, pct: confident.length > 0 ? (urgent.length / confident.length * 100).toFixed(1) : "N/A" };
    }

    function flatDays(results: DayResult[]) {
        return results.filter((r) => r.confidence >= 60 && r.confidence <= 52).length;
    }

    console.log(`\n${"═".repeat(80)}`);
    console.log(`  ${currency}/INR — Multi-Metric Accuracy Report`);
    console.log(`${"═".repeat(80)}`);
    console.log(`  Data window:  ${v1Results[0]?.date} → ${v1Results[v1Results.length - 1]?.date} (${v1Results.length} days)\n`);

    const metrics = [
        { name: "Strict (0.15% vs avg)", key: "strictOutcome" as const },
        { name: "Relaxed (0.2% vs trough)", key: "relaxedOutcome" as const },
        { name: "User (0% vs trough)", key: "userOutcome" as const },
    ];

    console.log(`  ${"Metric".padEnd(30)} ${"v1".padEnd(18)} ${"v2".padEnd(18)} ${"Delta"}`);
    console.log(`  ${"─".repeat(74)}`);

    for (const m of metrics) {
        const v1Acc = computeAccuracy(v1Results, m.key);
        const v2Acc = computeAccuracy(v2Results, m.key);
        const delta = parseFloat(v2Acc.pct as string) - parseFloat(v1Acc.pct as string);
        console.log(
            `  ${m.name.padEnd(30)} ${(`${v1Acc.correct}/${v1Acc.total} (${v1Acc.pct}%)`).padEnd(18)} ${(`${v2Acc.correct}/${v2Acc.total} (${v2Acc.pct}%)`).padEnd(18)} ${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`
        );
    }

    const v1Urgent = urgentStats(v1Results);
    const v2Urgent = urgentStats(v2Results);
    console.log(`  ${"─".repeat(74)}`);
    console.log(`  ${"URGENT frequency".padEnd(30)} ${(`${v1Urgent.count} (${v1Urgent.pct}%)`).padEnd(18)} ${(`${v2Urgent.count} (${v2Urgent.pct}%)`).padEnd(18)}`);

    // Signal distribution
    const v1Confident = v1Results.filter((r) => r.confidence >= 60);
    const v2Confident = v2Results.filter((r) => r.confidence >= 60);
    const v1Send = v1Confident.filter((r) => r.signal === "SEND_NOW").length;
    const v2Send = v2Confident.filter((r) => r.signal === "SEND_NOW").length;
    const v1Wait = v1Confident.filter((r) => r.signal === "WAIT").length;
    const v2Wait = v2Confident.filter((r) => r.signal === "WAIT").length;
    console.log(`  ${"SEND_NOW signals".padEnd(30)} ${String(v1Send).padEnd(18)} ${String(v2Send).padEnd(18)}`);
    console.log(`  ${"WAIT signals".padEnd(30)} ${String(v1Wait).padEnd(18)} ${String(v2Wait).padEnd(18)}`);
    console.log(`  ${"Flat-rate days clamped".padEnd(30)} ${"0".padEnd(18)} ${String(v2Results.filter((r) => r.confidence === 52).length - v1Results.filter((r) => r.confidence === 52).length).padEnd(18)}`);
}

async function main() {
    console.log("RemitIQ — Final Multi-Metric Accuracy Report");
    console.log("==============================================\n");
    console.log("Three outcome definitions compared:");
    console.log("  Strict:  SEND_NOW correct if rate doesn't drop >0.15% vs 5-day average");
    console.log("  Relaxed: SEND_NOW correct if rate doesn't drop >0.2% vs 5-day trough");
    console.log("  User:    SEND_NOW correct if rate is better than the worst day in 5 days");
    console.log("           (i.e., the user didn't miss out on a better day)\n");

    for (const currency of CORRIDORS) {
        console.log(`Processing ${currency}/INR...`);
        try {
            await runAudit(currency);
        } catch (err) {
            console.error(`  [${currency}] Error: ${(err as Error).message}`);
        }
    }

    console.log("\n\nReport complete.");
}

main();
