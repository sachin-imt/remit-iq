"use client";

import { useState, useMemo } from "react";
import { Calculator, ArrowRight, Info, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import DataTable from "@/components/calculators/DataTable";
import CalculatorLayout from "@/components/calculators/CalculatorLayout";

export default function LoanCalculatorPage() {
    const [amount, setAmount] = useState(25000);
    const [rate, setRate] = useState(6.5);
    const [years, setYears] = useState(5);

    const calculateLoan = useMemo(() => {
        const p = amount;
        const r = rate / 100 / 12;
        const n = years * 12;

        if (p <= 0 || r <= 0 || n <= 0) {
            return { monthlyPayment: 0, totalInterest: 0, totalPayment: 0, amortization: [], fullAmortization: [] };
        }

        const monthlyPayment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = monthlyPayment * n;
        const totalInterest = totalPayment - p;

        let balance = p;
        const amortization = [];
        const fullAmortization: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
        let cumulativeInterest = 0;

        for (let month = 1; month <= n; month++) {
            const interestPayment = balance * r;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;
            cumulativeInterest += interestPayment;

            // Every month row for the data table
            fullAmortization.push({
                month,
                payment: monthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
            });

            // Only save data points for every year or the very last month to keep chart clean
            if (month % 12 === 0 || month === n) {
                amortization.push({
                    year: month / 12,
                    balance: Math.max(0, balance),
                    interest: cumulativeInterest,
                });
            }
        }

        return {
            monthlyPayment,
            totalInterest,
            totalPayment: p + totalInterest,
            amortization,
            fullAmortization,
        };
    }, [amount, rate, years]);

    const { monthlyPayment, totalInterest, totalPayment, amortization, fullAmortization } = calculateLoan;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setAmount(val);
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <section className="relative overflow-hidden pt-10 pb-6 border-b border-white/40 bg-gradient-to-b from-white/40 via-transparent to-white/20">
                <div className="mx-auto max-w-6xl px-4 relative">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#00B9FF]/20 flex items-center justify-center">
                                <Calculator className="w-5 h-5 text-[#00B9FF]" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                Loan Calculator
                            </h1>
                        </div>
                        <p className="text-slate-500 text-sm md:text-base mb-6">
                            Calculate your monthly payments, total interest, and visualize your payoff schedule
                            over the life of the loan.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/calculators" className="text-[#00B9FF] text-sm font-semibold hover:text-slate-900 transition-colors flex items-center gap-1">
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
                            <h2 className="text-slate-900 font-bold text-lg mb-6">Loan Details</h2>

                            {/* Amount */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-slate-500 text-sm font-medium">Loan Amount</label>
                                    <span className="text-slate-900 font-bold">${amount.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                                    <input
                                        type="number"
                                        value={amount || ""}
                                        onChange={handleAmountChange}
                                        className="w-full bg-white/60 border border-slate-200 shadow-sm rounded-xl py-3 px-4 pl-8 text-slate-900 font-semibold focus:outline-none focus:border-[#00B9FF] focus:bg-white transition-all backdrop-blur-sm"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="1000" max="100000" step="500"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-4 accent-[#00B9FF]"
                                />
                            </div>

                            {/* Interest Rate */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-slate-500 text-sm font-medium">Interest Rate (APR)</label>
                                    <span className="text-slate-900 font-bold">{rate.toFixed(1)}%</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={rate || ""}
                                        onChange={(e) => setRate(Number(e.target.value))}
                                        step="0.1"
                                        className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl py-3 px-4 pr-8 text-slate-900 font-semibold focus:outline-none focus:border-[#00B9FF] focus:bg-white transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1" max="25" step="0.1"
                                    value={rate}
                                    onChange={(e) => setRate(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-4 accent-[#00B9FF]"
                                />
                            </div>

                            {/* Loan Term */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-slate-500 text-sm font-medium">Loan Term</label>
                                    <span className="text-slate-900 font-bold">{years} {years === 1 ? 'Year' : 'Years'}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 3, 5, 7, 10, 15, 20, 30].map(y => (
                                        <button
                                            key={y}
                                            onClick={() => setYears(y)}
                                            className={`py-2 rounded-lg text-sm font-semibold transition-all backdrop-blur-sm ${years === y
                                                ? 'bg-[#00B9FF] text-slate-900 shadow-md shadow-[#00B9FF]/20'
                                                : 'bg-white/60 border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-[#7A9CC4]'
                                                }`}
                                        >
                                            {y}y
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Cross-sell for RemitIQ */}
                        <div className="bg-gradient-to-br from-[#F0B429]/10 to-[#00B9FF]/10 border border-slate-100 shadow-lg shadow-slate-200/30 rounded-3xl p-6">
                            <div className="flex items-start gap-3">
                                <div className="pt-1"><CheckCircle2 className="w-5 h-5 text-[#F0B429]" /></div>
                                <div>
                                    <h3 className="text-slate-900 font-semibold text-sm mb-1">Sending loan funds globally?</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed mb-3">
                                        Don't let bank exchange rates eat into your loan. Compare live remittance rates to send money globally.
                                    </p>
                                    <Link href="/" className="inline-flex items-center text-[#F0B429] hover:text-yellow-400 text-sm font-semibold transition-colors">
                                        Compare Rates <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results - Right Column */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Top Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="glass-panel border-white/60 shadow-lg shadow-slate-200/30 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#00B9FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-[-1]" />
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Monthly Payment</p>
                                <p className="text-3xl font-extrabold text-slate-900">
                                    ${monthlyPayment > 0 ? monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </p>
                            </div>
                            <div className="glass-panel border-white/60 shadow-lg shadow-slate-200/30 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#F43F5E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-[-1]" />
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Interest</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    ${totalInterest > 0 ? totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </p>
                            </div>
                            <div className="glass-panel border-white/60 shadow-lg shadow-slate-200/30 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-[-1]" />
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Paid</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    ${totalPayment > 0 ? totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </p>
                            </div>
                        </div>

                        {/* Amortization Chart */}
                        <div className="glass-panel border-white/60 shadow-xl shadow-slate-200/40 rounded-3xl p-6 lg:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-slate-900 font-bold text-lg">Amortization Schedule</h2>
                                    <p className="text-slate-500 text-sm">Principal balance vs cumulative interest over time</p>
                                </div>
                            </div>

                            <div className="h-72 w-full">
                                {amortization.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={amortization} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00B9FF" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#00B9FF" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="year"
                                                tick={{ fill: "#64748B", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `Year ${v}`}
                                            />
                                            <YAxis
                                                tick={{ fill: "#64748B", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={60}
                                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: "#FFFFFF", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: '1px solid #E2E8F0', borderRadius: '8px' }}
                                                itemStyle={{ color: "#0F172A" }}
                                                labelStyle={{ color: '#64748B', marginBottom: '4px' }}
                                                formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']}
                                                labelFormatter={(label) => `Year ${label}`}
                                            />
                                            <Area type="monotone" dataKey="balance" name="Remaining Balance" stroke="#00B9FF" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                                            <Area type="monotone" dataKey="interest" name="Cumulative Interest" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorInterest)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                        <Calculator className="w-10 h-10 mb-3 opacity-20" />
                                        <p>Enter loan details to see chart</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-200/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#00B9FF]"></div>
                                    <span className="text-xs text-slate-500 font-medium">Remaining Balance</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#F43F5E]"></div>
                                    <span className="text-xs text-slate-500 font-medium">Cumulative Interest</span>
                                </div>
                            </div>
                        </div>

                        {/* Information Tips */}
                        <div className="bg-gradient-to-r from-white to-[#00B9FF]/5 border border-[#00B9FF]/10 shadow-sm rounded-3xl p-6 flex items-start gap-4">
                            <div className="mt-1"><Info className="w-5 h-5 text-[#00B9FF]" /></div>
                            <div>
                                <h4 className="text-slate-900 font-semibold text-sm mb-1">How Loans Work</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    In the early years of your loan, most of your monthly payment goes toward paying interest.
                                    As the loan matures, a larger portion of your payment begins to pay down the principal balance.
                                    Making extra principal payments early on can significantly reduce the total interest you pay.
                                </p>
                            </div>
                        </div>

                        {/* Monthly Amortization Table */}
                        <DataTable
                            title="Monthly Amortization Schedule"
                            defaultCollapsed={true}
                            columns={[
                                { key: "month", label: "Month", format: (v: number) => v.toString() },
                                { key: "payment", label: "Payment" },
                                { key: "principal", label: "Principal" },
                                { key: "interest", label: "Interest" },
                                { key: "balance", label: "Balance" },
                            ]}
                            data={fullAmortization}
                        />

                    </div>
                </div>
            </section>
        </div>
    );
}
