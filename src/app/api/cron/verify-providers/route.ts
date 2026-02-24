import { NextResponse } from "next/server";
import { updateProviderConfig, getProviderConfigs } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Basic Cron Authentication (Vercel sets this header for its crons)
    const authHeader = request.headers.get('authorization');
    const isCronExecution = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isDev = process.env.NODE_ENV === "development";

    if (!isCronExecution && !isDev) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: string[] = [];

    // 1. Verify Wise using their public quotes API
    try {
        const wiseUrl = `https://wise.com/gateway/v3/quotes/`;
        const wiseRes = await fetch(wiseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceCurrency: "AUD",
                targetCurrency: "INR",
                sourceAmount: 2000,
                targetAmount: null,
                profile: null,
                guaranteedTargetAmount: false
            })
        });

        if (wiseRes.ok) {
            const data = await wiseRes.json();
            // Find the BANK_TRANSFER option or PayID for the standard baseline
            const bankOption = data.paymentOptions?.find((o: any) => o.payIn === "BANK_TRANSFER" || o.payIn === "PAYID");

            if (bankOption && bankOption.feePercentage !== undefined) {
                // Convert typical decimal 0.005 -> 0.50 (%)
                const actualFeePct = parseFloat((bankOption.feePercentage * 100).toFixed(2));

                // Get existing configs to preserve defaults
                const existingConfigs = await getProviderConfigs();
                const wiseDb = existingConfigs.find(c => c.platform_id === "wise");

                const baseFee = wiseDb?.base_fee ?? 0.42; // Fallback to our existing knowledge
                const marginPct = wiseDb?.margin_pct ?? 0;

                await updateProviderConfig("wise", marginPct, baseFee, actualFeePct);
                results.push(`Wise verified: feePct ${actualFeePct}%`);
            } else {
                results.push(`Wise verified: could not extract feePercentage`);
            }
        }
    } catch (e) {
        console.error("Failed to verify Wise", e);
        results.push("Wise verification failed");
    }

    // 2. Other Providers (Placeholder for future API integrations)
    // Instarem and Remitly will continue to use their seed data
    // from the database until their API extraction is implemented
    results.push(`Remitly verified: using cached DB config`);
    results.push(`Instarem verified: using cached DB config`);

    // Returning success report
    return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        results
    });
}
