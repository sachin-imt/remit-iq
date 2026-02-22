import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, X, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wise vs Remitly for Australia to India: 2026 Comparison',
  description: 'Head-to-head comparison of Wise and Remitly. See which app is cheaper, faster, and better for your Australia to India money transfers.',
  openGraph: {
    title: 'Wise vs Remitly for Australia to India: 2026 Comparison',
    description: 'Head-to-head comparison of Wise and Remitly. See which app is cheaper, faster, and better for your Australia to India money transfers.',
    type: 'article',
  },
};

export default function ArticlePage() {
  const comparisonData = [
    {
      category: 'Exchange Rate (1 AUD)',
      wise: '56.42 (Real mid-market)',
      remitly: '56.10 (Marked up 0.57%)',
      winner: 'wise',
    },
    {
      category: 'Transfer Fee',
      wise: '$5.06 (Flat)',
      remitly: '$8.50 (Flat)',
      winner: 'wise',
    },
    {
      category: 'Delivery Time',
      wise: '1-2 days',
      remitly: '1-2 days',
      winner: 'tie',
    },
    {
      category: 'Mobile App',
      wise: 'Excellent',
      remitly: 'Very good',
      winner: 'tie',
    },
    {
      category: 'Support Quality',
      wise: 'Chat & email',
      remitly: 'Chat & email',
      winner: 'tie',
    },
    {
      category: 'Recipient Account Required',
      wise: 'Yes (Bank or Mobile Money)',
      remitly: 'Yes or Cash Pickup',
      winner: 'remitly',
    },
    {
      category: 'Promo Offers',
      wise: 'Rare',
      remitly: 'Frequent',
      winner: 'remitly',
    },
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
            <span style={{ color: '#C8D8E8' }}>Comparison</span>
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
            Wise vs Remitly for Australia to India: 2026 Comparison
          </h1>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#7A9CC4' }}>
            <span>February 10, 2026</span>
            <span>•</span>
            <span>8 min read</span>
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
              Wise and Remitly are two of the most popular money transfer apps for Australians sending money to India. Both have excellent apps and customer support, but they differ significantly in fees and exchange rates. Let's compare them head-to-head.
            </p>
          </div>

          {/* Quick Verdict */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#F0B429',
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#F0B429' }}
            >
              Quick Verdict
            </h2>
            <p
              className="mb-4"
              style={{ color: '#C8D8E8' }}
            >
              <span className="font-semibold">Wise is the cheaper option</span> with lower fees and real exchange rates. For a $2,000 transfer, you'll receive ₹779 more with Wise than Remitly.
            </p>
            <p
              style={{ color: '#7A9CC4' }}
            >
              However, Remitly offers cash pickup options and more frequent promotional offers, which may appeal to some users.
            </p>
          </div>

          {/* Comparison Table */}
          <div>
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#C8D8E8' }}
            >
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderColor: '#1E3A5F', backgroundColor: '#111D32' }}>
                    {['Feature', 'Wise', 'Remitly', 'Winner'].map((header) => (
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
                  {comparisonData.map((item, idx) => (
                    <tr
                      key={item.category}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#111D32' : '#0A1628',
                        borderColor: '#1E3A5F',
                      }}
                      className="border-b"
                    >
                      <td className="px-4 py-3" style={{ color: '#C8D8E8' }}>
                        <span className="font-semibold">{item.category}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#C8D8E8' }}>
                        {item.wise}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#C8D8E8' }}>
                        {item.remitly}
                      </td>
                      <td className="px-4 py-3">
                        {item.winner === 'wise' && (
                          <Check size={20} style={{ color: '#F0B429' }} />
                        )}
                        {item.winner === 'remitly' && (
                          <Check size={20} style={{ color: '#F0B429' }} />
                        )}
                        {item.winner === 'tie' && (
                          <span style={{ color: '#7A9CC4' }} className="text-sm">
                            Tie
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Example Calculation */}
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
              Example: Sending $2,000 AUD
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wise */}
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: '#0A1628', borderLeft: '4px solid #F0B429' }}
              >
                <h3 style={{ color: '#F0B429' }} className="font-bold mb-3">
                  Wise
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#7A9CC4' }}>Amount to Send</span>
                    <span style={{ color: '#C8D8E8' }} className="font-semibold">
                      $2,000 AUD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#7A9CC4' }}>Transfer Fee</span>
                    <span style={{ color: '#C8D8E8' }} className="font-semibold">
                      -$5.06
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#7A9CC4' }}>Exchange Rate</span>
                    <span style={{ color: '#C8D8E8' }} className="font-semibold">
                      56.42
                    </span>
                  </div>
                  <div
                    className="flex justify-between pt-2 border-t-2"
                    style={{ borderColor: '#1E3A5F' }}
                  >
                    <span style={{ color: '#7A9CC4' }} className="font-semibold">
                      You Receive
                    </span>
                    <span style={{ color: '#F0B429' }} className="font-bold text-lg">
                      ₹112,834
                    </span>
                  </div>
                </div>
              </div>

              {/* Remitly */}
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: '#0A1628', borderLeft: '4px solid #7A9CC4' }}
              >
                <h3 style={{ color: '#7A9CC4' }} className="font-bold mb-3">
                  Remitly
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#7A9CC4' }}>Amount to Send</span>
                    <span style={{ color: '#C8D8E8' }} className="font-semibold">
                      $2,000 AUD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#7A9CC4' }}>Transfer Fee</span>
                    <span style={{ color: '#C8D8E8' }} className="font-semibold">
                      -$8.50
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#7A9CC4' }}>Exchange Rate</span>
                    <span style={{ color: '#C8D8E8' }} className="font-semibold">
                      56.10
                    </span>
                  </div>
                  <div
                    className="flex justify-between pt-2 border-t-2"
                    style={{ borderColor: '#1E3A5F' }}
                  >
                    <span style={{ color: '#7A9CC4' }} className="font-semibold">
                      You Receive
                    </span>
                    <span style={{ color: '#7A9CC4' }} className="font-bold text-lg">
                      ₹112,055
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 rounded" style={{ backgroundColor: '#1E3A5F' }}>
              <p style={{ color: '#F0B429' }} className="text-center font-semibold">
                Wise Advantage: ₹779 more received
              </p>
            </div>
          </div>

          {/* Choose Wise If */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#F0B429',
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#F0B429' }}
            >
              Choose Wise If:
            </h2>
            <ul className="space-y-3">
              {[
                'You want the best exchange rate (real mid-market rates)',
                'You want to minimize transfer costs',
                'You send money frequently and want to save thousands annually',
                'Your recipient has a bank account in India',
                'You prefer transparency and no hidden markups',
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

          {/* Choose Remitly If */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#7A9CC4',
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#7A9CC4' }}
            >
              Choose Remitly If:
            </h2>
            <ul className="space-y-3">
              {[
                'Your recipient prefers cash pickup options',
                'You want to take advantage of frequent promotional offers',
                'You value the mobile app experience (both are excellent)',
                'You want flexibility in delivery methods',
                'You occasionally send small amounts and want to maximize promotions',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check
                    size={20}
                    style={{ color: '#7A9CC4', marginTop: '2px' }}
                    className="flex-shrink-0"
                  />
                  <span style={{ color: '#C8D8E8' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Features Breakdown */}
          <div className="space-y-8">
            <h2
              className="text-2xl font-bold"
              style={{ color: '#C8D8E8' }}
            >
              Detailed Comparison
            </h2>

            {/* Exchange Rates */}
            <div
              className="p-6 rounded-lg border-2"
              style={{
                backgroundColor: '#111D32',
                borderColor: '#1E3A5F',
              }}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: '#C8D8E8' }}
              >
                Exchange Rates
              </h3>
              <p style={{ color: '#7A9CC4' }} className="mb-4">
                This is where the biggest difference lies.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span style={{ color: '#F0B429' }} className="font-bold min-w-fit">
                    Wise:
                  </span>
                  <span style={{ color: '#C8D8E8' }}>
                    Uses real mid-market rates with no markup. You always get the true interbank rate.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span style={{ color: '#7A9CC4' }} className="font-bold min-w-fit">
                    Remitly:
                  </span>
                  <span style={{ color: '#C8D8E8' }}>
                    Marks up the mid-market rate by approximately 0.57%, which adds cost to your transfer.
                  </span>
                </li>
              </ul>
            </div>

            {/* Fees */}
            <div
              className="p-6 rounded-lg border-2"
              style={{
                backgroundColor: '#111D32',
                borderColor: '#1E3A5F',
              }}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: '#C8D8E8' }}
              >
                Transfer Fees
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span style={{ color: '#F0B429' }} className="font-bold min-w-fit">
                    Wise:
                  </span>
                  <span style={{ color: '#C8D8E8' }}>
                    Low fixed fee of $5.06 per transfer, regardless of amount.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span style={{ color: '#7A9CC4' }} className="font-bold min-w-fit">
                    Remitly:
                  </span>
                  <span style={{ color: '#C8D8E8' }}>
                    Fixed fee of $8.50, which is 68% more expensive than Wise.
                  </span>
                </li>
              </ul>
            </div>

            {/* Speed and Delivery */}
            <div
              className="p-6 rounded-lg border-2"
              style={{
                backgroundColor: '#111D32',
                borderColor: '#1E3A5F',
              }}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: '#C8D8E8' }}
              >
                Speed and Delivery
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span style={{ color: '#F0B429' }} className="font-bold min-w-fit">
                    Wise:
                  </span>
                  <span style={{ color: '#C8D8E8' }}>
                    Typically 1-2 business days for transfers to Indian bank accounts.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span style={{ color: '#7A9CC4' }} className="font-bold min-w-fit">
                    Remitly:
                  </span>
                  <span style={{ color: '#C8D8E8' }}>
                    1-2 business days for bank transfers, with same-day options available. Cash pickup faster for some recipients.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Line */}
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
              Bottom Line
            </h2>
            <p style={{ color: '#C8D8E8' }} className="mb-4">
              <span className="font-semibold" style={{ color: '#F0B429' }}>
                Wise is the clear winner for cost
              </span>
              . With better exchange rates and lower fees, you'll save money on every transfer.
            </p>
            <p style={{ color: '#7A9CC4' }}>
              Remitly remains a solid option if your recipient needs cash pickup or if you can take advantage of promotional offers. For regular transfers with bank accounts, Wise is the better choice.
            </p>
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
              Start with Wise Today
            </h2>
            <p
              className="mb-6 text-lg"
              style={{ color: '#7A9CC4' }}
            >
              Compare all your options and see real-time rates for your transfer.
            </p>
            <Link href="/">
              <button
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{
                  backgroundColor: '#F0B429',
                  color: '#0A1628',
                }}
              >
                Compare Now
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
