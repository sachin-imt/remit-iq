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
    getActiveRateAlerts,
    markAlertTriggered,
} from "@/lib/db";
import { computeIntelligenceFromRates } from "@/lib/intelligence";
import { getPlatforms } from "@/data/platforms";
import { sendRateAlert } from "@/lib/email";

export const dynamic = "force-dynamic"; // Never cache this endpoint
export const maxDuration = 60; // Allow up to 60s (longer for initial 3-year seed)

export async function GET(request: Request) {
    // ── Auth check for production ──────────────────────────────────────────
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    const log: string[] = [];

    try {
        // ── Step 1: Seed historical data if DB is sparse ───────────────────
        const existingCount = await getRateCount();
        log.push(`Existing rates in DB: ${existingCount}`);

        if (existingCount < 100) {
            // First run: seed 3 years of data from Frankfurter for seasonal analysis
            log.push("DB has < 100 rates, seeding 3 years of historical data...");
            const longTermResult = await fetchLongTermHistory(3);

            const bulkData = longTermResult.data.map((r) => ({
                date: r.date,
                midMarket: r.midMarket,
                bestRate: r.rate,
                source: longTermResult.source,
            }));

            const inserted = await insertDailyRatesBulk(bulkData);
            log.push(`Seeded ${inserted} historical rates (source: ${longTermResult.source})`);
        }

        // ── Step 2: Fetch today's latest rate ──────────────────────────────
        const latestResult = await fetchLatestRate();
        const latestMidMarket = latestResult.rate;
        const rateSource = latestResult.source;
        const today = new Date().toISOString().split("T")[0];
        const bestRate = parseFloat((latestMidMarket * (1 - 0.0034)).toFixed(2));

        const wasInserted = await insertDailyRate(today, latestMidMarket, bestRate, rateSource);
        log.push(
            wasInserted
                ? `Inserted today's rate: ₹${latestMidMarket} (${today}, source: ${rateSource})`
                : `Today's rate already exists (${today}), skipped`
        );

        // ── Step 3: Persist per-platform rates ─────────────────────────────
        const platforms = getPlatforms(latestMidMarket);
        const platformRateData = platforms.map((p) => ({
            platformId: p.id,
            rate: p.rate,
            fee: p.fee,
            marginPct: p.marginPct,
            source: p.id === "wise" ? "wise_api" : "estimated_margin",
        }));

        const platformCount = await insertPlatformRates(today, platformRateData);
        log.push(`Persisted ${platformCount} platform rates for ${today}`);

        // ── Step 4: Compute intelligence from persisted data ───────────────
        const persistedRates = await getRecentRates(180);
        log.push(`Computing intelligence from ${persistedRates.length} persisted rates`);

        const intelligence = computeIntelligenceFromRates(persistedRates, latestMidMarket);

        // ── Step 5: Cache the computed intelligence ────────────────────────
        await cacheIntelligence(latestMidMarket, intelligence);
        log.push("Intelligence cached successfully");

        // ── Step 6: Check and send rate alerts ─────────────────────────────
        let alertsTriggered = 0;
        const matchingAlerts = await getActiveRateAlerts(bestRate);
        log.push(`Found ${matchingAlerts.length} alerts to trigger (best rate: ₹${bestRate})`);

        for (const alert of matchingAlerts) {
            const sent = await sendRateAlert({
                to: alert.email,
                targetRate: alert.target_rate,
                currentRate: bestRate,
                midMarketRate: latestMidMarket,
            });

            if (sent) {
                await markAlertTriggered(alert.id, bestRate);
                alertsTriggered++;
                log.push(`Alert #${alert.id} triggered → ${alert.email} (target: ₹${alert.target_rate})`);
            } else {
                log.push(`Alert #${alert.id} email failed for ${alert.email} (will retry next run)`);
            }
        }

        const elapsed = Date.now() - startTime;
        log.push(`Completed in ${elapsed}ms`);

        return NextResponse.json({
            success: true,
            midMarketRate: latestMidMarket,
            rateSource,
            ratesInDb: await getRateCount(),
            platformsStored: platformCount,
            signal: intelligence.recommendation.signal,
            confidence: intelligence.recommendation.confidence,
            alertsTriggered,
            elapsed: `${elapsed}ms`,
            log,
        });
    } catch (error) {
        console.error("[Cron] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: String(error),
                log,
            },
            { status: 500 }
        );
    }
}
