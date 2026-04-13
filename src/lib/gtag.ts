/**
 * Google Ads / gtag.js utility
 *
 * Set NEXT_PUBLIC_GOOGLE_ADS_ID in your Vercel environment variables
 * (e.g. "AW-123456789") and all conversion events will fire automatically.
 * Until the var is set the functions are no-ops — safe to deploy now.
 */

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";

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

  // Standard GA4-style event — configure a conversion in Google Ads to match
  window.gtag("event", "provider_click", {
    send_to: GOOGLE_ADS_ID,
    provider_id: providerId,
    provider_name: providerName,
    transfer_amount: amount,
    currency,
    value: amount,          // used for conversion value reporting
    currency_code: "AUD",   // reporting currency
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
