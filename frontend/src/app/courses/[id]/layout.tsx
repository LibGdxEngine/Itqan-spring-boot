import type { Metadata } from "next";

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
    const course = await fetchCourse(id);

    if (!course) {
        return { title: "Course Not Found | Itqan" };
    }

    const title = `${course.title} | Itqan`;
    const description =
        course.description?.slice(0, 160) || "Learn with Itqan Education Platform";
    const courseUrl = `${SITE_URL}/courses/${id}`;

    return {
        title,
        description,
        alternates: {
            canonical: courseUrl,
            languages: {
                en: `${SITE_URL}/en/courses/${id}`,
                ar: `${SITE_URL}/ar/courses/${id}`,
            },
        },
        openGraph: {
            title: course.title || "Course",
            description,
            url: courseUrl,
            type: "website",
            images: course.thumbnailUrl
                ? [{ url: course.thumbnailUrl, alt: course.title || "Course" }]
                : [],
        },
        twitter: {
            card: "summary_large_image",
            title: course.title || "Course",
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
    const course = await fetchCourse(id);

    const jsonLd = course
        ? {
              "@context": "https://schema.org",
              "@type": "Course",
              name: course.title,
              description: course.description,
              provider: {
                  "@type": "Organization",
                  name: "Itqan",
                  sameAs: SITE_URL,
              },
              instructor: {
                  "@type": "Person",
                  name: course.instructor,
              },
              offers: {
                  "@type": "Offer",
                  price: course.price?.toString() || "0",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
              },
              educationalLevel: course.level,
              about: course.category,
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
