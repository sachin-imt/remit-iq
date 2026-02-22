"use client";
import { useState, useEffect } from "react";
import { Bell, Check, ChevronRight, Loader2 } from "lucide-react";

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [targetRate, setTargetRate] = useState("64.50");
  const [alertType, setAlertType] = useState<"rate" | "platform" | "both">("both");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [avgRate, setAvgRate] = useState<number | null>(null);

  // Fetch live rate data on mount
  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        if (data.midMarketRate) {
          // Best rate (Wise margin)
          const best = parseFloat((data.midMarketRate * (1 - 0.0034)).toFixed(2));
          setCurrentRate(best);
          setTargetRate(data.midMarketRate.toFixed(2));
        }
        if (data.stats?.avg) {
          setAvgRate(parseFloat(data.stats.avg.toFixed(2)));
        }
      })
      .catch(() => { });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          targetRate: parseFloat(targetRate),
          alertType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create alert");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"><Check className="w-8 h-8 text-emerald-400" /></div>
        <h1 className="text-3xl font-extrabold text-white mb-4">Alert Set!</h1>
        <p className="text-[#7A9CC4] text-lg mb-2">We&apos;ll notify you at <strong className="text-white">{email}</strong> when:</p>
        <ul className="text-[#C8D8E8] space-y-2 mb-8">
          {(alertType === "rate" || alertType === "both") && <li>AUD/INR rate reaches &#8377;{targetRate}</li>}
          {(alertType === "platform" || alertType === "both") && <li>A platform offers a significantly better deal</li>}
        </ul>
        <a href="/" className="inline-flex items-center gap-2 bg-[#F0B429] text-[#0A1628] font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors">Compare Rates Now <ChevronRight className="w-4 h-4" /></a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-10">
        <Bell className="w-12 h-12 text-[#F0B429] mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-white mb-2">Free AUD/INR Rate Alerts</h1>
        <p className="text-[#7A9CC4] text-lg">Get notified the moment rates hit your target. Never miss a good time to send money home.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-8">
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">Your email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#F0B429]" />
        </div>
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">Target AUD/INR rate</label>
          <p className="text-[#7A9CC4] text-sm mb-2">
            Current best rate: &#8377;{currentRate ?? "..."} | 30-day average: &#8377;{avgRate ?? "..."}
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A9CC4]">&#8377;</span>
            <input type="number" step="0.01" min="55" max="75" value={targetRate} onChange={(e) => setTargetRate(e.target.value)}
              className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-4 pl-10 text-white text-lg font-bold focus:outline-none focus:border-[#F0B429]" />
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-white font-semibold mb-3">What alerts do you want?</label>
          <div className="space-y-3">
            {([
              { value: "rate" as const, label: "Rate target alerts", desc: "Alert when AUD/INR hits your target rate" },
              { value: "platform" as const, label: "Best deal alerts", desc: "Alert when one platform is significantly cheaper" },
              { value: "both" as const, label: "All alerts (recommended)", desc: "Get both rate target and best deal alerts" },
            ]).map((opt) => (
              <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${alertType === opt.value ? "border-[#F0B429] bg-[#F0B429]/5" : "border-[#1E3A5F] hover:border-[#1E3A5F]/80"}`}>
                <input type="radio" name="alertType" value={opt.value} checked={alertType === opt.value} onChange={() => setAlertType(opt.value)} className="mt-1" />
                <div><p className="text-white font-semibold text-sm">{opt.label}</p><p className="text-[#7A9CC4] text-xs">{opt.desc}</p></div>
              </label>
            ))}
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full bg-[#F0B429] text-[#0A1628] font-bold py-4 rounded-xl hover:bg-yellow-400 transition-colors glow-gold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting alert...</> : "Set My Free Alert"}
        </button>
        <p className="text-[#7A9CC4] text-xs text-center mt-4">Free forever. No spam. Unsubscribe anytime.</p>
      </form>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Don't miss favorable rates", desc: "AUD/INR can swing 2-3% in a week. On a $5,000 transfer, that's ₹6,000+ difference." },
          { title: "Beat your bank", desc: "Banks charge 6%+ margins. Our alerts help you find digital platforms charging under 1%." },
          { title: "Timing is everything", desc: "Sending on the right day vs. the wrong day can save you ₹2,000-5,000 on a typical transfer." },
        ].map((item) => (
          <div key={item.title} className="bg-[#0D1B2E] rounded-xl p-5"><h3 className="text-white font-semibold text-sm mb-2">{item.title}</h3><p className="text-[#7A9CC4] text-xs">{item.desc}</p></div>
        ))}
      </div>
    </div>
  );
}
