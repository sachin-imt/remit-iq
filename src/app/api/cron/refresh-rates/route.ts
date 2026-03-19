/**
 * Cron Endpoint — Refresh Rates, Compute Intelligence, Check Alerts
 * ==================================================================
 * GET /api/cron/refresh-rates
 *
 * Called daily by Vercel Cron (or manually). Fetches latest rate from
 * Wise API (with Frankfurter fallback), persists to Postgres, computes
 * per-platform rates, pre-computes intelligence, and sends alert emails.
 */

import { NextResponse } from "next/server";
import { fetchLatestRate, fetchLongTermHistory } from "@/lib/rate-service";
import {
    insertDailyRate,
    insertDailyRatesBulk,
    insertPlatformRates,
    getRecentRates,
    getRateCount,
    cacheIntelligence,
} from "@/lib/db";
import { computeIntelligenceFromRates } from "@/lib/intelligence";
import { getPlatforms } from "@/data/platforms";
import { CORRIDORS } from "@/data/corridors";

export const dynamic = "force-dynamic"; 
export const maxDuration = 300; // Increased to 5 mins for multi-currency processing

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production" && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    const results: any[] = [];
    const today = new Date().toISOString().split("T")[0];

    // Process each corridor proactively
    for (const corridor of CORRIDORS) {
        const currency = corridor.currencyCode;
        const curStart = Date.now();
        const stats: any = { currency, status: "pending" };

        try {
            // 1. Seed history if needed
            const count = await getRateCount(currency);
            if (count < 100) {
                console.log(`[Cron] Seeding history for ${currency}...`);
                const history = await fetchLongTermHistory(3, currency);
                await insertDailyRatesBulk(history.data.map(h => ({ 
                    date: h.date,
                    midMarket: h.midMarket,
                    bestRate: h.rate,
                    currency 
                })));
                stats.seeded = history.data.length;
            }

            // 2. Fetch latest rate
            const latest = await fetchLatestRate(currency);
            await insertDailyRate(today, latest.rate, latest.rate * (1 - 0.0034), currency, latest.source);
            stats.rate = latest.rate;

            // 3. Update platform rates
            const platforms = getPlatforms(latest.rate);
            const platformData = platforms.map(p => ({
                platformId: p.id,
                rate: p.rate,
                fee: p.fee,
                marginPct: p.marginPct,
                source: p.id === "wise" ? "wise_api" : "estimated"
            }));
            await insertPlatformRates(today, platformData, currency);
            stats.platforms = platforms.length;

            // 4. Pre-compute and cache intelligence
            const recent = await getRecentRates(180, currency);
            const { computeIntelligenceFromDbRates } = await import("@/lib/intelligence");
            const intel = computeIntelligenceFromDbRates(recent, latest.rate, currency);
            
            // IntelligenceData requires dataSource, but computeIntelligenceFromDbRates returns Omit<IntelligenceData, "dataSource">
            const fullIntel = { ...intel, dataSource: "live" as const };
            await cacheIntelligence(latest.rate, fullIntel, currency);
            
            stats.signal = intel.recommendation.signal;
            stats.status = "success";
        } catch (err) {
            console.error(`[Cron] Error processing ${currency}:`, err);
            stats.status = "error";
            stats.error = String(err);
        }
        
        stats.elapsed = `${Date.now() - curStart}ms`;
        results.push(stats);
    }

    const totalElapsed = Date.now() - startTime;

    return NextResponse.json({
        success: true,
        today,
        processed: results.length,
        results,
        totalElapsed: `${totalElapsed}ms`
    });
}
