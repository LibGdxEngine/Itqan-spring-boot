import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type CourseItem = { instructor?: string };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "seo.instructors" });
  const keywords = t("keywords").split("|").map((k) => k.trim()).filter(Boolean);
  const url = `${SITE_URL}/instructors`;

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

async function fetchInstructors(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/courses/active`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const courses: CourseItem[] = await res.json();
    const names = new Set<string>();
    for (const c of courses) if (c.instructor) names.add(c.instructor);
    return Array.from(names);
  } catch {
    return [];
  }
}

export default async function InstructorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "seo.instructors" });
  const instructors = await fetchInstructors();
  const url = `${SITE_URL}/instructors`;

  const itemListElements = instructors.slice(0, 50).map((name, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    item: { "@type": "Person", name },
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
