"use client";

import { useState, useMemo } from "react";
import { BarChart3, ArrowRight, Info, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

export default function CompoundInterestPage() {
    const [initialInvestment, setInitialInvestment] = useState(10000);
    const [monthlyContribution, setMonthlyContribution] = useState(500);
    const [years, setYears] = useState(20);
    const [rate, setRate] = useState(7);

    const calculateCompoundInterest = useMemo(() => {
        let balance = initialInvestment;
        let totalPrincipal = initialInvestment;
        const r = rate / 100 / 12;
        const months = years * 12;

        const growthData = [];

        // Add year 0
        growthData.push({
            year: 0,
            principal: totalPrincipal,
            balance: balance,
            interest: 0,
        });

        for (let month = 1; month <= months; month++) {
            balance += balance * r; // Add interest
            balance += monthlyContribution; // Add contribution
            totalPrincipal += monthlyContribution; // Update total principal

            if (month % 12 === 0) {
                growthData.push({
                    year: month / 12,
                    principal: totalPrincipal,
                    balance: Math.round(balance),
                    interest: Math.round(balance - totalPrincipal),
                });
            }
        }

        const finalBalance = growthData[growthData.length - 1]?.balance || 0;
        const finalInterest = growthData[growthData.length - 1]?.interest || 0;

        return {
            finalBalance,
            totalPrincipal,
            totalInterest: finalInterest,
            growthData,
        };
    }, [initialInvestment, monthlyContribution, years, rate]);

    const { finalBalance, totalPrincipal, totalInterest, growthData } = calculateCompoundInterest;

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <section className="relative overflow-hidden pt-10 pb-6 border-b border-[#1E3A5F] bg-[#0A1628]">
                <div className="mx-auto max-w-6xl px-4 relative">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-[#10B981]" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                                Compound Interest Calculator
                            </h1>
                        </div>
                        <p className="text-[#7A9CC4] text-sm md:text-base mb-6">
                            See how your money grows over time. Visualize the power of compound interest and
                            regular investments.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/calculators" className="text-[#10B981] text-sm font-semibold hover:text-emerald-400 transition-colors flex items-center gap-1">
                                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Calculators
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Controls - Left Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                            <h2 className="text-white font-bold text-lg mb-6">Investment Details</h2>

                            {/* Initial Investment */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[#7A9CC4] text-sm font-medium">Initial Investment</label>
                                    <span className="text-white font-bold">${initialInvestment.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold">$</span>
                                    <input
                                        type="number"
                                        value={initialInvestment || ""}
                                        onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                        className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-4 pl-8 text-white font-semibold focus:outline-none focus:border-[#10B981] transition-all"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0" max="100000" step="1000"
                                    value={initialInvestment}
                                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                    className="w-full h-1.5 bg-[#1E3A5F] rounded-lg appearance-none cursor-pointer mt-4 accent-[#10B981]"
                                />
                            </div>

                            {/* Monthly Contribution */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[#7A9CC4] text-sm font-medium">Monthly Contribution</label>
                                    <span className="text-white font-bold">${monthlyContribution.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold">$</span>
                                    <input
                                        type="number"
                                        value={monthlyContribution || ""}
                                        onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                        className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-4 pl-8 text-white font-semibold focus:outline-none focus:border-[#10B981] transition-all"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0" max="5000" step="50"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                    className="w-full h-1.5 bg-[#1E3A5F] rounded-lg appearance-none cursor-pointer mt-4 accent-[#10B981]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Interest Rate */}
                                <div>
                                    <label className="block text-[#7A9CC4] text-sm font-medium mb-2">Est. Return (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={rate || ""}
                                            onChange={(e) => setRate(Number(e.target.value))}
                                            step="0.1"
                                            className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-3 pr-7 text-white font-semibold focus:outline-none focus:border-[#10B981] transition-all text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold text-sm">%</span>
                                    </div>
                                </div>

                                {/* Term */}
                                <div>
                                    <label className="block text-[#7A9CC4] text-sm font-medium mb-2">Years to Grow</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={years || ""}
                                            onChange={(e) => setYears(Number(e.target.value))}
                                            className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-3 pr-7 text-white font-semibold focus:outline-none focus:border-[#10B981] transition-all text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold text-sm">Yrs</span>
                                    </div>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="1" max="50" step="1"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full h-1.5 bg-[#1E3A5F] rounded-lg appearance-none cursor-pointer mt-4 accent-[#10B981]"
                            />

                        </div>

                        {/* Cross-sell for RemitIQ */}
                        <div className="bg-gradient-to-br from-[#10B981]/10 to-[#F0B429]/10 border border-[#1E3A5F] rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="pt-1"><CheckCircle2 className="w-5 h-5 text-[#10B981]" /></div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm mb-1">Investing overseas?</h3>
                                    <p className="text-[#7A9CC4] text-xs leading-relaxed mb-3">
                                        Don't let bank exchange rates eat into your investment capital. Send money to India at mid-market rates.
                                    </p>
                                    <Link href="/" className="inline-flex items-center text-[#10B981] hover:text-emerald-400 text-sm font-semibold transition-colors border-b border-[#10B981]/30 pb-0.5">
                                        Compare Rates Today <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results - Right Column */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Top Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1 md:col-span-3 bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 to-transparent opacity-100" />
                                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div>
                                        <p className="text-[#7A9CC4] text-sm font-bold uppercase tracking-widest mb-2">Future Balance</p>
                                        <p className="text-5xl font-extrabold text-white">
                                            ${finalBalance > 0 ? finalBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"}
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-[#10B981] font-bold text-lg mb-0.5">+${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                        <p className="text-[#7A9CC4] text-xs font-semibold">Total interest earned</p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-3 grid grid-cols-2 gap-4">
                                <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-5">
                                    <p className="text-[#7A9CC4] text-xs font-semibold uppercase tracking-wider mb-2">Total Principal</p>
                                    <p className="text-2xl font-bold text-white">
                                        ${totalPrincipal > 0 ? totalPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
                                    </p>
                                    <p className="text-[#7A9CC4] text-[10px] mt-1 text-opacity-70">
                                        Your initial ${initialInvestment.toLocaleString()} + contributions
                                    </p>
                                </div>
                                <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-5">
                                    <p className="text-[#7A9CC4] text-xs font-semibold uppercase tracking-wider mb-2">Return on Investment</p>
                                    <p className="text-2xl font-bold text-white">
                                        {totalPrincipal > 0 ? ((totalInterest / totalPrincipal) * 100).toFixed(1) : "0.0"}%
                                    </p>
                                    <p className="text-[#7A9CC4] text-[10px] mt-1 text-opacity-70">
                                        Return relative to your total deposits
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Growth Chart */}
                        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-white font-bold text-lg">Investment Growth</h2>
                                    <p className="text-[#7A9CC4] text-sm">Principal vs Compound Interest over {years} years</p>
                                </div>
                            </div>

                            <div className="h-80 w-full">
                                {growthData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00B9FF" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#00B9FF" stopOpacity={0.3} />
                                                </linearGradient>
                                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="year"
                                                tick={{ fill: "#7A9CC4", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `Y${v}`}
                                            />
                                            <YAxis
                                                tick={{ fill: "#7A9CC4", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={65}
                                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: '8px' }}
                                                itemStyle={{ color: "#fff", fontWeight: 600 }}
                                                labelStyle={{ color: "#7A9CC4", marginBottom: '8px' }}
                                                formatter={(value: number, name: string) => {
                                                    const label = name === 'interest' ? 'Compound Interest' : 'Total Principal';
                                                    return [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, label];
                                                }}
                                                labelFormatter={(label) => `Year ${label}`}
                                            />
                                            {/* Stacked areas show total balance, where principal is bottom and interest is top */}
                                            <Area type="monotone" dataKey="principal" stackId="1" stroke="#00B9FF" strokeWidth={2} fillOpacity={1} fill="url(#colorPrincipal)" />
                                            <Area type="monotone" dataKey="interest" stackId="1" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#7A9CC4]">
                                        <BarChart3 className="w-10 h-10 mb-3 opacity-20" />
                                        <p>Enter details to see growth</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[#1E3A5F]/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#00B9FF]"></div>
                                    <span className="text-xs text-[#7A9CC4] font-medium">Your Principal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                                    <span className="text-xs text-[#7A9CC4] font-medium">Interest Earned</span>
                                </div>
                            </div>
                        </div>

                        {/* Information Tips */}
                        <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-2xl p-5 flex items-start gap-4">
                            <div className="mt-1"><Info className="w-5 h-5 text-[#10B981]" /></div>
                            <div>
                                <h4 className="text-white font-semibold text-sm mb-1">The Magic of Compound Interest</h4>
                                <p className="text-[#7A9CC4] text-sm leading-relaxed">
                                    Compound interest is when you earn interest on both your original money and on the interest you've already earned.
                                    Over long periods, this creates a snowball effect where your returns start generating their own massive returns.
                                    Time is the most important factor in compound growth — starting early beats starting big.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
