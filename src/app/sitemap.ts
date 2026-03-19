import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/mdx";
import { getAllCorridorSlugs } from "@/data/corridors";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://remitiq.co";

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
        { url: `${baseUrl}/rates`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${baseUrl}/alerts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
        { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
        { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ];

    const posts = getAllPosts();
    const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly" as const,
        priority: 0.7,
    }));

    // Programmatic corridor pages (pSEO)
    const corridorRoutes: MetadataRoute.Sitemap = getAllCorridorSlugs().map((slug) => ({
        url: `${baseUrl}/send-money-to-india-from/${slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
    }));

    return [...staticRoutes, ...corridorRoutes, ...blogRoutes];
}
