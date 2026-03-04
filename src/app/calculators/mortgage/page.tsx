"use client";

import { useState, useMemo } from "react";
import { Home, ArrowRight, Info, PieChart as PieChartIcon, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

export default function MortgageCalculatorPage() {
    const [homeValue, setHomeValue] = useState(400000);
    const [downPayment, setDownPayment] = useState(80000);
    const [years, setYears] = useState(30);
    const [rate, setRate] = useState(6.5);
    const [propertyTax, setPropertyTax] = useState(4000); // Annual
    const [homeInsurance, setHomeInsurance] = useState(1200); // Annual

    const calculateMortgage = useMemo(() => {
        const loanAmount = homeValue - downPayment;
        const r = rate / 100 / 12;
        const n = years * 12;

        if (loanAmount <= 0) return { pni: 0, tax: 0, insurance: 0, total: 0, amortization: [], breakdown: [] };

        // Principal and Interest
        const pni = r > 0
            ? (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
            : loanAmount / n;

        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const totalMonthly = pni + monthlyTax + monthlyInsurance;

        // Amortization Schedule
        let balance = loanAmount;
        const amortization = [];
        let cumulativeInterest = 0;

        for (let month = 1; month <= n; month++) {
            const interestPayment = balance * r;
            const principalPayment = pni - interestPayment;
            balance -= principalPayment;
            cumulativeInterest += interestPayment;

            if (month % 12 === 0 || month === n) {
                amortization.push({
                    year: month / 12,
                    balance: Math.max(0, balance),
                    interest: cumulativeInterest,
                });
            }
        }

        // Breakdown for Pie Chart
        const breakdown = [
            { name: "Principal & Interest", value: pni, color: "#F0B429" },
            { name: "Property Tax", value: monthlyTax, color: "#00B9FF" },
            { name: "Home Insurance", value: monthlyInsurance, color: "#8B5CF6" },
        ];

        return {
            loanAmount,
            pni,
            tax: monthlyTax,
            insurance: monthlyInsurance,
            total: totalMonthly,
            amortization,
            breakdown
        };
    }, [homeValue, downPayment, years, rate, propertyTax, homeInsurance]);

    const { loanAmount, pni, tax, insurance, total, amortization, breakdown } = calculateMortgage;

    const handleDownPaymentChange = (val: number) => {
        setDownPayment(val);
    };

    const downPaymentPercent = homeValue > 0 ? ((downPayment / homeValue) * 100).toFixed(1) : "0.0";

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <section className="relative overflow-hidden pt-10 pb-6 border-b border-[#1E3A5F] bg-[#0A1628]">
                <div className="mx-auto max-w-6xl px-4 relative">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F0B429]/20 flex items-center justify-center">
                                <Home className="w-5 h-5 text-[#F0B429]" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                                Mortgage Calculator
                            </h1>
                        </div>
                        <p className="text-[#7A9CC4] text-sm md:text-base mb-6">
                            Estimate your monthly mortgage payments including property taxes and home insurance.
                            See exactly where your money goes.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/calculators" className="text-[#F0B429] text-sm font-semibold hover:text-yellow-400 transition-colors flex items-center gap-1">
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
                            <h2 className="text-white font-bold text-lg mb-6">Home Details</h2>

                            {/* Home Value */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[#7A9CC4] text-sm font-medium">Home Value</label>
                                    <span className="text-white font-bold">${homeValue.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold">$</span>
                                    <input
                                        type="number"
                                        value={homeValue || ""}
                                        onChange={(e) => setHomeValue(Number(e.target.value))}
                                        className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-4 pl-8 text-white font-semibold focus:outline-none focus:border-[#F0B429] transition-all"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="50000" max="2500000" step="10000"
                                    value={homeValue}
                                    onChange={(e) => setHomeValue(Number(e.target.value))}
                                    className="w-full h-1.5 bg-[#1E3A5F] rounded-lg appearance-none cursor-pointer mt-4 accent-[#F0B429]"
                                />
                            </div>

                            {/* Down Payment */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[#7A9CC4] text-sm font-medium">Down Payment</label>
                                    <span className="text-white font-bold">${downPayment.toLocaleString()} ({downPaymentPercent}%)</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold">$</span>
                                    <input
                                        type="number"
                                        value={downPayment || ""}
                                        onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                                        className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-4 pl-8 text-white font-semibold focus:outline-none focus:border-[#F0B429] transition-all"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0" max={homeValue} step="1000"
                                    value={downPayment}
                                    onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                                    className="w-full h-1.5 bg-[#1E3A5F] rounded-lg appearance-none cursor-pointer mt-4 accent-[#F0B429]"
                                />

                                {/* Loan Amount Display */}
                                <div className="mt-3 flex justify-between items-center bg-[#0A1628] rounded-lg p-3 border border-[#1E3A5F]/50">
                                    <span className="text-[#7A9CC4] text-xs font-medium">Loan Amount</span>
                                    <span className="text-white text-sm font-bold">${loanAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {/* Interest Rate */}
                                <div>
                                    <label className="block text-[#7A9CC4] text-sm font-medium mb-2">Rate (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={rate || ""}
                                            onChange={(e) => setRate(Number(e.target.value))}
                                            step="0.1"
                                            className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-3 pr-7 text-white font-semibold focus:outline-none focus:border-[#F0B429] transition-all text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold text-sm">%</span>
                                    </div>
                                </div>

                                {/* Term */}
                                <div>
                                    <label className="block text-[#7A9CC4] text-sm font-medium mb-2">Term (Yrs)</label>
                                    <select
                                        value={years}
                                        onChange={(e) => setYears(Number(e.target.value))}
                                        className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-3 px-3 text-white font-semibold focus:outline-none focus:border-[#F0B429] transition-all text-sm appearance-none"
                                    >
                                        <option value={10}>10 Years</option>
                                        <option value={15}>15 Years</option>
                                        <option value={20}>20 Years</option>
                                        <option value={30}>30 Years</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[#1E3A5F]">
                                <h3 className="text-white font-bold text-md mb-4">Taxes & Insurance (Annual)</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[#7A9CC4] text-xs font-medium mb-2">Property Tax</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold text-sm">$</span>
                                            <input
                                                type="number"
                                                value={propertyTax || ""}
                                                onChange={(e) => setPropertyTax(Number(e.target.value))}
                                                className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-2 px-3 pl-7 text-white font-semibold focus:outline-none focus:border-[#F0B429] transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[#7A9CC4] text-xs font-medium mb-2">Insurance</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A9CC4] font-semibold text-sm">$</span>
                                            <input
                                                type="number"
                                                value={homeInsurance || ""}
                                                onChange={(e) => setHomeInsurance(Number(e.target.value))}
                                                className="w-full bg-[#0D1B2E] border border-[#1E3A5F] rounded-xl py-2 px-3 pl-7 text-white font-semibold focus:outline-none focus:border-[#F0B429] transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Cross-sell for RemitIQ */}
                        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-5">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full bg-[#F0B429]/10 flex items-center justify-center mb-3">
                                    <Home className="w-5 h-5 text-[#F0B429]" />
                                </div>
                                <h3 className="text-white font-semibold text-sm mb-2">Buying property overseas?</h3>
                                <p className="text-[#7A9CC4] text-xs leading-relaxed mb-4">
                                    Moving large sums internationally for a down payment can cost thousands in hidden bank fees. Compare rates to save.
                                </p>
                                <Link href="/" className="bg-[#F0B429] text-[#0A1628] px-4 py-2 rounded-lg hover:bg-yellow-400 text-sm font-bold w-full transition-colors glow-gold">
                                    Compare Transfer Providers
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Results - Right Column */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Top Stat Cards & Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Grand Total Card */}
                            <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#F0B429]/10 to-transparent opacity-100" />
                                <div className="relative z-10 text-center">
                                    <p className="text-[#7A9CC4] text-sm font-bold uppercase tracking-widest mb-2">Estimated Monthly Payment</p>
                                    <p className="text-5xl font-extrabold text-white mb-4">
                                        ${total > 0 ? total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"}
                                    </p>
                                    <p className="text-emerald-400 text-xs font-semibold bg-emerald-400/10 inline-block px-3 py-1 rounded-full border border-emerald-400/20">
                                        Calculated with {rate}% APR over {years} years
                                    </p>
                                </div>
                            </div>

                            {/* Breakdown Donut Chart */}
                            <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-5 flex items-center gap-6">
                                <div className="w-1/2 h-36">
                                    {total > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={breakdown}
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {breakdown.map((entry, index) => (
                                                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
                          ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number) => \`$\${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}\`}
                                                contentStyle={{ background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: '8px', fontSize: '12px' }}
                                                itemStyle={{ color: "#fff" }}
                        />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <PieChartIcon className="w-10 h-10 text-[#1E3A5F]" />
                                        </div>
                                    )}
                                </div>
                                <div className="w-1/2 space-y-3">
                                    {breakdown.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                                                <span className="text-white text-xs font-medium truncate">{item.name}</span>
                                            </div>
                                            <p className="text-[#C8D8E8] text-sm font-bold pl-4">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Amortization Chart */}
                        <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-white font-bold text-lg">Amortization Schedule</h2>
                                    <p className="text-[#7A9CC4] text-sm">See how your loan balance decreases over time</p>
                                </div>
                            </div>

                            <div className="h-72 w-full">
                                {amortization.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={amortization} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorMortgage" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F0B429" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#F0B429" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="year"
                                                tick={{ fill: "#7A9CC4", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => \`Year \${v}\`} 
                      />
                                            <YAxis
                                                tick={{ fill: "#7A9CC4", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={60}
                                                tickFormatter={(v) => \`$\${(v / 1000).toFixed(0)}k\`} 
                      />
                                            <Tooltip
                                                contentStyle={{ background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: '8px' }}
                                                itemStyle={{ color: "#fff" }}
                                                labelStyle={{ color: "#7A9CC4", marginBottom: '4px' }}
                                                formatter={(value: number) => [\`$\${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}\`, 'Balance']}
                                            labelFormatter={(label) => \`Remaining Balance (Year \${label})\`}
                      />
                                            <Area type="monotone" dataKey="balance" name="Remaining Balance" stroke="#F0B429" strokeWidth={3} fillOpacity={1} fill="url(#colorMortgage)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#7A9CC4]">
                                        <Home className="w-10 h-10 mb-3 opacity-20" />
                                        <p>Enter details to see schedule</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
