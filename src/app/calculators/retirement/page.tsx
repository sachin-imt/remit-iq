"use client";

import { useState, useMemo } from "react";
import { PiggyBank, ArrowRight, Info, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import Link from "next/link";
import CalculatorLayout from "@/components/calculators/CalculatorLayout";

export default function RetirementPlannerPage() {
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(65);
    const [currentSavings, setCurrentSavings] = useState(15000);
    const [monthlyContribution, setMonthlyContribution] = useState(800);
    const [rate, setRate] = useState(7);
    const [withdrawalRate, setWithdrawalRate] = useState(4); // 4% rule
    const [lifeExpectancy, setLifeExpectancy] = useState(85);
    const [inflationRate, setInflationRate] = useState(2.5);

    const calculateRetirement = useMemo(() => {
        const years = retirementAge - currentAge;
        if (years <= 0) return { finalBalance: 0, monthlyIncome: 0, trajectory: [], totalContributions: 0 };

        let balance = currentSavings;
        let totalContributions = currentSavings;
        const r = rate / 100 / 12;
        const months = years * 12;

        const trajectory = [];

        // Add year 0
        trajectory.push({
            age: currentAge,
            balance: balance,
            contributions: totalContributions,
        });

        for (let month = 1; month <= months; month++) {
            balance += balance * r; // Add interest
            balance += monthlyContribution; // Add contribution
            totalContributions += monthlyContribution;

            if (month % 12 === 0) {
                trajectory.push({
                    age: currentAge + (month / 12),
                    balance: Math.round(balance),
                    contributions: totalContributions,
                });
            }
        }

        const finalBalance = trajectory[trajectory.length - 1]?.balance || 0;

        // Calculate monthly income at retirement based on the safe withdrawal rate
        const annualIncome = finalBalance * (withdrawalRate / 100);
        const monthlyIncome = annualIncome / 12;

        return {
            finalBalance,
            monthlyIncome,
            trajectory,
            totalContributions,
        };
    }, [currentAge, retirementAge, currentSavings, monthlyContribution, rate, withdrawalRate]);

    const { finalBalance, monthlyIncome, trajectory, totalContributions } = calculateRetirement;

    const handleAgeChange = (field: 'current' | 'retire', value: number) => {
        if (field === 'current') {
            setCurrentAge(Math.min(value, retirementAge - 1));
        } else {
            setRetirementAge(Math.max(value, currentAge + 1));
        }
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <section className="relative overflow-hidden pt-10 pb-6 border-b border-slate-200 bg-slate-50">
                <div className="mx-auto max-w-6xl px-4 relative">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center">
                                <PiggyBank className="w-5 h-5 text-[#8B5CF6]" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                Retirement Planner
                            </h1>
                        </div>
                        <p className="text-slate-500 text-sm md:text-base mb-6">
                            Estimate how much you'll have saved by retirement age and see what your
                            monthly income might look like based on the safe withdrawal rule.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/calculators" className="text-[#8B5CF6] text-sm font-semibold hover:text-violet-400 transition-colors flex items-center gap-1">
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
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                            <h2 className="text-slate-900 font-bold text-lg mb-6">Your Profile</h2>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {/* Current Age */}
                                <div>
                                    <label className="block text-slate-500 text-sm font-medium mb-2">Current Age</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={currentAge || ""}
                                            onChange={(e) => handleAgeChange('current', Number(e.target.value))}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-slate-900 font-semibold focus:outline-none focus:border-[#8B5CF6] transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Retirement Age */}
                                <div>
                                    <label className="block text-slate-500 text-sm font-medium mb-2">Retire Age</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={retirementAge || ""}
                                            onChange={(e) => handleAgeChange('retire', Number(e.target.value))}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-slate-900 font-semibold focus:outline-none focus:border-[#8B5CF6] transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Current Savings */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-slate-500 text-sm font-medium">Current Savings</label>
                                    <span className="text-slate-900 font-bold">${currentSavings.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                                    <input
                                        type="number"
                                        value={currentSavings || ""}
                                        onChange={(e) => setCurrentSavings(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 pl-8 text-slate-900 font-semibold focus:outline-none focus:border-[#8B5CF6] transition-all"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1000000" step="5000"
                                    value={currentSavings}
                                    onChange={(e) => setCurrentSavings(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-4 accent-[#8B5CF6]"
                                />
                            </div>

                            {/* Monthly Contribution */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-slate-500 text-sm font-medium">Monthly Savings</label>
                                    <span className="text-slate-900 font-bold">${monthlyContribution.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                                    <input
                                        type="number"
                                        value={monthlyContribution || ""}
                                        onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 pl-8 text-slate-900 font-semibold focus:outline-none focus:border-[#8B5CF6] transition-all"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0" max="10000" step="100"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-4 accent-[#8B5CF6]"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-200">
                                <h3 className="text-slate-900 font-bold text-md mb-4">Assumptions</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-slate-500 text-xs font-medium mb-2">Est. Return (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={rate || ""}
                                                onChange={(e) => setRate(Number(e.target.value))}
                                                step="0.1"
                                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 pr-7 text-slate-900 font-semibold focus:outline-none focus:border-[#8B5CF6] transition-all text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs font-medium mb-2">Withdrawal Rule</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={withdrawalRate || ""}
                                                onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                                                step="0.1"
                                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 pr-7 text-slate-900 font-semibold focus:outline-none focus:border-[#8B5CF6] transition-all text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-500 text-xs font-medium mb-2">Life Expectancy</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={lifeExpectancy || ""}
                                                onChange={(e) => setLifeExpectancy(Math.min(100, Math.max(65, Number(e.target.value))))}
                                                min={65}
                                                max={100}
                                                step={1}
                                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-900 font-semibold focus:outline-none focus:border-[#8B5CF6] transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-xs font-medium mb-2">Inflation (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={inflationRate || ""}
                                                onChange={(e) => setInflationRate(Number(e.target.value))}
                                                step="0.1"
                                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 pr-7 text-slate-900 font-semibold focus:outline-none focus:border-[#8B5CF6] transition-all text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cross-sell for RemitIQ */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center mb-3">
                                    <PiggyBank className="w-5 h-5 text-[#8B5CF6]" />
                                </div>
                                <h3 className="text-slate-900 font-semibold text-sm mb-2">Retiring overseas?</h3>
                                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                                    Moving your pension or retirement nest egg across borders? Find the best exchange rates to maximize your savings.
                                </p>
                                <Link href="/" className="bg-transparent border-2 border-[#8B5CF6] text-[#8B5CF6] px-4 py-2 rounded-lg hover:bg-[#8B5CF6] hover:text-slate-900 text-sm font-bold w-full transition-colors">
                                    Compare Rates Now
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Results - Right Column */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Top Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent opacity-100" />
                                <div className="relative z-10 flex flex-col justify-center h-full">
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Total Savings at Age {retirementAge}</p>
                                    <p className="text-5xl font-extrabold text-slate-900">
                                        ${finalBalance > 0 ? finalBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-3">
                                        Your estimated nest egg when you retire.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/5 to-transparent opacity-100" />
                                <div className="relative z-10 flex flex-col justify-center h-full">
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Est. Monthly Income</p>
                                    <p className="text-4xl font-extrabold text-emerald-400">
                                        ${monthlyIncome > 0 ? monthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"} / mo
                                    </p>
                                    <p className="text-slate-500 text-xs mt-3">
                                        Based on withdrawing {withdrawalRate}% of your portfolio per year.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Trajectory Chart */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-slate-900 font-bold text-lg">Retirement Trajectory</h2>
                                    <p className="text-slate-500 text-sm">See how your savings build over {retirementAge - currentAge} years</p>
                                </div>
                            </div>

                            <div className="h-80 w-full">
                                {trajectory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trajectory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRetirement" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5} />
                                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="age"
                                                tick={{ fill: "#64748B", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `Age ${v}`}
                                            />
                                            <YAxis
                                                tick={{ fill: "#64748B", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={65}
                                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: '1px solid #E2E8F0', borderRadius: '8px' }}
                                                itemStyle={{ color: "#0F172A", fontWeight: 600 }}
                                                labelStyle={{ color: '#64748B', marginBottom: '8px' }}
                                                formatter={(value: number, name: string) => {
                                                    const valStr = `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                                                    return name === 'balance' ? [valStr, 'Total Balance'] : [valStr, 'Your Contributions'];
                                                }}
                                                labelFormatter={(label) => `At Age ${label}`}
                                            />
                                            <Area type="monotone" dataKey="balance" name="balance" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRetirement)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                        <PiggyBank className="w-10 h-10 mb-3 opacity-20" />
                                        <p>Enter details to see trajectory</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Information Tips */}
                        <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-2xl p-5 flex items-start gap-4">
                            <div className="mt-1"><Info className="w-5 h-5 text-[#8B5CF6]" /></div>
                            <div>
                                <h4 className="text-slate-900 font-semibold text-sm mb-1">The 4% Rule</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Financial planners often use the "4% rule" as a rule of thumb for retirement.
                                    It suggests you can safely withdraw 4% of your total retirement portfolio in the first year,
                                    and adjust for inflation in subsequent years, without running out of money over a 30-year span.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
