"use client"

import * as React from "react"

import { SiteSettings, settingsApi } from "@/lib/admin-api"

let settingsPromise: Promise<SiteSettings> | null = null

/** Public site settings (contact details, social links, currency), fetched once per page load. */
export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = React.useState<SiteSettings>({})
  React.useEffect(() => {
    settingsPromise ??= settingsApi.get().catch(() => {
      settingsPromise = null
      return {}
    })
    let cancelled = false
    void settingsPromise.then((value) => {
      if (!cancelled) setSettings(value)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return settings
}

/** The site-wide default currency from admin settings. */
export function useSiteCurrency() {
  return useSiteSettings().defaultCurrency || "EGP"
}

/** Formats a course price in the site currency; 0 shows as the localized "free" label. */
export function formatPrice(amount: number, currency: string, locale: string, freeLabel: string) {
  if (!amount) return freeLabel
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

/** wa.me link for a phone number in any common format. */
export function whatsappLink(number: string | undefined, message?: string) {
  const digits = (number ?? "").replace(/\D/g, "")
  if (!digits) return null
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`
}
