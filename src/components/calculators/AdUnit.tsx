"use client";

/**
 * AdUnit — Google AdSense display ad component
 * ─────────────────────────────────────────────
 * Setup:
 *  1. Create a Google AdSense account at https://www.google.com/adsense
 *  2. Add & verify your site (remitiq.co)
 *  3. Get your publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX)
 *  4. Create ad units in AdSense console and note each unit's `data-ad-slot` ID
 *  5. Replace ADSENSE_CLIENT with your ca-pub-XXXXXXXXXXXXXXXX
 *  6. Replace slot values below with your actual ad slot IDs
 *
 * AdSense Terms: The "Advertisement" label is required by Google AdSense policies.
 */

import { useEffect, useRef } from "react";

// ── Replace with your own publisher ID ──────────────────────────────────────
const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";

export type AdSize = "leaderboard" | "rectangle" | "in-article";

interface AdUnitProps {
  size?: AdSize;
  slot: string; // Your AdSense ad unit slot ID
  className?: string;
}

const sizeConfig: Record<AdSize, { width: number; height: number; label: string }> = {
  leaderboard:  { width: 728,  height: 90,  label: "Leaderboard (728×90)" },
  rectangle:    { width: 300,  height: 250, label: "Rectangle (300×250)" },
  "in-article": { width: 300,  height: 250, label: "In-Article (Fluid)" },
};

export default function AdUnit({ size = "rectangle", slot, className = "" }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isDevMode = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDevMode) return; // Don't load real ads in dev — show placeholder instead

    // Push ad request to AdSense after mount
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet (e.g. ad blocker, slow network) — fail silently
    }
  }, [isDevMode]);

  const cfg = sizeConfig[size];
  const isFluid = size === "in-article";

  return (
    <div
      ref={adRef}
      className={`flex flex-col items-center ${className}`}
      aria-label="Advertisement"
    >
      {/* "Advertisement" label — required by Google AdSense ToS */}
      <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest mb-1.5 select-none">
        Advertisement
      </p>

      {isDevMode ? (
        /* ── Development placeholder ─────────────────────────────────────── */
        <div
          style={{ width: cfg.width, height: cfg.height, maxWidth: "100%" }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white text-center px-4"
        >
          <div className="text-slate-300 text-2xl mb-1">📢</div>
          <p className="text-slate-400 text-[11px] font-medium">{cfg.label}</p>
          <p className="text-slate-300 text-[10px] mt-0.5">Google AdSense slot: {slot}</p>
          <p className="text-slate-300 text-[10px]">Shows in production after approval</p>
        </div>
      ) : (
        /* ── Real AdSense ad unit ────────────────────────────────────────── */
        <ins
          className="adsbygoogle"
          style={
            isFluid
              ? { display: "block", textAlign: "center" }
              : { display: "inline-block", width: cfg.width, height: cfg.height, maxWidth: "100%" }
          }
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={isFluid ? "fluid" : "auto"}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
