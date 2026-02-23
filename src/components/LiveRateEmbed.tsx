"use client";

import { useEffect, useState, useMemo } from "react";
import { formatINR, getPlatforms, calcReceived, DEFAULT_MID_MARKET_RATE, getAffiliateUrlWithAmount } from "@/data/platforms";
import { ArrowUpRight, Loader2, Star, Zap } from "lucide-react";

export default function LiveRateEmbed({ providerA, providerB }: { providerA: string, providerB: string }) {
    const amount = 2000; // Fixed template amount for articles
    const [midMarketRate, setMidMarketRate] = useState(DEFAULT_MID_MARKET_RATE);
    const [providerConfigs, setProviderConfigs] = useState<any[] | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/rates")
            .then((r) => r.json())
            .then((data) => {
                if (data.midMarketRate) setMidMarketRate(data.midMarketRate);
                if (data.providerConfigs) setProviderConfigs(data.providerConfigs);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const comparison = useMemo(() => {
        const platforms = getPlatforms(midMarketRate, amount, providerConfigs);

        const pA = platforms.find(p => p.id === providerA);
        const pB = platforms.find(p => p.id === providerB);

        if (!pA || !pB) return null;

        const recvA = calcReceived(amount, pA.rate, pA.fee);
        const recvB = calcReceived(amount, pB.rate, pB.fee);

        const winner = recvA > recvB ? pA : pB;
        const loser = recvA > recvB ? pB : pA;
        const winnerRecv = Math.max(recvA, recvB);
        const loserRecv = Math.min(recvA, recvB);
        const diff = winnerRecv - loserRecv;

        return { pA, pB, recvA, recvB, winner, loser, winnerRecv, diff };
    }, [midMarketRate, providerConfigs, providerA, providerB]);

    if (loading) {
        return (
            <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 my-8 flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-[#F0B429] animate-spin" />
            </div>
        );
    }

    if (!comparison) return null;

    const { pA, pB, recvA, recvB, winner, diff } = comparison;

    return (
        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 my-8 not-prose">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#F0B429] fill-[#F0B429]" />
                <h3 className="text-white font-bold text-lg m-0">Live Rate Comparison</h3>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">REAL-TIME DATA</span>
            </div>

            <p className="text-[#7A9CC4] text-sm mb-6">
                Right now, sending $2,000 AUD through <strong>{winner.name}</strong> will get you <strong>+₹{formatINR(diff)}</strong> more than {winner.id === pA.id ? pB.name : pA.name}.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { p: pA, recv: recvA },
                    { p: pB, recv: recvB }
                ].map(({ p, recv }) => (
                    <div key={p.id} className={`p-4 rounded-xl border ${p.id === winner.id ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-[#1E3A5F] bg-[#0D1B2E]'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: p.color + "20", color: p.color }}>{p.abbr}</div>
                                <span className="text-white font-bold">{p.name}</span>
                            </div>
                            {p.id === winner.id && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white">BEST DEAL</span>}
                        </div>

                        <div className="space-y-1 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#7A9CC4]">Exchange Rate</span>
                                <span className="text-white font-semibold">₹{p.rate.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#7A9CC4]">Transfer Fee</span>
                                <span className={p.fee === 0 ? "text-emerald-400 font-semibold" : "text-white font-semibold"}>{p.fee === 0 ? "FREE" : `$${p.fee.toFixed(2)}`}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-[#1E3A5F]/50">
                                <span className="text-[#7A9CC4]">Recipient Gets</span>
                                <span className="text-white font-bold text-lg">₹{formatINR(recv)}</span>
                            </div>
                        </div>

                        <a href={getAffiliateUrlWithAmount(p.id, p.affiliateUrl, amount)} target="_blank" rel="noopener noreferrer sponsored"
                            className={`w-full inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${p.id === winner.id ? 'bg-[#F0B429] text-[#0A1628] hover:bg-yellow-400 glow-gold' : 'bg-[#1E3A5F]/50 text-[#C8D8E8] hover:bg-[#1E3A5F]'}`}>
                            Transfer via {p.name} <ArrowUpRight className="w-4 h-4" />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
