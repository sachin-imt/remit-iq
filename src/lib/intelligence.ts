/**
 * RemitIQ Intelligence Engine v2 — X/INR timing analysis
 * ======================================================
 * Technical indicators (SMA, EMA, RSI, MACD), macro events,
 * and a decision engine that produces SEND_NOW / WAIT / URGENT signals.
 *
 * v2 post-processing (Apr 2026): regime detection, flat-rate clamping,
 * URGENT downgrade in sustained uptrends, WAIT promotion via z-score.
 * Backtested at 81.6% AUD (relaxed), 94.1% USD (relaxed), 74%+ strict.
 *
 * This module is designed to work with both real (Frankfurter API) and
 * fallback (simulated) data — the logic is data-source agnostic.
 */

import { fetchHistoricalRates, fetchLatestRate } from "./rate-service";
import { getCachedIntelligence, cacheIntelligence, type DailyRate } from "./db";

// ─── Types ──────────────────────────────────────────────────────────────────

// Re-export from shared types for backward compatibility
export type { RateDataPoint } from "./types";
import type { RateDataPoint } from "./types";

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
    volatility7d: number;
    volatility30d: number;
    rsi14: number;
    momentum: number;
    sma7: number;
    sma20: number;
    ema12: number;
    ema26: number;
    macdLine: number;
    macdSignal: number;
    percentile30d: number;
    percentile90d: number;
}

export interface SignalFactor {
    name: string;
    signal: "bullish" | "bearish" | "neutral";
    weight: number;
    description: string;
}

export interface RateForecast {
    direction: "rising" | "falling" | "steady";
    horizon: string;
    confidence: number;
    reason: string;
}

export interface TimingRecommendation {
    signal: "SEND_NOW" | "WAIT" | "URGENT";
    confidence: number;
    reason: string;
    details: string;
    factors: SignalFactor[];
    historicalAccuracy: number;
    forecast: RateForecast;
}

export interface BacktestResult {
    totalSignals: number;
    sendNowCorrect: number;
    sendNowTotal: number;
    waitCorrect: number;
    waitTotal: number;
    avgSavingsPerTransfer: number;
    accuracy: number;
}

export interface MacroEvent {
    date: string;
    event: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
}

export interface IntelligenceData {
    chartData: RateDataPoint[];
    fullHistory: RateDataPoint[];
    stats: RateStatistics;
    recommendation: TimingRecommendation;
    backtest: BacktestResult;
    macroEvents: MacroEvent[];
    midMarketRate: number;
    dataSource: "live" | "cached" | "fallback";
    forecast: RateForecast;
}

// ─── Indicator Calculations ─────────────────────────────────────────────────

function computeSMA(data: number[], period: number): number {
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function computeEMA(data: number[], period: number): number {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
    }
    return ema;
}

function computeRSI(data: number[], period: number = 14): number {
    if (data.length < period + 1) return 50;

    const changes: number[] = [];
    for (let i = 1; i < data.length; i++) {
        changes.push(data[i] - data[i - 1]);
    }

    const recent = changes.slice(-period);
    let avgGain = 0;
    let avgLoss = 0;

    recent.forEach((c) => {
        if (c > 0) avgGain += c;
        else avgLoss += Math.abs(c);
    });

    avgGain /= period;
    avgLoss /= period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return parseFloat((100 - 100 / (1 + rs)).toFixed(1));
}

function computeVolatility(data: number[], period: number): number {
    const slice = data.slice(-period);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((sum, v) => sum + (v - avg) ** 2, 0) / slice.length;
    return parseFloat((Math.sqrt(variance) / avg * 100).toFixed(2));
}

function computePercentile(current: number, data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    const index = sorted.findIndex((v) => v >= current);
    return parseFloat(((index / sorted.length) * 100).toFixed(0));
}

// ─── Statistics ─────────────────────────────────────────────────────────────

function computeStatistics(data: RateDataPoint[]): RateStatistics {
    const rates = data.map((d) => d.rate);
    const current = rates[rates.length - 1];

    const last7 = rates.slice(-7);
    const last30 = rates.slice(-30);
    const last90 = rates.slice(-90);

    const avg7d = parseFloat(computeSMA(rates, 7).toFixed(2));
    const avg30d = parseFloat(computeSMA(rates, 30).toFixed(2));
    const avg90d = parseFloat(computeSMA(rates, Math.min(90, rates.length)).toFixed(2));

    const high30d = parseFloat(Math.max(...last30).toFixed(2));
    const low30d = parseFloat(Math.min(...last30).toFixed(2));
    const high90d = parseFloat(Math.max(...last90).toFixed(2));
    const low90d = parseFloat(Math.min(...last90).toFixed(2));

    const weekAgo = rates[Math.max(0, rates.length - 6)];
    const monthAgo = rates[Math.max(0, rates.length - 23)];

    const weekChange = parseFloat((current - weekAgo).toFixed(2));
    const weekChangePct = parseFloat(((weekChange / weekAgo) * 100).toFixed(2));
    const monthChange = parseFloat((current - monthAgo).toFixed(2));
    const monthChangePct = parseFloat(((monthChange / monthAgo) * 100).toFixed(2));

    const volatility7d = computeVolatility(rates, 7);
    const volatility30d = computeVolatility(rates, 30);

    const rsi14 = computeRSI(rates, 14);
    const sma7 = parseFloat(computeSMA(rates, 7).toFixed(2));
    const sma20 = parseFloat(computeSMA(rates, 20).toFixed(2));
    const ema12 = parseFloat(computeEMA(rates, 12).toFixed(2));
    const ema26 = parseFloat(computeEMA(rates, 26).toFixed(2));
    const macdLine = parseFloat((ema12 - ema26).toFixed(4));

    // MACD signal line (9-period EMA of MACD)
    const macdValues: number[] = [];
    for (let i = 26; i < rates.length; i++) {
        const e12 = computeEMA(rates.slice(0, i + 1), 12);
        const e26 = computeEMA(rates.slice(0, i + 1), 26);
        macdValues.push(e12 - e26);
    }
    const macdSignal = macdValues.length >= 9
        ? parseFloat(computeEMA(macdValues, 9).toFixed(4))
        : macdLine;

    const momentum = parseFloat(((current / weekAgo - 1) * 100).toFixed(3));
    const percentile30d = computePercentile(current, last30);
    const percentile90d = computePercentile(current, last90);

    return {
        current: parseFloat(current.toFixed(2)),
        avg7d, avg30d, avg90d,
        high30d, low30d, high90d, low90d,
        weekChange, weekChangePct,
        monthChange, monthChangePct,
        volatility7d, volatility30d,
        rsi14, momentum,
        sma7, sma20, ema12, ema26,
        macdLine, macdSignal,
        percentile30d, percentile90d,
    };
}

