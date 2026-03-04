"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { saveEmailCapture, hasModalBeenShown, markModalShown } from "@/lib/calculator-monetization";

export default function EmailCaptureModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const showModal = useCallback(() => {
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
    markModalShown();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      saveEmailCapture(email, window.location.pathname);
      setSubmitted(true);
      setTimeout(hideModal, 2000);
    }
  };

  useEffect(() => {
    if (hasModalBeenShown()) return;

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      showModal();
    };

    // Exit intent (desktop)
    const handleMouseOut = (e: MouseEvent) => {
      if (e.clientY < 5) trigger();
    };

    // Scroll-based trigger (60%)
    const handleScroll = () => {
      const scrollPct =
        (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (scrollPct > 0.6) trigger();
    };

    // Time-based fallback (45s)
    const timeout = setTimeout(trigger, 45000);

    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, [showModal]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) hideModal();
      }}
    >
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-2xl">
        <button
          onClick={hideModal}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-emerald-400 font-semibold text-lg">
              You&apos;re in! Check your email.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-slate-900 font-bold text-xl mb-2">
                Get Your Free Financial Health Report
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Join 10,000+ smart savers. Get weekly tips on saving money,
                reducing debt, and growing wealth — plus a free PDF checklist.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
              />
              <button
                type="submit"
                className="w-full bg-[#F0B429] text-slate-900 font-bold py-3 px-4 rounded-xl hover:bg-yellow-400 transition-colors"
              >
                Send Me the Free Guide
              </button>
            </form>
            <p className="text-slate-500/60 text-xs text-center mt-3">
              No spam, ever. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
