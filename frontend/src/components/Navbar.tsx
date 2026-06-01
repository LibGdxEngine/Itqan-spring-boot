"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, User, LogOut, Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useAuth } from "@/components/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const t = useTranslations()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#f0eee6] bg-[#f5f4ed]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 ltr-flex">
          {/* Logo — Amiri wordmark */}
          <Link href="/" className="flex items-center gap-2 group ltr-flex">
            <span className="text-xl font-serif-ar text-[#141413] tracking-normal" style={{ fontFamily: "var(--font-serif-ar)" }}>
              {t("nav.brand")}
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#5e5d59]">
            <Link href="/courses" className="hover:text-[#141413] transition-colors">
              {t("nav.publicCourses")}
            </Link>
            <Link href="/muqtatafat" className="hover:text-[#141413] transition-colors">
              {t("nav.muqtatafat")}
            </Link>
            <Link href="/instructors" className="hover:text-[#141413] transition-colors">
              {t("nav.instructors") || "Instructors"}
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className="hover:text-[#141413] transition-colors">
                  {t("nav.dashboard")}
                </Link>
                {user?.role === "ADMIN" && (
                  <Link href="/admin" className="hover:text-[#141413] transition-colors">
                    {t("nav.admin")}
                  </Link>
                )}
                {(user?.role === "INSTRUCTOR" || user?.role === "ADMIN") && (
                  <Link href="/instructor" className="hover:text-[#141413] transition-colors">
                    {t("nav.instructor")}
                  </Link>
                )}
                <Link href="/my-courses" className="hover:text-[#141413] transition-colors">
                  {t("nav.myLearning")}
                </Link>
              </>
            )}
          </div>

          {/* Auth buttons + language + hamburger */}
          <div className="flex items-center gap-3 ltr-flex">
            <LanguageSwitcher />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt={user?.firstName} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-[#87867f]">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>{t("common.profile")}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("common.signOut")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-3 ltr-flex">
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/login">{t("common.signIn")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    {t("common.getStarted")}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[#e8e6dc] text-[#5e5d59] hover:text-[#141413] transition-colors"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#f0eee6] bg-[#f5f4ed]">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            <Link
              href="/courses"
              onClick={closeMobileMenu}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#4d4c48] hover:bg-[#e8e6dc] hover:text-[#141413] transition-colors"
            >
              {t("nav.publicCourses")}
            </Link>
            <Link
              href="/muqtatafat"
              onClick={closeMobileMenu}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#4d4c48] hover:bg-[#e8e6dc] hover:text-[#141413] transition-colors"
            >
              {t("nav.muqtatafat")}
            </Link>
            <Link
              href="/instructors"
              onClick={closeMobileMenu}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#4d4c48] hover:bg-[#e8e6dc] hover:text-[#141413] transition-colors"
            >
              {t("nav.instructors") || "Instructors"}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#4d4c48] hover:bg-[#e8e6dc] hover:text-[#141413] transition-colors"
                >
                  {t("nav.dashboard")}
                </Link>
                {user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#4d4c48] hover:bg-[#e8e6dc] hover:text-[#141413] transition-colors"
                  >
                    {t("nav.admin")}
                  </Link>
                )}
                {(user?.role === "INSTRUCTOR" || user?.role === "ADMIN") && (
                  <Link
                    href="/instructor"
                    onClick={closeMobileMenu}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#4d4c48] hover:bg-[#e8e6dc] hover:text-[#141413] transition-colors"
                  >
                    {t("nav.instructor")}
                  </Link>
                )}
                <Link
                  href="/my-courses"
                  onClick={closeMobileMenu}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#4d4c48] hover:bg-[#e8e6dc] hover:text-[#141413] transition-colors"
                >
                  {t("nav.myLearning")}
                </Link>
                <div className="pt-2 border-t border-[#f0eee6]">
                  <button
                    onClick={() => { logout(); closeMobileMenu() }}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-[#4d4c48] hover:bg-[#f4e3e3] hover:text-[#b53333] transition-colors text-start"
                  >
                    {t("common.signOut")}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#f0eee6]">
                <Button variant="secondary" size="sm" asChild className="justify-start">
                  <Link href="/login" onClick={closeMobileMenu}>
                    {t("common.signIn")}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register" onClick={closeMobileMenu}>
                    {t("common.getStarted")}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
