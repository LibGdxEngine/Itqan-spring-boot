import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import HomeClient from "./_components/HomeClient";
import { fetchLandingPageServerSide } from "@/lib/landingPage";
import { SITE_URL, defaultOgImage, localizedAlternates, ogLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "seo.home" });
  const keywords = t("keywords").split("|").map((k) => k.trim()).filter(Boolean);

  return {
    title: t("title"),
    description: t("description"),
    keywords,
    alternates: localizedAlternates("/", locale),
    openGraph: {
      type: "website",
      url: SITE_URL,
      title: t("title"),
      description: t("description"),
      locale: ogLocale(locale),
      images: [defaultOgImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [defaultOgImage(locale).url],
    },
  };
}

export default async function Page() {
  let data = null;
  try {
    data = await fetchLandingPageServerSide();
  } catch (error) {
    console.error('Failed to fetch landing page data:', error);
  }
  return <HomeClient data={data} />;
}
