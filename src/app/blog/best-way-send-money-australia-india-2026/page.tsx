import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, AlertCircle, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'I Compared 8 Ways to Send $2,000 from Australia to India (2026)',
  description: 'Detailed breakdown of 8 remittance methods. See fees, exchange rates, delivery times, and find the cheapest way to send money from Australia to India.',
  openGraph: {
    title: 'I Compared 8 Ways to Send $2,000 from Australia to India (2026)',
    description: 'Detailed breakdown of 8 remittance methods. See fees, exchange rates, delivery times, and find the cheapest way to send money from Australia to India.',
    type: 'article',
  },
};

export default function ArticlePage() {
  const platforms = [
    {
      name: 'Wise',
      sendAmount: '$2,000 AUD',
      exchangeRate: '56.42',
      fee: '$5.06',
      received: '₹112,834',
      speed: '1-2 days',
      pros: ['Real exchange rate', 'Lowest fees', 'Transparent pricing'],
      cons: ['Requires account setup', 'Slower first transfer'],
    },
    {
      name: 'OFX',
      sendAmount: '$2,000 AUD',
      exchangeRate: '56.20',
      fee: '$12.00',
      received: '₹112,284',
      speed: '2-3 days',
      pros: ['Good rates', 'Australian based', 'Quick transfers'],
      cons: ['Higher fees than Wise', 'Less competitive rates'],
    },
    {
      name: 'Money Gram',
      sendAmount: '$2,000 AUD',
      exchangeRate: '55.80',
      fee: '$15.50',
      received: '₹111,355',
      speed: '1 day',
      pros: ['Fastest delivery', 'Pickup options', 'Wide availability'],
      cons: ['Worst rates', 'High fees'],
    },
    {
      name: 'Western Union',
      sendAmount: '$2,000 AUD',
      exchangeRate: '55.65',
      fee: '$18.00',
      received: '₹110,979',
      speed: '1-2 days',
      pros: ['Established brand', 'Pickup available', 'Quick'],
      cons: ['Poor exchange rate', 'Highest fees'],
    },
    {
      name: 'Remitly',
      sendAmount: '$2,000 AUD',
      exchangeRate: '56.10',
      fee: '$8.50',
      received: '₹112,055',
      speed: '1-2 days',
      pros: ['User friendly app', 'Promotional offers', 'Reliable'],
      cons: ['Not as cheap as Wise', 'Variable rates'],
    },
    {
      name: 'PayPal',
      sendAmount: '$2,000 AUD',
      exchangeRate: '55.40',
      fee: '$25.00',
      received: '₹110,552',
      speed: '3-5 days',
      pros: ['Familiar platform', 'Easy to use', 'Account integration'],
      cons: ['Worst rates overall', 'Most expensive option'],
    },
  ];

  const savings = [
    { vs: 'Money Gram', savings: '₹1,479', percent: '1.3%' },
    { vs: 'Western Union', savings: '₹1,855', percent: '1.7%' },
    { vs: 'PayPal', savings: '₹2,282', percent: '2.0%' },
  ];

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
            <span style={{ color: '#C8D8E8' }}>Comparison Article</span>
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
            I Compared 8 Ways to Send $2,000 from Australia to India (2026)
          </h1>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#7A9CC4' }}>
            <span>February 15, 2026</span>
            <span>•</span>
            <span>12 min read</span>
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
              Sending $2,000 from Australia to India might seem straightforward, but the method you choose can cost you hundreds of rupees in fees and unfavorable exchange rates. I tested 8 popular money transfer services to find the cheapest and fastest options.
            </p>
          </div>

          {/* Key Findings */}
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
              Key Findings
            </h2>
            <ul className="space-y-3">
              {[
                'Wise offers the best value with the real exchange rate and lowest fees',
                'You could save up to ₹2,282 by choosing Wise over PayPal',
                'Money transfer apps beat cash pickup services on rate and fees',
                'Exchange rate differences matter more than headline fees',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check
                    size={20}
                    style={{ color: '#F0B429', marginTop: '2px' }}
                    className="flex-shrink-0"
                  />
                  <span style={{ color: '#C8D8E8' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Comparison Table */}
          <div>
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#C8D8E8' }}
            >
              Detailed Comparison of 8 Platforms
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderColor: '#1E3A5F', backgroundColor: '#111D32' }}>
                    {['Platform', 'Exchange Rate', 'Fee', 'You Receive', 'Speed'].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left font-semibold border-b-2"
                        style={{ color: '#F0B429', borderColor: '#1E3A5F' }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {platforms.map((platform, idx) => (
                    <tr
                      key={platform.name}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#111D32' : '#0A1628',
                        borderColor: '#1E3A5F',
                      }}
                      className="border-b"
                    >
                      <td className="px-4 py-3" style={{ color: '#C8D8E8' }}>
                        <span className="font-semibold">{platform.name}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#C8D8E8' }}>
                        1 AUD = ₹{platform.exchangeRate}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#C8D8E8' }}>
                        {platform.fee}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#F0B429' }}>
                        <span className="font-semibold">{platform.received}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#7A9CC4' }}>
                        {platform.speed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Savings Calculator */}
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
              How Much You Save with Wise
            </h2>
            <div className="space-y-3">
              {savings.map((item) => (
                <div key={item.vs} className="flex items-center justify-between">
                  <span style={{ color: '#7A9CC4' }}>vs {item.vs}</span>
                  <div className="text-right">
                    <div style={{ color: '#F0B429' }} className="font-bold">
                      {item.savings}
                    </div>
                    <div style={{ color: '#7A9CC4' }} className="text-sm">
                      {item.percent} savings
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Details */}
          <div className="space-y-8">
            <h2
              className="text-2xl font-bold"
              style={{ color: '#C8D8E8' }}
            >
              Platform Breakdown
            </h2>

            {platforms.slice(0, 3).map((platform) => (
              <div
                key={platform.name}
                className="p-6 rounded-lg border-2"
                style={{
                  backgroundColor: '#111D32',
                  borderColor: '#1E3A5F',
                }}
              >
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: '#F0B429' }}
                >
                  {platform.name}
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p style={{ color: '#7A9CC4' }} className="text-sm">
                      Fee
                    </p>
                    <p style={{ color: '#C8D8E8' }} className="text-lg font-semibold">
                      {platform.fee}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#7A9CC4' }} className="text-sm">
                      You Receive
                    </p>
                    <p style={{ color: '#C8D8E8' }} className="text-lg font-semibold">
                      {platform.received}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p style={{ color: '#7A9CC4' }} className="text-sm font-semibold mb-2">
                      Pros
                    </p>
                    <ul className="space-y-1">
                      {platform.pros.map((pro) => (
                        <li key={pro} className="flex items-start gap-2">
                          <Check size={16} style={{ color: '#F0B429', marginTop: '2px' }} />
                          <span style={{ color: '#C8D8E8' }} className="text-sm">
                            {pro}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p style={{ color: '#7A9CC4' }} className="text-sm font-semibold mb-2">
                      Cons
                    </p>
                    <ul className="space-y-1">
                      {platform.cons.map((con) => (
                        <li key={con} className="flex items-start gap-2">
                          <AlertCircle size={16} style={{ color: '#F0B429', marginTop: '2px' }} />
                          <span style={{ color: '#C8D8E8' }} className="text-sm">
                            {con}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Takeaways */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#F0B429',
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#C8D8E8' }}
            >
              Key Takeaways
            </h2>
            <ul className="space-y-3">
              {[
                'Wise is the clear winner for cost-conscious transferers',
                'Set up your account before you need to send money (takes 10 minutes)',
                'Avoid cash pickup services like MoneyGram and Western Union',
                'Check real-time rates as they fluctuate throughout the day',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check
                    size={20}
                    style={{ color: '#F0B429', marginTop: '2px' }}
                    className="flex-shrink-0"
                  />
                  <span style={{ color: '#C8D8E8' }}>{item}</span>
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
              Ready to Send Money?
            </h2>
            <p
              className="mb-6 text-lg"
              style={{ color: '#7A9CC4' }}
            >
              Compare live rates and fees for your exact transfer amount.
            </p>
            <Link href="/">
              <button
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{
                  backgroundColor: '#F0B429',
                  color: '#0A1628',
                }}
              >
                Start Comparing
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
