/**
 * Rate Service — Fetches real AUD/INR exchange rate data from the Frankfurter API
 * ================================================================================
 * - Free, no API key required, no rate limits
 * - Data source: European Central Bank (ECB) reference rates
 * - Updated daily on business days
 * - 1-hour in-memory cache to avoid redundant fetches during SSR
 */

import { RateDataPoint } from "./intelligence";

// ─── Cache ──────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let historicalCache: CacheEntry<RateDataPoint[]> | null = null;
let latestRateCache: CacheEntry<number> | null = null;

function isCacheValid<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  return cache !== null && Date.now() - cache.timestamp < CACHE_TTL_MS;
}

// ─── Frankfurter API Types ──────────────────────────────────────────────────

interface FrankfurterTimeSeriesResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, { INR: number }>;
}

interface FrankfurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: { INR: number };
}

// ─── Fetch Functions ────────────────────────────────────────────────────────

/**
 * Fetch the latest AUD/INR mid-market rate from the Frankfurter API.
 */
export async function fetchLatestRate(): Promise<number> {
  if (isCacheValid(latestRateCache)) {
    return latestRateCache.data;
  }

  try {
    const response = await fetch(
      "https://api.frankfurter.app/latest?from=AUD&to=INR",
      { next: { revalidate: 3600 } } // Next.js fetch cache: 1 hour
    );

    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`);
    }

    const data: FrankfurterLatestResponse = await response.json();
    const rate = data.rates.INR;

    latestRateCache = { data: rate, timestamp: Date.now() };
    return rate;
  } catch (error) {
    console.error("[RemitIQ] Failed to fetch latest rate:", error);
    // Fallback: return last cached value or a reasonable default
    if (latestRateCache) return latestRateCache.data;
    return 64.10; // Reasonable fallback based on recent AUD/INR levels
  }
}

/**
 * Fetch historical AUD/INR rates for the given number of days.
 * Returns an array of RateDataPoint sorted chronologically.
 */
export async function fetchHistoricalRates(
  days: number = 180
): Promise<RateDataPoint[]> {
  if (isCacheValid(historicalCache) && historicalCache.data.length >= days * 0.6) {
    return historicalCache.data;
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    const response = await fetch(
      `https://api.frankfurter.app/${startStr}..${endStr}?from=AUD&to=INR`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`);
    }

    const raw: FrankfurterTimeSeriesResponse = await response.json();
    const rateEntries = Object.entries(raw.rates).sort(
      ([a], [b]) => a.localeCompare(b)
    );

    const dataPoints: RateDataPoint[] = rateEntries.map(([dateStr, rates]) => {
      const dt = new Date(dateStr + "T00:00:00");
      const midMarketRate = rates.INR;

      // Platform best rate is typically 0.3-0.5% below mid-market
      // (Wise's margin is ~0.34%)
      const bestRate = parseFloat((midMarketRate * (1 - 0.0034)).toFixed(2));

      // Volume estimation based on seasonal patterns (no real volume data from ECB)
      const month = dt.getMonth();
      const isDiwaliSeason = month === 9 || month === 10;
      const volume = isDiwaliSeason
        ? 0.7 + Math.random() * 0.3
        : 0.3 + Math.random() * 0.4;

      return {
        date: dateStr,
        day: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
        rate: bestRate,
        midMarket: parseFloat(midMarketRate.toFixed(2)),
        volume: parseFloat(volume.toFixed(2)),
      };
    });

    historicalCache = { data: dataPoints, timestamp: Date.now() };

    // Also update the latest rate cache from the most recent data point
    if (dataPoints.length > 0) {
      const latest = dataPoints[dataPoints.length - 1];
      latestRateCache = { data: latest.midMarket, timestamp: Date.now() };
    }

    return dataPoints;
  } catch (error) {
    console.error("[RemitIQ] Failed to fetch historical rates:", error);
    // Fallback: return cached data if available
    if (historicalCache) return historicalCache.data;
    // Ultimate fallback: generate simulated data
    return generateFallbackData(days);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Fallback data generator — only used if the API is completely unavailable
 * and there is no cached data. Uses the same logic as the original
 * generateHistoricalData() to keep the app functional.
 */
function generateFallbackData(days: number): RateDataPoint[] {
  const data: RateDataPoint[] = [];
  let rate = 62.5;
  let midMarket = 63.0;
  const baseVol = 0.003;

  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const month = dt.getMonth();
    const dayOfWeek = dt.getDay();

    // Skip weekends (ECB doesn't publish rates on weekends)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const seasonalBias = [0.0008, 0.0005, 0.0002, -0.0002, -0.0004, -0.0003,
      -0.0005, -0.0004, -0.0001, 0.0003, 0.0006, 0.0004][month];

    const dowFactor = [0, 0.8, 1.0, 1.0, 1.0, 0.8, 0][dayOfWeek];
    const meanReversion = (63.5 - rate) * 0.02;
    const dailyReturn = (Math.random() - 0.48) * baseVol * dowFactor + seasonalBias + meanReversion;
    rate = rate * (1 + dailyReturn);
    rate = Math.max(59.0, Math.min(68.0, rate));
    midMarket = rate + 0.15 + Math.random() * 0.12;

    const isDiwaliSeason = month === 9 || month === 10;
    const volume = isDiwaliSeason ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4;

    data.push({
      date: dt.toISOString().split("T")[0],
      day: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      rate: parseFloat(rate.toFixed(2)),
      midMarket: parseFloat(midMarket.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
    });
  }

  return data;
}
