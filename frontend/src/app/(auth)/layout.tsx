"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"
import { useTranslations } from "next-intl"
import { LanguageSwitcher } from "@/components/ui/language-switcher"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations()

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background - Fresh teal/cyan */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/15 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-cyan-300/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-teal-300/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group ltr-flex">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-colors">
              <BookOpen className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{t("nav.brand")}</span>
          </Link>
          
          {/* Main content */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              {t("auth.branding.tagline")}
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              {t("auth.branding.description")}
            </p>
            
            {/* Stats */}
            <div className="flex gap-8 pt-4 ltr-flex">
              <div>
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-white/70">{t("home.stats.activeStudents")}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-white/70">{t("home.stats.courses")}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-white/70">{t("home.stats.successRate")}</div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} {t("nav.brand")}. {t("common.allRightsReserved")}
          </div>
        </div>
      </div>
      
      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between ltr-flex">
            <Link href="/" className="flex items-center gap-2 ltr-flex">
              <div className="p-2 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                {t("nav.brand")}
              </span>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
        
        {/* Desktop language switcher */}
        <div className="hidden lg:flex justify-end p-6">
          <LanguageSwitcher />
        </div>
        
        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md animate-fade-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
