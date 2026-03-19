"use client";

import AffiliateBanner from "./AffiliateBanner";
import EmailCaptureModal from "./EmailCaptureModal";
import StickyCTABar from "./StickyCTABar";
import AdUnit from "./AdUnit";

interface CalculatorLayoutProps {
  calculatorSlug: string;
  children: React.ReactNode;
}

// ── Ad slot IDs ──────────────────────────────────────────────────────────────
// Replace these with your actual Google AdSense ad unit slot IDs.
// Create ad units at: https://www.google.com/adsense → Ads → By ad unit
const AD_SLOTS = {
  inArticle: "1234567890",  // In-article ad (fluid, full-width, between content & affiliate)
  leaderboard: "0987654321", // Leaderboard (728×90, below affiliate banner on desktop)
};

export default function CalculatorLayout({
  calculatorSlug,
  children,
}: CalculatorLayoutProps) {
  return (
    <>
      {children}

      {/* ── In-Article Ad ─────────────────────────────────────────────────── */}
      {/* Sits between calculator content and affiliate banner — high viewability */}
      <section className="mx-auto max-w-6xl px-4 pt-6 pb-2">
        <div className="flex justify-center">
          <AdUnit
            size="in-article"
            slot={AD_SLOTS.inArticle}
            className="w-full max-w-2xl"
          />
        </div>
      </section>

      {/* ── Affiliate Banner ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <AffiliateBanner calculatorSlug={calculatorSlug} />
      </section>

      {/* ── Leaderboard Ad ────────────────────────────────────────────────── */}
      {/* Shown below the affiliate banner — desktop: 728×90, mobile: responsive */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex justify-center">
          <AdUnit
            size="leaderboard"
            slot={AD_SLOTS.leaderboard}
            className="w-full max-w-[728px]"
          />
        </div>
      </section>

      <EmailCaptureModal />
      <StickyCTABar />
    </>
  );
}
