"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Film,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  X,
  HandHeart,
  HeartHandshake,
} from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_GROUPS: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: "overview",
    items: [
      { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", labelKey: "analytics", icon: BarChart3 },
    ],
  },
  {
    labelKey: "people",
    items: [
      { href: "/admin/users", labelKey: "users", icon: Users },
      { href: "/admin/team", labelKey: "team", icon: ShieldCheck },
    ],
  },
  {
    labelKey: "learning",
    items: [
      { href: "/admin/courses", labelKey: "courses", icon: BookOpen },
      { href: "/admin/enrollments", labelKey: "enrollments", icon: GraduationCap },
      { href: "/admin/reviews", labelKey: "reviews", icon: MessageSquareText },
    ],
  },
  {
    labelKey: "sales",
    items: [
      { href: "/admin/payments", labelKey: "payments", icon: CreditCard },
      { href: "/admin/coupons", labelKey: "coupons", icon: Ticket },
      { href: "/admin/enrollment-codes", labelKey: "enrollmentCodes", icon: KeyRound },
      { href: "/admin/scholarships", labelKey: "scholarships", icon: HandHeart },
      { href: "/admin/donations", labelKey: "donations", icon: HeartHandshake },
    ],
  },
  {
    labelKey: "content",
    items: [
      { href: "/admin/landing", labelKey: "landing", icon: LayoutTemplate },
      { href: "/admin/clips", labelKey: "clips", icon: Film },
    ],
  },
  {
    labelKey: "system",
    items: [
      { href: "/admin/audit-log", labelKey: "auditLog", icon: ClipboardList },
      { href: "/admin/settings", labelKey: "settings", icon: Settings },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/")
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("admin.nav")
  const [menuOpen, setMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
    } else if (user?.role !== "ADMIN") {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, isLoading, router, user?.role])

  // Close the mobile drawer on navigation and lock scrolling while it is open.
  React.useEffect(() => setMenuOpen(false), [pathname])
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  if (isLoading || !isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const current = NAV_GROUPS.flatMap((g) => g.items).find((item) => isActive(pathname, item.href))

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label={t("ariaLabel")}>
      <div className="flex h-16 items-center gap-2 border-b border-line-strong px-5">
        <Image src="/itqan_logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">{t("brand")}</p>
          <p className="text-xs text-ink-3">{t("panel")}</p>
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              {t(`groups.${group.labelKey}`)}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand font-medium text-white"
                          : "text-ink-button hover:bg-grid hover:text-ink",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {t(item.labelKey)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-line-strong p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-button hover:bg-grid"
        >
          <ExternalLink className="h-4 w-4" />
          {t("viewSite")}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-button hover:bg-grid"
        >
          <LogOut className="h-4 w-4 rtl:rotate-180" />
          {t("logout")}
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 border-e border-line-strong bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("closeMenu")}
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-72 max-w-[85vw] bg-surface shadow-xl">
            <button
              type="button"
              className="absolute end-3 top-4 rounded-md p-1.5 text-ink-2 hover:bg-grid"
              aria-label={t("closeMenu")}
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line-strong bg-canvas/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-ink-button hover:bg-grid lg:hidden"
            aria-label={t("openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <nav aria-label={t("breadcrumb")} className="min-w-0 flex-1 truncate text-sm text-ink-3">
            <Link href="/admin" className="hover:text-ink">
              {t("panel")}
            </Link>
            {current && current.href !== "/admin" ? (
              <>
                <span className="mx-2">/</span>
                <span className="font-medium text-ink">{t(current.labelKey)}</span>
              </>
            ) : null}
          </nav>
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="hidden text-end sm:block">
            <p className="text-sm font-medium text-ink">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-ink-3">{user.superAdmin ? t("superAdmin") : t("admin")}</p>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
