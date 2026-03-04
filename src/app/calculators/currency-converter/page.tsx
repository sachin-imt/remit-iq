"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeftRight, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import CalculatorLayout from "@/components/calculators/CalculatorLayout";
import { CURRENCIES, POPULAR_CURRENCIES, getCurrencyInfo, formatCurrencyResult } from "@/lib/currency-data";

export default function CurrencyConverterPage() {
  const [amount, setAmount] = useState(1000);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live rates
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        if (res.ok) {
          const data = await res.json();
          setRates(data.rates);
        }
      } catch {
        // Fall back to hardcoded rates
      } finally {
        setIsLoading(false);
      }
    }
    fetchRates();
  }, []);

  const getRate = (code: string): number => {
    if (rates && rates[code]) return rates[code];
    const info = getCurrencyInfo(code);
    return info ? info.fallbackRate : 1;
  };

  const conversion = useMemo(() => {
    const fromRate = getRate(fromCurrency);
    const toRate = getRate(toCurrency);
    const exchangeRate = toRate / fromRate;
    const result = amount * exchangeRate;
    const toInfo = getCurrencyInfo(toCurrency);
    const formatted = toInfo ? formatCurrencyResult(result, toInfo.symbol) : result.toFixed(2);

    return { result, exchangeRate, formatted };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, fromCurrency, toCurrency, rates]);

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);

  return (
    <CalculatorLayout calculatorSlug="currency-converter">
      <div className="min-h-screen pb-20">
        {/* Header */}
        <section className="relative overflow-hidden pt-10 pb-6 border-b border-white/40 bg-gradient-to-b from-white/40 via-transparent to-white/20">
          <div className="mx-auto max-w-6xl px-4 relative">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F43F5E]/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-[#F43F5E]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  Currency Converter
                </h1>
              </div>
              <p className="text-slate-500 text-sm md:text-base mb-6">
                Convert between 30+ currencies with live exchange rates. Rates
                are approximate mid-market rates for informational purposes.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/calculators"
                  className="text-[#F43F5E] text-sm font-semibold hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Back to
                  Calculators
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="max-w-xl mx-auto space-y-6">
            {/* Converter Card */}
            <div className="glass-panel border-white/60 shadow-xl shadow-slate-200/40 rounded-3xl p-8">
              {/* Amount */}
              <div className="mb-5">
                <label className="block text-slate-500 text-sm font-medium mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                    {fromInfo?.symbol || "$"}
                  </span>
                  <input
                    type="number"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="0"
                    className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 shadow-sm rounded-xl py-3 px-4 pl-10 text-slate-900 font-semibold focus:outline-none focus:border-[#F43F5E] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* From Currency */}
              <div className="mb-3">
                <label className="block text-slate-500 text-sm font-medium mb-2">
                  From
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                    {fromInfo?.flag}
                  </span>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl py-3 px-4 pl-12 text-slate-900 font-semibold focus:outline-none focus:border-[#F43F5E] focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center my-2">
                <button
                  onClick={swap}
                  className="w-11 h-11 rounded-full bg-white border border-slate-200 text-[#F43F5E] shadow-sm flex items-center justify-center hover:bg-slate-50 hover:shadow-md hover:rotate-180 transition-all duration-300"
                  title="Swap currencies"
                >
                  ⇅
                </button>
              </div>

              {/* To Currency */}
              <div className="mb-6">
                <label className="block text-slate-500 text-sm font-medium mb-2">
                  To
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                    {toInfo?.flag}
                  </span>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl py-3 px-4 pl-12 text-slate-900 font-semibold focus:outline-none focus:border-[#F43F5E] focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result */}
              <div className="text-center p-6 glass-panel bg-gradient-to-br from-[#F43F5E]/10 to-[#F0B429]/10 border border-white/60 rounded-2xl">
                <p className="text-4xl font-extrabold text-[#F43F5E]">
                  {isLoading ? "Loading..." : conversion.formatted}
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  1 {fromCurrency} = {conversion.exchangeRate.toFixed(4)}{" "}
                  {toCurrency}
                </p>
              </div>
            </div>

            {/* Info Tip */}
            <div className="bg-gradient-to-r from-white to-[#F43F5E]/5 border border-[#F43F5E]/10 shadow-sm rounded-3xl p-6 flex items-start gap-4">
              <div className="mt-1">
                <Info className="w-5 h-5 text-[#F43F5E]" />
              </div>
              <div>
                <h4 className="text-slate-900 font-semibold text-sm mb-1">
                  Mid-Market Rates
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  These are approximate mid-market rates for informational
                  purposes. Actual transfer rates from providers may vary.
                  For the best international transfer rates, compare providers
                  below.
                </p>
              </div>
            </div>

            {/* Popular Rates Ticker */}
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider text-center mb-3">
                Popular Exchange Rates (vs USD)
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_CURRENCIES.map((code) => {
                  const info = getCurrencyInfo(code);
                  const rate = getRate(code);
                  if (!info) return null;
                  return (
                    <div
                      key={code}
                      className="bg-white border border-slate-100 shadow-sm rounded-full px-4 py-2 flex items-center gap-2 text-xs text-slate-600 hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="text-base">{info.flag}</span>
                      <span className="font-medium">
                        {code} {rate < 2 ? rate.toFixed(4) : rate.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cross-sell to RemitIQ */}
            <div className="glass-panel border-white/60 shadow-lg shadow-slate-200/30 rounded-3xl p-8 text-center mt-8">
              <h3 className="text-slate-900 font-bold text-lg mb-2">
                Sending money internationally?
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                Don&apos;t just convert — compare actual transfer rates from Wise,
                Remitly, OFX, and more to find the cheapest way to send.
              </p>
              <Link
                href="/"
                className="inline-flex items-center bg-[#F0B429] text-slate-900 font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:bg-yellow-400 hover:-translate-y-0.5 transition-all"
              >
                Compare Live Transfer Rates{" "}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </CalculatorLayout>
  );
}
