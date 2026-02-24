import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import AnalyticsWrapper from "@/components/AnalyticsWrapper";
import CookieConsent from "@/components/CookieConsent";

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
      <body className="antialiased font-['Inter',system-ui,sans-serif]">
        <header className="sticky top-0 z-50 border-b border-[#1E3A5F] bg-[#0A1628]/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F0B429] flex items-center justify-center">
                <span className="text-[#0A1628] font-extrabold text-sm">RQ</span>
              </div>
              <span className="text-xl font-bold text-white">Remit<span className="text-[#F0B429]">IQ</span></span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="/" className="text-[#7A9CC4] hover:text-white transition-colors">Home</a>
              <a href="/blog" className="text-[#7A9CC4] hover:text-white transition-colors">Guides</a>
              <a href="/about" className="text-[#7A9CC4] hover:text-white transition-colors">About</a>
              <a href="/alerts" className="bg-[#F0B429] text-[#0A1628] font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-sm">Set Rate Alert</a>
            </nav>
          </div>
        </header>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-[#1E3A5F] bg-[#0D1B2E] mt-16">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-md bg-[#F0B429] flex items-center justify-center"><span className="text-[#0A1628] font-extrabold text-xs">RQ</span></div>
                  <span className="text-lg font-bold text-white">Remit<span className="text-[#F0B429]">IQ</span></span>
                </div>
                <p className="text-[#7A9CC4] text-sm leading-relaxed">Smarter remittances start here. Compare rates, get timing intelligence, and save on every transfer from Australia to India.</p>
              </div>
              <div><h3 className="text-white font-semibold mb-3 text-sm">Tools</h3><ul className="space-y-2 text-sm text-[#7A9CC4]"><li><a href="/" className="hover:text-white">Rate Comparison</a></li><li><a href="/alerts" className="hover:text-white">Rate Alerts</a></li></ul></div>
              <div><h3 className="text-white font-semibold mb-3 text-sm">Learn</h3><ul className="space-y-2 text-sm text-[#7A9CC4]"><li><a href="/blog" className="hover:text-white">Guides & Articles</a></li><li><a href="/blog/wise-vs-remitly" className="hover:text-white">Wise vs Remitly</a></li><li><a href="/blog/best-time-to-send" className="hover:text-white">Best Time to Send</a></li></ul></div>
              <div><h3 className="text-white font-semibold mb-3 text-sm">Company</h3><ul className="space-y-2 text-sm text-[#7A9CC4]"><li><a href="/about" className="hover:text-white">About RemitIQ</a></li><li><a href="/about#methodology" className="hover:text-white">Our Methodology</a></li><li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li></ul></div>
            </div>
            <div className="mt-10 pt-6 border-t border-[#1E3A5F] flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[#7A9CC4] text-xs">&copy; 2026 RemitIQ. All rights reserved.</p>
              <p className="text-[#7A9CC4] text-xs max-w-xl text-center md:text-right"><strong>Disclosure:</strong> RemitIQ earns referral commissions when you transfer through our partner links. This does not affect our rankings, which are based solely on the total amount received.</p>
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
