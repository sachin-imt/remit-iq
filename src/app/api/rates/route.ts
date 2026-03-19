import { NextRequest, NextResponse } from "next/server";
import { getProviderConfigs } from "@/lib/db";
import { getIntelligenceAsync } from "@/lib/intelligence";
import { getPlatforms, getRankedPlatforms } from "@/data/platforms";

export const revalidate = 300; // ISR: revalidate every 5 minutes

// In-memory cache for provider configs — DB query only needed once per process lifetime
// Circuit breaker: after a failure, skip DB for 5 min so warm requests don't pay 500ms timeout
let cachedProviderConfigs: Awaited<ReturnType<typeof getProviderConfigs>> | null = null;
let configsCachedAt = 0;
let configsLastFailedAt = 0;
const CONFIGS_TTL_MS = 60 * 60 * 1000; // 1 hour
const CONFIGS_RETRY_AFTER_MS = 5 * 60 * 1000; // retry DB after 5 min following a failure

async function getProviderConfigsCached(): Promise<Awaited<ReturnType<typeof getProviderConfigs>>> {
    // Return memory-cached configs if fresh
    if (cachedProviderConfigs && Date.now() - configsCachedAt < CONFIGS_TTL_MS) {
        return cachedProviderConfigs;
    }
    // Circuit breaker: skip DB call if it failed recently
    if (configsLastFailedAt && Date.now() - configsLastFailedAt < CONFIGS_RETRY_AFTER_MS) {
        return [];
    }
    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("provider configs timeout")), 500)
        );
        const configs = await Promise.race([getProviderConfigs(), timeout]) as Awaited<ReturnType<typeof getProviderConfigs>>;
        cachedProviderConfigs = configs;
        configsCachedAt = Date.now();
        configsLastFailedAt = 0; // reset circuit breaker on success
        return configs;
    } catch {
        console.warn("[RemitIQ API] Provider configs unavailable, using hardcoded defaults");
        configsLastFailedAt = Date.now();
        return cachedProviderConfigs ?? [];
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const currency = (searchParams.get("currency") || "AUD").toUpperCase();

        // Fetch intelligence and provider configs in parallel
        const [intel, providerConfigs] = await Promise.all([
            getIntelligenceAsync(currency),
            getProviderConfigsCached(),
        ]);

        const midMarketRate = intel.midMarketRate;
        const refAmount = 2000;
        const platforms = getPlatforms(midMarketRate, refAmount, providerConfigs);
        const ranked = getRankedPlatforms(refAmount, midMarketRate, providerConfigs);

        console.log(`[RemitIQ API] Serving ${currency} rates (source: ${intel.dataSource})`);

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
            source: intel.dataSource === "cached" ? "db_cache" : "api_live",
            currency,
        });
    } catch (error) {
        console.error("[RemitIQ API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch rate data" },
            { status: 500 }
        );
    }
}
