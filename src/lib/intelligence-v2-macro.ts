/**
 * Macro Events — Extracted for use by intelligence-v2.ts
 * (Identical to the v1 implementation in intelligence.ts)
 */

import type { MacroEvent } from "./intelligence";

interface CentralBankConfig {
    name: string;
    shortName: string;
    months: number[];
    dayOfWeek?: number;
    fixedDay?: number;
    description: string;
}

const CENTRAL_BANKS: Record<string, CentralBankConfig> = {
    AUD: { name: "Reserve Bank of Australia", shortName: "RBA", months: [1,2,3,4,5,7,8,9,10,11], dayOfWeek: 2, description: "RBA monetary policy meeting. Rate decisions directly impact AUD/INR." },
    USD: { name: "US Federal Reserve", shortName: "Fed", months: [0,2,4,5,6,8,10,11], fixedDay: 15, description: "FOMC interest rate decision. The most influential central bank for global FX markets." },
    GBP: { name: "Bank of England", shortName: "BoE", months: [1,2,4,5,7,8,10,11], fixedDay: 5, description: "BoE Monetary Policy Committee decision. Directly affects GBP/INR." },
    EUR: { name: "European Central Bank", shortName: "ECB", months: [0,2,3,5,6,8,9,11], fixedDay: 12, description: "ECB Governing Council rate decision. Impacts EUR/INR and global risk sentiment." },
    CAD: { name: "Bank of Canada", shortName: "BoC", months: [0,2,3,5,6,8,9,11], fixedDay: 10, description: "Bank of Canada rate decision. Directly impacts CAD/INR." },
    NZD: { name: "Reserve Bank of New Zealand", shortName: "RBNZ", months: [1,3,4,6,7,9,10], fixedDay: 22, description: "RBNZ Official Cash Rate decision. Directly impacts NZD/INR." },
    SGD: { name: "Monetary Authority of Singapore", shortName: "MAS", months: [3,9], fixedDay: 14, description: "MAS semi-annual policy statement. Affects SGD/INR band." },
    AED: { name: "Central Bank of UAE", shortName: "CBUAE", months: [0,2,4,5,6,8,10,11], fixedDay: 16, description: "CBUAE typically follows Fed decisions. AED is pegged to USD, so Fed impacts are indirect." },
    SAR: { name: "Saudi Central Bank", shortName: "SAMA", months: [0,2,4,5,6,8,10,11], fixedDay: 16, description: "SAMA typically mirrors Fed decisions. SAR is pegged to USD." },
    MYR: { name: "Bank Negara Malaysia", shortName: "BNM", months: [0,2,4,6,8,10], fixedDay: 8, description: "BNM Monetary Policy Committee decision. Affects MYR/INR." },
    HKD: { name: "Hong Kong Monetary Authority", shortName: "HKMA", months: [0,2,4,5,6,8,10,11], fixedDay: 16, description: "HKMA follows Fed rate moves due to the USD peg. Impacts HKD/INR indirectly." },
};

export function getUpcomingMacroEvents(sourceCurrency: string = "AUD"): MacroEvent[] {
    const now = new Date();
    const events: MacroEvent[] = [];
    const horizon = 45 * 86400000;

    const sourceBank = CENTRAL_BANKS[sourceCurrency];
    if (sourceBank) {
        for (const m of sourceBank.months) {
            let d: Date;
            if (sourceBank.dayOfWeek !== undefined) {
                d = new Date(now.getFullYear(), m, 1);
                while (d.getDay() !== sourceBank.dayOfWeek) d.setDate(d.getDate() + 1);
            } else {
                d = new Date(now.getFullYear(), m, sourceBank.fixedDay || 15);
            }
            if (d > now && d.getTime() - now.getTime() < horizon) {
                events.push({
                    date: d.toISOString().split("T")[0],
                    event: `${sourceBank.shortName} Interest Rate Decision`,
                    impact: "neutral",
                    description: sourceBank.description,
                });
            }
        }
    }

    const rbiMonths = [1, 3, 5, 7, 9, 11];
    for (const m of rbiMonths) {
        const d = new Date(now.getFullYear(), m, 6);
        if (d > now && d.getTime() - now.getTime() < horizon) {
            events.push({
                date: d.toISOString().split("T")[0],
                event: "RBI Monetary Policy",
                impact: "neutral",
                description: "Reserve Bank of India policy review. INR strength depends on rate decisions.",
            });
        }
    }

    if (sourceCurrency !== "USD") {
        const fed = CENTRAL_BANKS.USD;
        for (const m of fed.months) {
            const d = new Date(now.getFullYear(), m, fed.fixedDay || 15);
            if (d > now && d.getTime() - now.getTime() < horizon) {
                events.push({
                    date: d.toISOString().split("T")[0],
                    event: "Fed Interest Rate Decision",
                    impact: "neutral",
                    description: "US Fed rate decisions influence all global currencies and risk appetite.",
                });
                break;
            }
        }
    }

    if (now.getMonth() >= 8 && now.getMonth() <= 10) {
        events.push({
            date: `${now.getFullYear()}-10-15`,
            event: "Diwali Season",
            impact: "positive",
            description: "High remittance season — increased demand to India typically supports better conversion rates.",
        });
    }

    return events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
}
