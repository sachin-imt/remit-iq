import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content/blog');

export interface BlogPostMeta {
    title: string;
    excerpt: string;
    date: string;
    readTime: number;
    slug: string;
    featured?: boolean;
}

export interface BlogPost {
    meta: BlogPostMeta;
    content: string;
}

export function getPostSlugs(): string[] {
    if (!fs.existsSync(contentDirectory)) return [];
    return fs.readdirSync(contentDirectory).filter((file) => file.endsWith('.mdx'));
}

export function getPostBySlug(slug: string): BlogPost {
    const realSlug = slug.replace(/\.mdx$/, '');
    const fullPath = path.join(contentDirectory, `${realSlug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const { data, content } = matter(fileContents);

    return {
        meta: {
            title: data.title,
            excerpt: data.excerpt,
            date: data.date,
            readTime: data.readTime,
            featured: data.featured || false,
            slug: realSlug,
        },
        content,
    };
}

export function getAllPosts(): BlogPostMeta[] {
    const slugs = getPostSlugs();
    const posts = slugs
        .map((slug) => getPostBySlug(slug).meta)
        .sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));

    return posts;
}
