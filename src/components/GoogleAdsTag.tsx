/**
 * GoogleAdsTag — loads the Google Ads gtag.js script globally.
 * Renders nothing if NEXT_PUBLIC_GOOGLE_ADS_ID is not set.
 * Place this in the root layout alongside other script tags.
 */
import Script from "next/script";

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";

export default function GoogleAdsTag() {
  if (!ADS_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){window.dataLayer.push(arguments);};
          window.gtag('js', new Date());
          window.gtag('config', '${ADS_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
