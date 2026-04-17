"use client"

import Link from "next/link"
import { BookMarked, ArrowRight, Users, Award, Clock, ChevronRight, Star, Mail } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function Home() {
  const t = useTranslations()

  return (
    <div className="min-h-screen" style={{ background: "var(--islamic-warm-bg)" }}>
      {/* Navigation */}
      <Navbar />

      {/* ===== SECTION 1: HERO ===== */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Islamic pattern background */}
        <div className="absolute inset-0 pattern-islamic -z-10" />

        {/* Blur orbs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium ltr-flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              {t("home.badge")}
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                {t("home.heroTitle1")}
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                {t("home.heroTitle2")}
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t("home.heroSubtitle")}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  {t("common.startLearning")}
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                >
                  {t("nav.publicCourses")}
                  <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-8 pt-8 ltr-flex">
              <div className="flex -space-x-3 ltr-flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md"
                  />
                ))}
              </div>
              <div className="text-start">
                <div className="font-semibold text-slate-900">{t("home.socialProof.count")}</div>
                <div className="text-sm text-slate-500">{t("home.socialProof.label")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: STATS BAR ===== */}
      <section
        className="py-14"
        style={{ background: "linear-gradient(135deg, #065f46 0%, #064e3b 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {/* Students */}
            <div className="space-y-1">
              <div className="text-4xl font-bold text-white">{t("home.stats.studentsCount")}</div>
              <div className="text-sm font-medium text-emerald-200">{t("home.stats.activeStudents")}</div>
            </div>
            {/* Courses */}
            <div className="space-y-1">
              <div className="text-4xl font-bold text-white">{t("home.stats.coursesCount")}</div>
              <div className="text-sm font-medium text-emerald-200">{t("home.stats.courses")}</div>
            </div>
            {/* Success Rate */}
            <div className="space-y-1">
              <div className="text-4xl font-bold text-amber-400">{t("home.stats.successRateValue")}</div>
              <div className="text-sm font-medium text-emerald-200">{t("home.stats.successRate")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: FEATURES ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {t("home.features.title")}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t("home.features.description")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 — Expert Instructors (emerald) */}
            <div className="group relative p-8 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-emerald-200/60 transition-all duration-300">
              <div className="inline-flex p-3 rounded-xl bg-emerald-100 text-emerald-600 mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {t("home.features.expertInstructors.title")}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {t("home.features.expertInstructors.description")}
              </p>
              <div className="mt-5 flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all ltr-flex">
                {t("common.learnMore")}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
              </div>
            </div>

            {/* Card 2 — Certified Courses (amber/gold) */}
            <div className="group relative p-8 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-amber-200/60 transition-all duration-300">
              <div className="inline-flex p-3 rounded-xl bg-amber-100 text-amber-600 mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {t("home.features.certifiedCourses.title")}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {t("home.features.certifiedCourses.description")}
              </p>
              <div className="mt-5 flex items-center gap-1 text-sm font-medium text-amber-600 group-hover:gap-2 transition-all ltr-flex">
                {t("common.learnMore")}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
              </div>
            </div>

            {/* Card 3 — Learn at Your Pace (emerald) */}
            <div className="group relative p-8 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-emerald-200/60 transition-all duration-300">
              <div className="inline-flex p-3 rounded-xl bg-emerald-100 text-emerald-600 mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {t("home.features.learnAtYourPace.title")}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {t("home.features.learnAtYourPace.description")}
              </p>
              <div className="mt-5 flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all ltr-flex">
                {t("common.learnMore")}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: CTA ===== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-3xl p-12 md:p-16 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #047857 0%, #065f46 100%)" }}
          >
            {/* Islamic pattern overlay */}
            <div className="absolute inset-0 pattern-islamic opacity-30" />

            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              {/* Amber badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-sm font-medium mb-6 ltr-flex">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {t("home.badge")}
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {t("home.cta.title")}
              </h2>
              <p className="text-lg text-white/85 mb-8">
                {t("home.cta.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-slate-100 shadow-lg hover:shadow-xl"
                  >
                    {t("common.createFreeAccount")}
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  >
                    {t("common.signIn")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          {/* 4-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Column 1 — Brand */}
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-2 ltr-flex">
                <div className="p-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg">
                  <BookMarked className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-100">{t("nav.brand")}</span>
              </Link>
              <p className="text-sm leading-relaxed">{t("footer.tagline")}</p>
              {/* Gold accent underline */}
              <div className="w-12 h-0.5 bg-amber-500 rounded-full" />
            </div>

            {/* Column 2 — Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                {t("footer.quickLinks")}
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/" className="hover:text-emerald-400 transition-colors">
                    {t("footer.linkHome")}
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="hover:text-emerald-400 transition-colors">
                    {t("footer.linkCourses")}
                  </Link>
                </li>
                <li>
                  <Link href="/instructors" className="hover:text-emerald-400 transition-colors">
                    {t("nav.instructors") || "Instructors"}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-emerald-400 transition-colors">
                    {t("footer.linkAbout")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3 — Platform */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                {t("footer.platform")}
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/login" className="hover:text-emerald-400 transition-colors">
                    {t("footer.linkLogin")}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-emerald-400 transition-colors">
                    {t("footer.linkRegister")}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                    {t("footer.linkDashboard")}
                  </Link>
                </li>
                <li>
                  <Link href="/my-courses" className="hover:text-emerald-400 transition-colors">
                    {t("footer.linkMyCourses")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4 — Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                {t("footer.contact")}
              </h4>
              <a
                href={`mailto:${t("footer.email")}`}
                className="inline-flex items-center gap-2 text-sm hover:text-emerald-400 transition-colors ltr-flex"
              >
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("footer.email")}
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
            <p>
              © {new Date().getFullYear()} {t("nav.brand")}. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
