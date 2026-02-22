import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, AlertCircle, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'When Is the Best Time to Send Money from Australia to India?',
  description: 'Learn how RBA decisions, commodity prices, and RBI policy affect AUD/INR exchange rates. Timing your transfer right can save you thousands.',
  openGraph: {
    title: 'When Is the Best Time to Send Money from Australia to India?',
    description: 'Learn how RBA decisions, commodity prices, and RBI policy affect AUD/INR exchange rates. Timing your transfer right can save you thousands.',
    type: 'article',
  },
};

export default function ArticlePage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0A1628' }}>
      {/* Breadcrumb */}
      <section className="px-4 py-4 border-b-2" style={{ borderColor: '#1E3A5F' }}>
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-sm" style={{ color: '#7A9CC4' }}>
            <Link href="/" className="hover:text-[#F0B429] transition-colors">
              <Home size={16} />
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-[#F0B429] transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span style={{ color: '#C8D8E8' }}>Timing Guide</span>
          </nav>
        </div>
      </section>

      {/* Header */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
            style={{ color: '#C8D8E8' }}
          >
            When Is the Best Time to Send Money from Australia to India?
          </h1>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#7A9CC4' }}>
            <span>February 8, 2026</span>
            <span>•</span>
            <span>10 min read</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Introduction */}
          <div>
            <p
              className="text-lg leading-relaxed mb-6"
              style={{ color: '#C8D8E8' }}
            >
              The AUD/INR exchange rate fluctuates constantly, driven by economic policies, commodity prices, and market sentiment. Understanding what moves this rate can help you time your transfers to save thousands of rupees.
            </p>
          </div>

          {/* Key Insight */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#F0B429',
            }}
          >
            <h2
              className="text-2xl font-bold mb-4 flex items-center gap-2"
              style={{ color: '#F0B429' }}
            >
              <AlertCircle size={24} />
              Key Insight
            </h2>
            <p style={{ color: '#C8D8E8' }} className="mb-4">
              A 1% change in the AUD/INR rate means a difference of ₹560 on a $2,000 transfer. Timing matters significantly.
            </p>
            <p style={{ color: '#7A9CC4' }}>
              The rate regularly swings 2-4% over a month. While predicting exact peaks is impossible, understanding the drivers helps you identify favorable windows.
            </p>
          </div>

          {/* Main Drivers */}
          <div>
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#C8D8E8' }}
            >
              What Moves the AUD/INR Rate?
            </h2>

            <div className="space-y-6">
              {/* RBA Policy */}
              <div
                className="p-6 rounded-lg border-2"
                style={{
                  backgroundColor: '#111D32',
                  borderColor: '#1E3A5F',
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <TrendingUp size={24} style={{ color: '#F0B429', marginTop: '2px' }} />
                  <h3
                    className="text-xl font-bold"
                    style={{ color: '#C8D8E8' }}
                  >
                    Reserve Bank of Australia (RBA) Policy
                  </h3>
                </div>
                <p style={{ color: '#7A9CC4' }} className="mb-4">
                  The RBA's interest rate decisions are the biggest driver of AUD strength.
                </p>
                <div className="bg-[#0A1628] p-4 rounded mb-4">
                  <p style={{ color: '#C8D8E8' }} className="text-sm mb-3">
                    <span className="font-semibold" style={{ color: '#F0B429' }}>
                      Rate Hike →
                    </span>
                    {' '}Strengthens AUD (worse for you when sending)
                  </p>
                  <p style={{ color: '#C8D8E8' }} className="text-sm">
                    <span className="font-semibold" style={{ color: '#F0B429' }}>
                      Rate Cut →
                    </span>
                    {' '}Weakens AUD (better for you when sending)
                  </p>
                </div>
                <p style={{ color: '#7A9CC4' }} className="text-sm">
                  <span className="font-semibold">Strategy:</span> Monitor RBA meeting announcements. If rate cuts are expected, the AUD may weaken, improving your transfer value.
                </p>
              </div>

              {/* Commodities & Iron Ore */}
              <div
                className="p-6 rounded-lg border-2"
                style={{
                  backgroundColor: '#111D32',
                  borderColor: '#1E3A5F',
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <TrendingDown size={24} style={{ color: '#F0B429', marginTop: '2px' }} />
                  <h3
                    className="text-xl font-bold"
                    style={{ color: '#C8D8E8' }}
                  >
                    Commodity Prices (Especially Iron Ore)
                  </h3>
                </div>
                <p style={{ color: '#7A9CC4' }} className="mb-4">
                  Australia is a major exporter of iron ore, coal, and commodities. Global prices directly impact the AUD.
                </p>
                <div className="bg-[#0A1628] p-4 rounded mb-4">
                  <p style={{ color: '#C8D8E8' }} className="text-sm mb-3">
                    <span className="font-semibold" style={{ color: '#F0B429' }}>
                      Iron Ore ↑ (high demand) →
                    </span>
                    {' '}Strengthens AUD
                  </p>
                  <p style={{ color: '#C8D8E8' }} className="text-sm">
                    <span className="font-semibold" style={{ color: '#F0B429' }}>
                      Iron Ore ↓ (low demand) →
                    </span>
                    {' '}Weakens AUD
                  </p>
                </div>
                <p style={{ color: '#7A9CC4' }} className="text-sm">
                  <span className="font-semibold">Strategy:</span> Check commodity prices before sending. Weakness in commodities often correlates with a weaker AUD.
                </p>
              </div>

              {/* RBI & Monetary Policy */}
              <div
                className="p-6 rounded-lg border-2"
                style={{
                  backgroundColor: '#111D32',
                  borderColor: '#1E3A5F',
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <TrendingUp size={24} style={{ color: '#F0B429', marginTop: '2px' }} />
                  <h3
                    className="text-xl font-bold"
                    style={{ color: '#C8D8E8' }}
                  >
                    Reserve Bank of India (RBI) Policy
                  </h3>
                </div>
                <p style={{ color: '#7A9CC4' }} className="mb-4">
                  The RBI's interest rate and rupee intervention also influence the exchange rate.
                </p>
                <div className="bg-[#0A1628] p-4 rounded mb-4">
                  <p style={{ color: '#C8D8E8' }} className="text-sm mb-3">
                    <span className="font-semibold" style={{ color: '#F0B429' }}>
                      RBI Rate Hikes →
                    </span>
                    {' '}Strengthens INR (worse for you)
                  </p>
                  <p style={{ color: '#C8D8E8' }} className="text-sm">
                    <span className="font-semibold" style={{ color: '#F0B429' }}>
                      RBI Intervention →
                    </span>
                    {' '}Can support or weaken the rupee
                  </p>
                </div>
                <p style={{ color: '#7A9CC4' }} className="text-sm">
                  <span className="font-semibold">Strategy:</span> Follow RBI policy announcements. A weakening rupee (relative to other currencies) means better timing for your transfer.
                </p>
              </div>

              {/* Risk Sentiment */}
              <div
                className="p-6 rounded-lg border-2"
                style={{
                  backgroundColor: '#111D32',
                  borderColor: '#1E3A5F',
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle size={24} style={{ color: '#F0B429', marginTop: '2px' }} />
                  <h3
                    className="text-xl font-bold"
                    style={{ color: '#C8D8E8' }}
                  >
                    Global Risk Sentiment
                  </h3>
                </div>
                <p style={{ color: '#7A9CC4' }} className="mb-4">
                  Risk appetite impacts demand for AUD as a higher-yielding commodity currency.
                </p>
                <div className="bg-[#0A1628] p-4 rounded mb-4">
                  <p style={{ color: '#C8D8E8' }} className="text-sm mb-3">
                    <span className="font-semibold" style={{ color: '#F0B429' }}>
                      Risk-On (market confidence) →
                    </span>
                    {' '}Demand for AUD increases
                  </p>
                  <p style={{ color: '#C8D8E8' }} className="text-sm">
                    <span className="font-semibold" style={{ color: '#F0B429' }}>
                      Risk-Off (market uncertainty) →
                    </span>
                    {' '}Flight to safety, AUD weakens
                  </p>
                </div>
                <p style={{ color: '#7A9CC4' }} className="text-sm">
                  <span className="font-semibold">Strategy:</span> During global uncertainty (geopolitical events, market crashes), AUD often weakens, creating good transfer windows.
                </p>
              </div>
            </div>
          </div>

          {/* Seasonal Patterns */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#C8D8E8' }}
            >
              Seasonal Patterns
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded" style={{ backgroundColor: '#0A1628' }}>
                  <p style={{ color: '#F0B429' }} className="font-semibold mb-2">
                    March - April
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    Financial year-end in Australia often sees reduced export demand and economic uncertainty. AUD may weaken slightly.
                  </p>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: '#0A1628' }}>
                  <p style={{ color: '#F0B429' }} className="font-semibold mb-2">
                    June - July
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    Winter in Australia. Construction activity typically slows, potentially weakening commodity demand.
                  </p>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: '#0A1628' }}>
                  <p style={{ color: '#F0B429' }} className="font-semibold mb-2">
                    September - October
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    End of financial year in India. Strong tax-related demand for INR can strengthen the currency.
                  </p>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: '#0A1628' }}>
                  <p style={{ color: '#F0B429' }} className="font-semibold mb-2">
                    December - January
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    Holiday season. Increased remittance demand from migrant workers can weaken AUD slightly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Practical Timing Strategy */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#F0B429',
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#C8D8E8' }}
            >
              Practical Timing Strategy
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className="px-3 py-1 rounded font-bold text-sm min-w-fit mt-1"
                  style={{
                    backgroundColor: '#F0B429',
                    color: '#0A1628',
                  }}
                >
                  1
                </div>
                <div>
                  <p style={{ color: '#C8D8E8' }} className="font-semibold mb-1">
                    Monitor RBA Communications
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    Watch RBA meeting announcements and forward guidance. If rate cuts are coming, wait for them before transferring.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div
                  className="px-3 py-1 rounded font-bold text-sm min-w-fit mt-1"
                  style={{
                    backgroundColor: '#F0B429',
                    color: '#0A1628',
                  }}
                >
                  2
                </div>
                <div>
                  <p style={{ color: '#C8D8E8' }} className="font-semibold mb-1">
                    Check Iron Ore Prices
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    Iron ore prices are publicly available. A downtrend typically precedes AUD weakness.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div
                  className="px-3 py-1 rounded font-bold text-sm min-w-fit mt-1"
                  style={{
                    backgroundColor: '#F0B429',
                    color: '#0A1628',
                  }}
                >
                  3
                </div>
                <div>
                  <p style={{ color: '#C8D8E8' }} className="font-semibold mb-1">
                    Set Rate Alerts
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    Use Wise, XE.com, or OANDA to set alerts for your target AUD/INR rate. Send when the rate reaches your threshold.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div
                  className="px-3 py-1 rounded font-bold text-sm min-w-fit mt-1"
                  style={{
                    backgroundColor: '#F0B429',
                    color: '#0A1628',
                  }}
                >
                  4
                </div>
                <div>
                  <p style={{ color: '#C8D8E8' }} className="font-semibold mb-1">
                    Don't Wait for Perfect Timing
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    Trying to catch the absolute peak can be counterproductive. A 0.5-1% favorable move is sufficient.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div
                  className="px-3 py-1 rounded font-bold text-sm min-w-fit mt-1"
                  style={{
                    backgroundColor: '#F0B429',
                    color: '#0A1628',
                  }}
                >
                  5
                </div>
                <div>
                  <p style={{ color: '#C8D8E8' }} className="font-semibold mb-1">
                    Build in a Time Buffer
                  </p>
                  <p style={{ color: '#7A9CC4' }} className="text-sm">
                    If you need money on a specific date, set your transfer 2-3 weeks earlier to account for volatility.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Real Example */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#C8D8E8' }}
            >
              Real Example: Rate Movements in 2025
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ color: '#7A9CC4' }}>January 2025</span>
                <span style={{ color: '#C8D8E8' }} className="font-semibold">
                  1 AUD = ₹55.80
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: '#7A9CC4' }}>April 2025 (RBA cut)</span>
                <span style={{ color: '#F0B429' }} className="font-semibold">
                  1 AUD = ₹56.90 (+1.97%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: '#7A9CC4' }}>September 2025</span>
                <span style={{ color: '#C8D8E8' }} className="font-semibold">
                  1 AUD = ₹56.10
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: '#7A9CC4' }}>December 2025</span>
                <span style={{ color: '#C8D8E8' }} className="font-semibold">
                  1 AUD = ₹57.20
                </span>
              </div>
            </div>
            <div className="mt-6 p-4 rounded" style={{ backgroundColor: '#0A1628' }}>
              <p style={{ color: '#C8D8E8' }} className="text-sm">
                <span style={{ color: '#F0B429' }} className="font-semibold">
                  Impact:
                </span>
                {' '}A $2,000 transfer in April would give you ₹113,800 vs ₹111,600 in January - a difference of ₹2,200.
              </p>
            </div>
          </div>

          {/* Important Caveat */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#C8D8E8' }}
            >
              Important Caveat
            </h2>
            <p style={{ color: '#C8D8E8' }} className="mb-4">
              <span className="font-semibold">You cannot predict exchange rates with certainty.</span> Even professional traders get it wrong. These guidelines help you make informed decisions, not guarantee profits.
            </p>
            <ul className="space-y-2">
              {[
                'Unexpected events (policy surprises, geopolitical shocks) change everything',
                'The difference between waiting and not waiting might be 0.2%',
                'A bird in hand is worth two in the bush - if you need money, send it',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <AlertCircle size={16} style={{ color: '#F0B429', marginTop: '2px' }} />
                  <span style={{ color: '#7A9CC4' }} className="text-sm">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div
            className="p-8 md:p-12 rounded-lg border-2 text-center"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ color: '#C8D8E8' }}
            >
              Check Live Exchange Rates
            </h2>
            <p
              className="mb-6 text-lg"
              style={{ color: '#7A9CC4' }}
            >
              Set up rate alerts and compare current AUD/INR rates across providers.
            </p>
            <Link href="/">
              <button
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{
                  backgroundColor: '#F0B429',
                  color: '#0A1628',
                }}
              >
                View Current Rates
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
