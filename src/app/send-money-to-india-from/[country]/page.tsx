import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Star, Shield, Zap, TrendingUp, ChevronRight, Users, Globe, Banknote } from "lucide-react";
import { CORRIDORS, getCorridorBySlug, getAllCorridorSlugs } from "@/data/corridors";
import { PROVIDER_DEFINITIONS } from "@/data/platforms";
import { FAQSchema, FinancialServiceSchema, BreadcrumbSchema } from "@/components/JsonLd";

/* ────────────────────────── Static Params ────────────────────────── */
export function generateStaticParams() {
  return getAllCorridorSlugs().map((slug) => ({ country: slug }));
}

/* ────────────────────────── Dynamic Metadata ────────────────────────── */
type MetadataProps = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { country } = await params;
  const corridor = getCorridorBySlug(country);
  if (!corridor) {
    return { title: "Send Money to India | RemitIQ" };
  }

  const title = `Best Way to Send Money to India from ${corridor.country} (${corridor.currencyCode} → INR) | RemitIQ`;
  const description = `Compare live ${corridor.currencyCode} to INR exchange rates across ${corridor.providers.length}+ providers. Find the cheapest way to send money to India from ${corridor.country}. Save up to 5% on every transfer.`;

  return {
    title,
    description,
    keywords: [
      `send money ${corridor.country} to India`,
      `${corridor.currencyCode} to INR rate today`,
      `cheapest way to send money to India from ${corridor.country}`,
      `best ${corridor.currencyCode} to INR exchange rate`,
      `compare remittance ${corridor.country} India`,
      `${corridor.currencyCode} INR transfer`,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "RemitIQ",
    },
    alternates: {
      canonical: `https://remitiq.co/send-money-to-india-from/${corridor.slug}`,
    },
  };
}

/* ────────────────────────── Page Component ────────────────────────── */
type PageProps = { params: Promise<{ country: string }> };

