/**
 * RemitIQ Model Audit: Predictions vs Actuals
 * ============================================
 * Queries the Neon Postgres DB for historical rate data,
 * re-runs the intelligence engine on past windows to simulate
 * what signal was generated each day, then compares against
 * actual future rates to measure prediction accuracy.
 *
 * Usage: npx tsx src/scripts/audit-predictions.ts
 */

import { getRecentRates } from "../lib/db";
import { computeIntelligenceFromRates } from "../lib/intelligence";
import type { RateDataPoint } from "../lib/types";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

interface DayAudit {
  date: string;
  signal: string;
  confidence: number;
  rate: number;
  avg30d: number;
  percentile30d: number;
  forecast: string;
  forecastConfidence: number;
  // Outcome: what actually happened over the next 5 days
  futureAvg: number | null;
  futurePeak: number | null;
  futureTrough: number | null;
  outcome: "correct" | "incorrect" | "neutral" | "pending";
  rateChange5d: number | null;
  rateChangePct5d: number | null;
}

const CORRIDORS = ["AUD", "GBP", "USD", "CAD"];
const LOOK_AHEAD = 5; // days to check actual outcome

async function runAudit(currency: string): Promise<DayAudit[]> {
  const rates = await getRecentRates(180, currency);

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

  const audits: DayAudit[] = [];

  // Simulate signals for days 30 → (end - LOOK_AHEAD)
  // We need at least 30 days of history to generate a signal
  const startIndex = 30;
  const endIndex = ratePoints.length - LOOK_AHEAD;

  for (let i = startIndex; i < endIndex; i++) {
    const windowData = ratePoints.slice(0, i + 1);
    const intel = computeIntelligenceFromRates(windowData, windowData[i].midMarket!, currency);

    const signal = intel.recommendation.signal;
    const confidence = intel.recommendation.confidence;
    const currentRate = windowData[i].rate;
    const stats = intel.stats;
    const forecast = intel.forecast;

    // Look ahead: what actually happened?
    const futureSlice = ratePoints.slice(i + 1, i + 1 + LOOK_AHEAD);
    const futureRates = futureSlice.map((d) => d.rate);
    const futureAvg = futureRates.length > 0 ? futureRates.reduce((a, b) => a + b, 0) / futureRates.length : null;
    const futurePeak = futureRates.length > 0 ? Math.max(...futureRates) : null;
    const futureTrough = futureRates.length > 0 ? Math.min(...futureRates) : null;
    const rateChange5d = futureAvg !== null ? parseFloat((futureAvg - currentRate).toFixed(4)) : null;
    const rateChangePct5d = futureAvg !== null ? parseFloat(((futureAvg - currentRate) / currentRate * 100).toFixed(3)) : null;

    // Determine if the signal was correct
    let outcome: DayAudit["outcome"] = "neutral";
    if (futureRates.length > 0 && confidence >= 60) {
      if (signal === "SEND_NOW" || signal === "URGENT") {
        // Correct if the rate didn't drop more than 0.15% on average
        outcome = (futureAvg !== null && currentRate >= futureAvg * 0.9985) ? "correct" : "incorrect";
      } else if (signal === "WAIT") {
        // Correct if the rate improved by at least 0.15% within 5 days
        outcome = (futurePeak !== null && futurePeak >= currentRate * 1.0015) ? "correct" : "incorrect";
      }
    }

    audits.push({
      date: windowData[i].date,
      signal,
      confidence,
      rate: parseFloat(currentRate.toFixed(4)),
      avg30d: parseFloat(stats.avg30d.toFixed(4)),
      percentile30d: stats.percentile30d,
      forecast: forecast.direction,
      forecastConfidence: forecast.confidence,
      futureAvg: futureAvg !== null ? parseFloat(futureAvg.toFixed(4)) : null,
      futurePeak: futurePeak !== null ? parseFloat(futurePeak.toFixed(4)) : null,
      futureTrough: futureTrough !== null ? parseFloat(futureTrough.toFixed(4)) : null,
      outcome,
      rateChange5d,
      rateChangePct5d,
    });
  }

  return audits;
}

