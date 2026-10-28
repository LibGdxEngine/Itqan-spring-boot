"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { BarChart3, LayoutGrid, Loader2, Newspaper, TicketPercent } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { cn } from "@/lib/utils"

/** Instructors and admins may use the studio; everyone else is sent away. */
export function useStudioGuard() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const allowed = user?.role === "INSTRUCTOR" || user?.role === "ADMIN"

  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) router.replace("/login")
    else if (!allowed) router.replace("/dashboard")
  }, [allowed, isAuthenticated, isLoading, router])

  return { ready: !isLoading && isAuthenticated && allowed, user }
}

export { useSiteCurrency } from "@/lib/use-site-currency"

const NAV = [
  { href: "/instructor", key: "courses", icon: LayoutGrid, exact: true },
  { href: "/instructor/analytics", key: "analytics", icon: BarChart3 },
  { href: "/instructor/coupons", key: "coupons", icon: TicketPercent },
  { href: "/instructor/articles", key: "articles", icon: Newspaper },
] as const

export function StudioSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )
}

/** Page frame for the studio: site navbar, studio tabs, content container. */
export function StudioShell({ children, hideNav }: { children: React.ReactNode; hideNav?: boolean }) {
  const t = useTranslations("studio.nav")
  const pathname = usePathname()
  const { ready } = useStudioGuard()

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main id="main-content" className="container mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6">
        {!hideNav ? (
          <nav aria-label={t("label")} className="mb-6 flex gap-1 overflow-x-auto border-b border-line-strong">
            {NAV.map((item) => {
              const active = "exact" in item && item.exact
                ? pathname === item.href || pathname.startsWith("/instructor/courses")
                : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-brand text-ink"
                      : "border-transparent text-ink-2 hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.key)}
                </Link>
              )
            })}
          </nav>
        ) : null}
        {ready ? children : <StudioSpinner />}
      </main>
    </div>
  )
}