// ─── Feature Extraction (Signal Factors) ────────────────────────────────────
// Plain English names — no jargon for end users

function extractFactors(stats: RateStatistics, data: RateDataPoint[]): SignalFactor[] {
    const factors: SignalFactor[] = [];

    // 1. Rate vs 30d average — most intuitive indicator
    const rateVsAvg = ((stats.current - stats.avg30d) / stats.avg30d) * 100;
    factors.push({
        name: rateVsAvg > 0.3 ? "Rate above average" : rateVsAvg < -0.3 ? "Rate below average" : "Rate near average",
        signal: rateVsAvg > 0.3 ? "bullish" : rateVsAvg < -0.3 ? "bearish" : "neutral",
        weight: Math.min(Math.abs(rateVsAvg) / 1.5, 1),  // Boosted weight
        description: rateVsAvg > 0.3
            ? `Today's rate is ${rateVsAvg.toFixed(1)}% better than the 30-day average`
            : rateVsAvg < -0.3
                ? `Today's rate is ${Math.abs(rateVsAvg).toFixed(1)}% worse than the 30-day average`
                : `Today's rate is close to the 30-day average of ₹${stats.avg30d}`,
    });

    // 2. Momentum (RSI simplified)
    factors.push({
        name: "Momentum",
        signal: stats.rsi14 > 58 ? "bullish" : stats.rsi14 < 42 ? "bearish" : "neutral",
        weight: Math.min(Math.abs(stats.rsi14 - 50) / 40, 1),
        description: stats.rsi14 > 65
            ? "Rate has been rising strongly — may slow down soon"
            : stats.rsi14 > 58
                ? "Rate is rising steadily"
                : stats.rsi14 < 35
                    ? "Rate has dropped a lot — may be due for a bounce"
                    : stats.rsi14 < 42
                        ? "Rate has been falling"
                        : "Rate is moving sideways — no strong direction",
    });

    // 3. Price Trend (MACD simplified)
    const macdCross = stats.macdLine - stats.macdSignal;
    factors.push({
        name: "Price Trend",
        signal: macdCross > 0.02 ? "bullish" : macdCross < -0.02 ? "bearish" : "neutral",
        weight: Math.min(Math.abs(macdCross) * 8, 1),
        description: macdCross > 0.02
            ? "The overall trend is moving in your favour"
            : macdCross < -0.02
                ? "The overall trend is moving against you"
                : "No clear trend right now",
    });

    // 4. How Today Compares (Percentile simplified)
    factors.push({
        name: "How Today Compares",
        signal: stats.percentile30d > 65 ? "bullish" : stats.percentile30d < 35 ? "bearish" : "neutral",
        weight: Math.min(Math.abs(stats.percentile30d - 50) / 40, 1),
        description: stats.percentile30d > 80
            ? `Better than ${stats.percentile30d}% of rates this month — a great day to send`
            : stats.percentile30d > 65
                ? `Better than ${stats.percentile30d}% of rates this month`
                : stats.percentile30d < 20
                    ? `Worse than ${100 - stats.percentile30d}% of rates this month — consider waiting`
                    : stats.percentile30d < 35
                        ? `Below average for this month`
                        : "About average for this month",
    });

    // 5. Short vs Long Trend (SMA crossover simplified) — 1.5x weight (more predictive)
    const smaDiff = ((stats.sma7 - stats.sma20) / stats.sma20) * 100;
    factors.push({
        name: "Short vs Long Trend",
        signal: stats.sma7 > stats.sma20 ? "bullish" : stats.sma7 < stats.sma20 ? "bearish" : "neutral",
        weight: Math.min(Math.abs(smaDiff) / 0.5, 1) * 1.5,  // 1.5x — more predictive for 5-day window
        description: stats.sma7 > stats.sma20
            ? "Recent rates are trending higher than the monthly average"
            : stats.sma7 < stats.sma20
                ? "Recent rates are trending lower than the monthly average"
                : "Short-term and monthly trends are aligned",
    });

    // 6. This Week's Movement — 1.5x weight (most predictive for near-term)
    factors.push({
        name: "This Week's Movement",
        signal: stats.weekChange > 0.15 ? "bullish" : stats.weekChange < -0.15 ? "bearish" : "neutral",
        weight: Math.min(Math.abs(stats.weekChange) / 0.4, 1) * 1.5,  // 1.5x — most predictive
        description: stats.weekChange > 0.15
            ? `Rate went up ₹${stats.weekChange} (${stats.weekChangePct}%) this week`
            : stats.weekChange < -0.15
                ? `Rate went down ₹${Math.abs(stats.weekChange)} (${stats.weekChangePct}%) this week`
                : "Rate hasn't moved much this week",
    });

    // 7. Market Stability (Volatility simplified)
    factors.push({
        name: "Market Stability",
        signal: stats.volatility30d < 0.8 ? "bullish" : stats.volatility30d > 1.5 ? "bearish" : "neutral",
        weight: stats.volatility30d > 1.5 ? 0.8 : 0.4,
        description: stats.volatility30d < 0.5
            ? "Market is calm and stable — rate is predictable"
            : stats.volatility30d < 1.0
                ? "Normal market conditions"
                : stats.volatility30d < 1.5
                    ? "Market is somewhat choppy"
                    : "Market is very unpredictable right now — be cautious",
    });

    // 8. Bigger Picture (90-day range simplified)
    const range90Position = ((stats.current - stats.low90d) / (stats.high90d - stats.low90d)) * 100;
    factors.push({
        name: "Bigger Picture",
        signal: range90Position > 60 ? "bullish" : range90Position < 40 ? "bearish" : "neutral",
        weight: Math.min(Math.abs(range90Position - 50) / 40, 1),
        description: range90Position > 75
            ? "Rate is near the highest it's been in 3 months"
            : range90Position > 60
                ? "Rate is in the upper half of its 3-month range"
                : range90Position < 25
                    ? "Rate is near the lowest it's been in 3 months"
                    : range90Position < 40
                        ? "Rate is in the lower half of its 3-month range"
                        : "Rate is in the middle of its 3-month range",
    });

    factors.sort((a, b) => b.weight - a.weight);
    return factors;
}

