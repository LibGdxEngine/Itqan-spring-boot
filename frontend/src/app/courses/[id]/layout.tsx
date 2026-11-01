import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { SITE_URL, defaultOgImage, brandName, fetchPublic, localizedAlternates, localizedUrl, ogLocale, jsonLdHtml } from "@/lib/seo";
import { getCourseData } from "./course-data";

async function siteCurrency() {
    const settings = await fetchPublic<Record<string, string>>("/api/settings", 3600);
    return settings?.defaultCurrency || "EGP";
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const locale = await getLocale();
    const fallback = await getTranslations({ locale, namespace: "seo.courseFallback" });
    const { course } = await getCourseData(id);

    if (!course) {
        return { title: fallback("notFound"), robots: { index: false, follow: true } };
    }

    const title = course.title;
    const description = course.description?.replace(/\s+/g, " ").slice(0, 160) || fallback("description");
    const path = `/courses/${id}`;

    return {
        title,
        description,
        alternates: localizedAlternates(path, locale),
        openGraph: {
            title,
            description,
            url: localizedUrl(path, locale),
            type: "website",
            locale: ogLocale(locale),
            // Without a thumbnail, fall back to the brand card instead of sharing with no image.
            images: [course.thumbnailUrl ? { url: course.thumbnailUrl, alt: title } : { ...defaultOgImage(locale), alt: title }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [course.thumbnailUrl || defaultOgImage(locale).url],
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
    const [{ course, stats, reviews }, currency] = await Promise.all([getCourseData(id), siteCurrency()]);
    const url = `${SITE_URL}/courses/${id}`;
    const brand = brandName(locale);

    // https://schema.org/Course — rating and reviews only when there are real ones.
    const jsonLd = course
        ? {
              "@context": "https://schema.org",
              "@type": "Course",
              "@id": `${url}#course`,
              name: course.title,
              description: course.description || course.title,
              url,
              inLanguage: locale,
              image: course.thumbnailUrl || defaultOgImage(locale).url,
              educationalLevel: course.level,
              about: course.category,
              teaches: course.learningOutcomes?.length ? course.learningOutcomes : undefined,
              coursePrerequisites: course.requirements?.length ? course.requirements : undefined,
              timeRequired: `PT${course.duration || 0}H`,
              provider: { "@type": "EducationalOrganization", "@id": `${SITE_URL}#organization`, name: brand, sameAs: SITE_URL },
              offers: {
                  "@type": "Offer",
                  category: course.price > 0 ? "Paid" : "Free",
                  price: String(course.price ?? 0),
                  priceCurrency: currency,
                  availability: "https://schema.org/InStock",
                  url,
              },
              hasCourseInstance: {
                  "@type": "CourseInstance",
                  courseMode: "Online",
                  courseWorkload: `PT${course.duration || 0}H`,
                  instructor: course.instructor ? { "@type": "Person", name: course.instructor } : undefined,
              },
              aggregateRating:
                  stats && stats.reviewCount > 0
                      ? {
                            "@type": "AggregateRating",
                            ratingValue: stats.rating,
                            reviewCount: stats.reviewCount,
                            bestRating: 5,
                            worstRating: 1,
                        }
                      : undefined,
              review: reviews.length
                  ? reviews.map((r) => ({
                        "@type": "Review",
                        author: { "@type": "Person", name: r.authorName || brand },
                        datePublished: r.createdAt.slice(0, 10),
                        reviewBody: r.comment || undefined,
                        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
                    }))
                  : undefined,
          }
        : null;

    const breadcrumb = course
        ? {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                  { "@type": "ListItem", position: 1, name: brand, item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: locale === "ar" ? "الدورات" : "Courses", item: `${SITE_URL}/courses` },
                  { "@type": "ListItem", position: 3, name: course.title, item: url },
              ],
          }
        : null;

    return (
        <>
            {jsonLd ? (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
            ) : null}
            {breadcrumb ? (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumb) }} />
            ) : null}
            {children}
        </>
    );
}
