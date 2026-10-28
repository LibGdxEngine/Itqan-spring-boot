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

export function ogLocale(locale: string) {
  return locale === "ar" ? "ar_EG" : "en_US"
}

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
