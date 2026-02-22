/**
 * Synchronous fallback data generator.
 * Only used when the async Frankfurter API is unavailable.
 */

import type { RateDataPoint } from "./intelligence";

export function generateFallbackDataSync(days: number): RateDataPoint[] {
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
