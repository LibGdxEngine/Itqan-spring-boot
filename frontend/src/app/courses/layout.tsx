import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type CourseItem = {
  id?: number;
  title?: string;
  instructor?: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "seo.courses" });
  const keywords = t("keywords").split("|").map((k) => k.trim()).filter(Boolean);
  const url = `${SITE_URL}/courses`;

  return {
    title: t("title"),
    description: t("description"),
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: t("title"),
      description: t("description"),
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

async function fetchCourses(): Promise<CourseItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/courses/active`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "seo.courses" });
  const courses = await fetchCourses();
  const url = `${SITE_URL}/courses`;

  const itemListElements = courses.slice(0, 50).map((course, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${SITE_URL}/courses/${course.id}`,
    name: course.title,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collectionpage`,
    url,
    name: t("title"),
    description: t("description"),
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemListElements.length,
      itemListElement: itemListElements,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
