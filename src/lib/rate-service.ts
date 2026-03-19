/**
 * Rate Service — Fetches real X/INR exchange rate data
 * ======================================================
 * Primary: Wise public API (updates continuously, no auth)
 * Fallback: Frankfurter API (ECB data, updates daily)
 *
 * - 1-hour in-memory cache (keyed by currency) to avoid redundant fetches
 * - Supports any source currency → INR
 */

import type { RateDataPoint } from "./types";

// ─── Cache ──────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const historicalCacheMap = new Map<string, CacheEntry<RateDataPoint[]>>();
const latestRateCacheMap = new Map<string, CacheEntry<{ rate: number; source: string }>>();

function getCachedHistorical(currency: string): CacheEntry<RateDataPoint[]> | null {
    const entry = historicalCacheMap.get(currency) || null;
    return entry && Date.now() - entry.timestamp < CACHE_TTL_MS ? entry : null;
}

function getCachedLatest(currency: string): CacheEntry<{ rate: number; source: string }> | null {
    const entry = latestRateCacheMap.get(currency) || null;
    return entry && Date.now() - entry.timestamp < CACHE_TTL_MS ? entry : null;
}

// ─── Wise API Types ─────────────────────────────────────────────────────────

interface WiseLiveRate {
    source: string;
    target: string;
    value: number;
    time: number;
}

interface WiseHistoryRate {
    source: string;
    target: string;
    value: number;
    time: number; // epoch ms
}

// ─── Frankfurter API Types (fallback) ───────────────────────────────────────

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
 * Fetch the latest X/INR mid-market rate.
 * Primary: Wise | Fallback: Frankfurter (ECB)
 */
export async function fetchLatestRate(sourceCurrency: string = "AUD"): Promise<{ rate: number; source: string }> {
    const cached = getCachedLatest(sourceCurrency);
    if (cached) return cached.data;

    // Try Wise first
    try {
        const response = await fetch(
            `https://wise.com/rates/live?source=${sourceCurrency}&target=INR`,
            {
                headers: { "User-Agent": "RemitIQ/1.0" },
                signal: AbortSignal.timeout(5000),
            }
        );

        if (response.ok) {
            const data: WiseLiveRate = await response.json();
            const result = { rate: data.value, source: "wise" };
            latestRateCacheMap.set(sourceCurrency, { data: result, timestamp: Date.now() });
            console.log(`[RateService] Wise live ${sourceCurrency}/INR rate: ₹${data.value}`);
            return result;
        }
    } catch (error) {
        console.warn(`[RateService] Wise live ${sourceCurrency}/INR failed, falling back:`, error);
    }

    // Fallback: Frankfurter (ECB)
    try {
        const response = await fetch(
            `https://api.frankfurter.app/latest?from=${sourceCurrency}&to=INR`,
            { signal: AbortSignal.timeout(5000) }
        );

        if (response.ok) {
            const data: FrankfurterLatestResponse = await response.json();
            const result = { rate: data.rates.INR, source: "frankfurter" };
            latestRateCacheMap.set(sourceCurrency, { data: result, timestamp: Date.now() });
            console.log(`[RateService] Frankfurter ${sourceCurrency}/INR rate: ₹${data.rates.INR}`);
            return result;
        }
    } catch (error) {
        console.warn(`[RateService] Frankfurter ${sourceCurrency}/INR also failed:`, error);
    }

    // Last resort: return stale cache or hardcoded
    const stale = latestRateCacheMap.get(sourceCurrency);
    if (stale) return stale.data;
    return { rate: 64.10, source: "fallback" };
}

/**
 * Fetch historical X/INR rates.
 * Primary: Wise (30-day history) | Fallback: Frankfurter (180 days)
 */
