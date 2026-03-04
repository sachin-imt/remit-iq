"use client";

import { useState, useEffect } from "react";

export default function StickyCTABar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let shown = false;
    const handleScroll = () => {
      if (shown) return;
      const pct =
        window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (pct > 0.4) {
        setVisible(true);
        shown = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[55] bg-white border-t border-slate-200 shadow-2xl transition-transform duration-500 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-slate-500 text-sm text-center sm:text-left">
          💡 Want personalized financial advice?{" "}
          <strong className="text-slate-900">Talk to an expert free.</strong>
        </span>
        <a
          href="#advisor-affiliate"
          target="_blank"
          rel="noopener sponsored"
          className="bg-[#F0B429] text-slate-900 font-bold text-sm px-5 py-2 rounded-lg hover:bg-yellow-400 transition-colors whitespace-nowrap"
        >
          Get Free Consultation →
        </a>
      </div>
    </div>
  );
}
