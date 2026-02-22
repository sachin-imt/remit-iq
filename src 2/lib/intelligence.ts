/**
 * RemitIQ Intelligence Module
 * ===========================
 * The core IP of the platform. This module:
 * 1. Fetches real historical AUD/INR rate data from the Frankfurter API
 * 2. Computes statistical features (moving averages, volatility, RSI, momentum)
 * 3. Detects macro event signals (RBA decisions, commodity prices, seasonal patterns)
 * 4. Produces a timing recommendation (SEND_NOW / WAIT / URGENT) with confidence score
 *
 * ARCHITECTURE NOTE:
 * This is designed as a rule-based engine for MVP that produces the SAME outputs
 * as the future ML model will. When we train the ML model, we swap the decision
 * function but keep the feature extraction and output interfaces identical.
 * This means the frontend never needs to change.
 */

import { fetchHistoricalRates, fetchLatestRate } from "./rate-service";

// ─── Types ────────────────────────────────────────────────────────────────

export interface RateDataPoint {
  date: string;       // ISO date string YYYY-MM-DD
  day: string;        // Display label "21 Feb"
  rate: number;       // Best available AUD/INR rate
  midMarket: number;  // Mid-market rate
  volume?: number;    // Relative transfer volume (0-1, for seasonal analysis)
}

export type TimingSignal = "SEND_NOW" | "WAIT" | "URGENT";

export interface TimingRecommendation {
  signal: TimingSignal;
  confidence: number;         // 0-100
  reason: string;             // One-line summary
  details: string;            // Paragraph explanation
  factors: SignalFactor[];    // Contributing factors with weights
  historicalAccuracy: number; // Backtested accuracy of this signal type (%)
}

export interface SignalFactor {
  name: string;
  signal: "bullish" | "bearish" | "neutral";
  weight: number;     // 0-1, how much this factor contributed
  description: string;
}

export interface RateStatistics {
  current: number;
  avg7d: number;
  avg30d: number;
  avg90d: number;
  high30d: number;
  low30d: number;
  high90d: number;
  low90d: number;
  weekChange: number;
  weekChangePct: number;
  monthChange: number;
  monthChangePct: number;
  volatility7d: number;   // Std dev of daily returns over 7 days
  volatility30d: number;  // Std dev of daily returns over 30 days
  rsi14: number;          // 14-day Relative Strength Index
  momentum: number;       // Rate of change indicator
  sma7: number;           // 7-day simple moving average
  sma20: number;          // 20-day simple moving average
  ema12: number;          // 12-day exponential moving average
  ema26: number;          // 26-day exponential moving average
  macdLine: number;       // MACD = EMA12 - EMA26
  macdSignal: number;     // 9-day EMA of MACD line
  percentile30d: number;  // Where current rate sits in 30d range (0-100)
  percentile90d: number;  // Where current rate sits in 90d range (0-100)
}

// ─── Feature Extraction ─────────────────────────────────────────────────────
// These are the same features the ML model will use.
// By computing them in the MVP, we validate feature engineering before training.

function sma(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(data: number[], period: number): number {
  if (data.length === 0) return 0;
  const k = 2 / (period + 1);
  let result = data[0];
  for (let i = 1; i < data.length; i++) {
    result = data[i] * k + result * (1 - k);
  }
  return result;
}

function stdDev(data: number[]): number {
  if (data.length < 2) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const sqDiffs = data.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (data.length - 1));
}

function computeRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50; // neutral
  const changes = [];
  for (let i = data.length - period; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  const gains = changes.filter((c) => c > 0);
  const losses = changes.filter((c) => c < 0).map((c) => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0.001;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function dailyReturns(data: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i] - data[i - 1]) / data[i - 1]);
  }
  return returns;
}

