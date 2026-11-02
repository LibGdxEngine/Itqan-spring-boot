"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = React.useTransition()

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en'
    
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;samesite=lax`
      // A ?lang= in the address would override the cookie, so swap it for the new language.
      const url = new URL(window.location.href)
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", newLocale)
        window.location.assign(url.toString())
      } else {
        window.location.reload()
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      lang={locale === 'en' ? 'ar' : 'en'}
      aria-label={locale === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
      disabled={isPending}
      className="gap-2"
    >
      <Languages className="hidden w-4 h-4 sm:block" aria-hidden />
      <span className="hidden sm:inline">
        {locale === 'en' ? 'العربية' : 'English'}
      </span>
      {/* Phones: a short code instead of an ambiguous glyph. */}
      <span className="font-semibold tracking-wide sm:hidden" aria-hidden>
        {locale === 'en' ? 'ع' : 'EN'}
      </span>
    </Button>
  )
}
