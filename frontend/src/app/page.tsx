import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import HomeClient from "./_components/HomeClient";
import { fetchLandingPageServerSide } from "@/lib/landingPage";
import { localizedAlternates } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "seo.home" });
  const isAr = locale === "ar";
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
      locale: isAr ? "ar_SA" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
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
