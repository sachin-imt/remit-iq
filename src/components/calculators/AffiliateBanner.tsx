"use client";

import { AFFILIATE_CONFIG, trackAffiliateClick } from "@/lib/calculator-monetization";

interface AffiliateBannerProps {
  calculatorSlug: string;
}

export default function AffiliateBanner({ calculatorSlug }: AffiliateBannerProps) {
  const config = AFFILIATE_CONFIG[calculatorSlug];
  if (!config) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
      <div className="mb-5">
        <h3 className="text-slate-900 font-bold text-lg mb-1">{config.heading}</h3>
        <p className="text-slate-500 text-sm">{config.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {config.links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener sponsored"
            onClick={() =>
              trackAffiliateClick(
                link.name.toLowerCase().replace(/\s/g, "-"),
                calculatorSlug
              )
            }
            className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-[#F0B429]/40 hover:shadow-lg hover:shadow-[#F0B429]/5 transition-all"
          >
            <span className="text-[#10B981] text-[10px] font-bold uppercase tracking-wider bg-[#10B981]/10 px-2 py-0.5 rounded-full">
              {link.tag}
            </span>
            <p className="text-slate-900 font-bold text-sm mt-2">{link.name}</p>
            <p className="text-slate-500 text-xs mt-1">{link.description}</p>
            <p className="text-[#F0B429] text-xs font-semibold mt-3 group-hover:text-yellow-400 transition-colors">
              {config.cta} →
            </p>
          </a>
        ))}
      </div>

      <p className="text-slate-500/40 text-[10px] mt-4">
        Advertiser Disclosure: We may earn a commission from partner links. This
        doesn&apos;t affect our ratings.
      </p>
    </div>
  );
}