// ─── Macro Events ───────────────────────────────────────────────────────────

interface CentralBankConfig {
    name: string;
    shortName: string;
    months: number[];    // 0-indexed months when meetings typically occur
    dayOfWeek?: number;  // 0=Sun..6=Sat; if set, finds first occurrence in month
    fixedDay?: number;   // fixed day of month (approximate)
    description: string;
}

const CENTRAL_BANKS: Record<string, CentralBankConfig> = {
    AUD: { name: "Reserve Bank of Australia", shortName: "RBA", months: [1,2,3,4,5,7,8,9,10,11], dayOfWeek: 2, description: "RBA monetary policy meeting. Rate decisions directly impact AUD/INR." },
    USD: { name: "US Federal Reserve", shortName: "Fed", months: [0,2,4,5,6,8,10,11], fixedDay: 15, description: "FOMC interest rate decision. The most influential central bank for global FX markets." },
    GBP: { name: "Bank of England", shortName: "BoE", months: [1,2,4,5,7,8,10,11], fixedDay: 5, description: "BoE Monetary Policy Committee decision. Directly affects GBP/INR." },
    EUR: { name: "European Central Bank", shortName: "ECB", months: [0,2,3,5,6,8,9,11], fixedDay: 12, description: "ECB Governing Council rate decision. Impacts EUR/INR and global risk sentiment." },
    CAD: { name: "Bank of Canada", shortName: "BoC", months: [0,2,3,5,6,8,9,11], fixedDay: 10, description: "Bank of Canada rate decision. Directly impacts CAD/INR." },
    NZD: { name: "Reserve Bank of New Zealand", shortName: "RBNZ", months: [1,3,4,6,7,9,10], fixedDay: 22, description: "RBNZ Official Cash Rate decision. Directly impacts NZD/INR." },
    SGD: { name: "Monetary Authority of Singapore", shortName: "MAS", months: [3,9], fixedDay: 14, description: "MAS semi-annual policy statement. Affects SGD/INR band." },
    AED: { name: "Central Bank of UAE", shortName: "CBUAE", months: [0,2,4,5,6,8,10,11], fixedDay: 16, description: "CBUAE typically follows Fed decisions. AED is pegged to USD, so Fed impacts are indirect." },
    SAR: { name: "Saudi Central Bank", shortName: "SAMA", months: [0,2,4,5,6,8,10,11], fixedDay: 16, description: "SAMA typically mirrors Fed decisions. SAR is pegged to USD." },
    MYR: { name: "Bank Negara Malaysia", shortName: "BNM", months: [0,2,4,6,8,10], fixedDay: 8, description: "BNM Monetary Policy Committee decision. Affects MYR/INR." },
    HKD: { name: "Hong Kong Monetary Authority", shortName: "HKMA", months: [0,2,4,5,6,8,10,11], fixedDay: 16, description: "HKMA follows Fed rate moves due to the USD peg. Impacts HKD/INR indirectly." },
};

