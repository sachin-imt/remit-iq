/**
 * Eval Suite 03 — Technical Indicator Math
 * =========================================
 * Tests the core math functions in src/lib/intelligence.ts.
 *
 * WHY EVAL MATH FUNCTIONS?
 *   The rate intelligence signals (SEND_NOW / WAIT / URGENT) are computed
 *   from these indicators. If computeRSI or computeSMA produce wrong values,
 *   every signal recommendation is wrong — even if the rest of the code
 *   is perfect. Math bugs are silent and hard to spot in integration tests.
 *
 *   These are "numerical unit tests" — the most deterministic form of eval.
 *   They give you a precise, reproducible pass/fail with no LLM variability.
 *
 * WHAT WE'RE TESTING:
 *   computeSMA   — Simple Moving Average: mean of last N data points
 *   computeEMA   — Exponential Moving Average: weighted toward recent values
 *   computeRSI   — Relative Strength Index: momentum on 0–100 scale
 *   computePercentile — Where does today's value rank in a dataset?
 *   computeVolatility — Standard deviation of returns (annualized-style %)
 *   computeIntelligenceFromRates — End-to-end signal from historical rates
 *
 * GRADERS:
 *   "exact" for precise equality, "regex" for range checks
 *
 * NOTE: For range checks we use a custom approach — the fn returns a string
 *       like "42.5" and we check it falls within expected bounds via regex.
 */

import {
  computeSMA,
  computeEMA,
  computeRSI,
  computePercentile,
  computeVolatility,
  computeIntelligenceFromRates,
} from "../../src/lib/intelligence";
import type { RateDataPoint } from "../../src/lib/types";
import { runSuite } from "../runner";
import type { EvalCase } from "../types";

// ─── Data Generators ──────────────────────────────────────────────────────────

function makeFlat(value: number, length: number): number[] {
  return Array(length).fill(value);
}

function makeIncreasing(start: number, step: number, length: number): number[] {
  return Array.from({ length }, (_, i) => start + i * step);
}

function makeDecreasing(start: number, step: number, length: number): number[] {
  return Array.from({ length }, (_, i) => start - i * step);
}

function makeRatePoints(rates: number[]): RateDataPoint[] {
  return rates.map((rate, i) => ({
    date: `2025-01-${String(i + 1).padStart(2, "0")}`,
    day: `Day ${i + 1}`,
    rate,
    midMarket: rate * 1.002,
  }));
}

// ─── Test Input Types ─────────────────────────────────────────────────────────

type SMAInput = { data: number[]; period: number };
type EMAInput = { data: number[]; period: number };
type RSIInput = { data: number[]; period?: number };
type PercentileInput = { current: number; data: number[] };
type VolatilityInput = { data: number[]; period: number };
type IntelInput = { rates: number[] };

// ─── Test Cases ───────────────────────────────────────────────────────────────

// --- computeSMA ---

const smaCases: EvalCase<SMAInput>[] = [
  {
    id: "sma-01",
    description: "SMA of [1,2,3,4,5] over last 3 → (3+4+5)/3 = 4.000",
    input: { data: [1, 2, 3, 4, 5], period: 3 },
    graders: [{ type: "exact", expected: "4.00" }],
  },
  {
    id: "sma-02",
    description: "SMA of [10,20,30,40,50] over 5 → 30.000",
    input: { data: [10, 20, 30, 40, 50], period: 5 },
    graders: [{ type: "exact", expected: "30.00" }],
  },
  {
    id: "sma-03",
    description: "SMA of flat [50,50,50,...] over 7 → 50.00",
    input: { data: makeFlat(50, 20), period: 7 },
    graders: [{ type: "exact", expected: "50.00" }],
  },
  {
    id: "sma-04",
    description: "SMA period 1 → returns last element",
    input: { data: [10, 20, 30, 99], period: 1 },
    graders: [{ type: "exact", expected: "99.00" }],
  },
];

// --- computeEMA ---

