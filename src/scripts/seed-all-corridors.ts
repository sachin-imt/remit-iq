/**
 * One-off script: Seed historical rates for all ECB-supported corridors
 * =====================================================================
 * Fetches 3 years of history from Frankfurter API and persists to Neon DB.
 * Only seeds corridors that have < 100 days of data.
 *
 * Usage: npx tsx src/scripts/seed-all-corridors.ts
 */

import { fetchLongTermHistory } from "../lib/rate-service";
import { insertDailyRatesBulk, getRateCount, getSQL } from "../lib/db";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ECB/Frankfurter-supported corridors (excludes AED, QAR, KWD, SAR)
const ECB_CORRIDORS = ["AUD", "USD", "GBP", "CAD", "EUR", "SGD", "NZD", "MYR", "HKD"];

async function main() {
    console.log("RemitIQ — Seed All Corridors");
    console.log("============================\n");

    for (const currency of ECB_CORRIDORS) {
        const count = await getRateCount(currency);
        console.log(`${currency}/INR: ${count} days in DB`);

        if (count >= 100) {
            console.log(`  ✓ Already seeded, skipping.\n`);
            continue;
        }

        console.log(`  → Fetching 3 years of history from Frankfurter...`);
        try {
            const history = await fetchLongTermHistory(3, currency);
            console.log(`  → Got ${history.data.length} data points`);

            if (history.data.length === 0) {
                console.log(`  ✗ No data returned. Skipping.\n`);
                continue;
            }

            await insertDailyRatesBulk(
                history.data.map((h) => ({
                    date: h.date,
                    midMarket: h.midMarket,
                    bestRate: h.rate,
                    currency,
                }))
            );
            
            const newCount = await getRateCount(currency);
            console.log(`  ✓ Seeded! Now has ${newCount} days in DB.\n`);
        } catch (err) {
            console.error(`  ✗ Error seeding ${currency}:`, (err as Error).message, "\n");
        }
    }

    console.log("\nDone! All ECB-supported corridors should now have historical data.");
    console.log("\nNote: AED, QAR, KWD, SAR are NOT supported by ECB/Frankfurter.");
    console.log("These corridors need an alternative data source.\n");
}

main();
