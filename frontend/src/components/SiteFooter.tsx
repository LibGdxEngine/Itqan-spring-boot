"use client"

import Link from "next/link"
import { Facebook, MapPin, MessageCircle, Phone } from "lucide-react"
import { useTranslations } from "next-intl"

import { useSiteSettings, whatsappLink } from "@/lib/use-site-currency"
import { SITE_CONTACT } from "@/lib/site-contact"

// Only Facebook for now. To bring a channel back, re-add its entry
// (instagramUrl/Instagram, youtubeUrl/Youtube, xUrl/Twitter, tiktokUrl/Music2, telegramUrl/Send).
const SOCIALS = [
  { key: "facebookUrl", label: "Facebook", icon: Facebook, fallback: SITE_CONTACT.facebookUrl },
] as const

const isHttp = (value: string | undefined): value is string => !!value && /^https?:\/\//i.test(value)

export function SiteFooter() {
  const t = useTranslations()
  const settings = useSiteSettings()
  // Contact is by WhatsApp only; email is intentionally not shown.
  const whatsappNumber = settings.whatsappNumber || SITE_CONTACT.whatsappNumber
  const whatsapp = whatsappLink(whatsappNumber)
  const socials = SOCIALS.map((s) => ({ ...s, href: settings[s.key] || s.fallback })).filter((s) => isHttp(s.href))

  return (
    <footer className="border-t border-night-2 bg-night text-on-night-2">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="ltr-flex inline-flex items-center gap-2">
              <span className="text-lg text-on-night" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
                {settings.siteName || t("nav.brand")}
              </span>
            </Link>
            <p className="text-sm leading-relaxed">{settings.tagline || t("footer.tagline")}</p>
            {socials.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label={t("footer.social")}>
                {socials.map(({ key, label, icon: Icon, href }) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-night-2 text-on-night-soft transition-colors hover:bg-brand hover:text-on-night"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label={t("footer.quickLinks")} className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.5px] text-on-night">{t("footer.quickLinks")}</h2>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/courses" className="transition-colors hover:text-coral">{t("footer.linkCourses")}</Link></li>
              <li><Link href="/services" className="transition-colors hover:text-coral">{t("nav.services")}</Link></li>
              <li><Link href="/instructors" className="transition-colors hover:text-coral">{t("nav.instructors")}</Link></li>
              <li><Link href="/articles" className="transition-colors hover:text-coral">{t("nav.articles")}</Link></li>
              <li><Link href="/about" className="transition-colors hover:text-coral">{t("footer.linkAbout")}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t("footer.platform")} className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.5px] text-on-night">{t("footer.platform")}</h2>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/login" className="transition-colors hover:text-coral">{t("footer.linkLogin")}</Link></li>
              <li><Link href="/register" className="transition-colors hover:text-coral">{t("footer.linkRegister")}</Link></li>
              <li><Link href="/dashboard" className="transition-colors hover:text-coral">{t("footer.linkDashboard")}</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-coral">{t("footer.linkPrivacy")}</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-coral">{t("footer.linkTerms")}</Link></li>
            </ul>
          </nav>

          <div className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.5px] text-on-night">{t("footer.contact")}</h2>
            <ul className="space-y-2.5 text-sm">
              {settings.contactPhone ? (
                <li>
                  <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 transition-colors hover:text-coral">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span dir="ltr">{settings.contactPhone}</span>
                  </a>
                </li>
              ) : null}
              {whatsapp ? (
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-coral">
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {t("footer.whatsapp")}
                      <span dir="ltr" className="block text-xs opacity-80">{whatsappNumber}</span>
                    </span>
                  </a>
                </li>
              ) : null}
              {settings.address ? (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="whitespace-pre-line">{settings.address}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-night-2 pt-8 text-sm sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.siteName || t("nav.brand")}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  )
}
