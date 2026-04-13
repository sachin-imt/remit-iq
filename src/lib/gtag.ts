/**
 * Google Ads / gtag.js utility
 *
 * Set NEXT_PUBLIC_GOOGLE_ADS_ID in your Vercel environment variables
 * (e.g. "AW-123456789") and all conversion events will fire automatically.
 * Until the var is set the functions are no-ops — safe to deploy now.
 */

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";

// Conversion labels from Google Ads > Goals > Conversions
const CONVERSION_PROVIDER_CLICK = `${GOOGLE_ADS_ID}/zH3SCI76kJscENX80KFC`;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire a provider outbound-click conversion (primary Google Ads event). */
export function trackProviderClick(
  providerId: string,
  providerName: string,
  amount: number,
  currency: string
) {
  if (typeof window === "undefined" || !window.gtag || !GOOGLE_ADS_ID) return;

  // Fire the specific conversion action (AW-17787272789/zH3SCI76kJscENX80KFC = "Provider Click")
  window.gtag("event", "conversion", {
    send_to: CONVERSION_PROVIDER_CLICK,
    value: amount,
    currency: "AUD",
    transaction_id: `${providerId}-${Date.now()}`,
  });

  // Also fire a named event for GA4 reporting
  window.gtag("event", "provider_click", {
    send_to: GOOGLE_ADS_ID,
    provider_id: providerId,
    provider_name: providerName,
    transfer_amount: amount,
    source_currency: currency,
  });
}

/** Fire a /compare page-view conversion. */
export function trackComparePageView(currency: string) {
  if (typeof window === "undefined" || !window.gtag || !GOOGLE_ADS_ID) return;

  window.gtag("event", "compare_page_view", {
    send_to: GOOGLE_ADS_ID,
    currency,
  });
}

/** Generic conversion helper — use for any additional conversion actions. */
export function trackConversion(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag || !GOOGLE_ADS_ID) return;

  window.gtag("event", eventName, {
    send_to: GOOGLE_ADS_ID,
    ...params,
  });
}
