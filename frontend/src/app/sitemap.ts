import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type CourseItem = {
    id?: number;
    updatedAt?: string;
};

type ArticleItem = {
    slug?: string;
    publishedAt?: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: `${SITE_URL}/courses`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/instructors`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/articles`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/muqtatafat`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
        },
    ];

    let coursePages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${API_URL}/api/courses/active`, {
            next: { revalidate: 3600 },
        });
        if (res.ok) {
            const courses: CourseItem[] = await res.json();
            coursePages = courses.map((course) => ({
                url: `${SITE_URL}/courses/${course.id}`,
                lastModified: course.updatedAt
                    ? new Date(course.updatedAt)
                    : new Date(),
                changeFrequency: "weekly" as const,
                priority: 0.8,
            }));
        }
    } catch {
        // If API is unavailable, return static pages only
    }

    let articlePages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${API_URL}/api/articles?page=0&size=100`, {
            next: { revalidate: 3600 },
        });
        if (res.ok) {
            const data = await res.json();
            const articles: ArticleItem[] = Array.isArray(data)
                ? data
                : (data.content ?? []);
            articlePages = articles.map((article) => ({
                url: `${SITE_URL}/articles/${encodeURIComponent(
                    article.slug ?? "",
                )}`,
                lastModified: article.publishedAt
                    ? new Date(article.publishedAt)
                    : undefined,
                changeFrequency: "weekly" as const,
                priority: 0.7,
            }));
        }
    } catch {
        // If API is unavailable, return static pages only
    }

    return [...staticPages, ...coursePages, ...articlePages];
}
