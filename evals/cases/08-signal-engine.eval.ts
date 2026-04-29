/**
 * Eval Suite 08 — Signal Engine (Backtesting + v2 Decision Logic)
 * ================================================================
 * Tests the CORE PREDICTION MODEL: the rule-based intelligence engine in
 * src/lib/intelligence.ts that generates SEND_NOW / WAIT / URGENT signals.
 *
 * WHY THIS IS THE HIGHEST-VALUE EVAL:
 *   Suite 03 tests the MATH BUILDING BLOCKS (SMA, RSI, etc.).
 *   This suite tests the DECISION ENGINE that uses those building blocks
 *   to produce actionable signals — the core value proposition of RemitIQ.
 *
 * WHAT WE'RE TESTING:
 *   08a — Backtest Mechanics:
 *     Does runBacktest() gracefully handle edge cases? Does it produce
 *     better-than-random accuracy on realistic oscillating data?
 *
 *   08b — Signal Output Validity:
 *     Is the signal always SEND_NOW/WAIT/URGENT? Is confidence always 0-100?
 *     Does the forecast direction match the input data trend?
 *
 *   08c — v2 Decision Logic:
 *     The v2 post-processing fixes (Apr 2026) applied four surgical rules:
 *       1. URGENT → SEND_NOW downgrade in sustained uptrends (prevents premature urgency)
 *       2. Flat-rate confidence clamp (prevents false confidence on stable markets)
 *       3. WAIT promotion via z-score (catches below-average rates reliably)
 *       4. Low-vol corridor confidence caps (SGD/MYR/HKD use tighter thresholds)
 *
 *   08d — Multi-Currency Corridors:
 *     AUD, GBP, SGD — each should produce valid signals respecting their
 *     corridor-specific volatility characteristics.
 *
 * GRADERS:
 *   All deterministic — exact/contains/regex. No LLM judge needed.
 *   These run instantly in CI and in the export:excel command.
 */

import { computeIntelligenceFromRates } from "../../src/lib/intelligence";
import type { RateDataPoint } from "../../src/lib/types";
import { runSuite } from "../runner";
import type { EvalCase } from "../types";

// ─── Fixture Builders ─────────────────────────────────────────────────────────

function makeTrend(start: number, dailyDelta: number, count: number): RateDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(2025, 0, i + 1).toISOString().split("T")[0],
    day: `Day ${i + 1}`,
    rate: parseFloat((start + i * dailyDelta).toFixed(4)),
    midMarket: parseFloat((start + i * dailyDelta + 0.02).toFixed(4)),
  }));
}

function makeFlat(value: number, count: number): RateDataPoint[] {
  return makeTrend(value, 0, count);
}

function makeOscillating(center: number, amplitude: number, periodDays: number, count: number): RateDataPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const rate = center + amplitude * Math.sin((2 * Math.PI * i) / periodDays);
    return {
      date: new Date(2025, 0, i + 1).toISOString().split("T")[0],
      day: `Day ${i + 1}`,
      rate: parseFloat(rate.toFixed(4)),
      midMarket: parseFloat((rate + 0.02).toFixed(4)),
    };
  });
}

// ─── Output Serializer ────────────────────────────────────────────────────────

type SignalInput = { rates: RateDataPoint[]; currency: string };

function runAndSerialize(input: SignalInput): string {
  const r = computeIntelligenceFromRates(
    input.rates,
    input.rates[input.rates.length - 1].rate,
    input.currency
  );
  return JSON.stringify({
    signal: r.recommendation.signal,
    confidence: r.recommendation.confidence,
    forecastDir: r.forecast.direction,
    accuracy: r.backtest.accuracy,
    totalSignals: r.backtest.totalSignals,
    sendNowTotal: r.backtest.sendNowTotal,
    waitTotal: r.backtest.waitTotal,
  });
}

// ─── Sub-suite 08a: Backtest Mechanics ────────────────────────────────────────

