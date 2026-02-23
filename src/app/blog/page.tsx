import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { getAllPosts } from '@/lib/mdx';

export const metadata: Metadata = {
  title: 'RemitIQ Blog | Money Transfer Insights & Guides',
  description: 'Expert guides on sending money from Australia to India. Compare providers, timing strategies, and latest remittance trends.',
  openGraph: {
    title: 'RemitIQ Blog | Money Transfer Insights & Guides',
    description: 'Expert guides on sending money from Australia to India. Compare providers, timing strategies, and latest remittance trends.',
    type: 'website',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const featuredPosts = posts.filter((post) => post.featured);
  const allPosts = posts;

  return (
    <main className="min-h-screen bg-[#0A1628]">
      {/* Hero Section */}
      <section className="px-4 pt-16 pb-12 md:pt-24 md:pb-16 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00B9FF]/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="max-w-6xl mx-auto">
          <div className="mb-0 max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#C8D8E8] leading-tight mb-4">
              RemitIQ <span className="text-[#00B9FF]">Insights</span>
            </h1>
            <p className="text-lg md:text-xl text-[#7A9CC4] leading-relaxed">
              Data-driven intelligence on AUD to INR exchange rates. Stop guessing, start comparing, and save on every transfer.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-24">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-8 border-b border-[#1E3A5F]/50 pb-4">
              <TrendingUp className="text-[#F0B429] w-6 h-6" />
              <h2 className="text-2xl font-bold text-white tracking-wide">Featured Briefing</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
                  <article className="h-full flex flex-col p-8 rounded-2xl border-2 border-[#1E3A5F] bg-[#111D32] transition-all duration-300 hover:border-[#F0B429]/50 hover:bg-[#111D32]/80 hover:shadow-2xl hover:shadow-[#F0B429]/5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#F0B429]/10 text-[#F0B429] border border-[#F0B429]/20">
                        Editor&apos;s choice
                      </div>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-extrabold text-[#C8D8E8] mb-4 leading-snug group-hover:text-white transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-[#7A9CC4] text-base leading-relaxed mb-8 flex-grow">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-[#1E3A5F]/50 mt-auto">
                      <div className="flex items-center gap-4 text-sm font-medium text-[#7A9CC4]">
                        <span>{post.readTime} min read</span>
                        <span className="w-1 h-1 rounded-full bg-[#1E3A5F]"></span>
                        <span>{new Date(post.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#0A1628] flex items-center justify-center group-hover:bg-[#F0B429] transition-colors">
                        <ArrowRight size={18} className="text-[#F0B429] group-hover:text-[#0A1628] transition-colors" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Posts Grid */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-[#1E3A5F]/50 pb-4">
            <h2 className="text-2xl font-bold text-white tracking-wide">All Articles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
                <article className="h-full flex flex-col p-6 rounded-2xl border border-[#1E3A5F] bg-[#111D32]/50 transition-all duration-300 hover:border-[#00B9FF]/50 hover:bg-[#111D32] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#00B9FF]/5">
                  <h3 className="text-xl font-bold text-[#C8D8E8] mb-3 leading-tight group-hover:text-white transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-[#7A9CC4] leading-relaxed mb-6 flex-grow line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 mt-auto">
                    <div className="flex items-center gap-3 text-xs font-medium text-[#7A9CC4]">
                      <span>{post.readTime} min read</span>
                      <span className="w-1 h-1 rounded-full bg-[#1E3A5F]"></span>
                      <time>{new Date(post.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                    </div>
                    {post.featured ? (
                      <TrendingUp size={16} className="text-[#F0B429]" />
                    ) : (
                      <ArrowRight size={16} className="text-[#00B9FF] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    )}
                  </div>
                </article>
              </Link>
            ))}

            {allPosts.length === 0 && (
              <div className="col-span-full bg-[#111D32] border border-[#1E3A5F] border-dashed rounded-2xl p-12 text-center">
                <p className="text-[#7A9CC4] font-medium">No articles published yet. Check back soon.</p>
              </div>
            )}
          </div>
        </section>

        {/* Minimalist CTA */}
        <section className="mt-16 pt-16 border-t border-[#1E3A5F]/30">
          <div className="bg-gradient-to-br from-[#111D32] to-[#0D1B2E] border border-[#1E3A5F] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F0B429]/5 rounded-full blur-[80px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
              Stop overpaying your bank.
            </h2>
            <p className="text-lg text-[#7A9CC4] mb-8 max-w-xl mx-auto">
              Use our live comparison engine to find the highest exchange rate and lowest fees for your AUD to INR transfer today.
            </p>
            <Link href="/">
              <button className="bg-[#F0B429] hover:bg-yellow-400 text-[#0A1628] font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 glow-gold">
                Compare Live Rates
              </button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
