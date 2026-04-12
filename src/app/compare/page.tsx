"use client";
import { useState, useMemo, useEffect } from "react";
import { ArrowUpRight, Star, CheckCircle, Zap, Clock, Loader2 } from "lucide-react";
import { getRankedPlatforms, formatINR, DEFAULT_MID_MARKET_RATE, getPlatforms, calcReceived, getAffiliateUrlWithAmount } from "@/data/platforms";
import { useCountry } from "@/components/CountryContext";
import CountrySelector from "@/components/CountrySelector";

type SortKey = "received" | "rate" | "fee" | "speed" | "stars";

export default function ComparePage() {
  const [amount, setAmount] = useState(2000);
  const [inputVal, setInputVal] = useState("2,000");
  const [sortBy, setSortBy] = useState<SortKey>("received");
  const [midMarketRate, setMidMarketRate] = useState(DEFAULT_MID_MARKET_RATE);
  const [dataSource, setDataSource] = useState<string>("cached");
  const [providerConfigs, setProviderConfigs] = useState<any[] | undefined>(undefined);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const { currencyCode, pairLabel } = useCountry();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/rates?currency=${currencyCode}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.midMarketRate) {
          setMidMarketRate(data.midMarketRate);
          setDataSource(data.dataSource || "live");
          if (data.providerConfigs) setProviderConfigs(data.providerConfigs);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") { /* ignore */ }
      });
    return () => controller.abort();
  }, [currencyCode]);

  const ranked = useMemo(() => {
    const platforms = getPlatforms(midMarketRate, amount, providerConfigs, isFirstTimeUser);
    const list = platforms.map((p) => ({
      ...p,
      received: calcReceived(amount, p.rate, p.fee),
      savings: 0,
    }));

    // Sort by selected criteria
    if (sortBy === "received") list.sort((a, b) => b.received - a.received);
    else if (sortBy === "rate") list.sort((a, b) => b.rate - a.rate);
    else if (sortBy === "fee") list.sort((a, b) => a.fee - b.fee);
    else if (sortBy === "speed") list.sort((a, b) => a.speedDays - b.speedDays);
    else if (sortBy === "stars") list.sort((a, b) => b.stars - a.stars);

    const worst = [...list].sort((a, b) => a.received - b.received)[0].received;
    list.forEach((p) => { p.savings = p.received - worst; });
    return list;
  }, [amount, sortBy, midMarketRate, providerConfigs, isFirstTimeUser]);

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const maxSavings = best.received - worst.received;

  const handleAmountChange = (val: string) => {
    const numStr = val.replace(/[^0-9]/g, "");
    if (!numStr) {
      setInputVal("");
      return;
    }
    const num = parseInt(numStr, 10);
    setInputVal(num.toLocaleString("en-US"));
    if (num > 0 && num <= 100000) setAmount(num);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <title>Compare Remittance Providers | Wise vs Remitly vs Western Union etc</title>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Compare Remittance Providers: Best Way to Send Money to India</h1>
          {dataSource === "live" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">LIVE</span>}
        </div>
        <p className="text-slate-500">Compare live exchange rates from {ranked.length} platforms. Ranked by total INR received after all fees.</p>
        <p className="text-slate-500 text-xs mt-1">Mid-market rate: &#8377;{midMarketRate.toFixed(2)} (ECB)</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-slate-500 text-sm mb-1">Send Amount ({currencyCode})</label>
          <input type="text" value={inputVal} onChange={(e) => handleAmountChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-lg font-bold text-slate-900 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20" />
        </div>
        <div className="md:w-48">
          <label className="block text-slate-500 text-sm mb-1">Sort by</label>
          <select aria-label="Sort comparison results" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20">
            <option value="received">Best value (INR received)</option>
            <option value="rate">Exchange rate</option>
            <option value="fee">Lowest fee</option>
            <option value="speed">Fastest delivery</option>
            <option value="stars">Highest rated</option>
          </select>
        </div>
      </div>
      {/* New User Rate Toggle */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setIsFirstTimeUser(!isFirstTimeUser)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isFirstTimeUser ? "bg-emerald-500" : "bg-slate-300"}`}
          role="switch"
          aria-checked={isFirstTimeUser}
          aria-label="Toggle new user promotional rates"
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isFirstTimeUser ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <div>
          <span className="text-slate-900 text-sm font-semibold">New User Rates</span>
          <span className="text-slate-500 text-xs ml-2">{isFirstTimeUser ? "Showing first-time registration promos" : "Showing standard rates for existing users"}</span>
        </div>
      </div>
      {maxSavings > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
          <p className="text-emerald-400 font-semibold">Save up to &#8377;{formatINR(maxSavings)} by choosing {best.name} over {worst.name} on a {currencyCode} {amount.toLocaleString()} transfer.</p>
        </div>
      )}
      <div className="space-y-4">
        {ranked.map((p, i) => (
          <div key={p.id} className={`bg-slate-50 border rounded-2xl p-6 transition-all hover:border-[#F0B429]/30 ${i === 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-200"}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 md:w-1/4">
                <span className="text-slate-500 text-2xl font-bold w-8 text-center">#{i + 1}</span>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: p.color + "20", color: p.color }}>{p.abbr}</div>
                <div>
                  <p className="text-slate-900 font-bold">{p.name}</p>
                  <div className="flex items-center gap-1"><Star className="w-3 h-3 text-[#F0B429] fill-[#F0B429]" /><span className="text-slate-500 text-xs">{p.stars}/5</span>
                    {p.badge && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F0B429]/20 text-[#F0B429]">{p.badge}</span>}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                <div><p className="text-slate-500 text-xs">Exchange Rate</p><p className="text-slate-900 font-semibold">&#8377;{p.rate.toFixed(2)}</p><p className="text-slate-500 text-[10px]">{p.marginPct.toFixed(2)}% margin</p></div>
                <div><p className="text-slate-500 text-xs">Transfer Fee</p><p className={p.fee === 0 ? "text-emerald-400 font-semibold" : "text-slate-900 font-semibold"}>{p.fee === 0 ? "FREE" : `${currencyCode} ${p.fee.toFixed(2)}`}</p></div>
                <div><p className="text-slate-500 text-xs">Delivery Speed</p><p className="text-slate-900 font-semibold">{p.speed}</p></div>
                <div><p className="text-slate-500 text-xs">You Receive</p><p className="text-slate-900 font-bold text-xl">&#8377;{formatINR(p.received)}</p>{p.savings > 0 && <p className="text-emerald-400 text-xs font-semibold">+&#8377;{formatINR(p.savings)} vs worst</p>}</div>
              </div>
              <div className="md:w-32 flex md:justify-end">
                <a href={getAffiliateUrlWithAmount(p.id, p.affiliateUrl, amount, "compare", currencyCode)} target="_blank" rel="noopener noreferrer sponsored"
                  className={`inline-flex items-center gap-1.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all w-full md:w-auto justify-center ${i === 0 ? "bg-[#F0B429] text-slate-900 hover:bg-yellow-400 glow-gold" : "bg-slate-100/50 text-slate-700 hover:bg-slate-100"}`}>
                  Send Now <ArrowUpRight className="w-4 h-4" /></a>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">{p.paymentMethods.map((m) => (<span key={m} className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">{m}</span>))}</div>
              {p.promoText && <p className="text-emerald-600 text-xs font-medium flex items-center gap-1"><span className="text-xs">🎁</span> {p.promoText}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 bg-white rounded-xl p-6">
        <h2 className="text-slate-900 font-bold mb-3">How We Compare</h2>
        <div className="text-slate-500 text-sm space-y-2">
          <p><strong>Note:</strong> {isFirstTimeUser ? "Rates shown reflect first-time user promotional offers. These are typically one-time incentives for your very first transfer — switch the toggle off to see standard ongoing rates." : "Rates shown are standard, ongoing rates for registered users. Toggle \"New User Rates\" above to see first-time registration promos across all providers."}</p>
          <p>RemitIQ compares the total value of your transfer &mdash; not just the exchange rate. We calculate the exact INR amount you&apos;ll receive after all fees and FX margins.</p>
          <p>Rates are derived from real-time ECB mid-market data with provider-specific margins applied. Rankings are purely by value to you &mdash; we never boost rankings based on commercial relationships.</p>
        </div>
      </div>
      <p className="text-[#4A6A8A] text-[10px] text-center mt-6">Affiliate disclosure: RemitIQ may earn a commission if you sign up through some of our links. This does not affect our rankings or editorial independence.</p>
    </div>
  );
}
