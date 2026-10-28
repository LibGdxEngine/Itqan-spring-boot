import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Compass, Search } from "lucide-react"

import { PublicPage } from "@/components/layout/PublicPage"
import { Button } from "@/components/ui/button"

export default async function NotFound() {
  const t = await getTranslations("errors.notFound")
  return (
    <PublicPage>
      <section className="relative mx-auto flex max-w-2xl flex-col items-center px-4 pb-24 pt-36 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-16 h-64 pattern-islamic opacity-60 [mask-image:radial-gradient(60%_60%_at_50%_40%,#000,transparent)]" />
        <span className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Compass className="h-8 w-8" />
        </span>
        <p className="relative text-sm font-semibold uppercase tracking-[0.2em] text-brand" dir="ltr">404</p>
        <h1 className="relative mt-2 text-3xl text-ink sm:text-4xl">{t("title")}</h1>
        <p className="relative mt-3 max-w-md text-ink-2">{t("description")}</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">{t("home")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/courses">
              <Search /> {t("courses")}
            </Link>
          </Button>
        </div>
      </section>
    </PublicPage>
  )
}
