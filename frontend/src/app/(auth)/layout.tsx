import type { Metadata } from "next";
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "@/components/ui/language-switcher"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "seo.auth" });
  return {
    title: t("loginTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Solid dark background */}
        <div className="absolute inset-0 bg-[#141413]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-[#faf9f5]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group ltr-flex">
            <div className="p-2.5 bg-[#30302e] rounded-xl group-hover:bg-[#30302e] transition-colors">
              <BookOpen className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{t("nav.brand")}</span>
          </Link>

          {/* Main content */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              {t("auth.branding.tagline")}
            </h1>
            <p className="text-lg text-[#b0aea5] max-w-md leading-relaxed">
              {t("auth.branding.description")}
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-4 ltr-flex">
              <div>
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-[#b0aea5]">{t("home.stats.activeStudents")}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-[#b0aea5]">{t("home.stats.courses")}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-[#b0aea5]">{t("home.stats.successRate")}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-[#b0aea5]">
            © {new Date().getFullYear()} {t("nav.brand")}. {t("common.allRightsReserved")}
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col bg-[#f5f4ed]">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b border-[#e8e6dc] bg-[#faf9f5]">
          <div className="flex items-center justify-between ltr-flex">
            <Link href="/" className="flex items-center gap-2 ltr-flex">
              <div className="p-2 bg-[#c96442] rounded-lg">
                <BookOpen className="w-5 h-5 text-[#faf9f5]" />
              </div>
              <span className="text-xl font-bold text-[#141413]">
                {t("nav.brand")}
              </span>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop language switcher */}
        <div className="hidden lg:flex justify-end p-6">
          <LanguageSwitcher />
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md animate-fade-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
