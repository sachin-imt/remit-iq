export interface Platform {
  id: string;
  name: string;
  abbr: string;
  rate: number;
  fee: number;
  speed: string;
  speedDays: number;
  color: string;
  stars: number;
  badge: string | null;
  paymentMethods: string[];
  affiliateUrl: string;
  promoText: string | null;
  marginPct: number; // FX margin as a percentage of mid-market rate
  baseFee: number;
  feePct: number;
  promoMarginPct?: number; // Optional negative margin for promotional rates
  promoCap?: number; // Optional cap limit for promo rates
}

/**
 * Provider margin definitions — the percentage each provider marks up from mid-market.
 * These are realistic margins derived from actual provider behavior (Feb 2026 data).
 *
 * isLive: true if rate comes from a real API, false if estimated from margin
 * lastVerified: date when margin was last manually verified against the platform
 * marginSource: where the margin data comes from
 */
export const PROVIDER_DEFINITIONS = [
  { id: "wise", name: "Wise", abbr: "W", marginPct: 0, baseFee: 0.42, feePct: 0.50, speed: "Minutes", speedDays: 0, color: "#00B9FF", stars: 4.8, badge: "BEST RATE" as string | null, paymentMethods: ["Bank Transfer", "Debit Card", "PayID"], affiliateUrl: "https://wise.com/au/send-money/send-money-to-india", promoText: "First transfer free for new users" as string | null, isLive: true, lastVerified: "2026-02-21", marginSource: "Wise public API" },
  { id: "remitly", name: "Remitly", abbr: "R", marginPct: 0.06, baseFee: 0, feePct: 0, promoMarginPct: -0.93, promoCap: 1500, speed: "Minutes", speedDays: 0, color: "#FF6B35", stars: 4.7, badge: "NO FEES" as string | null, paymentMethods: ["Bank Transfer", "Debit Card"], affiliateUrl: "https://www.remitly.com/au/en/india", promoText: "Zero fees on first 3 transfers" as string | null, isLive: false, lastVerified: "2026-02-21", marginSource: "Manual check vs remitly.com" },
  { id: "torfx", name: "TorFX", abbr: "T", marginPct: 0.75, baseFee: 0, feePct: 0, speed: "1-2 days", speedDays: 2, color: "#818CF8", stars: 4.6, badge: null, paymentMethods: ["Bank Transfer"], affiliateUrl: "https://www.torfx.com/", promoText: null, isLive: false, lastVerified: "2026-02-21", marginSource: "Manual check vs torfx.com" },
  { id: "ofx", name: "OFX", abbr: "O", marginPct: 0.86, baseFee: 0, feePct: 0, speed: "1-2 days", speedDays: 2, color: "#34D399", stars: 4.5, badge: null, paymentMethods: ["Bank Transfer"], affiliateUrl: "https://www.ofx.com/en-au/", promoText: "No fees on transfers over $1,000" as string | null, isLive: false, lastVerified: "2026-02-21", marginSource: "Manual check vs ofx.com" },
  { id: "instarem", name: "Instarem", abbr: "I", marginPct: 1.03, baseFee: 1.99, feePct: 0, speed: "Same day", speedDays: 0.5, color: "#FBBF24", stars: 4.4, badge: null, paymentMethods: ["Bank Transfer", "PayID"], affiliateUrl: "https://www.instarem.com/en-au/", promoText: null, isLive: false, lastVerified: "2026-02-21", marginSource: "Manual check vs instarem.com" },
  { id: "wu", name: "Western Union", abbr: "WU", marginPct: 1.86, baseFee: 4.99, feePct: 0, speed: "Minutes", speedDays: 0, color: "#F87171", stars: 3.9, badge: null, paymentMethods: ["Bank Transfer", "Debit Card", "Cash"], affiliateUrl: "https://www.westernunion.com/au/en/web/send-money/estimate-details", promoText: "Zero fees & 0% margin for new users" as string | null, isLive: false, lastVerified: "2026-02-21", marginSource: "Manual check vs westernunion.com" },
];

/**
 * Compute platform rates dynamically from the real mid-market rate.
 * Each provider's rate = midMarketRate * (1 - marginPct/100)
 */
