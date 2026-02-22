"use client";
import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowUpRight, TrendingUp, Clock, Bell, Shield, Zap, ChevronRight, Star, BarChart3, Loader2 } from "lucide-react";
import { formatINR, calcReceived, getPlatforms, DEFAULT_MID_MARKET_RATE } from "@/data/platforms";

interface SignalFactor {
  name: string;
  signal: "bullish" | "bearish" | "neutral";
  weight: number;
  description: string;
}

interface RateForecast {
  direction: "rising" | "falling" | "steady";
  horizon: string;
  confidence: number;
  reason: string;
}

interface TimingRecommendation {
  signal: "SEND_NOW" | "WAIT" | "URGENT";
  confidence: number;
  reason: string;
  details: string;
  factors: SignalFactor[];
  historicalAccuracy: number;
  forecast: RateForecast;
}

interface RateStatistics {
  current: number;
  avg7d: number;
  avg30d: number;
  avg90d: number;
  high30d: number;
  low30d: number;
  high90d: number;
  low90d: number;
  weekChange: number;
  weekChangePct: number;
  monthChange: number;
  monthChangePct: number;
  volatility7d: number;
  volatility30d: number;
  rsi14: number;
  momentum: number;
  sma7: number;
  sma20: number;
  ema12: number;
  ema26: number;
  macdLine: number;
  macdSignal: number;
  percentile30d: number;
  percentile90d: number;
}

interface BacktestResult {
  totalSignals: number;
  sendNowCorrect: number;
  sendNowTotal: number;
  waitCorrect: number;
  waitTotal: number;
  avgSavingsPerTransfer: number;
  accuracy: number;
}

interface RateDataPoint {
  date: string;
  day: string;
  rate: number;
  midMarket: number;
  volume?: number;
}

interface IntelligenceData {
  chartData: RateDataPoint[];
  fullHistory: RateDataPoint[];
  stats: RateStatistics;
  recommendation: TimingRecommendation;
  backtest: BacktestResult;
  macroEvents: unknown[];
  midMarketRate: number;
  dataSource: "live" | "cached" | "fallback";
  forecast: RateForecast;
}

interface RankedPlatform {
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
  marginPct: number;
  received: number;
  savings: number;
}

