import { BarChart3, Calculator, Home, PiggyBank, Briefcase } from "lucide-react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata = {
    title: "Free Finance Calculators | RemitIQ",
    description: "Professional-grade calculators for loans, mortgages, compound interest, and retirement. 100% free with interactive charts.",
};

const calculators = [
    {
        id: "loan",
        title: "Loan Calculator",
        description: "Calculate monthly payments, total interest, and see a full amortization schedule.",
        icon: <Calculator className="w-6 h-6 text-[#00B9FF]" />,
        href: "/calculators/loan",
        color: "from-[#00B9FF]/20 to-transparent",
        borderColor: "border-[#00B9FF]/30",
    },
    {
        id: "mortgage",
        title: "Mortgage Calculator",
        description: "Plan your home purchase with detailed monthly payments including taxes and insurance.",
        icon: <Home className="w-6 h-6 text-[#F0B429]" />,
        href: "/calculators/mortgage",
        color: "from-[#F0B429]/20 to-transparent",
        borderColor: "border-[#F0B429]/30",
    },
    {
        id: "compound",
        title: "Compound Interest",
        description: "See how your money grows over time with compound interest and visualize the power of investing.",
        icon: <BarChart3 className="w-6 h-6 text-[#10B981]" />,
        href: "/calculators/compound-interest",
        color: "from-[#10B981]/20 to-transparent",
        borderColor: "border-[#10B981]/30",
    },
    {
        id: "retirement",
        title: "Retirement Planner",
        description: "Figure out how much you need to save for retirement and whether you're on track.",
        icon: <PiggyBank className="w-6 h-6 text-[#8B5CF6]" />,
        href: "/calculators/retirement",
        color: "from-[#8B5CF6]/20 to-transparent",
        borderColor: "border-[#8B5CF6]/30",
    },
    {
        id: "currency",
        title: "Currency Converter",
        description: "Convert currencies and find the cheapest way to send money internationally.",
        icon: <Briefcase className="w-6 h-6 text-[#F43F5E]" />,
        href: "/",
        color: "from-[#F43F5E]/20 to-transparent",
        borderColor: "border-[#F43F5E]/30",
    },
];

export default function CalculatorsHubPage() {
    return (
        <div className="min-h-screen relative z-10">
            <section className="relative overflow-hidden pt-12 pb-8">
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/20 z-[-1]" />
                <div className="mx-auto max-w-6xl px-4 relative">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                            Free Financial <span className="text-gradient">Calculators</span>
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Professional-grade finance tools to plan loans, mortgages, investments, and more.
                            Always free, no signup required.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {calculators.map((calc) => (
                            <Link
                                key={calc.id}
                                href={calc.href}
                                className={`group relative glass-panel border border-white/60 hover:${calc.borderColor} rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-300/50 overflow-hidden`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${calc.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[-1]`} />
                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white/80 border border-white/60 shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                        {calc.icon}
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#F0B429] transition-colors">
                                        {calc.title}
                                    </h2>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                        {calc.description}
                                    </p>
                                    <div className="inline-flex items-center text-sm font-semibold text-slate-900 group-hover:text-[#F0B429] transition-colors">
                                        <span>Calculate Now</span>
                                        <ArrowUpRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
