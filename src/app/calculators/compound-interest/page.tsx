"use client";

import { useState, useMemo } from "react";
import { BarChart3, ArrowRight, Info, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import CalculatorLayout from "@/components/calculators/CalculatorLayout";
import DataTable from "@/components/calculators/DataTable";

const freqOptions = [
    { label: "Annually", value: 1 },
    { label: "Quarterly", value: 4 },
    { label: "Monthly", value: 12 },
    { label: "Daily", value: 365 },
];

export default function CompoundInterestPage() {
    const [initialInvestment, setInitialInvestment] = useState(10000);
    const [monthlyContribution, setMonthlyContribution] = useState(500);
    const [years, setYears] = useState(20);
    const [rate, setRate] = useState(7);
    const [compoundFreq, setCompoundFreq] = useState(12);

    const calculateCompoundInterest = useMemo(() => {
        let balance = initialInvestment;
        let totalPrincipal = initialInvestment;
        const r = rate / 100 / compoundFreq;
        const totalPeriods = compoundFreq * years;

        // Monthly contribution adjusted for the compounding frequency
        // e.g. if quarterly compounding, each period gets 3 months of contributions
        const contributionPerPeriod = monthlyContribution * (12 / compoundFreq);

        const growthData = [];

        // Add year 0
        growthData.push({
            year: 0,
            principal: totalPrincipal,
            balance: balance,
            interest: 0,
        });

        let periodsPerYear = compoundFreq;

        for (let period = 1; period <= totalPeriods; period++) {
            balance += balance * r; // Add interest for this period
            balance += contributionPerPeriod; // Add contribution
            totalPrincipal += contributionPerPeriod; // Update total principal

            // Record data at the end of each year
            if (period % periodsPerYear === 0) {
                growthData.push({
                    year: period / periodsPerYear,
                    principal: Math.round(totalPrincipal),
                    balance: Math.round(balance),
                    interest: Math.round(balance - totalPrincipal),
                });
            }
        }

        const finalBalance = growthData[growthData.length - 1]?.balance || 0;
        const finalInterest = growthData[growthData.length - 1]?.interest || 0;

        return {
            finalBalance,
            totalPrincipal: Math.round(totalPrincipal),
            totalInterest: finalInterest,
            growthData,
        };
    }, [initialInvestment, monthlyContribution, years, rate, compoundFreq]);

    const { finalBalance, totalPrincipal, totalInterest, growthData } = calculateCompoundInterest;

    // Build table data from growthData (skip year 0)
    const tableData = growthData
        .filter((d) => d.year > 0)
        .map((d) => ({
            year: d.year,
            balance: d.balance,
            contributions: d.principal,
            interest: d.interest,
        }));

    const tableColumns = [
        { key: "year", label: "Year", format: (v: number) => `${v}` },
        { key: "balance", label: "Balance" },
        { key: "contributions", label: "Contributions" },
        { key: "interest", label: "Interest Earned" },
    ];

    return (
        <CalculatorLayout calculatorSlug="compound-interest">
            <div className="min-h-screen pb-20">
                {/* Header */}
                <section className="relative overflow-hidden pt-10 pb-6 border-b border-white/40 bg-gradient-to-b from-white/40 via-transparent to-white/20">
                    <div className="mx-auto max-w-6xl px-4 relative">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-[#10B981]" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                    Compound Interest Calculator
                                </h1>
                            </div>
                            <p className="text-slate-500 text-sm md:text-base mb-6">
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
                            <div className="glass-panel border-white/60 shadow-xl shadow-slate-200/40 rounded-3xl p-6 lg:p-8">
                                <h2 className="text-slate-900 font-bold text-lg mb-6">Investment Details</h2>

                                {/* Initial Investment */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-slate-500 text-sm font-medium">Initial Investment</label>
                                        <span className="text-slate-900 font-bold">${initialInvestment.toLocaleString()}</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                                        <input
                                            type="number"
                                            value={initialInvestment || ""}
                                            onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                            className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 shadow-sm rounded-xl py-3 px-4 pl-8 text-slate-900 font-semibold focus:outline-none focus:border-[#10B981] focus:bg-white transition-all"
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="100000" step="1000"
                                        value={initialInvestment}
                                        onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-4 accent-[#10B981]"
                                    />
                                </div>

                                {/* Monthly Contribution */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-slate-500 text-sm font-medium">Monthly Contribution</label>
                                        <span className="text-slate-900 font-bold">${monthlyContribution.toLocaleString()}</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                                        <input
                                            type="number"
                                            value={monthlyContribution || ""}
                                            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                            className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 shadow-sm rounded-xl py-3 px-4 pl-8 text-slate-900 font-semibold focus:outline-none focus:border-[#10B981] focus:bg-white transition-all"
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="5000" step="50"
                                        value={monthlyContribution}
                                        onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-4 accent-[#10B981]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Interest Rate */}
                                    <div>
                                        <label className="block text-slate-500 text-sm font-medium mb-2">Est. Return (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={rate || ""}
                                                onChange={(e) => setRate(Number(e.target.value))}
                                                step="0.1"
                                                className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl py-3 px-3 pr-7 text-slate-900 font-semibold focus:outline-none focus:border-[#10B981] focus:bg-white transition-all text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">%</span>
                                        </div>
                                    </div>

                                    {/* Term */}
                                    <div>
                                        <label className="block text-slate-500 text-sm font-medium mb-2">Years to Grow</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={years || ""}
                                                onChange={(e) => setYears(Number(e.target.value))}
                                                className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl py-3 px-3 pr-7 text-slate-900 font-semibold focus:outline-none focus:border-[#10B981] focus:bg-white transition-all text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">Yrs</span>
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="50" step="1"
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-4 accent-[#10B981]"
                                />

                                {/* Compounding Frequency */}
                                <div className="mt-6">
                                    <label className="block text-slate-500 text-sm font-medium mb-3">Compounding Frequency</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {freqOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setCompoundFreq(opt.value)}
                                                className={`py-2 rounded-lg text-xs font-semibold transition-all backdrop-blur-sm ${
                                                    compoundFreq === opt.value
                                                        ? "bg-[#10B981] text-white shadow-md shadow-[#10B981]/20"
                                                        : "bg-white/60 border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Cross-sell for RemitIQ */}
                            <div className="glass-panel border-white/60 shadow-lg shadow-slate-200/30 rounded-3xl p-6">
                                <div className="flex items-start gap-3">
                                    <div className="pt-1"><CheckCircle2 className="w-5 h-5 text-[#10B981]" /></div>
                                    <div>
                                        <h3 className="text-slate-900 font-semibold text-sm mb-1">Investing overseas?</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed mb-3">
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
                                <div className="col-span-1 md:col-span-3 glass-panel border-white/60 shadow-md rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 to-transparent opacity-100" />
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div>
                                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Future Balance</p>
                                            <p className="text-5xl font-extrabold text-slate-900">
                                                ${finalBalance > 0 ? finalBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"}
                                            </p>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-[#10B981] font-bold text-lg mb-0.5">+${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            <p className="text-slate-500 text-xs font-semibold">Total interest earned</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-3 grid grid-cols-2 gap-4">
                                    <div className="glass-panel border-white/60 rounded-2xl p-5">
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Principal</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            ${totalPrincipal > 0 ? totalPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
                                        </p>
                                        <p className="text-slate-500 text-[10px] mt-1 text-opacity-70">
                                            Your initial ${initialInvestment.toLocaleString()} + contributions
                                        </p>
                                    </div>
                                    <div className="glass-panel border-white/60 rounded-2xl p-5">
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Return on Investment</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {totalPrincipal > 0 ? ((totalInterest / totalPrincipal) * 100).toFixed(1) : "0.0"}%
                                        </p>
                                        <p className="text-slate-500 text-[10px] mt-1 text-opacity-70">
                                            Return relative to your total deposits
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Growth Chart */}
                            <div className="glass-panel border-white/60 shadow-lg rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-slate-900 font-bold text-lg">Investment Growth</h2>
                                        <p className="text-slate-500 text-sm">Principal vs Compound Interest over {years} years</p>
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
                                                    tick={{ fill: "#64748B", fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(v) => `Y${v}`}
                                                />
                                                <YAxis
                                                    tick={{ fill: "#64748B", fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={65}
                                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                                />
                                                <Tooltip
                                                    contentStyle={{ background: "#FFFFFF", border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                                                    itemStyle={{ color: "#0F172A", fontWeight: 600 }}
                                                    labelStyle={{ color: '#64748B', marginBottom: '8px' }}
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
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                            <BarChart3 className="w-10 h-10 mb-3 opacity-20" />
                                            <p>Enter details to see growth</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-200/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#00B9FF]"></div>
                                        <span className="text-xs text-slate-500 font-medium">Your Principal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                                        <span className="text-xs text-slate-500 font-medium">Interest Earned</span>
                                    </div>
                                </div>
                            </div>

                            {/* Year-by-Year Data Table */}
                            <DataTable
                                title="Year-by-Year Growth"
                                columns={tableColumns}
                                data={tableData}
                                defaultCollapsed={true}
                            />

                            {/* Information Tips */}
                            <div className="bg-gradient-to-r from-white to-[#10B981]/5 border border-[#10B981]/10 shadow-sm rounded-3xl p-6 flex items-start gap-4">
                                <div className="mt-1"><Info className="w-5 h-5 text-[#10B981]" /></div>
                                <div>
                                    <h4 className="text-slate-900 font-semibold text-sm mb-1">The Magic of Compound Interest</h4>
                                    <p className="text-slate-500 text-sm leading-relaxed">
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
        </CalculatorLayout>
    );
}
