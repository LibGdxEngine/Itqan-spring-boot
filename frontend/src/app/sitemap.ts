import type { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type CourseItem = {
    id?: number;
    updatedAt?: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
            alternates: {
                languages: {
                    en: `${SITE_URL}/en`,
                    ar: `${SITE_URL}/ar`,
                },
            },
        },
        {
            url: `${SITE_URL}/courses`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
            alternates: {
                languages: {
                    en: `${SITE_URL}/en/courses`,
                    ar: `${SITE_URL}/ar/courses`,
                },
            },
        },
        {
            url: `${SITE_URL}/instructors`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: {
                languages: {
                    en: `${SITE_URL}/en/instructors`,
                    ar: `${SITE_URL}/ar/instructors`,
                },
            },
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
                alternates: {
                    languages: {
                        en: `${SITE_URL}/en/courses/${course.id}`,
                        ar: `${SITE_URL}/ar/courses/${course.id}`,
                    },
                },
            }));
        }
    } catch {
        // If API is unavailable, return static pages only
    }

    return [...staticPages, ...coursePages];
}
