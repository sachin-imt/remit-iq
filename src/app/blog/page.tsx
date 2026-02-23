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
    <main className="min-h-screen" style={{ backgroundColor: '#0A1628' }}>
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: '#C8D8E8' }}
            >
              RemitIQ Blog
            </h1>
            <p
              className="text-lg"
              style={{ color: '#7A9CC4' }}
            >
              Expert insights on money transfers from Australia to India. Learn how to save money, time, and hassle.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2
                className="text-2xl md:text-3xl font-bold flex items-center gap-2"
                style={{ color: '#F0B429' }}
              >
                <TrendingUp size={28} />
                Featured Articles
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <article
                    className="h-full p-6 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      backgroundColor: '#111D32',
                      borderColor: '#1E3A5F',
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3
                          className="text-xl font-bold mb-2 leading-tight"
                          style={{ color: '#C8D8E8' }}
                        >
                          {post.title}
                        </h3>
                      </div>
                      <div
                        className="px-3 py-1 rounded text-sm font-semibold ml-2 flex-shrink-0"
                        style={{
                          backgroundColor: '#1E3A5F',
                          color: '#F0B429',
                        }}
                      >
                        Featured
                      </div>
                    </div>

                    <p
                      className="mb-4 text-sm leading-relaxed"
                      style={{ color: '#7A9CC4' }}
                    >
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm" style={{ color: '#7A9CC4' }}>
                        <span>{post.readTime} min read</span>
                        <span>{new Date(post.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <ArrowRight
                        size={20}
                        style={{ color: '#F0B429' }}
                      />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ color: '#C8D8E8' }}
            >
              All Articles
            </h2>
          </div>

          <div className="space-y-4">
            {allPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article
                  className="p-6 rounded-lg border-2 transition-all hover:border-[#F0B429] cursor-pointer"
                  style={{
                    backgroundColor: '#111D32',
                    borderColor: '#1E3A5F',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3
                        className="text-lg font-semibold mb-2"
                        style={{ color: '#C8D8E8' }}
                      >
                        {post.title}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: '#7A9CC4' }}
                      >
                        {post.excerpt}
                      </p>
                    </div>
                    <ArrowRight
                      size={20}
                      style={{ color: '#F0B429' }}
                      className="flex-shrink-0 mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4 text-sm" style={{ color: '#7A9CC4' }}>
                    <div className="flex gap-4">
                      <span>{post.readTime} min read</span>
                      <span>{new Date(post.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    {post.featured && (
                      <div
                        className="px-3 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: '#1E3A5F',
                          color: '#F0B429',
                        }}
                      >
                        Featured
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            ))}

            {allPosts.length === 0 && (
              <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-8 text-center">
                <p className="text-[#7A9CC4]">No articles published yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="p-8 md:p-12 rounded-lg border-2"
            style={{
              backgroundColor: '#111D32',
              borderColor: '#1E3A5F',
            }}
          >
            <h2
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ color: '#C8D8E8' }}
            >
              Ready to Compare Providers?
            </h2>
            <p
              className="mb-6 text-lg"
              style={{ color: '#7A9CC4' }}
            >
              Use our comparison tool to find the best rates for your transfer.
            </p>
            <Link href="/">
              <button
                className="px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{
                  backgroundColor: '#F0B429',
                  color: '#0A1628',
                }}
              >
                Start Comparing
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
