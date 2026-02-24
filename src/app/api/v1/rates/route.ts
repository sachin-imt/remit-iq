import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, getCachedIntelligence, isIntelligenceFresh, getRecentRates, getLatestRate, cacheIntelligence, getRateCount, getProviderConfigs } from "@/lib/db";
import { getIntelligenceAsync, computeIntelligenceFromRates } from "@/lib/intelligence";
import { getPlatforms, getRankedPlatforms } from "@/data/platforms";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate the Request
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing or invalid Authorization header. Expected 'Bearer <API_KEY>'." }, { status: 401 });
        }

        const apiKey = authHeader.split(" ")[1];
        const client = await validateApiKey(apiKey);

        if (!client) {
            return NextResponse.json({ error: "Unauthorized. Invalid API Key." }, { status: 403 });
        }

        console.log(`[B2B API] Authenticated request from client: ${client.client_name} (Tier: ${client.tier})`);

        // 2. Fetch the Data (Same logic as internal API, but formatted for external consumption)
        let intelPayload;
        let midMarketRate;

        if (await isIntelligenceFresh(24)) {
            const cached = (await getCachedIntelligence())!;
            intelPayload = cached.data as any;
            midMarketRate = cached.midMarketRate;
        } else {
            // Unlikely to hit this in production due to cron, but safe fallback
            const rateCount = await getRateCount();
            if (rateCount >= 30) {
                const persistedRates = await getRecentRates(180);
                const latestRate = await getLatestRate();
                midMarketRate = latestRate?.mid_market || 64.10;
                intelPayload = computeIntelligenceFromRates(persistedRates, midMarketRate);
                await cacheIntelligence(midMarketRate, intelPayload);
            } else {
                intelPayload = await getIntelligenceAsync();
                midMarketRate = intelPayload.midMarketRate;
            }
        }

        const providerConfigs = await getProviderConfigs();
        const ranked = getRankedPlatforms(2000, midMarketRate, providerConfigs); // Default 2k for standard comparative payload

        // 3. Format the strict B2B JSON Contract
        const responseData = {
            metadata: {
                timestamp: new Date().toISOString(),
                client: client.client_name,
                currency_pair: "AUD/INR"
            },
            market: {
                interbank_rate: midMarketRate,
                ai_signal: intelPayload.recommendation?.signal || "WAIT",
                ai_confidence: intelPayload.recommendation?.confidence || 50,
                short_term_forecast: intelPayload.recommendation?.forecast?.direction || "steady"
            },
            live_providers: ranked.map(p => ({
                id: p.id,
                name: p.name,
                offered_rate: p.rate,
                transfer_fee: p.fee,
                estimated_speed: p.speed,
                is_promo_applied: !!p.promoMarginPct
            }))
        };

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error("[B2B API] Fatal Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