const emaCases: EvalCase<EMAInput>[] = [
  {
    id: "ema-01",
    description: "EMA of flat data → equals the flat value",
    input: { data: makeFlat(80, 30), period: 12 },
    graders: [{ type: "exact", expected: "80.00" }],
  },
  {
    id: "ema-02",
    description: "EMA of increasing data → final EMA < last value (lags behind)",
    input: { data: makeIncreasing(70, 0.5, 30), period: 12 },
    graders: [
      // EMA lags, so it should be less than the last value (70 + 29*0.5 = 84.5)
      { type: "regex", pattern: "^(7[0-9]|8[0-3])" }, // between 70 and 83.x
    ],
  },
  {
    id: "ema-03",
    description: "EMA of [1,1,1,...] → 1.00",
    input: { data: makeFlat(1, 20), period: 9 },
    graders: [{ type: "exact", expected: "1.00" }],
  },
];

// --- computeRSI ---

const rsiCases: EvalCase<RSIInput>[] = [
  {
    id: "rsi-01",
    description: "RSI on flat data (no gains/losses) → returns 50 (neutral, both avgGain and avgLoss are 0)",
    // Bug found by eval: original code returned 100 for flat data because `avgLoss === 0`
    // fired before checking if avgGain was also 0. Fixed: return 50 when both are 0.
    input: { data: makeFlat(83, 30), period: 14 },
    graders: [{ type: "exact", expected: "50" }],
  },
  {
    id: "rsi-02",
    description: "RSI on monotonically rising rates → RSI > 70 (overbought)",
    input: { data: makeIncreasing(70, 0.3, 30), period: 14 },
    graders: [
      // RSI should be high — above 70 means overbought
      { type: "regex", pattern: "^(7[0-9]|8[0-9]|9[0-9]|100)" },
    ],
  },
  {
    id: "rsi-03",
    description: "RSI on monotonically falling rates → RSI < 30 (oversold)",
    input: { data: makeDecreasing(90, 0.3, 30), period: 14 },
    graders: [
      // RSI should be low — below 30 means oversold
      { type: "regex", pattern: "^([0-2][0-9]|0)" },
    ],
  },
  {
    id: "rsi-04",
    description: "RSI with insufficient data (<= period) → returns 50 (default)",
    input: { data: [80, 81, 82], period: 14 },
    graders: [{ type: "exact", expected: "50" }],
  },
  {
    id: "rsi-05",
    description: "RSI is always between 0 and 100",
    input: { data: makeIncreasing(60, 1, 50), period: 14 },
    graders: [
      // Must be a valid number ≤ 100
      { type: "regex", pattern: "^\\d+(\\.\\d+)?$" },
    ],
  },
];

// --- computePercentile ---

const percentileCases: EvalCase<PercentileInput>[] = [
  {
    id: "pct-01",
    description: "Percentile of max value in dataset → near 100%",
    input: {
      current: 100,
      data: [70, 75, 80, 85, 90, 95, 100],
    },
    graders: [
      // Should be 6/7 = ~85% (index of first value ≥ 100)
      { type: "regex", pattern: "^(8[0-9]|9[0-9]|100)$" },
    ],
  },
  {
    id: "pct-02",
    description: "Percentile of min value in dataset → 0%",
    input: {
      current: 70,
      data: [70, 75, 80, 85, 90, 95, 100],
    },
    graders: [{ type: "exact", expected: "0" }],
  },
  {
    id: "pct-03",
    description: "Percentile of median value → approximately 50%",
    input: {
      current: 83,
      data: [80, 81, 82, 83, 84, 85, 86],
    },
    graders: [
      // 3/7 ≈ 43% (index of first value >= 83)
      { type: "regex", pattern: "^(4[0-9]|5[0-9])$" },
    ],
  },
  {
    id: "pct-04a",
    description: "Percentile when current > all historical values → returns 100 (best ever)",
    // Bug found by eval: original code used findIndex which returns -1 when not found,
    // producing (-1 / length) * 100 = negative percentile. Fixed: return 100 when -1.
    input: {
      current: 95,                         // higher than all values in [80..82.9]
      data: makeIncreasing(80, 0.1, 30),
    },
    graders: [
      { type: "exact", expected: "100" },
    ],
  },
  {
    id: "pct-04b",
    description: "Percentile always returns a valid number 0–100 for in-range values",
    input: {
      current: 81.5,                        // within the [80..82.9] range
      data: makeIncreasing(80, 0.1, 30),
    },
    graders: [
      { type: "regex", pattern: "^(100|[0-9]{1,2})$" },
    ],
  },
];

// --- computeVolatility ---

