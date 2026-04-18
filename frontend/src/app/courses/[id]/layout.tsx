import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type CourseData = {
    id?: number;
    title?: string;
    description?: string;
    instructor?: string;
    price?: number;
    level?: string;
    category?: string;
    thumbnailUrl?: string;
    duration?: number;
};

async function fetchCourse(id: string): Promise<CourseData | null> {
    try {
        const res = await fetch(`${API_URL}/api/courses/${id}`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const locale = await getLocale();
    const fallback = await getTranslations({ locale, namespace: "seo.courseFallback" });
    const course = await fetchCourse(id);

    if (!course) {
        return { title: fallback("notFound") };
    }

    const title = course.title || fallback("notFound");
    const description =
        course.description?.slice(0, 160) || fallback("description");
    const courseUrl = `${SITE_URL}/courses/${id}`;

    return {
        title,
        description,
        alternates: { canonical: courseUrl },
        openGraph: {
            title,
            description,
            url: courseUrl,
            type: "website",
            locale: locale === "ar" ? "ar_SA" : "en_US",
            images: course.thumbnailUrl
                ? [{ url: course.thumbnailUrl, alt: title }]
                : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
        },
    };
}

export default async function CourseLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const locale = await getLocale();
    const course = await fetchCourse(id);

    const jsonLd = course
        ? {
              "@context": "https://schema.org",
              "@type": "Course",
              name: course.title,
              description: course.description,
              inLanguage: locale,
              provider: {
                  "@type": "Organization",
                  name: locale === "ar" ? "إتقان" : "Itqan",
                  sameAs: SITE_URL,
              },
              instructor: course.instructor
                  ? { "@type": "Person", name: course.instructor }
                  : undefined,
              offers: {
                  "@type": "Offer",
                  price: course.price?.toString() || "0",
                  priceCurrency: "SAR",
                  availability: "https://schema.org/InStock",
                  url: `${SITE_URL}/courses/${id}`,
              },
              educationalLevel: course.level,
              about: course.category,
              image: course.thumbnailUrl,
              timeRequired: `PT${course.duration || 0}H`,
          }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
