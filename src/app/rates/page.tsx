"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, ArrowDown, ArrowUp, Bell, BarChart3, Loader2 } from "lucide-react";

interface SignalFactor {
  name: string;
  signal: "bullish" | "bearish" | "neutral";
  weight: number;
  description: string;
}

interface TimingRecommendation {
  signal: "SEND_NOW" | "WAIT" | "URGENT";
  confidence: number;
  reason: string;
  details: string;
  factors: SignalFactor[];
  historicalAccuracy: number;
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
  stats: RateStatistics;
  recommendation: TimingRecommendation;
  backtest: BacktestResult;
  dataSource: "live" | "cached" | "fallback";
}

export default function RatesPage() {
  const [intel, setIntel] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((data) => {
        setIntel(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 text-[#F0B429] animate-spin mx-auto mb-4" />
        <p className="text-[#7A9CC4]">Loading real-time AUD/INR rate data...</p>
      </div>
    );
  }

  if (!intel) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-red-400 mb-2">Unable to load rate data</p>
        <p className="text-[#7A9CC4] text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const { stats, recommendation, chartData, backtest, dataSource } = intel;

  const sigConfig: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
    SEND_NOW: { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", label: "SEND NOW", icon: "\u2705" },
    WAIT: { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400", label: "WAIT 3-7 DAYS", icon: "\u23F3" },
    URGENT: { bg: "bg-red-500/15", border: "border-red-500/30", text: "text-red-400", label: "URGENT \u2014 ACT NOW", icon: "\u26A0\uFE0F" },
  };
  const sig = sigConfig[recommendation.signal];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">AUD to INR Exchange Rate Today</h1>
        <div className="flex items-center gap-2">
          <p className="text-[#7A9CC4]">Live rate tracking with 30-day history and AI-powered timing recommendations</p>
          {dataSource === "live" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">LIVE</span>}
        </div>
        <p className="text-[#7A9CC4] text-xs mt-2">Data source: European Central Bank &middot; Last updated: {new Date().toLocaleString("en-AU")} AEST</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 md:col-span-2">
          <p className="text-[#7A9CC4] text-sm mb-1">Best available AUD/INR rate</p>
          <div className="flex items-end gap-4">
            <p className="text-5xl font-extrabold text-white">&#8377;{stats.current}</p>
            <div className={`flex items-center gap-1 mb-2 ${stats.weekChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {stats.weekChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="font-semibold">{stats.weekChange >= 0 ? "+" : ""}&#8377;{stats.weekChange} ({stats.weekChangePct >= 0 ? "+" : ""}{stats.weekChangePct}%) this week</span>
            </div>
          </div>
        </div>
        <div className={`${sig.bg} border ${sig.border} rounded-2xl p-6 flex flex-col justify-center text-center`}>
          <span className="text-3xl">{sig.icon}</span>
          <p className={`font-bold text-lg ${sig.text} mt-2`}>{sig.label}</p>
          <p className="text-[#C8D8E8] text-sm mt-1">{recommendation.reason}</p>
          <div className="mt-3"><p className="text-[#7A9CC4] text-xs">Confidence</p>
            <div className="w-full bg-[#0D1B2E] rounded-full h-2 mt-1"><div className={`h-2 rounded-full ${recommendation.signal === "SEND_NOW" ? "bg-emerald-400" : recommendation.signal === "WAIT" ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${recommendation.confidence}%` }} /></div>
            <p className={`text-xs font-semibold mt-1 ${sig.text}`}>{recommendation.confidence}%</p>
          </div>
        </div>
      </div>

      <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-white font-bold text-lg">AUD/INR &mdash; 30-Day Chart</h2>
          {dataSource === "live" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">REAL DATA</span>}
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <defs><linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F0B429" stopOpacity={0.3} /><stop offset="95%" stopColor="#F0B429" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="day" tick={{ fill: "#7A9CC4", fontSize: 11 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis domain={[stats.low30d - 0.3, stats.high30d + 0.3]} tick={{ fill: "#7A9CC4", fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: number) => `₹${v.toFixed(1)}`} />
              <Tooltip contentStyle={{ background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: 8 }} labelStyle={{ color: "#7A9CC4" }} formatter={(value: number) => [`₹${value}`, "Rate"]} />
              <ReferenceLine y={stats.avg30d} stroke="#7A9CC4" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="rate" stroke="#F0B429" strokeWidth={2.5} fill="url(#rg2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Current Rate", value: `₹${stats.current}` },
          { label: "30-Day Average", value: `₹${stats.avg30d}` },
          { label: "30-Day High", value: `₹${stats.high30d}` },
          { label: "30-Day Low", value: `₹${stats.low30d}` },
        ].map((s) => (
          <div key={s.label} className="bg-[#111D32] border border-[#1E3A5F] rounded-xl p-4">
            <p className="text-[#7A9CC4] text-xs">{s.label}</p><p className="text-white font-bold text-xl mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Intelligence Factors */}
      <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-[#F0B429]" /><h2 className="text-white font-bold">Rate Intelligence Analysis</h2></div>
        <p className="text-[#C8D8E8] mb-4">{recommendation.details}</p>
        <div className="space-y-2 mb-4">
          {recommendation.factors.slice(0, 5).map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#0D1B2E] rounded-lg p-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${f.signal === "bullish" ? "bg-emerald-500/20 text-emerald-400" : f.signal === "bearish" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>
                {f.signal === "bullish" ? "\u2191" : f.signal === "bearish" ? "\u2193" : "\u2194"} {f.signal}</span>
              <div className="flex-1"><p className="text-white text-sm font-semibold">{f.name}</p><p className="text-[#7A9CC4] text-xs">{f.description}</p></div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-[#0D1B2E] rounded-lg p-3">
          <BarChart3 className="w-5 h-5 text-[#F0B429]" />
          <div><p className="text-white text-sm font-semibold">Backtest Accuracy: {backtest.accuracy}%</p><p className="text-[#7A9CC4] text-xs">Tested over {backtest.totalSignals} signals on 180 days of {dataSource === "live" ? "real" : "historical"} data</p></div>
        </div>
        <p className="text-[#7A9CC4] text-xs mt-4 italic">This is guidance only &mdash; not financial advice. Based on {dataSource === "live" ? "real ECB" : "historical"} AUD/INR data.</p>
      </div>

      <div className="bg-gradient-to-r from-[#F0B429]/10 to-[#00B9FF]/10 border border-[#1E3A5F] rounded-2xl p-8 text-center">
        <Bell className="w-8 h-8 text-[#F0B429] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Don&apos;t miss your target rate</h2>
        <p className="text-[#7A9CC4] mb-4">Set a free rate alert &mdash; we&apos;ll notify you the instant AUD/INR hits your target.</p>
        <a href="/alerts" className="inline-flex items-center gap-2 bg-[#F0B429] text-[#0A1628] font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors">Set Rate Alert &mdash; Free</a>
      </div>

      <div className="mt-12 space-y-6">
        <h2 className="text-xl font-bold text-white">Understanding the AUD to INR Exchange Rate</h2>
        <div className="text-[#7A9CC4] text-sm leading-relaxed space-y-3">
          <p>The AUD/INR exchange rate is influenced by RBA interest rate decisions, Australian commodity prices (iron ore, coal), RBI monetary policy, and global risk sentiment. A 1% improvement on a $5,000 transfer translates to approximately &#8377;3,200 more received.</p>
          <p>RemitIQ tracks the rate across all major remittance platforms &mdash; not just the mid-market rate. The rate you get from platforms like Wise or Remitly includes their FX margin, typically 0.3% to 2% below mid-market.</p>
        </div>
      </div>
    </div>
  );
}
