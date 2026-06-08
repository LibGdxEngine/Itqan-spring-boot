"use client"

import Link from "next/link"
import { Mail } from "lucide-react"
import { useTranslations } from "next-intl"

export function SiteFooter() {
  const t = useTranslations()

  return (
    <footer className="bg-[#141413] border-t border-[#30302e] text-[#b0aea5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 ltr-flex">
              <span
                className="text-lg text-[#faf9f5]"
                style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
              >
                {t("nav.brand")}
              </span>
            </Link>
            <p className="text-sm leading-relaxed">{t("footer.tagline")}</p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-[#faf9f5] uppercase tracking-[0.5px]">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-[#c96442] transition-colors">{t("footer.linkHome")}</Link></li>
              <li><Link href="/courses" className="hover:text-[#c96442] transition-colors">{t("footer.linkCourses")}</Link></li>
              <li><Link href="/services" className="hover:text-[#c96442] transition-colors">{t("nav.services")}</Link></li>
              <li><Link href="/instructors" className="hover:text-[#c96442] transition-colors">{t("nav.instructors") || "Instructors"}</Link></li>
              <li><Link href="/about" className="hover:text-[#c96442] transition-colors">{t("footer.linkAbout")}</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-[#faf9f5] uppercase tracking-[0.5px]">
              {t("footer.platform")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/login" className="hover:text-[#c96442] transition-colors">{t("footer.linkLogin")}</Link></li>
              <li><Link href="/register" className="hover:text-[#c96442] transition-colors">{t("footer.linkRegister")}</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#c96442] transition-colors">{t("footer.linkDashboard")}</Link></li>
              <li><Link href="/my-courses" className="hover:text-[#c96442] transition-colors">{t("footer.linkMyCourses")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-[#faf9f5] uppercase tracking-[0.5px]">
              {t("footer.contact")}
            </h4>
            <a
              href={`mailto:${t("footer.email")}`}
              className="inline-flex items-center gap-2 text-sm hover:text-[#c96442] transition-colors ltr-flex"
            >
              <Mail className="w-4 h-4 shrink-0" />
              {t("footer.email")}
            </a>
          </div>
        </div>

        <div className="border-t border-[#30302e] pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>
            © {new Date().getFullYear()} {t("nav.brand")}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  )
}