export async function fetchHistoricalRates(
    days: number = 180,
    sourceCurrency: string = "AUD"
): Promise<{ data: RateDataPoint[]; source: string }> {
    const cached = getCachedHistorical(sourceCurrency);
    if (cached && cached.data.length >= days * 0.6) {
        return { data: cached.data, source: "cache" };
    }

    // Primary: Frankfurter (ECB daily rates — one official fix per day, never changes intraday)
    // This is the stability-critical choice: Wise "history+live" includes a live intraday rate
    // that fluctuates, causing the computed signal to flip between refreshes. ECB daily rates
    // are deterministic — the signal only changes when the next day's rate is published.
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        const response = await fetch(
            `https://api.frankfurter.app/${startStr}..${endStr}?from=${sourceCurrency}&to=INR`,
            { signal: AbortSignal.timeout(6000) }
        );

        if (response.ok) {
            const raw: FrankfurterTimeSeriesResponse = await response.json();
            const rateEntries = Object.entries(raw.rates).sort(
                ([a], [b]) => a.localeCompare(b)
            );

            const dataPoints: RateDataPoint[] = rateEntries.map(([dateStr, rates]) => {
                const dt = new Date(dateStr + "T00:00:00");
                const midMarketRate = rates.INR;
                const bestRate = parseFloat((midMarketRate * (1 - 0.0034)).toFixed(2));

                return {
                    date: dateStr,
                    day: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
                    rate: bestRate,
                    midMarket: parseFloat(midMarketRate.toFixed(2)),
                };
            });

            historicalCacheMap.set(sourceCurrency, { data: dataPoints, timestamp: Date.now() });

            if (dataPoints.length > 0) {
                const latest = dataPoints[dataPoints.length - 1];
                latestRateCacheMap.set(sourceCurrency, {
                    data: { rate: latest.midMarket, source: "frankfurter" },
                    timestamp: Date.now(),
                });
            }

            console.log(`[RateService] Frankfurter ${sourceCurrency}/INR history: ${dataPoints.length} data points`);
            return { data: dataPoints, source: "frankfurter" };
        }
    } catch (error) {
        console.warn(`[RateService] Frankfurter ${sourceCurrency}/INR history failed:`, error);
    }

    // Last resort
    const stale = historicalCacheMap.get(sourceCurrency);
    if (stale) return { data: stale.data, source: "cache" };
    return { data: generateFallbackData(days), source: "fallback" };
}

/**
 * Fetch long-term historical data (up to 3 years) from Frankfurter API.
 * Used for one-time DB seeding to enable seasonal analysis and better indicators.
 * Frankfurter API is rate-limited so we fetch in yearly chunks.
 */
export async function fetchLongTermHistory(
    years: number = 3,
    sourceCurrency: string = "AUD"
): Promise<{ data: RateDataPoint[]; source: string }> {
    const allDataPoints: RateDataPoint[] = [];

    for (let y = years; y > 0; y--) {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() - (y - 1));
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - y);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        try {
            const response = await fetch(
                `https://api.frankfurter.app/${startStr}..${endStr}?from=${sourceCurrency}&to=INR`,
                { signal: AbortSignal.timeout(15000) }
            );

            if (response.ok) {
                const raw: FrankfurterTimeSeriesResponse = await response.json();
                const rateEntries = Object.entries(raw.rates).sort(
                    ([a], [b]) => a.localeCompare(b)
                );

                for (const [dateStr, rates] of rateEntries) {
                    const dt = new Date(dateStr + "T00:00:00");
                    const midMarketRate = rates.INR;
                    const bestRate = parseFloat((midMarketRate * (1 - 0.0034)).toFixed(2));

                    allDataPoints.push({
                        date: dateStr,
                        day: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
                        rate: bestRate,
                        midMarket: parseFloat(midMarketRate.toFixed(4)),
                    });
                }

                console.log(`[RateService] Frankfurter long-term: year -${y} → ${rateEntries.length} data points`);
            }
        } catch (error) {
            console.warn(`[RateService] Frankfurter long-term year -${y} failed:`, error);
        }
    }

    // Deduplicate by date and sort
    const seen = new Set<string>();
    const deduplicated = allDataPoints.filter((dp) => {
        if (seen.has(dp.date)) return false;
        seen.add(dp.date);
        return true;
    });
    deduplicated.sort((a, b) => a.date.localeCompare(b.date));

    console.log(`[RateService] Long-term total: ${deduplicated.length} data points over ${years} years`);
    return { data: deduplicated, source: "frankfurter_longterm" };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
    return d.toISOString().split("T")[0];
}

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

    if (data.length > 0) {
        data[data.length - 1].rate = 63.88;
        data[data.length - 1].midMarket = 64.10;
    }

    return data;
}