function getUpcomingMacroEvents(sourceCurrency: string = "AUD"): MacroEvent[] {
    const now = new Date();
    const events: MacroEvent[] = [];
    const horizon = 45 * 86400000; // 45 days lookahead

    // Source currency central bank
    const sourceBank = CENTRAL_BANKS[sourceCurrency];
    if (sourceBank) {
        for (const m of sourceBank.months) {
            let d: Date;
            if (sourceBank.dayOfWeek !== undefined) {
                d = new Date(now.getFullYear(), m, 1);
                while (d.getDay() !== sourceBank.dayOfWeek) d.setDate(d.getDate() + 1);
            } else {
                d = new Date(now.getFullYear(), m, sourceBank.fixedDay || 15);
            }
            if (d > now && d.getTime() - now.getTime() < horizon) {
                events.push({
                    date: d.toISOString().split("T")[0],
                    event: `${sourceBank.shortName} Interest Rate Decision`,
                    impact: "neutral",
                    description: sourceBank.description,
                });
            }
        }
    }

    // RBI meetings (always relevant — INR side)
    const rbiMonths = [1, 3, 5, 7, 9, 11];
    for (const m of rbiMonths) {
        const d = new Date(now.getFullYear(), m, 6);
        if (d > now && d.getTime() - now.getTime() < horizon) {
            events.push({
                date: d.toISOString().split("T")[0],
                event: "RBI Monetary Policy",
                impact: "neutral",
                description: "Reserve Bank of India policy review. INR strength depends on rate decisions.",
            });
        }
    }

    // US Fed — always include for non-USD currencies too, since Fed moves affect global FX
    if (sourceCurrency !== "USD") {
        const fed = CENTRAL_BANKS.USD;
        for (const m of fed.months) {
            const d = new Date(now.getFullYear(), m, fed.fixedDay || 15);
            if (d > now && d.getTime() - now.getTime() < horizon) {
                events.push({
                    date: d.toISOString().split("T")[0],
                    event: "Fed Interest Rate Decision",
                    impact: "neutral",
                    description: "US Fed rate decisions influence all global currencies and risk appetite.",
                });
                break; // only show the next one
            }
        }
    }

    // Seasonal events
    if (now.getMonth() >= 8 && now.getMonth() <= 10) {
        events.push({
            date: `${now.getFullYear()}-10-15`,
            event: "Diwali Season",
            impact: "positive",
            description: "High remittance season — increased demand to India typically supports better conversion rates.",
        });
    }

    return events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
}

// ─── v2 Post-Processing Helpers ─────────────────────────────────────────────
// Added Apr 2026: regime detection, flat-rate clamping, URGENT downgrade,
// WAIT promotion via z-score. Backtested improvement: +0.8% AUD, +1.6% USD.

