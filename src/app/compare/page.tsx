"use client";
import { useState, useMemo, useEffect } from "react";
import { ArrowUpRight, Star, CheckCircle, Zap, Clock, Loader2 } from "lucide-react";
import { getRankedPlatforms, formatINR, DEFAULT_MID_MARKET_RATE, getPlatforms, calcReceived } from "@/data/platforms";

type SortKey = "received" | "rate" | "fee" | "speed" | "stars";

export default function ComparePage() {
  const [amount, setAmount] = useState(2000);
  const [inputVal, setInputVal] = useState("2,000");
  const [sortBy, setSortBy] = useState<SortKey>("received");
  const [midMarketRate, setMidMarketRate] = useState(DEFAULT_MID_MARKET_RATE);
  const [dataSource, setDataSource] = useState<string>("cached");

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((data) => {
        if (data.midMarketRate) {
          setMidMarketRate(data.midMarketRate);
          setDataSource(data.dataSource || "live");
        }
      })
      .catch(() => { });
  }, []);

  const ranked = useMemo(() => {
    const platforms = getPlatforms(midMarketRate);
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
  }, [amount, sortBy, midMarketRate]);

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const maxSavings = best.received - worst.received;

  const handleAmountChange = (val: string) => {
    setInputVal(val);
    const num = parseInt(val.replace(/,/g, ""), 10);
    if (!isNaN(num) && num > 0 && num <= 100000) setAmount(num);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-extrabold text-white">Compare Money Transfer Rates &mdash; Australia to India</h1>
          {dataSource === "live" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">LIVE</span>}
        </div>
        <p className="text-[#7A9CC4]">Live rates from {ranked.length} platforms. Ranked by total INR received after all fees.</p>
        <p className="text-[#7A9CC4] text-xs mt-1">Mid-market rate: &#8377;{midMarketRate.toFixed(2)} (ECB)</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-[#7A9CC4] text-sm mb-1">Send Amount (AUD)</label>
          <input type="text" value={inputVal} onChange={(e) => handleAmountChange(e.target.value)} className="w-full bg-[#111D32] border border-[#1E3A5F] rounded-xl py-3 px-4 text-lg font-bold text-white focus:outline-none focus:border-[#F0B429]" />
        </div>
        <div className="md:w-48">
          <label className="block text-[#7A9CC4] text-sm mb-1">Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="w-full bg-[#111D32] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#F0B429]">
            <option value="received">Best value (INR received)</option>
            <option value="rate">Exchange rate</option>
            <option value="fee">Lowest fee</option>
            <option value="speed">Fastest delivery</option>
            <option value="stars">Highest rated</option>
          </select>
        </div>
      </div>
      {maxSavings > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
          <p className="text-emerald-400 font-semibold">Save up to &#8377;{formatINR(maxSavings)} by choosing {best.name} over {worst.name} on a ${amount.toLocaleString()} AUD transfer.</p>
        </div>
      )}
      <div className="space-y-4">
        {ranked.map((p, i) => (
          <div key={p.id} className={`bg-[#111D32] border rounded-2xl p-6 transition-all hover:border-[#F0B429]/30 ${i === 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-[#1E3A5F]"}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 md:w-1/4">
                <span className="text-[#7A9CC4] text-2xl font-bold w-8 text-center">#{i + 1}</span>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: p.color + "20", color: p.color }}>{p.abbr}</div>
                <div>
                  <p className="text-white font-bold">{p.name}</p>
                  <div className="flex items-center gap-1"><Star className="w-3 h-3 text-[#F0B429] fill-[#F0B429]" /><span className="text-[#7A9CC4] text-xs">{p.stars}/5</span>
                    {p.badge && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F0B429]/20 text-[#F0B429]">{p.badge}</span>}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                <div><p className="text-[#7A9CC4] text-xs">Exchange Rate</p><p className="text-white font-semibold">&#8377;{p.rate.toFixed(2)}</p><p className="text-[#7A9CC4] text-[10px]">{p.marginPct.toFixed(2)}% margin</p></div>
                <div><p className="text-[#7A9CC4] text-xs">Transfer Fee</p><p className={p.fee === 0 ? "text-emerald-400 font-semibold" : "text-white font-semibold"}>{p.fee === 0 ? "FREE" : `AUD $${p.fee.toFixed(2)}`}</p></div>
                <div><p className="text-[#7A9CC4] text-xs">Delivery Speed</p><p className="text-white font-semibold">{p.speed}</p></div>
                <div><p className="text-[#7A9CC4] text-xs">You Receive</p><p className="text-white font-bold text-xl">&#8377;{formatINR(p.received)}</p>{p.savings > 0 && <p className="text-emerald-400 text-xs font-semibold">+&#8377;{formatINR(p.savings)} vs worst</p>}</div>
              </div>
              <div className="md:w-32 flex md:justify-end">
                <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
                  className={`inline-flex items-center gap-1.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all w-full md:w-auto justify-center ${i === 0 ? "bg-[#F0B429] text-[#0A1628] hover:bg-yellow-400 glow-gold" : "bg-[#1E3A5F]/50 text-[#C8D8E8] hover:bg-[#1E3A5F]"}`}>
                  Send Now <ArrowUpRight className="w-4 h-4" /></a>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1E3A5F]/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">{p.paymentMethods.map((m) => (<span key={m} className="text-[10px] px-2 py-0.5 rounded bg-[#0D1B2E] text-[#7A9CC4] border border-[#1E3A5F]">{m}</span>))}</div>
              {p.promoText && <p className="text-[#F0B429] text-xs font-medium">{p.promoText}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 bg-[#0D1B2E] rounded-xl p-6">
        <h2 className="text-white font-bold mb-3">How We Compare</h2>
        <div className="text-[#7A9CC4] text-sm space-y-2">
          <p>RemitIQ compares the total value of your transfer &mdash; not just the exchange rate. We calculate the exact INR amount you&apos;ll receive after all fees and FX margins.</p>
          <p>Rates are derived from real-time ECB mid-market data with provider-specific margins applied. Rankings are purely by value to you &mdash; we never boost rankings based on commercial relationships.</p>
        </div>
      </div>
    </div>
  );
}
