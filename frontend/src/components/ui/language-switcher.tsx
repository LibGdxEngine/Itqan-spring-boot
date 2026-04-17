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
      // Set the locale cookie
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
      // Reload to apply the new locale
      window.location.reload()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      disabled={isPending}
      className="gap-2"
    >
      <Languages className="w-4 h-4" />
      <span className="hidden sm:inline">
        {locale === 'en' ? 'العربية' : 'English'}
      </span>
    </Button>
  )
}