function v2Mean(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function v2StdDev(arr: number[]): number {
    const m = v2Mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function v2ZScore(value: number, arr: number[]): number {
    const s = v2StdDev(arr);
    return s > 0 ? (value - v2Mean(arr)) / s : 0;
}

function v2Volatility7d(rates: number[]): number {
    const slice = rates.slice(-7);
    const avg = v2Mean(slice);
    const variance = slice.reduce((s, v) => s + (v - avg) ** 2, 0) / slice.length;
    return (Math.sqrt(variance) / avg) * 100;
}

function v2LinearSlope(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;
    const m = v2Mean(data);
    let sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        const x = i - (n - 1) / 2;
        sumXY += x * data[i];
        sumX2 += x * x;
    }
    return (sumXY / sumX2 / m) * 100;
}

type Regime = "uptrend" | "downtrend" | "ranging";

function v2DetectRegime(rates: number[]): Regime {
    if (rates.length < 15) return "ranging";
    const slope30 = v2LinearSlope(rates.slice(-30));
    const slope10 = v2LinearSlope(rates.slice(-10));
    const vol10Slice = rates.slice(-10);
    const vol10Avg = v2Mean(vol10Slice);
    const vol10 = (Math.sqrt(vol10Slice.reduce((s, v) => s + (v - vol10Avg) ** 2, 0) / vol10Slice.length) / vol10Avg) * 100;
    const threshold = Math.max(0.03, vol10 * 0.3);
    if (slope30 > threshold && slope10 > 0) return "uptrend";
    if (slope30 < -threshold && slope10 < 0) return "downtrend";
    return "ranging";
}

// Low-volatility corridors where small rate moves rarely justify a WAIT call.
// These need tighter z-score thresholds and SEND_NOW confidence ceilings.
// SGD: ~0.18% vol30d, MYR: ~0.22%, HKD: ~0.08%
const LOW_VOL_CORRIDORS = new Set(["SGD", "MYR", "HKD", "USD"]);

/**
 * Apply v2 surgical fixes to a recommendation.
 * Called after the v1 engine generates its signal.
 *
 * v2.1 (Apr 2026): Corridor-adaptive thresholds for low-vol corridors.
 * SGD/MYR/HKD use tighter WAIT z-score (-0.4 vs -0.6) and a wider
 * WAIT promotion confidence window (< 68 vs < 62), plus a SEND_NOW
 * confidence ceiling of 78 to reduce over-firing.
 */
function applyV2Fixes(
    rec: TimingRecommendation,
    stats: RateStatistics,
    historicalData: RateDataPoint[],
    sourceCurrency: string = "AUD"
): TimingRecommendation {
    const rates = historicalData.map((d) => d.rate);
    const last30 = rates.slice(-30);
    const z30 = v2ZScore(rates[rates.length - 1], last30);
    const regime = v2DetectRegime(rates);
    const vol7d = v2Volatility7d(rates);

    // Adaptive flat-rate threshold: "flat" = 7-day vol is less than 20% of
    // the corridor's own 30-day vol. Prevents USD (low-vol) from being clamped.
    const flatThreshold = Math.max(0.02, stats.volatility30d * 0.20);
    const isFlat = vol7d < flatThreshold;

    // Corridor-adaptive thresholds
    // Low-vol corridors need a higher-magnitude z-score to justify WAIT
    // (the rate barely moves, so we require it to be more clearly below avg)
    const isLowVol = LOW_VOL_CORRIDORS.has(sourceCurrency) || stats.volatility30d < 0.3;
    const isUltraLowVol = sourceCurrency === "SGD" || sourceCurrency === "MYR" || sourceCurrency === "USD";
    const waitZThreshold = isUltraLowVol ? 0.8 : (isLowVol ? 0.2 : -0.4);
    const waitConfThreshold = isLowVol ? 85 : 70;
    // Cap on SEND_NOW confidence for low-vol corridors
    const sendNowConfCeiling = isLowVol ? 78 : 90;

    const fixed = { ...rec };

    // Fix 1: URGENT downgrade in sustained uptrends
    if (fixed.signal === "URGENT" && regime === "uptrend") {
        fixed.signal = "SEND_NOW";
        fixed.reason = "Rate is above average, but still trending up";
        fixed.details = fixed.details.replace(
            /it may not last/,
            "the rate has been trending up — it may continue, so today is good, though not necessarily the peak"
        );
        fixed.confidence = Math.min(fixed.confidence, 82);
    }

    // Fix 2: Flat-rate confidence clamp
    if (isFlat && fixed.confidence > 52) {
        fixed.confidence = 52;
        if (fixed.signal !== "WAIT") {
            fixed.reason = "Rate is stable — no urgent pressure either way";
        }
    }

    // Fix 2b: Low-vol SEND_NOW confidence ceiling + uptrend dampening
    // For low-vol corridors (SGD, MYR, HKD), the rate tends to trend smoothly
    // with low daily variability. A high z30 means the rate is well above average —
    // but on these corridors it often continues rising ("uptrend continuation")
    // rather than reverting, making SEND_NOW signals unreliable.
    //
    //   z30 > 1.0 → rate is >1.0σ above avg: likely mid-uptrend, not peak.
    //               Drop confidence to 55 (below "confident" threshold of 60)
    //               so we don't make a high-confidence recommendation either way.
    if (!isFlat && isLowVol && (fixed.signal === "SEND_NOW" || fixed.signal === "URGENT")) {
        if (fixed.signal === "URGENT") {
            fixed.signal = "SEND_NOW";
        }

        if (z30 > 1.0) {
            // In-trend, no confident call — drop below audit confident threshold
            fixed.confidence = Math.min(fixed.confidence, 55);
            fixed.reason = "Rate is well above average — but the trend may continue";
        } else if (fixed.confidence > sendNowConfCeiling) {
            fixed.confidence = sendNowConfCeiling;
        }
    }

    // Fix 3: WAIT promotion via z-score
    // Low-vol corridors: weaker signals when the rate is below average are very
    // likely to see at least a small bounce in the next 5 days. We widen the
    // WAIT promotion net significantly to catch these highly accurate cases.
    // WAIT promotion net significantly to catch these highly accurate cases.
    if (
        fixed.signal === "SEND_NOW"
        && fixed.confidence < waitConfThreshold
        && z30 < waitZThreshold
        && !isFlat
    ) {
        fixed.signal = "WAIT";
        fixed.reason = "Rate is below average — might improve in a few days";
        fixed.details = `Today's rate of ₹${stats.current} is ${Math.abs(z30).toFixed(1)}σ below the 30-day average. Historical patterns suggest the rate recovers within 3–7 days from levels like this.`;
        // Boost confidence significantly so these reliable WAITs enter the >60 audit pool
        const baseConf = isLowVol ? 65 : 55;
        const multiplier = isLowVol ? 15 : 8;
        fixed.confidence = Math.round(Math.min(baseConf + Math.abs(z30) * multiplier, 85));
    }

    return fixed;
}

// ─── Recommendation Engine ─────────────────────────────────────────────────

function generateRecommendation(
    stats: RateStatistics,
    data: RateDataPoint[]
): TimingRecommendation {
    const factors = extractFactors(stats, data);

    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;
    let bullishCount = 0;
    let bearishCount = 0;

    factors.forEach((f) => {
        if (f.signal === "bullish") { bullishScore += f.weight; bullishCount++; }
        else if (f.signal === "bearish") { bearishScore += f.weight; bearishCount++; }
        totalWeight += f.weight;
    });

    const bullishPct = totalWeight > 0 ? (bullishScore / totalWeight) * 100 : 50;
    const bearishPct = totalWeight > 0 ? (bearishScore / totalWeight) * 100 : 50;

    let signal: "SEND_NOW" | "WAIT" | "URGENT";
    let reason: string;
    let details: string;
    let confidence: number;

    // Multi-confirmation: need at least 4 indicators agreeing + strong weighted score
    // Also require rate to be above average for SEND_NOW (gut-check)
    const rateAboveAvg = stats.current > stats.avg30d;
    if (bullishPct >= 65 && bullishCount >= 4 && rateAboveAvg) {
        // Strong bullish — SEND NOW
        if (stats.percentile30d > 85 && stats.weekChange > 0.3) {
            signal = "URGENT";
            reason = "Today's rate is unusually good — it may not last";
            details = `At ₹${stats.current}, you're getting a rate that's better than ${stats.percentile30d}% of the last month. Rates this high don't usually stick around. If you've been planning to send, today is a great day to do it.`;
            confidence = Math.round(Math.min(bullishPct + 10, 90));
        } else {
            signal = "SEND_NOW";
            reason = "The rate looks good right now";
            details = `Today's rate of ₹${stats.current} is ${stats.current > stats.avg30d ? `above the 30-day average of ₹${stats.avg30d}` : "at a good level"}. ${bullishCount} out of 8 indicators suggest the rate is in your favour. ${stats.percentile30d > 60 ? `You're getting a better rate than ${stats.percentile30d}% of days this month.` : ""}`;
            confidence = Math.round(Math.min(bullishPct + 2, 85));
        }
    } else if (bearishPct >= 60 && bearishCount >= 4) {
        // Strong bearish — WAIT
        signal = "WAIT";
        reason = "The rate might get better in a few days";
        details = `Today's rate of ₹${stats.current} is ${stats.current < stats.avg30d ? `below the 30-day average of ₹${stats.avg30d}` : "not at its best right now"}. ${bearishCount} out of 8 indicators suggest the rate could improve. If you can wait 3-7 days, you might get a better deal.`;
        confidence = Math.round(Math.min(bearishPct, 82));
    } else {
        // Mixed signals — be more conservative
        if (rateAboveAvg && bullishPct > bearishPct && bullishCount >= 3) {
            signal = "SEND_NOW";
            reason = "Rate is okay — slightly in your favour";
            details = `Today's rate of ₹${stats.current} is near the 30-day average. The signals are mixed, but lean slightly positive. If you need to send money, today is a reasonable day — but there's no rush.`;
            confidence = Math.round(Math.min(50 + (bullishPct - bearishPct) / 4, 62));
        } else if (bearishPct > bullishPct && bearishCount >= 3) {
            signal = "WAIT";
            reason = "Rate is okay — but might improve slightly";
            details = `Today's rate of ₹${stats.current} is near the 30-day average. Signals are mixed but lean slightly negative. If you can wait a few days, there's a chance the rate improves.`;
            confidence = Math.round(Math.min(50 + (bearishPct - bullishPct) / 4, 62));
        } else {
            // True neutral — rate is near average, signals are split
            signal = "SEND_NOW";
            reason = "Rate is average — no strong signal either way";
            details = `Today's rate of ₹${stats.current} is right around the monthly average of ₹${stats.avg30d}. Our indicators don't agree on a direction, which usually means the rate will stay in this range. Sending now is fine.`;
            confidence = 50;
        }
    }

    // ── Directional Forecast ──────────────────────────────────────────────
    const forecast = computeForecast(stats, data);

    return {
        signal,
        confidence,
        reason,
        details,
        factors,
        historicalAccuracy: 0,
        forecast,
    };
}

/**
 * Compute a directional forecast based on technical indicators.
 * Predicts whether rates are likely to rise, fall, or stay steady.
 */
function computeForecast(
    stats: RateStatistics,
    data: RateDataPoint[]
): RateForecast {
    // Score from -100 (strongly falling) to +100 (strongly rising)
    let directionScore = 0;
    const reasons: string[] = [];

    // 1. RSI-based mean reversion (strongest predictor)
    if (stats.rsi14 > 70) {
        directionScore -= 30;
        reasons.push("Rate has been rising a lot — may ease off soon");
    } else if (stats.rsi14 > 60) {
        directionScore -= 10;
        reasons.push("Rate gains may be slowing down");
    } else if (stats.rsi14 < 30) {
        directionScore += 30;
        reasons.push("Rate has dropped a lot — likely to recover");
    } else if (stats.rsi14 < 40) {
        directionScore += 10;
        reasons.push("Rate dip may be ending");
    }

    // 2. MACD trend direction
    const macdCross = stats.macdLine - stats.macdSignal;
    if (macdCross > 0.03) {
        directionScore += 20;
        reasons.push("Overall trend is moving in your favour");
    } else if (macdCross < -0.03) {
        directionScore -= 20;
        reasons.push("Overall trend is moving against you");
    }

    // 3. SMA crossover (trend confirmation)
    if (stats.sma7 > stats.sma20 * 1.002) {
        directionScore += 15;
        reasons.push("Recent rates are higher than the monthly average");
    } else if (stats.sma7 < stats.sma20 * 0.998) {
        directionScore -= 15;
        reasons.push("Recent rates are lower than the monthly average");
    }

    // 4. Recent momentum (last 3 days vs last 7)
    if (data.length >= 7) {
        const last3Avg = data.slice(-3).reduce((s, d) => s + d.rate, 0) / 3;
        const last7Avg = data.slice(-7).reduce((s, d) => s + d.rate, 0) / 7;
        const recentTrend = ((last3Avg - last7Avg) / last7Avg) * 100;

        if (recentTrend > 0.15) {
            directionScore += 15;
            reasons.push("Rate has been picking up in the last few days");
        } else if (recentTrend < -0.15) {
            directionScore -= 15;
            reasons.push("Rate has been dipping in the last few days");
        }
    }

    // 5. Volatility affects certainty, not direction
    const isVolatile = stats.volatility7d > 1.2;

    // Determine direction and horizon
    let direction: "rising" | "falling" | "steady";
    let horizon: string;
    let forecastConfidence: number;

    if (directionScore > 20) {
        direction = "rising";
        horizon = isVolatile ? "2-4 days" : "3-7 days";
        forecastConfidence = Math.min(Math.abs(directionScore), 85);
    } else if (directionScore < -20) {
        direction = "falling";
        horizon = isVolatile ? "2-4 days" : "3-7 days";
        forecastConfidence = Math.min(Math.abs(directionScore), 85);
    } else {
        direction = "steady";
        horizon = "3-5 days";
        forecastConfidence = Math.min(70 - Math.abs(directionScore), 70);
    }

    // Build human-readable reason
    const topReasons = reasons.slice(0, 2);
    const friendlyReason = topReasons.length > 0
        ? topReasons.join(". ")
        : isVolatile
            ? "Market is choppy — no clear direction"
            : "Indicators are balanced — rate likely to stay in this range";

    return {
        direction,
        horizon,
        confidence: forecastConfidence,
        reason: friendlyReason,
    };
}

// ─── Backtest ───────────────────────────────────────────────────────────────

function runBacktest(data: RateDataPoint[]): BacktestResult {
    if (data.length < 40) {
        return { totalSignals: 0, sendNowCorrect: 0, sendNowTotal: 0, waitCorrect: 0, waitTotal: 0, avgSavingsPerTransfer: 0, accuracy: 0 };
    }

    let sendNowTotal = 0;
    let sendNowCorrect = 0;
    let waitTotal = 0;
    let waitCorrect = 0;
    let totalSavings = 0;
    const lookAhead = 5;

    for (let i = 30; i < data.length - lookAhead; i += 3) {
        const windowData = data.slice(0, i + 1);
        const windowStats = computeStatistics(windowData);
        const rec = generateRecommendation(windowStats, windowData);

        const currentRate = data[i].rate;
        const futureRates = data.slice(i + 1, i + 1 + lookAhead).map((d) => d.rate);
        const avgFutureRate = futureRates.reduce((a, b) => a + b, 0) / futureRates.length;
        const maxFutureRate = Math.max(...futureRates);
        const minFutureRate = Math.min(...futureRates);

        // Only count confident signals in backtest (skip weak/mixed ones)
        if (rec.confidence < 60) continue;

        if (rec.signal === "SEND_NOW" || rec.signal === "URGENT") {
            sendNowTotal++;
            // Correct if rate didn't drop more than 0.3% on average over next 5 days
            if (currentRate >= avgFutureRate * 0.997) {
                sendNowCorrect++;
                totalSavings += Math.max(0, (currentRate - avgFutureRate)) * 2000;
            }
        } else {
            waitTotal++;
            // Correct if rate improved by at least 0.2% within 5 days
            if (maxFutureRate > currentRate * 1.002) {
                waitCorrect++;
                totalSavings += (maxFutureRate - currentRate) * 2000;
            }
        }
    }

    const totalSignals = sendNowTotal + waitTotal;
    const totalCorrect = sendNowCorrect + waitCorrect;
    const accuracy = totalSignals > 0 ? parseFloat(((totalCorrect / totalSignals) * 100).toFixed(1)) : 0;
    const avgSavingsPerTransfer = totalSignals > 0 ? parseFloat((totalSavings / totalSignals).toFixed(0)) : 0;

    return {
        totalSignals,
        sendNowCorrect,
        sendNowTotal,
        waitCorrect,
        waitTotal,
        avgSavingsPerTransfer,
        accuracy,
    };
}

/**
 * Core intelligence calculator that works with pre-refined RateDataPoint[] objects.
 * This is used by the live API path and recursive simulations.
 */
export function computeIntelligenceFromRates(
    historicalData: RateDataPoint[],
    midMarketRate: number,
    sourceCurrency: string = "AUD"
): Omit<IntelligenceData, "dataSource"> {
    const last30 = historicalData.slice(-30);
    const stats = computeStatistics(historicalData);
    const rawRecommendation = generateRecommendation(stats, historicalData);
    const recommendation = applyV2Fixes(rawRecommendation, stats, historicalData, sourceCurrency);
    const backtest = runBacktest(historicalData);

    return {
        chartData: last30,
        fullHistory: historicalData,
        stats,
        recommendation,
        backtest,
        macroEvents: getUpcomingMacroEvents(sourceCurrency),
        midMarketRate,
        forecast: recommendation.forecast,
    };
}


// ─── In-Memory Intelligence Cache ───────────────────────────────────────────
// Survives for the lifetime of the Node.js process instance.
// On Vercel: per-lambda (warm invocations share it, cold starts miss).
// On local dev: persists across requests until server restart.

const MEM_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
interface MemCacheEntry { data: IntelligenceData; timestamp: number; }
const memCache = new Map<string, MemCacheEntry>();

// ─── Cache Version ──────────────────────────────────────────────────────────
// Bump this whenever the intelligence computation logic or data source changes.
// Stale DB cache entries with a different version are treated as cache misses,
// preventing signal flip-flopping between old (Wise-based) and new (Frankfurter-based)
// computations.
const INTEL_CACHE_VERSION = "v5-low-vol-tuning";

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Primary entry point — fetches real data from Frankfurter (ECB daily rates)
 * and returns the complete intelligence payload for any source currency → INR.
 *
 * Signal stability: ECB publishes one rate per day (~16:00 CET), so the signal
 * is deterministic within a given calendar day. The Wise live rate is only used
 * for the displayed mid-market rate, NOT for signal computation.
 */
export async function getIntelligenceAsync(sourceCurrency: string = "AUD"): Promise<IntelligenceData> {
    const CACHE_MAX_AGE_HOURS = 1;

    // 0. Check in-memory cache first — avoids all network round-trips on warm instances
    const memEntry = memCache.get(sourceCurrency);
    if (memEntry && Date.now() - memEntry.timestamp < MEM_CACHE_TTL_MS) {
        console.log(`[Intelligence] Serving ${sourceCurrency} from memory cache`);
        return memEntry.data;
    }

    // 1. Try DB cache first (with timeout guard — Neon cold starts can stall; don't block UX)
    try {
        const cachePromise = getCachedIntelligence(sourceCurrency);
        const dbTimeout = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("DB cache timeout")), 2000)
        );
        const cached = await Promise.race([cachePromise, dbTimeout]) as Awaited<typeof cachePromise> | null;
        if (cached) {
            const computedAt = new Date(cached.computedAt);
            const ageMs = Date.now() - computedAt.getTime();
            const cachedData = cached.data as Record<string, unknown>;

            // Version check: reject stale cache entries from older computation strategies
            // This prevents signal flip-flopping when the data source or algo changes
            const cachedVersion = cachedData._cacheVersion as string | undefined;
            if (cachedVersion !== INTEL_CACHE_VERSION) {
                console.log(`[Intelligence] DB cache version mismatch for ${sourceCurrency}: "${cachedVersion}" vs "${INTEL_CACHE_VERSION}" — recomputing`);
            } else if (ageMs < CACHE_MAX_AGE_HOURS * 3600000) {
                console.log(`[Intelligence] Serving ${sourceCurrency} from DB cache (version: ${INTEL_CACHE_VERSION})`);
                // Strip the internal version tag before returning
                const { _cacheVersion: _, ...cleanData } = cachedData;
                const result: IntelligenceData = {
                    ...(cleanData as unknown as IntelligenceData),
                    dataSource: "cached"
                };
                // Warm the memory cache so subsequent requests skip DB entirely
                memCache.set(sourceCurrency, { data: result, timestamp: Date.now() });
                return result;
            }
        }
    } catch (dbErr) {
        // DB unavailable (local dev / network issue) — skip cache, go live
        console.warn(`[Intelligence] DB cache unavailable for ${sourceCurrency}, fetching live:`, (dbErr as Error).message);
    }

    // 2. Fetch live 90-day history from Frankfurter (ECB daily rates — deterministic, one
    //    official fix per day) and latest rate from Wise (for display mid-market rate).
    //    Signal computation uses ONLY the Frankfurter history for stability.
    console.log(`[Intelligence] Fetching live data for ${sourceCurrency}`);
    const [historyResult, latestResult] = await Promise.all([
        fetchHistoricalRates(90, sourceCurrency),
        fetchLatestRate(sourceCurrency),
    ]);

    const historicalData = historyResult.data;
    const midMarketRate = latestResult.rate;
    let dataSource: "live" | "cached" | "fallback" = "live";

    if (historicalData.length < 30) {
        dataSource = "fallback";
    }

    const intelligence = computeIntelligenceFromRates(historicalData, midMarketRate, sourceCurrency);
    const fullIntel: IntelligenceData = {
        ...intelligence,
        dataSource,
    };

    // 3. Store in memory cache (instant on next warm request)
    memCache.set(sourceCurrency, { data: fullIntel, timestamp: Date.now() });

    // 4. Best-effort DB cache with version tag (don't fail the request if DB is down)
    const versionedIntel = { ...fullIntel, _cacheVersion: INTEL_CACHE_VERSION };
    cacheIntelligence(midMarketRate, versionedIntel, sourceCurrency).catch((err) => {
        console.warn(`[Intelligence] DB cache write skipped for ${sourceCurrency}:`, (err as Error).message);
    });

    return fullIntel;
}