function summarise(audits: DayAudit[], currency: string): void {
  const confident = audits.filter((a) => a.confidence >= 60);
  const correct = confident.filter((a) => a.outcome === "correct");
  const incorrect = confident.filter((a) => a.outcome === "incorrect");
  const sendNowAudits = confident.filter((a) => a.signal === "SEND_NOW" || a.signal === "URGENT");
  const waitAudits = confident.filter((a) => a.signal === "WAIT");
  const urgentAudits = confident.filter((a) => a.signal === "URGENT");

  const accuracy = confident.length > 0 ? (correct.length / confident.length * 100).toFixed(1) : "N/A";
  const sendNowAcc = sendNowAudits.length > 0
    ? (sendNowAudits.filter((a) => a.outcome === "correct").length / sendNowAudits.length * 100).toFixed(1)
    : "N/A";
  const waitAcc = waitAudits.length > 0
    ? (waitAudits.filter((a) => a.outcome === "correct").length / waitAudits.length * 100).toFixed(1)
    : "N/A";

  // Rate change distribution when SEND_NOW was issued
  const sendNowChanges = sendNowAudits
    .filter((a) => a.rateChangePct5d !== null)
    .map((a) => a.rateChangePct5d as number);
  const avgSendNowChange = sendNowChanges.length > 0
    ? (sendNowChanges.reduce((a, b) => a + b, 0) / sendNowChanges.length).toFixed(3)
    : "N/A";

  const waitChanges = waitAudits
    .filter((a) => a.rateChangePct5d !== null)
    .map((a) => a.rateChangePct5d as number);
  const avgWaitChange = waitChanges.length > 0
    ? (waitChanges.reduce((a, b) => a + b, 0) / waitChanges.length).toFixed(3)
    : "N/A";

  // Forecast accuracy
  const forecastAudits = audits.filter((a) => a.rateChange5d !== null && a.forecast !== "steady");
  const forecastCorrect = forecastAudits.filter((a) => {
    if (a.forecast === "rising") return (a.rateChange5d as number) > 0;
    if (a.forecast === "falling") return (a.rateChange5d as number) < 0;
    return false;
  });
  const forecastAcc = forecastAudits.length > 0
    ? (forecastCorrect.length / forecastAudits.length * 100).toFixed(1)
    : "N/A";

  // Recent 30 days
  const recent30 = audits.slice(-30);
  const recent30Confident = recent30.filter((a) => a.confidence >= 60);
  const recent30Correct = recent30Confident.filter((a) => a.outcome === "correct");
  const recentAcc = recent30Confident.length > 0
    ? (recent30Correct.length / recent30Confident.length * 100).toFixed(1)
    : "N/A";

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${currency}/INR — Signal Accuracy Audit`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Data window:           ${audits[0]?.date} → ${audits[audits.length - 1]?.date}`);
  console.log(`  Total signal days:     ${audits.length}`);
  console.log(`  Confident signals:     ${confident.length} (confidence ≥ 60%)`);
  console.log(`  URGENT signals:        ${urgentAudits.length}`);
  console.log(`\n  ── Overall Accuracy ──`);
  console.log(`  Correct:               ${correct.length}/${confident.length} (${accuracy}%)`);
  console.log(`  Incorrect:             ${incorrect.length}/${confident.length}`);
  console.log(`\n  ── By Signal Type ──`);
  console.log(`  SEND_NOW/URGENT:       ${sendNowAudits.filter((a) => a.outcome === "correct").length}/${sendNowAudits.length} correct (${sendNowAcc}%)`);
  console.log(`  WAIT:                  ${waitAudits.filter((a) => a.outcome === "correct").length}/${waitAudits.length} correct (${waitAcc}%)`);
  console.log(`\n  ── Rate Movement After Signal ──`);
  console.log(`  Avg 5d change after SEND_NOW: ${avgSendNowChange}%`);
  console.log(`  Avg 5d change after WAIT:     ${avgWaitChange}%`);
  console.log(`\n  ── Directional Forecast Accuracy ──`);
  console.log(`  Rising/Falling forecast: ${forecastCorrect.length}/${forecastAudits.length} correct (${forecastAcc}%)`);
  console.log(`\n  ── Last 30 Days ──`);
  console.log(`  Recent accuracy:       ${recent30Correct.length}/${recent30Confident.length} (${recentAcc}%)`);

  // Print last 30 days signal log
  console.log(`\n  ── Signal History (last 30 days) ──`);
  console.log(`  ${"Date".padEnd(12)} ${"Signal".padEnd(10)} ${"Conf".padEnd(6)} ${"Rate".padEnd(8)} ${"Forecast".padEnd(10)} ${"5d Chg%".padEnd(9)} ${"Outcome"}`);
  console.log(`  ${"─".repeat(72)}`);
  for (const a of recent30) {
    const outcomeStr = a.confidence < 60 ? "low-conf" : a.outcome;
    const change = a.rateChangePct5d !== null ? `${a.rateChangePct5d > 0 ? "+" : ""}${a.rateChangePct5d}%` : "N/A";
    const signalPad = a.signal.padEnd(10);
    console.log(
      `  ${a.date.padEnd(12)} ${signalPad} ${String(a.confidence).padEnd(6)} ${String(a.rate).padEnd(8)} ${a.forecast.padEnd(10)} ${change.padEnd(9)} ${outcomeStr}`
    );
  }
}

async function main() {
  console.log("RemitIQ — Prediction Model Audit");
  console.log("==================================");
  console.log("Querying Neon DB for historical rate data...\n");

  for (const currency of CORRIDORS) {
    console.log(`Fetching ${currency}/INR data...`);
    try {
      const audits = await runAudit(currency);
      if (audits.length > 0) {
        summarise(audits, currency);
      }
    } catch (err) {
      console.error(`  [${currency}] Error: ${(err as Error).message}`);
    }
  }

  console.log("\n\nAudit complete.");
}

main();