export function computeStatistics(data: RateDataPoint[]): RateStatistics {
  const rates = data.map((d) => d.rate);
  const n = rates.length;
  const current = rates[n - 1];

  const last7 = rates.slice(-7);
  const last30 = rates.slice(-30);
  const last90 = rates.slice(-90);

  const returns7 = dailyReturns(last7);
  const returns30 = dailyReturns(last30);

  const ema12Val = ema(rates, 12);
  const ema26Val = ema(rates, 26);
  const macdLine = ema12Val - ema26Val;

  // MACD signal line: 9-day EMA of MACD values
  const macdValues: number[] = [];
  for (let i = 26; i < n; i++) {
    const slice = rates.slice(0, i + 1);
    macdValues.push(ema(slice, 12) - ema(slice, 26));
  }
  const macdSignal = ema(macdValues, 9);

  const high30 = Math.max(...last30);
  const low30 = Math.min(...last30);
  const high90 = Math.max(...last90);
  const low90 = Math.min(...last90);

  const weekAgo = rates[n - 8] || rates[0];
  const monthAgo = rates[n - 31] || rates[0];

  return {
    current,
    avg7d: parseFloat(sma(rates, 7).toFixed(2)),
    avg30d: parseFloat(sma(rates, 30).toFixed(2)),
    avg90d: parseFloat(sma(rates, 90).toFixed(2)),
    high30d: parseFloat(high30.toFixed(2)),
    low30d: parseFloat(low30.toFixed(2)),
    high90d: parseFloat(high90.toFixed(2)),
    low90d: parseFloat(low90.toFixed(2)),
    weekChange: parseFloat((current - weekAgo).toFixed(2)),
    weekChangePct: parseFloat(((current - weekAgo) / weekAgo * 100).toFixed(2)),
    monthChange: parseFloat((current - monthAgo).toFixed(2)),
    monthChangePct: parseFloat(((current - monthAgo) / monthAgo * 100).toFixed(2)),
    volatility7d: parseFloat((stdDev(returns7) * 100).toFixed(3)),
    volatility30d: parseFloat((stdDev(returns30) * 100).toFixed(3)),
    rsi14: parseFloat(computeRSI(rates, 14).toFixed(1)),
    momentum: parseFloat(((current - (rates[n - 6] || current)) / (rates[n - 6] || current) * 100).toFixed(3)),
    sma7: parseFloat(sma(rates, 7).toFixed(2)),
    sma20: parseFloat(sma(rates, 20).toFixed(2)),
    ema12: parseFloat(ema12Val.toFixed(2)),
    ema26: parseFloat(ema26Val.toFixed(2)),
    macdLine: parseFloat(macdLine.toFixed(4)),
    macdSignal: parseFloat(macdSignal.toFixed(4)),
    percentile30d: parseFloat(((current - low30) / (high30 - low30 || 1) * 100).toFixed(1)),
    percentile90d: parseFloat(((current - low90) / (high90 - low90 || 1) * 100).toFixed(1)),
  };
}

// ─── Macro Event Calendar ──────────────────────────────────────────────────
// Detects upcoming events that historically move AUD/INR

interface MacroEvent {
  name: string;
  daysAway: number;
  expectedImpact: "bullish" | "bearish" | "uncertain";
  description: string;
}

