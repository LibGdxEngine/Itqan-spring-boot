"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ArrowRight, User, LogOut, Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { useAuth } from "@/components/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface NavLink {
  href: string
  label: string
}

export function Navbar() {
  const t = useTranslations()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  // Links close the drawer themselves; Escape closes it too.
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMobileMenuOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileMenuOpen])

  const links: NavLink[] = [
    { href: "/courses", label: t("nav.publicCourses") },
    { href: "/services", label: t("nav.services") },
    { href: "/muqtatafat", label: t("nav.muqtatafat") },
    { href: "/articles", label: t("nav.articles") },
    { href: "/instructors", label: t("nav.instructors") },
    { href: "/scholarships", label: t("nav.scholarships") },
  ]
  if (isAuthenticated && user?.role === "STUDENT") links.push({ href: "/dashboard", label: t("nav.myLearning") })
  if (user?.role === "INSTRUCTOR" || user?.role === "ADMIN") links.push({ href: "/instructor", label: t("nav.instructor") })
  if (user?.role === "ADMIN") links.push({ href: "/admin", label: t("nav.admin") })

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/85">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-night"
      >
        {t("nav.skipToContent")}
      </a>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ltr-flex flex h-16 items-center justify-between">
          <Link href="/" className="ltr-flex group flex items-center gap-2">
            <Image
              src="/itqan_logo.png"
              alt={t("nav.brand")}
              width={40}
              height={40}
              className="h-10 w-10 object-contain dark:brightness-110"
              priority
            />
          </Link>

          <nav aria-label={t("nav.mainLabel")} className="hidden items-center gap-6 text-[15px] font-medium text-ink-2 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "transition-colors hover:text-ink",
                  isActive(link.href) && "text-ink underline decoration-brand decoration-2 underline-offset-[6px]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ltr-flex flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LanguageSwitcher />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    aria-label={t("nav.accountMenu")}
                    className="relative h-9 w-9 rounded-full p-0 ring-1 ring-line-strong transition-all hover:shadow-sm hover:ring-brand/40 focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-coral to-brand text-sm font-semibold uppercase text-on-night">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-ink-3">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="me-2 h-4 w-4" />
                      <span>{t("common.profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="me-2 h-4 w-4" />
                    <span>{t("common.signOut")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="ltr-flex hidden items-center gap-3 md:flex">
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/login">{t("common.signIn")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    {t("common.getStarted")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            )}

            <button
              type="button"
              className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-sand hover:text-ink md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav id="mobile-menu" aria-label={t("nav.mainLabel")} className="border-t border-line bg-canvas md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-4 py-2.5 text-sm font-medium text-ink-button transition-colors hover:bg-sand hover:text-ink",
                  isActive(link.href) && "bg-sand text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="mt-2 border-t border-line pt-2">
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-ink-button transition-colors hover:bg-sand hover:text-ink"
                >
                  {t("common.profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    closeMobileMenu()
                  }}
                  className="w-full rounded-lg px-4 py-2.5 text-start text-sm font-medium text-ink-button transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  {t("common.signOut")}
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-line pt-2">
                <Button variant="secondary" size="sm" asChild className="justify-start">
                  <Link href="/login" onClick={closeMobileMenu}>
                    {t("common.signIn")}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register" onClick={closeMobileMenu}>
                    {t("common.getStarted")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