export default function HomePage() {
  const [amount, setAmount] = useState(2000);
  const [inputVal, setInputVal] = useState("2,000");
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => {
        setIntelligence(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const midMarketRate = intelligence?.midMarketRate ?? DEFAULT_MID_MARKET_RATE;
  const stats = intelligence?.stats ?? null;
  const recommendation = intelligence?.recommendation ?? null;
  const chartData = intelligence?.chartData ?? null;
  const dataSource = intelligence?.dataSource ?? "fallback";

  const ranked: RankedPlatform[] = useMemo(() => {
    const platforms = getPlatforms(midMarketRate);
    return platforms
      .map((p) => {
        const received = calcReceived(amount, p.rate, p.fee);
        return { ...p, received, savings: 0 };
      })
      .sort((a, b) => b.received - a.received)
      .map((p, _i, arr) => ({ ...p, savings: p.received - arr[arr.length - 1].received }));
  }, [amount, midMarketRate]);

  const handleAmountChange = (val: string) => {
    setInputVal(val);
    const num = parseInt(val.replace(/[^0-9]/g, ""));
    if (!isNaN(num) && num > 0) setAmount(num);
  };

  const sigConfig: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
    SEND_NOW: { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", label: "SEND NOW", icon: "\u2705" },
    WAIT: { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400", label: "WAIT 3-7 DAYS", icon: "\u23F3" },
    URGENT: { bg: "bg-red-500/15", border: "border-red-500/30", text: "text-red-400", label: "URGENT \u2014 ACT NOW", icon: "\u26A0\uFE0F" },
  };
  const sig = recommendation ? sigConfig[recommendation.signal] : null;

  return (
    <div>
      {/* Compact Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F0B429]/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-4 relative">
          <div className="text-center max-w-3xl mx-auto mb-5">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
              Find the best rate to send money <span className="text-[#F0B429]">from Australia to India</span>
            </h1>
            <p className="text-[#7A9CC4] text-base">Compare live rates across 6+ platforms. Our AI tells you the best platform <em>and</em> the best time to send.</p>
          </div>
          {/* Amount Input — full width with step guidance */}
          <div className="max-w-2xl mx-auto mb-3">
            <label className="flex items-center gap-2 text-[#7A9CC4] text-xs font-medium mb-1.5 ml-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F0B429]/20 text-[#F0B429] text-[10px] font-bold">1</span>
              Enter your amount to compare live rates
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold text-lg">AUD</span>
              <input type="text" value={inputVal} onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full bg-[#111D32] border-2 border-[#1E3A5F] rounded-xl py-4 px-4 pl-16 text-right text-2xl font-bold text-white focus:outline-none focus:border-[#F0B429] transition-all placeholder:text-[#3A5575]" placeholder="2,000" />
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3A5575] group-focus-within:text-[#F0B429] transition-colors" />
            </div>
          </div>

          {/* Timing Signal — full width below input */}
          <div className="max-w-2xl mx-auto mb-2">
            {loading ? (
              <div className="bg-[#111D32] border border-[#1E3A5F] rounded-xl p-3 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-[#F0B429] animate-spin" />
                <p className="text-[#7A9CC4] text-sm">Loading rate intelligence...</p>
              </div>
            ) : sig && recommendation ? (
              <div className={`${sig.bg} border ${sig.border} rounded-xl p-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{sig.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${sig.text}`}>{sig.label}</span>
                        {dataSource === "live" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">LIVE</span>}
                      </div>
                      <p className="text-[#C8D8E8] text-xs mt-0.5">{recommendation.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-3">
                    {recommendation.forecast && (
                      <div className="hidden sm:flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${recommendation.forecast.direction === "rising"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : recommendation.forecast.direction === "falling"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-slate-500/15 text-[#7A9CC4]"
                          }`}>
                          {recommendation.forecast.direction === "rising" ? "↑" : recommendation.forecast.direction === "falling" ? "↓" : "→"}{" "}
                          {recommendation.forecast.direction === "rising" ? "Rising" : recommendation.forecast.direction === "falling" ? "Falling" : "Steady"} next {recommendation.forecast.horizon}
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[#7A9CC4] text-[10px]">Confidence</p>
                      <p className={`font-bold text-sm ${sig.text}`}>{recommendation.confidence}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Comparison Table — tighter rows */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1E3A5F] flex items-center justify-between">
            <h2 className="text-white font-bold text-sm">Sending AUD {amount.toLocaleString()} to India</h2>
            <p className="text-[#7A9CC4] text-xs">Mid-market: &#8377;{midMarketRate.toFixed(2)} | {dataSource === "live" ? "Live rates" : "Updated just now"}</p>
          </div>
          <div className="hidden md:block">
            <table className="w-full">
              <thead><tr className="text-[#7A9CC4] text-xs uppercase tracking-wider border-b border-[#1E3A5F]">
                <th className="text-left px-4 py-2">Platform</th><th className="text-right px-4 py-2">Rate</th><th className="text-right px-4 py-2">Fee</th>
                <th className="text-right px-4 py-2">You Receive</th><th className="text-center px-4 py-2">Speed</th><th className="text-right px-4 py-2">Savings</th><th className="px-4 py-2"></th>
              </tr></thead>
              <tbody>
                {ranked.map((p, i) => (
                  <tr key={p.id} className={`border-b border-[#1E3A5F]/50 hover:bg-[#0D1B2E]/50 ${i === 0 ? "bg-emerald-500/5" : ""}`}>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: p.color + "20", color: p.color }}>{p.abbr}</div>
                      <div><p className="text-white font-semibold text-sm">{p.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#F0B429] fill-[#F0B429]" /><span className="text-[#7A9CC4] text-xs">{p.stars}</span>
                          {p.badge && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F0B429]/20 text-[#F0B429]">{p.badge}</span>}
                        </div></div>
                    </div></td>
                    <td className="px-4 py-2.5 text-right"><p className="text-white font-semibold text-sm">&#8377;{p.rate.toFixed(2)}</p><p className="text-[#7A9CC4] text-[10px]">{p.marginPct.toFixed(2)}% margin</p></td>
                    <td className="px-4 py-2.5 text-right"><p className={p.fee === 0 ? "text-emerald-400 font-semibold text-sm" : "text-white text-sm"}>{p.fee === 0 ? "FREE" : `$${p.fee.toFixed(2)}`}</p></td>
                    <td className="px-4 py-2.5 text-right"><p className="text-white font-bold">&#8377;{formatINR(p.received)}</p></td>
                    <td className="px-4 py-2.5 text-center"><span className="text-[#7A9CC4] text-sm">{p.speed}</span></td>
                    <td className="px-4 py-2.5 text-right">{p.savings > 0 ? <p className="text-emerald-400 font-semibold text-sm">+&#8377;{formatINR(p.savings)}</p> : <p className="text-[#7A9CC4] text-xs">baseline</p>}</td>
                    <td className="px-4 py-2.5"><a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${i === 0 ? "bg-[#F0B429] text-[#0A1628] hover:bg-yellow-400 glow-gold" : "bg-[#1E3A5F]/50 text-[#C8D8E8] hover:bg-[#1E3A5F]"}`}>
                      Send <ArrowUpRight className="w-3.5 h-3.5" /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#1E3A5F]/50">
            {ranked.map((p, i) => (
              <div key={p.id} className={`p-3 ${i === 0 ? "bg-emerald-500/5" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: p.color + "20", color: p.color }}>{p.abbr}</div>
                    <div><p className="text-white font-semibold text-sm">{p.name}</p>
                      {p.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F0B429]/20 text-[#F0B429]">{p.badge}</span>}</div>
                  </div>
                  {p.savings > 0 && <span className="text-emerald-400 text-xs font-semibold">+&#8377;{formatINR(p.savings)}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-white font-bold text-lg">&#8377;{formatINR(p.received)}</p>
                    <p className="text-[#7A9CC4] text-xs">Rate: &#8377;{p.rate.toFixed(2)} &middot; Fee: {p.fee === 0 ? "Free" : `$${p.fee}`} &middot; {p.speed}</p></div>
                  <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
                    className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${i === 0 ? "bg-[#F0B429] text-[#0A1628]" : "bg-[#1E3A5F]/50 text-[#C8D8E8]"}`}>Send</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chart + Rate Intelligence — side by side on desktop */}
      {chartData && stats && recommendation && (
        <section className="mx-auto max-w-6xl px-4 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Chart — 3 columns */}
            <div className="lg:col-span-3 bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#F0B429]" />
                  <h2 className="text-white font-bold text-sm">AUD/INR &mdash; Last 30 Days</h2>
                  {dataSource === "live" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">LIVE</span>}
                </div>
                <div className="flex gap-4 text-xs">
                  <div><span className="text-[#7A9CC4]">Now </span><span className="text-white font-bold">&#8377;{stats.current}</span></div>
                  <div><span className="text-[#7A9CC4]">Avg </span><span className="text-white font-bold">&#8377;{stats.avg30d}</span></div>
                  <div><span className="text-[#7A9CC4]">7d </span><span className={stats.weekChange >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{stats.weekChange >= 0 ? "+" : ""}&#8377;{stats.weekChange}</span></div>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F0B429" stopOpacity={0.3} /><stop offset="95%" stopColor="#F0B429" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="day" tick={{ fill: "#7A9CC4", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis domain={[stats.low30d - 0.3, stats.high30d + 0.3]} tick={{ fill: "#7A9CC4", fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v: number) => `₹${v.toFixed(1)}`} />
                    <Tooltip contentStyle={{ background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#7A9CC4" }} formatter={(v: number) => [`₹${v}`, "Rate"]} />
                    <ReferenceLine y={stats.avg30d} stroke="#7A9CC4" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Area type="monotone" dataKey="rate" stroke="#F0B429" strokeWidth={2} fill="url(#rg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rate Intelligence — 2 columns */}
            <div className="lg:col-span-2 bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#F0B429]" /><h2 className="text-white font-bold text-sm">Rate Intelligence</h2>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F0B429]/20 text-[#F0B429] uppercase">Beta</span>
              </div>
              {/* Compact Factors */}
              <div className="space-y-1.5 flex-1">
                {recommendation.factors.slice(0, 5).map((f: { signal: string; name: string; description: string; weight: number }, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-[#0D1B2E] rounded-lg px-2.5 py-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${f.signal === "bullish" ? "bg-emerald-500/20 text-emerald-400" : f.signal === "bearish" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {f.signal === "bullish" ? "👍" : f.signal === "bearish" ? "👎" : "➡️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold">{f.name}</p>
                      <p className="text-[#7A9CC4] text-[10px] truncate">{f.description}</p>
                    </div>
                    <div className="w-10 bg-[#1E3A5F] rounded-full h-1"><div className={`h-1 rounded-full ${f.signal === "bullish" ? "bg-emerald-400" : f.signal === "bearish" ? "bg-red-400" : "bg-gray-400"}`} style={{ width: `${Math.min(f.weight, 1) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
              {/* Compact Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-[#0D1B2E] rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[#7A9CC4] text-[10px]">Momentum</p>
                  <p className="text-white font-bold text-xs">{stats.rsi14 > 60 ? "📈 Strong" : stats.rsi14 > 52 ? "📈 Rising" : stats.rsi14 < 40 ? "📉 Falling" : stats.rsi14 < 48 ? "📉 Dipping" : "➡️ Flat"}</p>
                </div>
                <div className="bg-[#0D1B2E] rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[#7A9CC4] text-[10px]">Today</p>
                  <p className="text-white font-bold text-xs">Top {100 - stats.percentile30d}%</p>
                </div>
                <div className="bg-[#0D1B2E] rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[#7A9CC4] text-[10px]">Stability</p>
                  <p className="text-white font-bold text-xs">{stats.volatility30d < 0.5 ? "🟢 Calm" : stats.volatility30d < 1.0 ? "🟡 Normal" : stats.volatility30d < 1.5 ? "🟠 Choppy" : "🔴 Risky"}</p>
                </div>
              </div>
              <p className="text-[#7A9CC4] text-[9px] mt-2 italic">Guidance only, not financial advice. ECB data.</p>
            </div>
          </div>
        </section>
      )}

      {/* Compact CTA + How It Works — merged into one section */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        {/* CTA Bar */}
        <div className="bg-gradient-to-r from-[#F0B429]/10 to-[#00B9FF]/10 border border-[#1E3A5F] rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-[#F0B429] flex-shrink-0" />
            <div>
              <h2 className="text-white font-bold text-sm">Get notified when rates hit your target</h2>
              <p className="text-[#7A9CC4] text-xs">Free alerts — no spam, just the rates you care about.</p>
            </div>
          </div>
          <a href="/alerts" className="inline-flex items-center gap-2 bg-[#F0B429] text-[#0A1628] font-bold px-5 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-sm whitespace-nowrap glow-gold">
            Set Rate Alert <ChevronRight className="w-3.5 h-3.5" /></a>
        </div>
        {/* How It Works — horizontal cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: <Zap className="w-5 h-5" />, title: "Compare live rates", desc: "6+ platforms ranked by actual INR you'll receive — after all fees." },
            { icon: <TrendingUp className="w-5 h-5" />, title: "Get timing intelligence", desc: "AI analyzes real rate data to tell you if now is a good time to send." },
            { icon: <Shield className="w-5 h-5" />, title: "Send with confidence", desc: "Click through to your chosen platform. We never touch your money." },
          ].map((s, i) => (
            <div key={i} className="bg-[#111D32] border border-[#1E3A5F] rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F0B429]/10 text-[#F0B429] flex items-center justify-center flex-shrink-0">{s.icon}</div>
              <div><h3 className="text-white font-semibold text-sm">{s.title}</h3><p className="text-[#7A9CC4] text-xs">{s.desc}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Bar + SEO — compact footer area */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {getPlatforms(midMarketRate).map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111D32] border border-[#1E3A5F] rounded-lg">
              <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: p.color + "20", color: p.color }}>{p.abbr}</div>
              <span className="text-[#C8D8E8] text-xs">{p.name}</span>
            </div>
          ))}
        </div>
        <div className="text-[#7A9CC4] text-xs leading-relaxed text-center max-w-3xl mx-auto space-y-2">
          <p>Every year, Indians in Australia send over $7.3 billion home. The difference between the best and worst deal on a $2,000 transfer can exceed &#8377;3,000. RemitIQ compares live rates and uses AI to help you pick the right time — no conflicts of interest.</p>
        </div>
      </section>
    </div>
  );
}