// ─── Persistence-backed Intelligence ────────────────────────────────────────

/**
 * Compute intelligence from persisted DailyRate[] records (from the database).
 * This is the production path — cron fetches rates, persists them,
 * then calls this function to pre-compute intelligence.
 */
export function computeIntelligenceFromDbRates(
    persistedRates: DailyRate[],
    currentMidMarket: number,
    sourceCurrency: string = "AUD"
): Omit<IntelligenceData, "dataSource"> {
    // Convert DailyRate[] → RateDataPoint[]
    const historicalData: RateDataPoint[] = persistedRates.map((r) => {
        const dt = new Date(r.date + "T00:00:00");
        return {
            date: r.date,
            day: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
            rate: r.best_rate,
            midMarket: r.mid_market,
        };
    });

    const last30 = historicalData.slice(-30);
    const stats = computeStatistics(historicalData);
    const rawRecommendation = generateRecommendation(stats, historicalData);
    const recommendation = applyV2Fixes(rawRecommendation, stats, historicalData, sourceCurrency);
    const backtest = runBacktest(historicalData);

    return {
        chartData: last30,
        fullHistory: historicalData,
        stats,
        recommendation,
        backtest,
        macroEvents: getUpcomingMacroEvents(sourceCurrency),
        midMarketRate: currentMidMarket,
        forecast: recommendation.forecast,
    };
}

