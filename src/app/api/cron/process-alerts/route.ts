import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getProviderConfigs, getActiveRateAlerts, markAlertTriggered, getSQL } from "@/lib/db";
import { getRankedPlatforms } from "@/data/platforms";
import { getIntelligenceAsync } from "@/lib/intelligence";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY || "missing_key_during_build");

        const authHeader = request.headers.get("authorization");
        if (
            process.env.NODE_ENV === "production" &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return new Response("Unauthorized", { status: 401 });
        }

        const providerConfigs = await getProviderConfigs();
        
        // 1. Get all unique currencies that have active alerts
        const sql = (await import("@/lib/db")).getSQL();
        const activeCurrenciesRows = await sql`SELECT DISTINCT currency_code FROM alerts WHERE is_active = TRUE`;
        const activeCurrencies = activeCurrenciesRows.map(r => r.currency_code as string);

        let totalProcessed = 0;
        let totalEmailsSent = 0;

        for (const currency of activeCurrencies) {
            try {
                // 2. Get latest intelligence for this specific currency
                const intel = await getIntelligenceAsync(currency);
                const midMarketRate = intel.midMarketRate;
                
                // Use a standard reference amount for the competitive check
                const ranked = getRankedPlatforms(2000, midMarketRate, providerConfigs);
                const bestPlatform = ranked[0];
                const currentRate = bestPlatform.rate;

                // 3. Find alerts for this currency where target_rate <= currentRate
                const triggeredAlerts = await getActiveRateAlerts(currentRate, currency);
                totalProcessed += triggeredAlerts.length;

                for (const alert of triggeredAlerts) {
                    try {
                        const currencySymbol = currency === "AUD" ? "$" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";

                        await resend.emails.send({
                            from: "RemitIQ Rate Alerts <alerts@remitiq.co>",
                            to: alert.email,
                            subject: `🚨 Target Rate Reached! ${currency}/INR is ₹${currentRate.toFixed(2)}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; color: #0F172A; max-width: 600px; margin: 0 auto; padding: 20px;">
                                    <h2 style="color: #1E3A5F;">Great news! 🚀</h2>
                                    <p style="font-size: 16px;">The ${currency} to INR exchange rate has hit your target of <b>₹${alert.target_rate}</b>.</p>
                                    <p style="font-size: 16px;">Right now, the best rate is <b>₹${currentRate.toFixed(2)}</b> via <b>${bestPlatform.name}</b>.</p>
                                    <p style="font-size: 16px;">Don't miss out on this rate. Exchange markets move fast, so consider sending money now to lock it in.</p>
                                    <div style="margin-top: 30px; margin-bottom: 30px;">
                                        <a href="${process.env.NODE_ENV === "production" ? "https://remitiq.co" : "http://localhost:3000"}" style="display: inline-block; padding: 14px 28px; background-color: #F0B429; color: #0F172A; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px;">Compare Live Rates</a>
                                    </div>
                                    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
                                    <p style="font-size: 12px; color: #64748B;">You received this email because you signed up for Rate Alerts on RemitIQ. To stop receiving alerts, you can unsubscribe at any time.</p>
                                </div>
                            `
                        });

                        await markAlertTriggered(alert.id, currentRate);
                        totalEmailsSent++;
                        console.log(`[Cron: Alerts] Triggered ${currency} alert #${alert.id} for ${alert.email} at rate ${currentRate}`);
                    } catch (err) {
                        console.error(`[Cron: Alerts] Failed to send email to ${alert.email}`, err);
                    }
                }
            } catch (err) {
                console.error(`[Cron: Alerts] Failed to process currency ${currency}`, err);
            }
        }

        return NextResponse.json({
            success: true,
            currenciesProcessed: activeCurrencies.length,
            alertsProcessed: totalProcessed,
            emailsSent: totalEmailsSent,
        });

    } catch (error) {
        console.error("[Cron: Alerts] Error processing alerts:", error);
        return NextResponse.json({ error: "Failed to process alerts" }, { status: 500 });
    }
}