export function getPlatforms(
  midMarketRate: number,
  amount: number = 2000,
  dynamicConfigs?: { platform_id: string; margin_pct: number; base_fee: number; fee_pct: number; promo_margin_pct: number | null; promo_cap: number | null }[]
): Platform[] {
  return PROVIDER_DEFINITIONS.map((baseDef) => {
    // Override with dynamic config from DB if provided
    const config = dynamicConfigs?.find((c) => c.platform_id === baseDef.id);
    const p = {
      ...baseDef,
      marginPct: config?.margin_pct ?? baseDef.marginPct,
      baseFee: config?.base_fee ?? baseDef.baseFee,
      feePct: config?.fee_pct ?? baseDef.feePct,
      promoMarginPct: (config?.promo_margin_pct !== undefined && config?.promo_margin_pct !== null) ? config.promo_margin_pct : baseDef.promoMarginPct,
      promoCap: (config?.promo_cap !== undefined && config?.promo_cap !== null) ? config.promo_cap : baseDef.promoCap,
    };

    let effectiveRate = 0;

    // Calculate fee
    const fee = parseFloat((p.baseFee + (amount * p.feePct) / 100).toFixed(2));
    const amountAfterFee = amount - fee;

    if (amountAfterFee > 0) {
      if ('promoCap' in p && p.promoCap && 'promoMarginPct' in p && p.promoMarginPct !== undefined) {
        // Tiered rate calculation (blended rate)
        const promoRate = midMarketRate * (1 - p.promoMarginPct / 100);
        const standardRate = midMarketRate * (1 - p.marginPct / 100);

        const promoAmount = Math.min(amountAfterFee, p.promoCap);
        const standardAmount = amountAfterFee - promoAmount;

        const totalReceived = (promoAmount * promoRate) + (standardAmount * standardRate);
        effectiveRate = totalReceived / amountAfterFee;
      } else {
        // Standard calculation
        effectiveRate = midMarketRate * (1 - p.marginPct / 100);
      }
    }

    return {
      ...(p as any),
      rate: parseFloat(effectiveRate.toFixed(4)), // High precision for accurate re-calculation
      fee,
    };
  }) as Platform[];
}

/**
 * Legacy constant — still used as a fallback when async data isn't available.
 * Will be overridden by real data at runtime.
 */
export const DEFAULT_MID_MARKET_RATE = 64.10;

/**
 * Legacy PLATFORMS array — uses default mid-market rate for backward compatibility.
 * Prefer getPlatforms(realMidMarketRate) when you have live data.
 */
export const PLATFORMS: Platform[] = getPlatforms(DEFAULT_MID_MARKET_RATE, 2000);

export function calcReceived(amount: number, rate: number, fee: number): number {
  return Math.round((amount - fee) * rate);
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function getRankedPlatforms(
  amount: number,
  midMarketRate?: number,
  dynamicConfigs?: { platform_id: string; margin_pct: number; base_fee: number; fee_pct: number; promo_margin_pct: number | null; promo_cap: number | null }[]
) {
  const platforms = midMarketRate
    ? getPlatforms(midMarketRate, amount, dynamicConfigs)
    : getPlatforms(DEFAULT_MID_MARKET_RATE, amount, dynamicConfigs);
  const ranked = platforms.map((p) => ({
    ...p,
    received: calcReceived(amount, p.rate, p.fee),
    savings: 0,
  }));
  ranked.sort((a, b) => b.received - a.received);
  const worst = ranked[ranked.length - 1].received;
  ranked.forEach((p) => { p.savings = p.received - worst; });
  return ranked;
}

/**
 * Dynamically appends the transfer amount to the provider's affiliate URL
 * using their specific query parameter schema.
 */
export function getAffiliateUrlWithAmount(platformId: string, baseUrl: string, amount: number): string {
  try {
    const url = new URL(baseUrl);

    switch (platformId) {
      case "wise":
        url.searchParams.set("sourceCurrency", "AUD");
        url.searchParams.set("targetCurrency", "INR");
        url.searchParams.set("sourceAmount", amount.toString());
        break;
      case "remitly":
        url.searchParams.set("amount", amount.toString());
        break;
      case "instarem":
        // Instarem does not support URL amount parameters on their landing page
        break;
      case "wu":
        url.searchParams.set("SendAmount", amount.toString());
        url.searchParams.set("ReceiveCountry", "IN");
        url.searchParams.set("ISOCurrency", "INR");
        break;
      default:
        // Generic fallback
        url.searchParams.set("amount", amount.toString());
        break;
    }

    return url.toString();
  } catch (e) {
    // If URL parsing fails, return the original safely
    return baseUrl;
  }
}
