import type { Metadata } from "next"
import ServicesClient from "./ServicesClient"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  title: "خدمات الأكاديمية — إتقان",
  description:
    "خدمات إتقان العلمية والتحريرية والتعليمية: تحقيق المخطوطات، مراجعة الكتب والرسائل، التدقيق اللغوي، تعليم القرآن الكريم، وتعليم العربية لغير الناطقين بها.",
  keywords: [
    "خدمات أكاديمية",
    "تحقيق مخطوطات",
    "مراجعة كتب ورسائل",
    "تدقيق لغوي",
    "تعليم القرآن الكريم",
    "تعليم غير الناطقين بالعربية",
    "إتقان",
  ],
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/services`,
    title: "خدمات الأكاديمية — إتقان",
    description:
      "خدمات إتقان العلمية والتحريرية والتعليمية: تحقيق المخطوطات، مراجعة الكتب والرسائل، التدقيق اللغوي، تعليم القرآن الكريم، وتعليم العربية لغير الناطقين بها.",
    locale: "ar_SA",
  },
  twitter: {
    card: "summary_large_image",
    title: "خدمات الأكاديمية — إتقان",
    description:
      "خدمات إتقان العلمية والتحريرية والتعليمية: تحقيق المخطوطات، مراجعة الكتب والرسائل، التدقيق اللغوي، تعليم القرآن الكريم، وتعليم العربية لغير الناطقين بها.",
  },
}

export default function ServicesPage() {
  return <ServicesClient />
}