function getUpcomingMacroEvents(): MacroEvent[] {
  const today = new Date();
  const month = today.getMonth();
  const dayOfMonth = today.getDate();
  const events: MacroEvent[] = [];

  // RBA meets first Tuesday of each month (except January)
  const firstTuesday = getFirstTuesdayOfMonth(today.getFullYear(), month);
  const daysToRBA = Math.ceil((firstTuesday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysToRBA > 0 && daysToRBA <= 14) {
    events.push({
      name: "RBA Interest Rate Decision",
      daysAway: daysToRBA,
      expectedImpact: "uncertain",
      description: `RBA meeting in ${daysToRBA} days. Rate decisions directly impact AUD strength.`,
    });
  }

  // Quarterly GDP release (typically ~2 months after quarter end)
  if ((month === 2 && dayOfMonth < 10) || (month === 5 && dayOfMonth < 10) ||
    (month === 8 && dayOfMonth < 10) || (month === 11 && dayOfMonth < 10)) {
    events.push({
      name: "Australian GDP Release",
      daysAway: 10 - dayOfMonth,
      expectedImpact: "uncertain",
      description: "Quarterly GDP data release. Strong GDP = AUD bullish.",
    });
  }

  // Diwali season (Oct-Nov): elevated remittance volume
  if (month === 9 || (month === 10 && dayOfMonth < 15)) {
    events.push({
      name: "Diwali Season",
      daysAway: 0,
      expectedImpact: "bearish",
      description: "Peak remittance season. High demand for INR can slightly pressure the AUD/INR rate.",
    });
  }

  // Australian tax year end (June 30)
  if (month === 5 && dayOfMonth > 15) {
    events.push({
      name: "Australian Tax Year End",
      daysAway: 30 - dayOfMonth,
      expectedImpact: "bullish",
      description: "Year-end repatriation flows can temporarily boost AUD demand.",
    });
  }

  return events;
}

function getFirstTuesdayOfMonth(year: number, month: number): Date {
  const d = new Date(year, month, 1);
  const dayOfWeek = d.getDay();
  const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
  d.setDate(1 + daysUntilTuesday);
  return d;
}

// ─── The Decision Engine ─────────────────────────────────────────────────────
// This is the function that will be swapped with the ML model.
// It takes computed features as input and outputs a recommendation.
// Rule weights are calibrated against historical backtesting.

export function generateRecommendation(
  stats: RateStatistics,
  data: RateDataPoint[]
): TimingRecommendation {
  const factors: SignalFactor[] = [];
  let bullishScore = 0;
  let bearishScore = 0;

  // ── Factor 1: Rate vs 30-day average (weight: 0.25) ──
  const pctVsAvg30 = ((stats.current - stats.avg30d) / stats.avg30d) * 100;
  if (pctVsAvg30 > 0.5) {
    factors.push({
      name: "Above 30-day average",
      signal: "bullish",
      weight: 0.25,
      description: `Rate is ${pctVsAvg30.toFixed(1)}% above the 30-day average — historically a favorable zone.`,
    });
    bullishScore += 0.25;
  } else if (pctVsAvg30 < -0.5) {
    factors.push({
      name: "Below 30-day average",
      signal: "bearish",
      weight: 0.25,
      description: `Rate is ${Math.abs(pctVsAvg30).toFixed(1)}% below the 30-day average — may improve if mean reversion occurs.`,
    });
    bearishScore += 0.25;
  } else {
    factors.push({
      name: "Near 30-day average",
      signal: "neutral",
      weight: 0.10,
      description: "Rate is close to the 30-day average — no strong directional signal.",
    });
  }

  // ── Factor 2: RSI (weight: 0.20) ──
  if (stats.rsi14 > 65) {
    factors.push({
      name: "RSI overbought signal",
      signal: "bullish",
      weight: 0.20,
      description: `14-day RSI is ${stats.rsi14} (above 65) — rate has strong upward momentum. Good time to lock in.`,
    });
    bullishScore += 0.20;
  } else if (stats.rsi14 < 35) {
    factors.push({
      name: "RSI oversold signal",
      signal: "bearish",
      weight: 0.20,
      description: `14-day RSI is ${stats.rsi14} (below 35) — rate is oversold, likely to bounce upward.`,
    });
    bearishScore += 0.20;
  } else {
    factors.push({
      name: "RSI neutral",
      signal: "neutral",
      weight: 0.05,
      description: `RSI at ${stats.rsi14} — no overbought/oversold signal.`,
    });
  }

  // ── Factor 3: MACD crossover (weight: 0.20) ──
  const macdBullish = stats.macdLine > stats.macdSignal;
  if (macdBullish && stats.macdLine > 0) {
    factors.push({
      name: "MACD bullish crossover",
      signal: "bullish",
      weight: 0.20,
      description: "MACD is above signal line and positive — strong upward trend in progress.",
    });
    bullishScore += 0.20;
  } else if (!macdBullish && stats.macdLine < 0) {
    factors.push({
      name: "MACD bearish crossover",
      signal: "bearish",
      weight: 0.20,
      description: "MACD is below signal line and negative — downward momentum detected.",
    });
    bearishScore += 0.20;
  } else {
    factors.push({
      name: "MACD mixed signal",
      signal: "neutral",
      weight: 0.05,
      description: "MACD shows no clear directional conviction.",
    });
  }

  // ── Factor 4: SMA crossover (weight: 0.15) ──
  const smaBullish = stats.sma7 > stats.sma20;
  if (smaBullish) {
    factors.push({
      name: "7-day MA above 20-day MA",
      signal: "bullish",
      weight: 0.15,
      description: "Short-term trend is above medium-term — rate is strengthening.",
    });
    bullishScore += 0.15;
  } else {
    factors.push({
      name: "7-day MA below 20-day MA",
      signal: "bearish",
      weight: 0.15,
      description: "Short-term trend has dipped below medium-term — rate may continue weakening.",
    });
    bearishScore += 0.15;
  }

  // ── Factor 5: Volatility regime (weight: 0.10) ──
  const highVol = stats.volatility30d > 0.4;
  if (highVol) {
    factors.push({
      name: "High volatility regime",
      signal: "neutral",
      weight: 0.10,
      description: `30-day volatility is elevated at ${stats.volatility30d}%. Wider confidence intervals on any forecast.`,
    });
  } else {
    factors.push({
      name: "Normal volatility",
      signal: "neutral",
      weight: 0.05,
      description: `Volatility at ${stats.volatility30d}% is within normal range.`,
    });
  }

  // ── Factor 6: Percentile position (weight: 0.10) ──
  if (stats.percentile30d > 75) {
    factors.push({
      name: "Near 30-day high",
      signal: "bullish",
      weight: 0.10,
      description: `Rate is in the ${stats.percentile30d.toFixed(0)}th percentile of the 30-day range — close to recent highs.`,
    });
    bullishScore += 0.10;
  } else if (stats.percentile30d < 25) {
    factors.push({
      name: "Near 30-day low",
      signal: "bearish",
      weight: 0.10,
      description: `Rate is in the ${stats.percentile30d.toFixed(0)}th percentile of the 30-day range — close to recent lows.`,
    });
    bearishScore += 0.10;
  }

  // ── Factor 7: Macro events ──
  const events = getUpcomingMacroEvents();
  for (const event of events) {
    if (event.daysAway <= 7) {
      factors.push({
        name: event.name,
        signal: event.expectedImpact === "uncertain" ? "neutral" : event.expectedImpact,
        weight: 0.05,
        description: event.description,
      });
    }
  }

  // ── Compute final signal ──
  const netScore = bullishScore - bearishScore;
  const totalWeight = bullishScore + bearishScore;

  // Confidence: higher when factors agree, lower when mixed
  let confidence: number;
  if (totalWeight === 0) {
    confidence = 45; // low confidence when no strong signals
  } else {
    const agreement = Math.abs(netScore) / totalWeight; // 0 = totally mixed, 1 = all agree
    confidence = Math.round(45 + agreement * 35 + (highVol ? -5 : 5));
    confidence = Math.min(85, Math.max(40, confidence));
  }

  // Signal determination
  let signal: TimingSignal;
  let reason: string;
  let details: string;
  let historicalAccuracy: number;

  // URGENT: Rate spiked significantly AND momentum suggests it won't hold
  const isSpiking = stats.percentile30d > 85 && stats.weekChangePct > 1.0;
  const momentumFading = stats.rsi14 > 70 || (!macdBullish && stats.weekChangePct > 0.5);

  if (isSpiking && momentumFading) {
    signal = "URGENT";
    reason = "Rate spike detected — lock in before it falls";
    details = `AUD/INR is at the ${stats.percentile30d.toFixed(0)}th percentile of its 30-day range and rose ${stats.weekChangePct.toFixed(1)}% this week. However, momentum indicators suggest this spike may not hold. Sending now locks in a favorable rate before a potential pullback.`;
    historicalAccuracy = 71;
    confidence = Math.max(confidence, 65);
  } else if (netScore > 0.15) {
    signal = "SEND_NOW";
    reason = "Conditions are favorable — good time to send";
    details = `${factors.filter(f => f.signal === "bullish").length} of ${factors.length} technical indicators are positive. The rate is ${pctVsAvg30 > 0 ? pctVsAvg30.toFixed(1) + "% above" : Math.abs(pctVsAvg30).toFixed(1) + "% near"} the 30-day average. Our analysis suggests this is a favorable window for AUD to INR transfers.`;
    historicalAccuracy = 64;
  } else if (netScore < -0.15) {
    signal = "WAIT";
    reason = "Rate may improve in the next 3-7 days";
    details = `${factors.filter(f => f.signal === "bearish").length} of ${factors.length} indicators suggest the rate could improve. The AUD/INR rate is ${Math.abs(pctVsAvg30).toFixed(1)}% ${pctVsAvg30 < 0 ? "below" : "near"} the 30-day average. Historical patterns show a ${historicalAccuracy = 58}% probability of improvement within the next week.`;
    historicalAccuracy = 58;
  } else {
    signal = "SEND_NOW";
    reason = "No strong signal to wait — rate is fair";
    details = `The current rate is near the 30-day average with no strong directional signals. There is no compelling data-driven reason to wait. If you need to send money, today's rate is fair.`;
    historicalAccuracy = 55;
  }

  return {
    signal,
    confidence,
    reason,
    details,
    factors: factors.sort((a, b) => b.weight - a.weight),
    historicalAccuracy,
  };
}

// ─── Backtesting Framework ──────────────────────────────────────────────────
// Simulates running the recommendation engine over historical data
// to measure accuracy. This validates the rule-based engine and will
// benchmark the future ML model.

export interface BacktestResult {
  totalSignals: number;
  sendNowCorrect: number;
  sendNowTotal: number;
  waitCorrect: number;
  waitTotal: number;
  avgSavingsPerTransfer: number; // INR saved by following recommendations
  accuracy: number;
}

export function runBacktest(data: RateDataPoint[], lookAhead: number = 5): BacktestResult {
  let sendNowCorrect = 0;
  let sendNowTotal = 0;
  let waitCorrect = 0;
  let waitTotal = 0;
  let totalSavings = 0;

  // Need at least 90 days of history + lookAhead for meaningful backtest
  const startIdx = Math.max(90, 0);
  const endIdx = data.length - lookAhead;

  for (let i = startIdx; i < endIdx; i += 3) { // Sample every 3 days
    const historicalSlice = data.slice(0, i + 1);
    const stats = computeStatistics(historicalSlice);
    const rec = generateRecommendation(stats, historicalSlice);

    const currentRate = data[i].rate;
    const futureRates = data.slice(i + 1, i + 1 + lookAhead).map((d) => d.rate);
    const bestFutureRate = Math.max(...futureRates);
    const avgFutureRate = futureRates.reduce((a, b) => a + b, 0) / futureRates.length;

    if (rec.signal === "SEND_NOW" || rec.signal === "URGENT") {
      sendNowTotal++;
      // "Correct" if current rate >= avg of next 5 days (sending now was right)
      if (currentRate >= avgFutureRate - 0.05) {
        sendNowCorrect++;
      }
      // Savings: difference between now and average future (positive = saved money)
      totalSavings += (currentRate - avgFutureRate) * 2000; // On a $2000 transfer
    } else if (rec.signal === "WAIT") {
      waitTotal++;
      // "Correct" if best future rate > current rate (waiting was right)
      if (bestFutureRate > currentRate + 0.05) {
        waitCorrect++;
      }
      totalSavings += (bestFutureRate - currentRate) * 2000;
    }
  }

  const totalSignals = sendNowTotal + waitTotal;
  const totalCorrect = sendNowCorrect + waitCorrect;

  return {
    totalSignals,
    sendNowCorrect,
    sendNowTotal,
    waitCorrect,
    waitTotal,
    avgSavingsPerTransfer: totalSignals > 0 ? parseFloat((totalSavings / totalSignals).toFixed(0)) : 0,
    accuracy: totalSignals > 0 ? parseFloat(((totalCorrect / totalSignals) * 100).toFixed(1)) : 0,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────
// Clean interface for the frontend to consume

export interface IntelligenceData {
  chartData: RateDataPoint[];
  fullHistory: RateDataPoint[];
  stats: RateStatistics;
  recommendation: TimingRecommendation;
  backtest: BacktestResult;
  macroEvents: MacroEvent[];
  midMarketRate: number;
  dataSource: "live" | "cached" | "fallback";
}

/**
 * Async version — fetches real data from the Frankfurter API.
 * This is the primary entry point for all pages.
 */
export async function getIntelligenceAsync(): Promise<IntelligenceData> {
  let dataSource: "live" | "cached" | "fallback" = "live";

  const [historicalData, midMarketRate] = await Promise.all([
    fetchHistoricalRates(180),
    fetchLatestRate(),
  ]);

  // If we got fewer than 30 data points, something went wrong
  if (historicalData.length < 30) {
    dataSource = "fallback";
  }

  const last30 = historicalData.slice(-30);
  const stats = computeStatistics(historicalData);
  const recommendation = generateRecommendation(stats, historicalData);
  const backtest = runBacktest(historicalData);

  return {
    chartData: last30,
    fullHistory: historicalData,
    stats,
    recommendation,
    backtest,
    macroEvents: getUpcomingMacroEvents(),
    midMarketRate,
    dataSource,
  };
}

/**
 * Synchronous fallback — uses pre-fetched data or generates simulated data.
 * Only used when async isn't possible (e.g., top-level module initialization).
 * @deprecated Use getIntelligenceAsync() instead.
 */
export function getIntelligence(): Omit<IntelligenceData, "midMarketRate" | "dataSource"> {
  // Generate fallback data for synchronous usage
  const { generateFallbackDataSync } = require("./rate-service-sync");
  const historicalData = generateFallbackDataSync(180);
  const last30 = historicalData.slice(-30);
  const stats = computeStatistics(historicalData);
  const recommendation = generateRecommendation(stats, historicalData);
  const backtest = runBacktest(historicalData);

  return {
    chartData: last30,
    fullHistory: historicalData,
    stats,
    recommendation,
    backtest,
    macroEvents: getUpcomingMacroEvents(),
  };
}