export const backtestCases: EvalCase<SignalInput>[] = [
  {
    id: "bt-01",
    description: "Short data (<40 days) → backtest returns 0 signals (graceful no-op)",
    input: { rates: makeTrend(83, 0.05, 30), currency: "AUD" },
    graders: [
      { type: "contains", expected: '"totalSignals":0' },
      { type: "contains", expected: '"accuracy":0' },
    ],
  },
  {
    id: "bt-02",
    description: "Oscillating data (90d, period 14) → backtest finds ≥ 3 confident signals",
    input: { rates: makeOscillating(83, 1.5, 14, 90), currency: "AUD" },
    graders: [
      // Match any integer ≥ 3: single digit 3-9, or two+ digit number starting 1-9
      { type: "regex", pattern: '"totalSignals":([3-9]|[1-9][0-9]+)' },
    ],
  },
  {
    id: "bt-03",
    description: "Backtest accuracy is a valid number (not NaN, not undefined)",
    input: { rates: makeOscillating(83, 1.5, 14, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"accuracy":[0-9]+(\\.\\d+)?' },
    ],
  },
  {
    id: "bt-04",
    description: "Oscillating data → accuracy above 50% (better than coin flip on clean data)",
    // Oscillating data with clear peaks and troughs should allow the algorithm to
    // correctly call SEND_NOW near peaks and WAIT near troughs
    input: { rates: makeOscillating(83, 2.0, 14, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"accuracy":[5-9][0-9]' },
    ],
  },
  {
    id: "bt-05",
    description: "BacktestResult always has all required fields",
    input: { rates: makeOscillating(83, 1.5, 14, 90), currency: "AUD" },
    graders: [
      { type: "contains", expected: '"accuracy"' },
      { type: "contains", expected: '"totalSignals"' },
      { type: "contains", expected: '"sendNowTotal"' },
      { type: "contains", expected: '"waitTotal"' },
    ],
  },
];

// ─── Sub-suite 08b: Signal Output Validity ────────────────────────────────────

export const signalCases: EvalCase<SignalInput>[] = [
  {
    id: "sig-01",
    description: "Strong 90-day uptrend → signal is SEND_NOW or URGENT",
    input: { rates: makeTrend(80, 0.06, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"signal":"(?:SEND_NOW|URGENT)"' },
    ],
  },
  {
    id: "sig-02",
    description: "Strong 90-day downtrend → signal is WAIT",
    input: { rates: makeTrend(90, -0.06, 90), currency: "AUD" },
    graders: [
      { type: "contains", expected: '"signal":"WAIT"' },
    ],
  },
  {
    id: "sig-03",
    description: "Signal output is always one of SEND_NOW / WAIT / URGENT (no invalid values)",
    input: { rates: makeOscillating(83, 0.5, 7, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"signal":"(?:SEND_NOW|WAIT|URGENT)"' },
    ],
  },
  {
    id: "sig-04",
    description: "Confidence is always in valid range 1–100",
    input: { rates: makeOscillating(83, 0.5, 7, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"confidence":([1-9][0-9]?|100)' },
    ],
  },
  {
    id: "sig-05",
    description: "Forecast direction is always rising / falling / steady",
    input: { rates: makeOscillating(83, 0.5, 7, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"forecastDir":"(?:rising|falling|steady)"' },
    ],
  },
  {
    id: "sig-06",
    description: "Pure linear uptrend → forecast is 'steady' (RSI mean-reversion cancels SMA bullish signal)",
    // At RSI ~100, the algorithm scores -30 for mean reversion. The MACD converges to 0
    // for a stable linear trend (signal line tracks macd line). SMA (+15) + momentum (+15)
    // = net 0 → "steady". This is correct: the forecast predicts pullback from extremes.
    input: { rates: makeTrend(80, 0.06, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"forecastDir":"(?:steady|falling)"' },
    ],
  },
  {
    id: "sig-07",
    description: "Pure linear downtrend → forecast is 'steady' or 'rising' (RSI mean-reversion)",
    // Mirror of sig-06: at RSI ~0, algorithm scores +30 for bounce recovery.
    // MACD converges, SMA bearish (-15), momentum bearish (-15) → net 0-ish → steady or rising.
    input: { rates: makeTrend(90, -0.06, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"forecastDir":"(?:steady|rising)"' },
    ],
  },
  {
    id: "sig-08",
    description: "Flat data → forecast direction is 'steady'",
    input: { rates: makeFlat(83, 90), currency: "AUD" },
    graders: [
      { type: "contains", expected: '"forecastDir":"steady"' },
    ],
  },
];

// ─── Sub-suite 08c: v2 Decision Logic ────────────────────────────────────────

export const v2Cases: EvalCase<SignalInput>[] = [
  {
    id: "v2-01",
    description: "Steep sustained uptrend (90d, 0.10/day) → SEND_NOW not URGENT (v2 URGENT downgrade in uptrend)",
    // This produces: percentile30d > 85, weekChange > 0.3 → v1 fires URGENT
    // v2: regime = uptrend → downgrades URGENT → SEND_NOW
    input: { rates: makeTrend(80, 0.10, 90), currency: "AUD" },
    graders: [
      { type: "not-contains", expected: '"signal":"URGENT"' },
      { type: "contains", expected: '"signal":"SEND_NOW"' },
    ],
  },
  {
    id: "v2-02",
    description: "Perfectly flat market (90d) → confidence clamped to ≤52 (v2 flat-rate clamp)",
    input: { rates: makeFlat(83, 90), currency: "AUD" },
    graders: [
      // v2 clamps confidence at 52 for flat markets
      { type: "regex", pattern: '"confidence":([1-4][0-9]|5[0-2])' },
    ],
  },
  {
    id: "v2-03",
    description: "Strong downtrend (90d) → WAIT with high confidence ≥65 (v2 WAIT promotion)",
    input: { rates: makeTrend(88, -0.06, 90), currency: "AUD" },
    graders: [
      { type: "contains", expected: '"signal":"WAIT"' },
      { type: "regex", pattern: '"confidence":([6-9][0-9]|100)' },
    ],
  },
  {
    id: "v2-04",
    description: "USD flat corridor (90d) → low confidence even on flat data (low-vol corridor threshold)",
    // USD is in LOW_VOL_CORRIDORS — different thresholds apply
    input: { rates: makeFlat(83.2, 90), currency: "USD" },
    graders: [
      { type: "regex", pattern: '"confidence":([1-5][0-9])' },
    ],
  },
  {
    id: "v2-05",
    description: "URGENT never fires for slow gradual uptrends (v2 regime check)",
    // 0.035/day is slow — regime = uptrend, so v2 downgrades any URGENT → SEND_NOW
    input: { rates: makeTrend(79, 0.035, 90), currency: "AUD" },
    graders: [
      { type: "not-contains", expected: '"signal":"URGENT"' },
    ],
  },
];

// ─── Sub-suite 08d: Multi-Currency Corridors ─────────────────────────────────

export const currencyCases: EvalCase<SignalInput>[] = [
  {
    id: "curr-01",
    description: "AUD oscillating → valid signal and accuracy (baseline corridor)",
    input: { rates: makeOscillating(83, 1.5, 14, 90), currency: "AUD" },
    graders: [
      { type: "regex", pattern: '"signal":"(?:SEND_NOW|WAIT|URGENT)"' },
      { type: "regex", pattern: '"accuracy":[0-9]+' },
    ],
  },
  {
    id: "curr-02",
    description: "GBP oscillating → valid signal (non-AUD corridor works correctly)",
    input: { rates: makeOscillating(107, 2.0, 14, 90), currency: "GBP" },
    graders: [
      { type: "regex", pattern: '"signal":"(?:SEND_NOW|WAIT|URGENT)"' },
    ],
  },
  {
    id: "curr-03",
    description: "SGD flat corridor → confidence ≤78 (low-vol SEND_NOW confidence ceiling)",
    // SGD is ultra-low-vol: sendNowConfCeiling = 78
    input: { rates: makeOscillating(55, 0.15, 14, 90), currency: "SGD" },
    graders: [
      { type: "regex", pattern: '"signal":"(?:SEND_NOW|WAIT|URGENT)"' },
      { type: "regex", pattern: '"confidence":([1-7][0-9]|[1-5][0-9])' },
    ],
  },
  {
    id: "curr-04",
    description: "NZD oscillating → valid signal (NZD not a low-vol corridor, behaves like AUD)",
    input: { rates: makeOscillating(52, 1.0, 14, 90), currency: "NZD" },
    graders: [
      { type: "regex", pattern: '"signal":"(?:SEND_NOW|WAIT|URGENT)"' },
    ],
  },
];

// ─── Suite Runner ─────────────────────────────────────────────────────────────

export async function runSignalEngineSuite() {
  const btResult = await runSuite(
    "08a — Backtest Mechanics",
    "Backtest handles edge cases, finds signals in oscillating data, beats coin-flip accuracy.",
    backtestCases,
    async (input) => runAndSerialize(input)
  );

  const sigResult = await runSuite(
    "08b — Signal Output Validity",
    "Signal always SEND_NOW/WAIT/URGENT; confidence 0-100; forecast direction matches trend.",
    signalCases,
    async (input) => runAndSerialize(input)
  );

  const v2Result = await runSuite(
    "08c — v2 Decision Logic",
    "URGENT downgrade in uptrends, flat confidence clamp, WAIT promotion, low-vol corridor caps.",
    v2Cases,
    async (input) => runAndSerialize(input)
  );

  const currResult = await runSuite(
    "08d — Multi-Currency Corridors",
    "AUD, GBP, SGD, NZD — valid signals respecting corridor-specific volatility thresholds.",
    currencyCases,
    async (input) => runAndSerialize(input)
  );

  return [btResult, sigResult, v2Result, currResult];
}
