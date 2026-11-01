import type { MetadataRoute } from "next";

import { SITE_URL, fetchPublic, localizedUrl } from "@/lib/seo";

export const revalidate = 3600;

type Page<T> = { content: T[]; totalPages: number };
type CatalogItem = { id: number; createdAt?: string };
type ArticleItem = { slug?: string; publishedAt?: string | null; updatedAt?: string | null };

const MAX_PAGES = 50;

/** Every page of a paged endpoint (bounded, so a huge catalog can't stall the sitemap). */
async function allPages<T>(path: (page: number) => string): Promise<T[]> {
    const items: T[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
        const data = await fetchPublic<Page<T> | T[]>(path(page), 3600);
        if (!data) break;
        if (Array.isArray(data)) return data;
        items.push(...data.content);
        if (page + 1 >= data.totalPages) break;
    }
    return items;
}

/** Entry available in both languages: Arabic at the plain URL, English at ?lang=en. */
function bilingual(
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
    lastModified?: Date,
): MetadataRoute.Sitemap[number] {
    return {
        url: localizedUrl(path, "ar"),
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages: { ar: localizedUrl(path, "ar"), en: localizedUrl(path, "en") } },
    };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();
    const staticPages: MetadataRoute.Sitemap = [
        bilingual("/", "weekly", 1.0, now),
        bilingual("/courses", "daily", 0.9, now),
        bilingual("/instructors", "weekly", 0.7),
        bilingual("/articles", "daily", 0.8, now),
        bilingual("/muqtatafat", "weekly", 0.6),
        bilingual("/about", "monthly", 0.5),
        bilingual("/scholarships", "monthly", 0.6),
        bilingual("/scholarships/donate", "monthly", 0.5),
        bilingual("/privacy", "yearly", 0.2),
        bilingual("/terms", "yearly", 0.2),
        // The services page is Arabic-only content.
        { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.7 },
    ];

    const [courses, articles] = await Promise.all([
        allPages<CatalogItem>((page) => `/api/catalog?sort=newest&size=48&page=${page}`),
        allPages<ArticleItem>((page) => `/api/articles?page=${page}&size=100`),
    ]);

    const coursePages = courses.map((course) =>
        bilingual(`/courses/${course.id}`, "weekly", 0.8, course.createdAt ? new Date(course.createdAt) : undefined),
    );

    // Articles are written in one language, so they get a single URL.
    const articlePages: MetadataRoute.Sitemap = articles
        .filter((article) => article.slug)
        .map((article) => {
            const modified = article.updatedAt ?? article.publishedAt;
            return {
                url: `${SITE_URL}/articles/${encodeURIComponent(article.slug!)}`,
                lastModified: modified ? new Date(modified) : undefined,
                changeFrequency: "weekly" as const,
                priority: 0.7,
            };
        });

    return [...staticPages, ...coursePages, ...articlePages];
}
