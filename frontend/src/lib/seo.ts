import type { Metadata } from "next"

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "")
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/** Arabic is the default language; it lives at the plain URL, English at `?lang=en`. */
export function localizedUrl(path: string, locale: string) {
  const base = `${SITE_URL}${path === "/" ? "" : path}` || SITE_URL
  return locale === "en" ? `${base}?lang=en` : base
}

/** Self-referencing canonical plus hreflang alternates for both languages. */
export function localizedAlternates(path: string, locale: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localizedUrl(path, locale),
    languages: {
      ar: localizedUrl(path, "ar"),
      en: localizedUrl(path, "en"),
      "x-default": localizedUrl(path, "ar"),
    },
  }
}

/** Brand as shown in titles, schema and share cards. */
export const BRAND = { ar: "إتقان للتفسير", en: "Itqan Tafseer" } as const

export function brandName(locale: string) {
  return locale === "ar" ? BRAND.ar : BRAND.en
}

/** Open Graph locale. The audience is the whole Arab world, so Arabic uses the region-neutral ar_AR. */
export function ogLocale(locale: string) {
  return locale === "ar" ? "ar_AR" : "en_US"
}

export function ogAlternateLocale(locale: string) {
  return locale === "ar" ? "en_US" : "ar_AR"
}

/**
 * Static 1200x630 brand share card for the given language (public/og-default*.png).
 * Set explicitly on every page that defines `openGraph`: a child segment's openGraph
 * replaces the parent's, so the image would otherwise be dropped.
 */
export function defaultOgImage(locale: string) {
  const en = locale === "en"
  return {
    url: `${SITE_URL}/${en ? "og-default-en.png" : "og-default.png"}`,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: en ? "Itqan Tafseer — Understand the Quran" : "إتقان للتفسير — طريقك لفهم كلام الله",
  }
}

/** Square logo for Organization schema (Google requires >= 112px on a solid background). */
export const LOGO_URL = `${SITE_URL}/logo-1200.png`

/** Server-side fetch of a public API resource; null on any failure so pages still render. */
export async function fetchPublic<T>(path: string, revalidateSeconds = 300): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: revalidateSeconds } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so text can't close the tag. */
export function jsonLdHtml(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