export default async function CorridorPage({ params }: PageProps) {
  const { country } = await params;
  const corridor = getCorridorBySlug(country);

  if (!corridor) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Corridor Not Found</h1>
        <p className="text-slate-500 mb-8">We don&apos;t have data for this corridor yet.</p>
        <Link href="/" className="btn-primary px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2">
          Compare AUD to INR <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const availableProviders = PROVIDER_DEFINITIONS.filter((p) =>
    corridor.providers.includes(p.id)
  );

  return (
    <div>
      {/* Schema Markup */}
      <FinancialServiceSchema
        name="RemitIQ"
        url={`https://remitiq.co/send-money-to-india-from/${corridor.slug}`}
        description={`Compare live ${corridor.currencyCode} to INR exchange rates for sending money from ${corridor.country} to India.`}
        areaServed={[corridor.country, "India"]}
      />
      <FAQSchema items={corridor.faq} />
      <BreadcrumbSchema
        items={[
          { name: "RemitIQ", url: "https://remitiq.co" },
          { name: "Send Money to India", url: "https://remitiq.co/send-money-to-india-from/australia" },
          { name: corridor.country, url: `https://remitiq.co/send-money-to-india-from/${corridor.slug}` },
        ]}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium">Send Money to India from {corridor.country}</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <span className="text-2xl">{corridor.flag}</span>
              <span className="text-slate-700 text-sm font-semibold">{corridor.currencyCode} → INR</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
              Best Way to Send Money to India<br className="hidden md:block" /> from <span className="text-gradient">{corridor.country}</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Compare live {corridor.currencyCode} to INR exchange rates across {availableProviders.length} leading platforms. Find the cheapest transfer for your money.
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="glass-panel border border-white/60 rounded-2xl px-5 py-4 text-center">
              <Users className="w-5 h-5 text-[#F0B429] mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Indian Diaspora</p>
              <p className="text-slate-900 font-bold text-lg">{corridor.diaspora}</p>
            </div>
            <div className="glass-panel border border-white/60 rounded-2xl px-5 py-4 text-center">
              <Banknote className="w-5 h-5 text-[#F0B429] mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Annual Remittance</p>
              <p className="text-slate-900 font-bold text-lg">{corridor.annualRemittance}</p>
            </div>
            <div className="glass-panel border border-white/60 rounded-2xl px-5 py-4 text-center">
              <Globe className="w-5 h-5 text-[#F0B429] mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Average Transfer</p>
              <p className="text-slate-900 font-bold text-lg">{corridor.avgTransfer}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Comparison */}
      <section className="mx-auto max-w-6xl px-4 pb-8 z-10 relative">
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/60">
          <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between bg-white/40">
            <h2 className="text-slate-900 font-bold text-sm">
              Top Providers for {corridor.country} → India
            </h2>
            <p className="text-slate-500 text-xs">{availableProviders.length} providers compared</p>
          </div>

          <div className="divide-y divide-slate-200/50">
            {availableProviders.map((p, i) => (
              <div key={p.id} className={`p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/50 transition-colors ${i === 0 ? "bg-emerald-500/5" : ""}`}>
                <div className="flex items-center gap-3 md:w-1/4">
                  <span className="text-slate-400 text-lg font-bold w-6 text-center">#{i + 1}</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: p.color + "20", color: p.color }}>
                    {p.abbr}
                  </div>
                  <div>
                    <p className="text-slate-900 font-bold text-sm">{p.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#F0B429] fill-[#F0B429]" />
                      <span className="text-slate-500 text-xs">{p.stars}</span>
                      {p.badge && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F0B429]/20 text-[#F0B429]">{p.badge}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 flex-1">
                  <div>
                    <p className="text-slate-500 text-xs">Margin</p>
                    <p className="text-slate-900 font-semibold text-sm">{p.marginPct}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Fee</p>
                    <p className={`font-semibold text-sm ${p.baseFee === 0 && p.feePct === 0 ? "text-emerald-500" : "text-slate-900"}`}>
                      {p.baseFee === 0 && p.feePct === 0 ? "FREE" : `${corridor.currencySymbol}${p.baseFee}${p.feePct > 0 ? ` + ${p.feePct}%` : ""}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Speed</p>
                    <p className="text-slate-900 font-semibold text-sm">{p.speed}</p>
                  </div>
                </div>

                <div className="md:w-28">
                  <a
                    href={p.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all w-full ${
                      i === 0
                        ? "btn-primary"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    Send <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[#4A6A8A] text-[10px] text-center mt-3 px-4">
          Affiliate disclosure: RemitIQ may earn a commission if you sign up through some of our links. This does not affect our rankings.
        </p>
      </section>

      {/* CTA — Use Live Comparison */}
      <section className="mx-auto max-w-6xl px-4 pb-8 z-10 relative">
        <div className="glass-panel border border-white/60 rounded-3xl px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#F0B429]/10 to-transparent" />
          <div className="flex items-center gap-4 relative z-10">
            <Zap className="w-6 h-6 text-[#F0B429] flex-shrink-0" />
            <div>
              <h2 className="text-slate-900 font-bold text-sm">Want live rates for your exact amount?</h2>
              <p className="text-slate-500 text-xs">Our live comparison engine calculates the exact INR you&apos;ll receive — after all fees and margins.</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 btn-primary font-bold px-6 py-3 rounded-xl text-sm whitespace-nowrap"
          >
            Compare Live Rates <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-6xl px-4 pb-8 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: <Zap className="w-5 h-5" />, title: "Compare providers", desc: `${availableProviders.length}+ platforms ranked by actual value — after all fees and FX margins.` },
            { icon: <TrendingUp className="w-5 h-5" />, title: "Get timing intelligence", desc: "Our AI analyzes real rate data to tell you if now is a good time to send." },
            { icon: <Shield className="w-5 h-5" />, title: "Send with confidence", desc: "Click through to your chosen platform. We never touch your money." },
          ].map((s, i) => (
            <div key={i} className="glass-panel border border-white/60 hover:border-white rounded-3xl px-6 py-6 flex items-start gap-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/10 cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-[#F0B429]/10 text-[#F0B429] flex items-center justify-center flex-shrink-0">{s.icon}</div>
              <div>
                <h3 className="text-slate-900 font-semibold text-sm">{s.title}</h3>
                <p className="text-slate-500 text-xs">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-6xl px-4 pb-12 z-10 relative">
        <div className="glass-panel border border-white/60 rounded-3xl p-8">
          <h2 className="text-slate-900 font-bold text-xl mb-6">
            Frequently Asked Questions: {corridor.country} → India
          </h2>
          <div className="space-y-6">
            {corridor.faq.map((item, i) => (
              <div key={i}>
                <h3 className="text-slate-900 font-semibold text-sm mb-2">{item.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Corridors */}
      <section className="mx-auto max-w-6xl px-4 pb-12 z-10 relative">
        <h2 className="text-slate-900 font-bold text-sm mb-4">Send Money to India From Other Countries</h2>
        <div className="flex flex-wrap gap-2">
          {CORRIDORS.filter((c) => c.slug !== corridor.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/send-money-to-india-from/${c.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-[#F0B429]/50 hover:bg-[#F0B429]/5 transition-all"
            >
              <span>{c.flag}</span>
              <span>{c.country}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* SEO Footer Text */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="text-slate-500 text-xs leading-relaxed text-center max-w-3xl mx-auto space-y-2">
          <p>
            {corridor.country} is home to an Indian diaspora of approximately {corridor.diaspora} people, contributing {corridor.annualRemittance} in annual remittances to India. 
            RemitIQ helps you compare live {corridor.currencyCode} to INR exchange rates across {availableProviders.length}+ platforms to find the absolute best deal — no hidden fees, no conflicts of interest.
          </p>
        </div>
      </section>
    </div>
  );
}