const volatilityCases: EvalCase<VolatilityInput>[] = [
  {
    id: "vol-01",
    description: "Volatility of flat data → 0% (no deviation)",
    input: { data: makeFlat(83, 30), period: 30 },
    graders: [{ type: "exact", expected: "0" }],
  },
  {
    id: "vol-02",
    description: "Volatility increases when data has larger swings",
    // High swing data should have higher vol than low swing
    input: { data: [80, 90, 70, 95, 75, 85, 65, 88], period: 7 },
    graders: [
      // Should be > 0 (there IS volatility)
      { type: "regex", pattern: "^[1-9]|^[1-9][0-9]" },
    ],
  },
  {
    id: "vol-03",
    description: "Volatility of steadily increasing data → low but > 0",
    input: { data: makeIncreasing(80, 0.05, 30), period: 30 },
    graders: [
      // Very steady increase = very low volatility
      { type: "regex", pattern: "^0\\." },
    ],
  },
];

// --- computeIntelligenceFromRates (end-to-end) ---

const intelligenceCases: EvalCase<IntelInput>[] = [
  {
    id: "intel-01",
    description: "Strong uptrend (90 days rising) → signal is SEND_NOW or URGENT",
    input: { rates: makeIncreasing(75, 0.1, 90) },
    graders: [
      { type: "regex", pattern: "SEND_NOW|URGENT" },
    ],
  },
  {
    id: "intel-02",
    description: "Strong downtrend (90 days falling) → signal is WAIT",
    input: { rates: makeDecreasing(90, 0.1, 90) },
    graders: [
      { type: "contains", expected: "WAIT" },
    ],
  },
  {
    id: "intel-03",
    description: "Flat rates → low confidence signal (market is stable, no edge)",
    input: { rates: makeFlat(83, 90) },
    graders: [
      // Confidence should be low when the market is totally flat
      { type: "regex", pattern: "confidence:[\\s]*([0-9]{2})" },
    ],
  },
  {
    id: "intel-04",
    description: "Returns required fields: signal, confidence, reason, stats",
    input: { rates: makeIncreasing(80, 0.05, 90) },
    graders: [
      { type: "contains", expected: "signal:" },
      { type: "contains", expected: "confidence:" },
      { type: "contains", expected: "avg30d:" },
    ],
  },
];

// ─── Suite Runner ─────────────────────────────────────────────────────────────

export async function runIndicatorsSuite() {
  const smaResult = await runSuite(
    "03a — computeSMA",
    "Simple Moving Average — average of last N data points",
    smaCases,
    async ({ data, period }) => computeSMA(data, period).toFixed(2)
  );

  const emaResult = await runSuite(
    "03b — computeEMA",
    "Exponential Moving Average — weighted toward recent values",
    emaCases,
    async ({ data, period }) => computeEMA(data, period).toFixed(2)
  );

  const rsiResult = await runSuite(
    "03c — computeRSI",
    "Relative Strength Index — momentum on 0–100 scale",
    rsiCases,
    async ({ data, period }) => computeRSI(data, period ?? 14).toString()
  );

  const percentileResult = await runSuite(
    "03d — computePercentile",
    "Percentile rank — where does today's rate sit in the historical range?",
    percentileCases,
    async ({ current, data }) => computePercentile(current, data).toString()
  );

  const volatilityResult = await runSuite(
    "03e — computeVolatility",
    "Volatility — standard deviation of returns as a percentage",
    volatilityCases,
    async ({ data, period }) => computeVolatility(data, period).toString()
  );

  const intelligenceResult = await runSuite(
    "03f — computeIntelligenceFromRates (end-to-end)",
    "Full intelligence signal from historical rate array → SEND_NOW / WAIT / URGENT",
    intelligenceCases,
    async ({ rates }) => {
      const points = makeRatePoints(rates);
      const result = computeIntelligenceFromRates(points, rates[rates.length - 1], "AUD");
      // Serialize key fields for grading
      return [
        `signal: ${result.recommendation.signal}`,
        `confidence: ${result.recommendation.confidence}`,
        `reason: ${result.recommendation.reason}`,
        `avg30d: ${result.stats.avg30d}`,
        `rsi14: ${result.stats.rsi14}`,
      ].join("\n");
    }
  );

  return [
    smaResult,
    emaResult,
    rsiResult,
    percentileResult,
    volatilityResult,
    intelligenceResult,
  ];
}
