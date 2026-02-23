import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getPostSlugs } from "@/lib/mdx";
import LiveRateEmbed from "@/components/LiveRateEmbed";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export async function generateStaticParams() {
    return getPostSlugs().map((slug) => ({
        slug: slug.replace(/\.mdx$/, ""),
    }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    try {
        const post = getPostBySlug(params.slug);
        return {
            title: `${post.meta.title} | RemitIQ`,
            description: post.meta.excerpt,
            openGraph: {
                title: post.meta.title,
                description: post.meta.excerpt,
                type: "article",
                publishedTime: post.meta.date,
            },
        };
    } catch {
        return { title: 'Not Found | RemitIQ' };
    }
}

const components = {
    LiveRateEmbed,
    // Automatically style markdown elements using tailwind typography classes
    h1: (props: any) => <h1 className="text-3xl font-extrabold text-white mt-10 mb-6" {...props} />,
    h2: (props: any) => <h2 className="text-2xl font-bold text-white mt-10 mb-4" {...props} />,
    h3: (props: any) => <h3 className="text-xl font-bold text-white mt-8 mb-3" {...props} />,
    p: (props: any) => <p className="text-[#C8D8E8] leading-relaxed mb-6" {...props} />,
    ul: (props: any) => <ul className="list-disc list-inside text-[#C8D8E8] space-y-2 mb-6 ml-4 marker:text-[#F0B429]" {...props} />,
    ol: (props: any) => <ol className="list-decimal list-inside text-[#C8D8E8] space-y-2 mb-6 ml-4 marker:text-[#F0B429]" {...props} />,
    li: (props: any) => <li className="" {...props} />,
    strong: (props: any) => <strong className="text-white font-semibold" {...props} />,
    a: (props: any) => <a className="text-[#F0B429] hover:underline" {...props} />,
    blockquote: (props: any) => <blockquote className="border-l-4 border-[#F0B429] pl-4 italic text-[#7A9CC4] my-6 bg-[#111D32] p-4 rounded-r-lg" {...props} />
};

export default function BlogPost({ params }: { params: { slug: string } }) {
    let post;
    try {
        post = getPostBySlug(params.slug);
    } catch {
        notFound();
    }

    return (
        <article className="mx-auto max-w-3xl px-4 py-12 md:py-20">
            <Link href="/blog" className="inline-flex items-center gap-2 text-[#7A9CC4] hover:text-white transition-colors mb-8 text-sm font-semibold">
                <ArrowLeft className="w-4 h-4" /> Back to Guides
            </Link>

            <header className="mb-12">
                <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">
                    {post.meta.title}
                </h1>
                <div className="flex items-center gap-6 text-[#7A9CC4] text-sm">
                    <time dateTime={post.meta.date}>
                        {new Date(post.meta.date).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{post.meta.readTime} min read</span>
                    </div>
                </div>
            </header>

            <div className="prose-lg">
                <MDXRemote source={post.content} components={components} />
            </div>

            <div className="mt-16 pt-8 border-t border-[#1E3A5F]">
                <div className="bg-[#111D32] border border-[#1E3A5F] rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-bold text-white mb-3">Ready to find the best rate?</h3>
                    <p className="text-[#7A9CC4] mb-6">We compare live exchange rates across 6+ providers so you don&apos;t have to.</p>
                    <Link href="/" className="inline-flex items-center justify-center bg-[#F0B429] text-[#0A1628] font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors glow-gold">
                        Compare Live Rates Now
                    </Link>
                </div>
            </div>
        </article>
    );
}
