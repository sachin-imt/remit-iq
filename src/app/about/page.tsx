"use client";
import { Shield, TrendingUp, Users, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A1628' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#1E3A5F', backgroundColor: '#111D32' }}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#C8D8E8' }}>
            About RemitIQ
          </h1>
          <p className="text-xl leading-relaxed max-w-2xl" style={{ color: '#7A9CC4' }}>
            Empowering informed remittance decisions through transparent, real-time exchange rate intelligence.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Mission Section */}
        <section className="mb-24">
          <div
            className="rounded-lg p-10 border"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#F0B429' }}>
              Our Mission
            </h2>
            <p className="text-lg leading-relaxed mb-4" style={{ color: '#C8D8E8' }}>
              RemitIQ exists to solve a critical problem: diaspora communities send over $800 billion annually in remittances, yet they often lack transparent, trustworthy information about the best rates and platforms available.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: '#C8D8E8' }}>
              We're building the information layer for the remittance industry—aggregating real-time exchange rates, compliance data, and community insights to help people send money smarter, safer, and with confidence.
            </p>
          </div>
        </section>

        {/* Values Grid */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold mb-10" style={{ color: '#C8D8E8' }}>
            Our Values
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: 'Transparent Rankings',
                desc: 'Our rankings are based solely on the total INR you receive — never influenced by which platforms pay us referral commissions. The best deal for you always comes first.',
              },
              {
                icon: TrendingUp,
                title: 'Intelligence Not Just Data',
                desc: 'Raw data is useless. We provide context, analysis, and narrative that help you understand what exchange rates really mean for your money.',
              },
              {
                icon: Users,
                title: 'Built for Community',
                desc: 'Remittance corridors are defined by communities. We prioritize the corridors and use cases that matter most to diaspora populations.',
              },
              {
                icon: Zap,
                title: 'Real-Time Accuracy',
                desc: 'Exchange rates move constantly. Our data updates in real time so you never make decisions based on stale information.',
              },
            ].map((value, idx) => {
              const IconComponent = value.icon;
              return (
                <div
                  key={idx}
                  className="rounded-lg p-8 border transition-all duration-200"
                  style={{
                    backgroundColor: '#111D32',
                    borderColor: '#1E3A5F',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#F0B429';
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(240, 180, 41, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="mb-4">
                    <IconComponent
                      size={40}
                      style={{ color: '#F0B429' }}
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#C8D8E8' }}>
                    {value.title}
                  </h3>
                  <p className="leading-relaxed" style={{ color: '#7A9CC4' }}>
                    {value.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Methodology Section */}
        <section className="mb-24" id="methodology">
          <div
            className="rounded-lg p-10 border"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#C8D8E8' }}>
              Our Methodology
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#F0B429' }}>
                  Data Collection
                </h3>
                <p style={{ color: '#7A9CC4' }}>
                  We aggregate exchange rate data from multiple official sources, partner platforms, and market feeds. Our infrastructure updates rates every 30 seconds across 50+ remittance corridors.
                </p>
              </div>

              <div
                className="h-px"
                style={{ backgroundColor: '#1E3A5F' }}
              />

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#F0B429' }}>
                  Quality Assurance
                </h3>
                <p style={{ color: '#7A9CC4' }}>
                  Every rate is validated against historical trends and real-time market data. We flag anomalies and maintain audit trails for transparency.
                </p>
              </div>

              <div
                className="h-px"
                style={{ backgroundColor: '#1E3A5F' }}
              />

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#F0B429' }}>
                  Compliance & Verification
                </h3>
                <p style={{ color: '#7A9CC4' }}>
                  All platforms are verified for regulatory compliance, security certifications, and customer protections. We maintain detailed compliance profiles for each corridor.
                </p>
              </div>

              <div
                className="h-px"
                style={{ backgroundColor: '#1E3A5F' }}
              />

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#F0B429' }}>
                  Community Intelligence
                </h3>
                <p style={{ color: '#7A9CC4' }}>
                  We aggregate feedback, reviews, and real experiences from community members. This contextual layer helps you understand which platforms work best for your corridor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Revenue Model Section */}
        <section className="mb-24">
          <div
            className="rounded-lg p-10 border"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#C8D8E8' }}>
              How We Make Money
            </h2>

            <p className="text-lg leading-relaxed mb-6" style={{ color: '#7A9CC4' }}>
              We believe in transparency about how we earn money. When you click through to a platform and make a transfer, we earn a referral commission from that platform. This is how we keep RemitIQ free.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: '#F0B429' }}
                />
                <div>
                  <p className="font-semibold" style={{ color: '#C8D8E8' }}>
                    Referral Commissions: We earn a small commission when you transfer through our partner links
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: '#F0B429' }}
                />
                <div>
                  <p className="font-semibold" style={{ color: '#C8D8E8' }}>
                    Rankings are never influenced: We always rank by the total INR you receive — the best deal for you comes first, regardless of who pays us more
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: '#F0B429' }}
                />
                <div>
                  <p className="font-semibold" style={{ color: '#C8D8E8' }}>
                    No hidden fees: We never add margins or charge you anything. The rate you see is the rate the platform offers
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm mt-8 pt-8 border-t" style={{ borderColor: '#1E3A5F', color: '#7A9CC4' }}>
              Our incentive is simple: if we help you find the best deal, you trust us and come back. That trust is worth more than any commission.
            </p>
          </div>
        </section>

        {/* Privacy Section */}
        <section id="privacy">
          <div
            className="rounded-lg p-10 border"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2 className="text-3xl font-bold mb-6" style={{ color: '#C8D8E8' }}>
              Your Privacy & Data
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#F0B429' }}>
                  Data We Collect
                </h3>
                <p style={{ color: '#7A9CC4' }}>
                  We only collect what's necessary: email for alerts, search history for trends, and feedback for community insights. We never sell personal data.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#F0B429' }}>
                  How We Protect It
                </h3>
                <p style={{ color: '#7A9CC4' }}>
                  All data is encrypted in transit and at rest. We comply with GDPR, CCPA, and emerging privacy standards. Your financial information is never stored.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#F0B429' }}>
                  Your Rights
                </h3>
                <p style={{ color: '#7A9CC4' }}>
                  You can access, export, or delete your data anytime. Our privacy policy is clear, plain language—no legal jargon hiding bad practices.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Spacing */}
      <div className="h-16" />
    </div>
  );
}
