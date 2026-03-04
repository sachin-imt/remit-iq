import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import AnalyticsWrapper from "@/components/AnalyticsWrapper";
import CookieConsent from "@/components/CookieConsent";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "RemitIQ: Best AUD to INR Exchange Rate | Compare & Send Money to India",
  description: "Compare live exchange rates across Wise, Remitly, OFX, and 6+ platforms. Find the cheapest way to send money from Australia to India today. AI-powered timing tells you whether to send now or wait.",
  keywords: ["send money Australia to India", "AUD to INR rate today", "best remittance Australia India", "Wise vs Remitly Australia", "cheapest way to send AUD to INR", "AUD INR forecast", "compare remittance to India"],
  openGraph: { title: "RemitIQ: Best AUD to INR Exchange Rate", description: "Compare rates across 6+ platforms to find the cheapest way to send money to India.", type: "website", locale: "en_AU", siteName: "RemitIQ" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-['Inter',system-ui,sans-serif] bg-slate-50 relative overflow-x-hidden">
        {/* Global Mesh Background */}
        <div className="fixed inset-0 z-[-1] bg-mesh w-full h-full opacity-60"></div>
        {/* Floating animated blobs for deep premium engagement */}
        <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob z-[-1]"></div>
        <div className="fixed top-[20%] right-[-10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000 z-[-1]"></div>
        <div className="fixed bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-sky-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000 z-[-1]"></div>

        <header className="sticky top-0 z-50 border-b border-white/40 glass-panel">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
              <div className="w-10 h-10 rounded-xl bg-[#F0B429] flex items-center justify-center shadow-sm shadow-[#F0B429]/30">
                <span className="text-slate-900 font-black text-lg tracking-tight">RQ</span>
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">Remit<span className="text-[#F0B429]">IQ</span></span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="/" className="text-slate-600 hover:text-slate-900 transition-colors">Compare Rates</a>
              <a href="/calculators" className="text-slate-600 hover:text-slate-900 transition-colors">Calculators</a>
              <a href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">Guides</a>
              <a href="/alerts" className="bg-[#F0B429] text-slate-900 font-bold px-5 py-2.5 rounded-xl hover:bg-yellow-400 transition-all shadow-sm shadow-[#F0B429]/20 hover:-translate-y-0.5" aria-label="Set Rate Alert">Set Rate Alert</a>
            </nav>
            <MobileNav />
          </div>
        </header>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-white/50 bg-white/40 backdrop-blur-sm mt-16 pb-8">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-[#F0B429] flex items-center justify-center shadow-sm shadow-[#F0B429]/20"><span className="text-slate-900 font-black text-sm tracking-tight">RQ</span></div>
                  <span className="text-xl font-black text-slate-900 tracking-tight">Remit<span className="text-[#F0B429]">IQ</span></span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">Smarter remittances start here. Compare rates, get timing intelligence, and empower your financial decisions with our suite of free tools.</p>
              </div>
              <div><h3 className="text-slate-900 font-semibold mb-3 text-sm">Tools</h3><ul className="space-y-2 text-sm text-slate-500"><li><a href="/" className="hover:text-slate-900">Rate Comparison</a></li><li><a href="/calculators" className="hover:text-slate-900">Finance Calculators</a></li><li><a href="/alerts" className="hover:text-slate-900">Rate Alerts</a></li></ul></div>
              <div><h3 className="text-slate-900 font-semibold mb-3 text-sm">Learn</h3><ul className="space-y-2 text-sm text-slate-500"><li><a href="/blog" className="hover:text-slate-900">Guides & Articles</a></li><li><a href="/blog/wise-vs-remitly" className="hover:text-slate-900">Wise vs Remitly</a></li><li><a href="/blog/best-time-to-send" className="hover:text-slate-900">Best Time to Send</a></li></ul></div>
              <div><h3 className="text-slate-900 font-semibold mb-3 text-sm">Company</h3><ul className="space-y-2 text-sm text-slate-500"><li><a href="/about" className="hover:text-slate-900">About RemitIQ</a></li><li><a href="/about#methodology" className="hover:text-slate-900">Our Methodology</a></li><li><a href="/privacy" className="hover:text-slate-900">Privacy Policy</a></li></ul></div>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-slate-400 text-xs">&copy; 2026 RemitIQ. All rights reserved.</p>
              <p className="text-slate-400 text-xs max-w-xl text-center md:text-right leading-relaxed"><strong>Disclosure:</strong> RemitIQ earns referral commissions when you transfer through our partner links. This does not affect our rankings, which are based solely on the total amount received.</p>
            </div>
          </div>
        </footer>
        <ChatWidget />
        <AnalyticsWrapper />
        <CookieConsent />
      </body>
    </html>
  );
}
