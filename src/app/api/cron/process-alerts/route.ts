import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCachedIntelligence, getProviderConfigs, getActiveRateAlerts, markAlertTriggered } from "@/lib/db";
import { getRankedPlatforms } from "@/data/platforms";

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (
            process.env.NODE_ENV === "production" &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return new Response("Unauthorized", { status: 401 });
        }

        const cached = getCachedIntelligence();
        if (!cached) {
            return NextResponse.json({ error: "No cached intelligence found" }, { status: 500 });
        }

        const providerConfigs = getProviderConfigs();
        const midMarketRate = cached.midMarketRate;
        const ranked = getRankedPlatforms(2000, midMarketRate, providerConfigs);
        const bestPlatform = ranked[0];

        // Use the highest actual rate a user would get
        const currentRate = bestPlatform.rate;

        // Find alerts where target_rate <= currentRate
        const triggeredAlerts = getActiveRateAlerts(currentRate);

        let emailsSent = 0;

        for (const alert of triggeredAlerts) {
            try {
                // Send email via Resend
                await resend.emails.send({
                    from: "RemitIQ Rate Alerts <alerts@remitiq.co>",
                    to: alert.email,
                    subject: `🚨 Target Rate Reached! AUD/INR is ₹${currentRate.toFixed(2)}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #0A1628; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #1E3A5F;">Great news! 🚀</h2>
                            <p style="font-size: 16px;">The AUD to INR exchange rate has hit your target of <b>₹${alert.target_rate}</b>.</p>
                            <p style="font-size: 16px;">Right now, the best rate is <b>₹${currentRate.toFixed(2)}</b> via <b>${bestPlatform.name}</b>.</p>
                            <p style="font-size: 16px;">Don't miss out on this rate. Exchange markets move fast, so consider sending money now to lock it in.</p>
                            <div style="margin-top: 30px; margin-bottom: 30px;">
                                <a href="${process.env.NODE_ENV === "production" ? "https://remitiq.co" : "http://localhost:3000"}" style="display: inline-block; padding: 14px 28px; background-color: #F0B429; color: #0A1628; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px;">Compare Live Rates</a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
                            <p style="font-size: 12px; color: #64748B;">You received this email because you signed up for Rate Alerts on RemitIQ. To stop receiving alerts, you can unsubscribe at any time.</p>
                        </div>
                    `
                });

                // Mark alert as triggered so it doesn't fire again
                markAlertTriggered(alert.id, currentRate);
                emailsSent++;
                console.log(`[Cron: Alerts] Triggered alert #${alert.id} for ${alert.email} at rate ${currentRate}`);
            } catch (err) {
                console.error(`[Cron: Alerts] Failed to send email to ${alert.email}`, err);
            }
        }

        return NextResponse.json({
            success: true,
            currentRate,
            alertsProcessed: triggeredAlerts.length,
            emailsSent,
        });

    } catch (error) {
        console.error("[Cron: Alerts] Error processing alerts:", error);
        return NextResponse.json({ error: "Failed to process alerts" }, { status: 500 });
    }
}
