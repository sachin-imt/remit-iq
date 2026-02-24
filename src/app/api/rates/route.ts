import { NextResponse } from "next/server";
import { getCachedIntelligence, isIntelligenceFresh, getRecentRates, getLatestRate, cacheIntelligence, getRateCount, getProviderConfigs } from "@/lib/db";
import { getIntelligenceAsync, computeIntelligenceFromRates } from "@/lib/intelligence";
import { getPlatforms, getRankedPlatforms } from "@/data/platforms";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function GET() {
    try {
        // ── Try serving from pre-computed cache first ───────────────────────
        if (await isIntelligenceFresh(24)) {
            const cached = (await getCachedIntelligence())!;
            const intel = cached.data as Record<string, unknown>;
            const midMarketRate = cached.midMarketRate;
            const providerConfigs = await getProviderConfigs();
            const platforms = getPlatforms(midMarketRate, 2000, providerConfigs);
            const ranked = getRankedPlatforms(2000, midMarketRate, providerConfigs);

            console.log("[RemitIQ API] Serving from pre-computed cache (computed at:", cached.computedAt, ")");

            return NextResponse.json({
                midMarketRate,
                chartData: intel.chartData,
                stats: intel.stats,
                recommendation: intel.recommendation,
                backtest: intel.backtest,
                macroEvents: intel.macroEvents,
                platforms,
                ranked,
                providerConfigs,
                dataSource: "live",
                lastUpdated: cached.computedAt,
                source: "db_cache",
            });
        }

        // ── Fallback: try computing from persisted rates ───────────────────
        const rateCount = await getRateCount();
        if (rateCount >= 30) {
            console.log("[RemitIQ API] Cache stale, recomputing from", rateCount, "persisted rates");

            const persistedRates = await getRecentRates(180);
            const latestRate = await getLatestRate();
            const midMarketRate = latestRate?.mid_market || 64.10;

            const intel = computeIntelligenceFromRates(persistedRates, midMarketRate);

            // Cache the result for next time
            await cacheIntelligence(midMarketRate, intel);

            const providerConfigs = await getProviderConfigs();
            const platforms = getPlatforms(midMarketRate, 2000, providerConfigs);
            const ranked = getRankedPlatforms(2000, midMarketRate, providerConfigs);

            return NextResponse.json({
                midMarketRate,
                chartData: intel.chartData,
                stats: intel.stats,
                recommendation: intel.recommendation,
                backtest: intel.backtest,
                macroEvents: intel.macroEvents,
                platforms,
                ranked,
                providerConfigs,
                dataSource: "live",
                lastUpdated: new Date().toISOString(),
                source: "db_recomputed",
            });
        }

        // ── Last resort: fetch live and seed DB ────────────────────────────
        console.log("[RemitIQ API] No persisted rates, fetching live and seeding DB");

        const intel = await getIntelligenceAsync();
        const providerConfigs = await getProviderConfigs();
        const platforms = getPlatforms(intel.midMarketRate, 2000, providerConfigs);
        const ranked = getRankedPlatforms(2000, intel.midMarketRate, providerConfigs);

        return NextResponse.json({
            midMarketRate: intel.midMarketRate,
            chartData: intel.chartData,
            stats: intel.stats,
            recommendation: intel.recommendation,
            backtest: intel.backtest,
            macroEvents: intel.macroEvents,
            platforms,
            ranked,
            providerConfigs,
            dataSource: intel.dataSource,
            lastUpdated: new Date().toISOString(),
            source: "api_live",
        });
    } catch (error) {
        console.error("[RemitIQ API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch rate data" },
            { status: 500 }
        );
    }
}
