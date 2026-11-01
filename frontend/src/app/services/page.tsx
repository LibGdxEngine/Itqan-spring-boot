import type { Metadata } from "next"
import ServicesClient from "./ServicesClient"
import { SITE_URL, defaultOgImage, ogLocale } from "@/lib/seo"

export const metadata: Metadata = {
  title: "خدمات الأكاديمية",
  description:
    "خدمات إتقان العلمية والتحريرية والتعليمية: تحقيق المخطوطات، مراجعة الكتب والرسائل، التدقيق اللغوي، تعليم القرآن الكريم، وتعليم العربية لغير الناطقين بها.",
  keywords: [
    "خدمات أكاديمية",
    "تحقيق مخطوطات",
    "مراجعة كتب ورسائل",
    "تدقيق لغوي",
    "تعليم القرآن الكريم",
    "تعليم غير الناطقين بالعربية",
    "إتقان للتفسير",
  ],
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/services`,
    title: "خدمات الأكاديمية",
    description:
      "خدمات إتقان العلمية والتحريرية والتعليمية: تحقيق المخطوطات، مراجعة الكتب والرسائل، التدقيق اللغوي، تعليم القرآن الكريم، وتعليم العربية لغير الناطقين بها.",
    locale: ogLocale("ar"),
    images: [defaultOgImage("ar")],
  },
  twitter: {
    card: "summary_large_image",
    title: "خدمات الأكاديمية",
    description:
      "خدمات إتقان العلمية والتحريرية والتعليمية: تحقيق المخطوطات، مراجعة الكتب والرسائل، التدقيق اللغوي، تعليم القرآن الكريم، وتعليم العربية لغير الناطقين بها.",
    images: [defaultOgImage("ar").url],
  },
}

export default function ServicesPage() {
  return <ServicesClient />
}
