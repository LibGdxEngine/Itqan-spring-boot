import type { Metadata } from "next";
import Link from "next/link"
import Image from "next/image"
import { getLocale, getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel"

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
      {/* Left side — dark branding panel (animated client component) */}
      <AuthBrandPanel />

      {/* Right side - Auth forms */}
      <div className="relative flex-1 flex flex-col bg-[#f5f4ed]">
        {/* Subtle dotted texture behind the form column */}
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-60" />

        {/* Mobile header */}
        <div className="relative z-10 lg:hidden p-6 border-b border-[#e8e6dc] bg-[#faf9f5]">
          <div className="flex items-center justify-between ltr-flex">
            <Link href="/" className="flex items-center gap-2 ltr-flex">
              <Image
                src="/itqan_logo.png"
                alt={t("nav.brand")}
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
                priority
              />
              <span className="text-xl font-bold text-[#141413]">
                {t("nav.brand")}
              </span>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop language switcher */}
        <div className="relative z-10 hidden lg:flex justify-end p-6">
          <LanguageSwitcher />
        </div>

        {/* Form container */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md animate-fade-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
