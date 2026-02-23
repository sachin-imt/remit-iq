import Link from "next/link";
import { ArrowRight, Code, Database, Zap, Shield, CheckCircle2 } from "lucide-react";

export default function DevelopersPage() {
    return (
        <main className="min-h-screen pt-20 pb-16">
            <div className="mx-auto max-w-6xl px-4">

                {/* Hero */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111D32] border border-[#1E3A5F] mb-6">
                        <Code className="w-4 h-4 text-[#F0B429]" />
                        <span className="text-[#C8D8E8] text-sm font-medium">RemitIQ B2B API v1.0</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
                        Power your app with <span className="text-[#F0B429]">live rate intelligence</span>
                    </h1>
                    <p className="text-lg text-[#7A9CC4] leading-relaxed mb-8">
                        Get programmatic access to real-time AUD/INR exchange rates, historical spreads across 6+ major providers, and our proprietary AI timing signals.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="mailto:api@remitiq.co?subject=API Access Request" className="w-full sm:w-auto bg-[#F0B429] hover:bg-yellow-400 text-[#0A1628] font-bold py-3 px-8 rounded-xl transition-all shadow-lg glow-gold">
                            Request API Key
                        </a>
                        <Link href="/blog" className="w-full sm:w-auto bg-transparent border-2 border-[#1E3A5F] hover:border-[#7A9CC4] text-white font-bold py-3 px-8 rounded-xl transition-all">
                            Read the Docs
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                        <div className="w-12 h-12 rounded-xl bg-[#0A1628] flex items-center justify-center mb-4 border border-[#1E3A5F]">
                            <Zap className="w-6 h-6 text-[#F0B429]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Real-Time Aggregation</h3>
                        <p className="text-[#7A9CC4] text-sm leading-relaxed">
                            Stop scraping manually. Get instant access to the exact margins and fees of Wise, Remitly, Instarem, OFX, TorFX, and Western Union in a single JSON payload.
                        </p>
                    </div>

                    <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                        <div className="w-12 h-12 rounded-xl bg-[#0A1628] flex items-center justify-center mb-4 border border-[#1E3A5F]">
                            <Database className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Historical Backtesting</h3>
                        <p className="text-[#7A9CC4] text-sm leading-relaxed">
                            Access our 3-year trailing PostgreSQL database to run your own financial models on AUD/INR currency volatility and provider markup trends.
                        </p>
                    </div>

                    <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-6">
                        <div className="w-12 h-12 rounded-xl bg-[#0A1628] flex items-center justify-center mb-4 border border-[#1E3A5F]">
                            <Shield className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Proprietary AI Signals</h3>
                        <p className="text-[#7A9CC4] text-sm leading-relaxed">
                            Don't just get the rate; get the context. Our API responds with our engine's algorithmic 5-day forecast ('Wait' vs 'Send Now') and confidence scores.
                        </p>
                    </div>
                </div>

                {/* Code Snippet */}
                <div className="bg-[#0A1628] border border-[#1E3A5F] rounded-2xl overflow-hidden mb-20 shadow-2xl">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E3A5F] bg-[#0A1628]">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                        </div>
                        <span className="ml-4 text-xs font-mono text-[#7A9CC4]">curl snippet</span>
                    </div>
                    <div className="p-6 overflow-x-auto">
                        <pre className="text-sm font-mono text-[#C8D8E8] leading-relaxed">
                            <span className="text-pink-400">curl</span> -X GET \ <br />
                            {'  '}<span className="text-green-400">"https://api.remitiq.co/v1/rates?pair=AUDINR"</span> \ <br />
                            {'  '}-H <span className="text-yellow-300">"Authorization: Bearer rq_test_12345"</span><br />
                            <br />
                            <span className="text-[#7A9CC4]">{"// Response:"}</span><br />
                            {"{"}<br />
                            {'  '}<span className="text-blue-300">"metadata"</span>: {"{"}<br />
                            {'    '}<span className="text-blue-300">"timestamp"</span>: <span className="text-green-400">"2026-02-23T07:34:58Z"</span><br />
                            {'  '}{"},"}<br />
                            {'  '}<span className="text-blue-300">"market"</span>: {"{"}<br />
                            {'    '}<span className="text-blue-300">"interbank_rate"</span>: <span className="text-orange-400">64.10</span>,<br />
                            {'    '}<span className="text-blue-300">"ai_signal"</span>: <span className="text-green-400">"WAIT"</span>,<br />
                            {'    '}<span className="text-blue-300">"ai_confidence"</span>: <span className="text-orange-400">82</span><br />
                            {'  '}{"},"}<br />
                            {'  '}<span className="text-blue-300">"live_providers"</span>: [{"{"}<br />
                            {'    '}<span className="text-blue-300">"id"</span>: <span className="text-green-400">"wise"</span>,<br />
                            {'    '}<span className="text-blue-300">"offered_rate"</span>: <span className="text-orange-400">64.10</span>,<br />
                            {'    '}<span className="text-blue-300">"transfer_fee"</span>: <span className="text-orange-400">10.42</span><br />
                            {'  '}{"}, ...]"}<br />
                            {"}"}
                        </pre>
                    </div>
                </div>

                {/* Pricing / Tiers */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-white mb-4">Simple, transparent pricing</h2>
                    <p className="text-[#7A9CC4]">Start building for free. Upgrade when you need production scale.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-8 flex flex-col h-full">
                        <h3 className="text-2xl font-bold text-white mb-2">Sandbox</h3>
                        <p className="text-[#7A9CC4] text-sm mb-6">Perfect for prototyping and testing.</p>
                        <div className="text-4xl font-extrabold text-white mb-6">$0<span className="text-lg font-normal text-[#7A9CC4]">/mo</span></div>
                        <ul className="space-y-4 mb-8 flex-1 text-[#C8D8E8] text-sm">
                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> 100 requests per day</li>
                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Delayed rate data (15 min)</li>
                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Standard email support</li>
                        </ul>
                        <a href="mailto:api@remitiq.co" className="w-full block text-center bg-transparent border-2 border-[#1E3A5F] hover:border-[#F0B429] text-white font-bold py-3 px-6 rounded-xl transition-all">
                            Get Sandbox Key
                        </a>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-[#0D1B2E] border-2 border-[#F0B429] rounded-2xl p-8 flex flex-col h-full relative">
                        <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-[#F0B429] text-[#0A1628] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            Most Popular
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Production API</h3>
                        <p className="text-[#7A9CC4] text-sm mb-6">For businesses power cross-border payments.</p>
                        <div className="text-4xl font-extrabold text-white mb-6">$99<span className="text-lg font-normal text-[#7A9CC4]">/mo</span></div>
                        <ul className="space-y-4 mb-8 flex-1 text-[#C8D8E8] text-sm">
                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#F0B429] shrink-0" /> 100,000 requests per month</li>
                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#F0B429] shrink-0" /> Real-time sub-second data</li>
                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#F0B429] shrink-0" /> Full AI timing predictions</li>
                            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#F0B429] shrink-0" /> Direct Slack channel support</li>
                        </ul>
                        <a href="mailto:api@remitiq.co" className="w-full block text-center bg-[#F0B429] hover:bg-yellow-400 text-[#0A1628] font-bold py-3 px-6 rounded-xl transition-all shadow-lg glow-gold">
                            Request Access
                        </a>
                    </div>
                </div>

            </div>
        </main>
    )
}
