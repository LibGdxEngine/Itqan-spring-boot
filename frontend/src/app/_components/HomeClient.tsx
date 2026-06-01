"use client"

import Link from "next/link"
import { ArrowRight, Play, Star, Clock, Mail, ChevronRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
  type Variants,
} from "framer-motion"
import { useEffect, useRef, useState } from "react"
import type {
  LandingCourse,
  LandingPageData,
  LandingTeacher,
} from "@/lib/landingPage"

const EASE = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

interface HomeClientProps {
  data: LandingPageData | null
}

export default function HomeClient({ data }: HomeClientProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === "ar"

  const heroVideoUrl = data?.hero.videoUrl ?? null
  const heroTitle = (isAr ? data?.hero.titleAr : data?.hero.titleEn) ?? t("home.hero.featuredTitle")
  const heroTeacher = (isAr ? data?.hero.teacherNameAr : data?.hero.teacherNameEn) ?? t("home.hero.featuredTeacher")
  const heroDuration = (isAr ? data?.hero.durationLabelAr : data?.hero.durationLabelEn) ?? t("home.hero.featuredDuration")

  const stats = data?.stats
  const specializations = data?.specializations ?? []
  const featuredCourses = data?.featuredCourses ?? []
  const featuredInstructors = data?.featuredInstructors ?? []

  return (
    <div className="min-h-screen bg-[#f5f4ed] text-[#141413]">
      <Navbar />

      {/* ===== 1. HERO ===== */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 pattern-islamic -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Text column */}
            <motion.div
              className="space-y-8"
              initial="hidden"
              animate="visible"
              variants={staggerParent}
            >
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 text-xs tracking-[0.12px] uppercase text-[#87867f]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c96442] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c96442]" />
                </span>
                {t("home.badge")}
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="text-display font-serif-ar text-[#141413]"
                style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
              >
                {t("home.heroTitle1")} {t("home.heroTitle2")}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-[20px] leading-[1.6] text-[#5e5d59] max-w-xl"
              >
                {t("home.heroSubtitle")}
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-start gap-3 ltr-flex"
              >
                <Link href="/register">
                  <Button size="lg" className="text-base px-7">
                    {t("common.startLearning")}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="secondary" className="text-base px-7">
                    {t("nav.publicCourses")}
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Featured video card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
            >
              {/* Ambient warm glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-10 -z-10 opacity-25 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, #d97757 0%, transparent 60%)",
                }}
              />
              <div className="bg-[#faf9f5] border border-[#f0eee6] rounded-[32px] p-5 shadow-whisper">
                <div className="relative aspect-video rounded-[20px] overflow-hidden bg-[#30302e]">
                  {heroVideoUrl ? (
                    heroVideoUrl.includes("youtube.com/embed") || heroVideoUrl.includes("youtu.be") ? (
                      <iframe
                        src={heroVideoUrl}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : (
                      <video
                        src={heroVideoUrl}
                        controls
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <>
                      <div className="absolute inset-0 pattern-islamic opacity-40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          aria-label="Play featured lecture"
                          className="w-16 h-16 rounded-full bg-[#c96442] text-[#faf9f5] flex items-center justify-center shadow-[0_0_0_6px_rgba(250,249,245,0.15)] hover:bg-[#b55836] transition-colors"
                        >
                          <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                        </button>
                      </div>
                    </>
                  )}
                  {heroDuration ? (
                    <div className="absolute bottom-3 left-3 bg-[#141413]/80 text-[#faf9f5] text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 ltr-flex">
                      <Clock className="w-3 h-3" />
                      {heroDuration}
                    </div>
                  ) : null}
                </div>
                <div className="pt-5 pb-1 px-1 space-y-1.5">
                  <span className="text-xs tracking-[0.12px] uppercase text-[#87867f]">
                    {t("home.hero.featuredCaption")}
                  </span>
                  <h3
                    className="text-[22px] leading-tight text-[#141413]"
                    style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                  >
                    {heroTitle}
                  </h3>
                  <p className="text-sm text-[#5e5d59]">{heroTeacher}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 2. STATS BAR (dark chapter break) ===== */}
      <section className="bg-[#141413] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            <StatItem value={stats?.courses ?? 0} label={t("home.stats.courses")} locale={locale} />
            <StatItem value={stats?.teachers ?? 0} label={t("home.stats.teachers")} locale={locale} />
            <StatItem value={stats?.students ?? 0} label={t("home.stats.activeStudents")} locale={locale} />
            <StatItem value={stats?.specializations ?? 0} label={t("home.stats.specializations")} locale={locale} />
          </div>
        </div>
      </section>

      {/* ===== 3. SPECIALIZATION PILLS ===== */}
      <section aria-labelledby="categories-heading" className="py-20 bg-[#f5f4ed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10 space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={staggerParent}
          >
            <motion.h2
              variants={fadeUp}
              id="categories-heading"
              className="text-subhead-lg text-[#141413]"
              style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
            >
              {t("home.categories.title")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#5e5d59] text-[17px] leading-[1.6]">
              {t("home.categories.subtitle")}
            </motion.p>
          </motion.div>
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerParent}
          >
            <motion.button
              variants={fadeUp}
              className="px-5 py-2.5 rounded-full bg-[#c96442] text-[#faf9f5] text-sm font-medium shadow-[0_0_0_1px_#c96442] hover:bg-[#b55836] transition-colors"
            >
              {t("home.categories.all")}
            </motion.button>
            {specializations.map((s) => (
              <motion.button
                key={s.id}
                variants={fadeUp}
                className="px-5 py-2.5 rounded-full bg-[#e8e6dc] text-[#4d4c48] text-sm font-medium shadow-[0_0_0_1px_#d1cfc5] hover:shadow-[0_0_0_1px_#c2c0b6] hover:text-[#141413] transition-all"
              >
                {isAr ? s.nameAr : s.nameEn}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== 4. TEACHER CARDS ===== */}
      {featuredInstructors.length > 0 ? (
        <section aria-labelledby="teachers-heading" className="py-20 bg-[#faf9f5] border-y border-[#f0eee6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 ltr-flex"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={staggerParent}
            >
              <motion.div variants={fadeUp} className="space-y-3">
                <h2
                  id="teachers-heading"
                  className="text-subhead-lg text-[#141413]"
                  style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                >
                  {t("home.teachers.title")}
                </h2>
                <p className="text-[#5e5d59] text-[17px] leading-[1.6]">
                  {t("home.teachers.subtitle")}
                </p>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Link
                  href="/instructors"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c96442] hover:text-[#b55836] transition-colors ltr-flex"
                >
                  {t("home.teachers.viewAll")}
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerParent}
            >
              {featuredInstructors.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  locale={locale}
                  coursesLabel={t("home.teachers.coursesLabel")}
                  studentsLabel={t("home.teachers.studentsLabel")}
                />
              ))}
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* ===== 5. COURSE GRID ===== */}
      {featuredCourses.length > 0 ? (
        <section aria-labelledby="courses-heading" className="py-20 bg-[#f5f4ed]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 ltr-flex"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={staggerParent}
            >
              <motion.div variants={fadeUp} className="space-y-3">
                <h2
                  id="courses-heading"
                  className="text-subhead-lg text-[#141413]"
                  style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                >
                  {t("home.courses.title")}
                </h2>
                <p className="text-[#5e5d59] text-[17px] leading-[1.6]">
                  {t("home.courses.subtitle")}
                </p>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c96442] hover:text-[#b55836] transition-colors ltr-flex"
                >
                  {t("home.courses.browseAll")}
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerParent}
            >
              {featuredCourses.map((course) => (
                <FeaturedCourseCard
                  key={course.id}
                  course={course}
                  locale={locale}
                  freeLabel={t("home.courses.free")}
                  hoursLabel={t("common.duration")}
                />
              ))}
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* ===== 6. CTA (dark chapter) ===== */}
      <section aria-labelledby="cta-heading" className="py-24 bg-[#141413]">
        <motion.div
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerParent}
        >
          <motion.h2
            variants={fadeUp}
            id="cta-heading"
            className="text-section text-[#faf9f5]"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {t("home.cta.title")}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[18px] leading-[1.6] text-[#b0aea5] max-w-2xl mx-auto"
          >
            {t("home.cta.description")}
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-2 ltr-flex"
          >
            <Link href="/register">
              <Button size="lg" className="text-base px-7">
                {t("common.createFreeAccount")}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="white" className="text-base px-7">
                {t("home.cta.exploreCourses")}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== 7. FOOTER ===== */}
      <footer className="bg-[#141413] border-t border-[#30302e] text-[#b0aea5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-2 ltr-flex">
                <span
                  className="text-lg text-[#faf9f5]"
                  style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                >
                  {t("nav.brand")}
                </span>
              </Link>
              <p className="text-sm leading-relaxed">{t("footer.tagline")}</p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-[#faf9f5] uppercase tracking-[0.5px]">
                {t("footer.quickLinks")}
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/" className="hover:text-[#c96442] transition-colors">{t("footer.linkHome")}</Link></li>
                <li><Link href="/courses" className="hover:text-[#c96442] transition-colors">{t("footer.linkCourses")}</Link></li>
                <li><Link href="/instructors" className="hover:text-[#c96442] transition-colors">{t("nav.instructors") || "Instructors"}</Link></li>
                <li><Link href="/about" className="hover:text-[#c96442] transition-colors">{t("footer.linkAbout")}</Link></li>
              </ul>
            </div>

            {/* Platform */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-[#faf9f5] uppercase tracking-[0.5px]">
                {t("footer.platform")}
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/login" className="hover:text-[#c96442] transition-colors">{t("footer.linkLogin")}</Link></li>
                <li><Link href="/register" className="hover:text-[#c96442] transition-colors">{t("footer.linkRegister")}</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#c96442] transition-colors">{t("footer.linkDashboard")}</Link></li>
                <li><Link href="/my-courses" className="hover:text-[#c96442] transition-colors">{t("footer.linkMyCourses")}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-[#faf9f5] uppercase tracking-[0.5px]">
                {t("footer.contact")}
              </h4>
              <a
                href={`mailto:${t("footer.email")}`}
                className="inline-flex items-center gap-2 text-sm hover:text-[#c96442] transition-colors ltr-flex"
              >
                <Mail className="w-4 h-4 shrink-0" />
                {t("footer.email")}
              </a>
            </div>
          </div>

          <div className="border-t border-[#30302e] pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
            <p>
              © {new Date().getFullYear()} {t("nav.brand")}. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ===== Sub-components ===== */

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]

function toArabicDigits(n: number): string {
  return n
    .toString()
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? ARABIC_DIGITS[Number(c)] : c))
    .join("")
}

function formatStatNumber(n: number, locale: string): string {
  const rounded = Math.round(n)
  if (locale === "ar") return toArabicDigits(rounded)
  return rounded.toLocaleString("en-US")
}

function StatItem({
  value,
  label,
  locale,
}: {
  value: number
  label: string
  locale: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => formatStatNumber(v, locale))
  const [staticValue] = useState(formatStatNumber(value, locale))

  useEffect(() => {
    if (reduced || !inView) return
    const controls = animate(motionValue, value, { duration: 1.4, ease: EASE })
    return controls.stop
  }, [inView, reduced, value, motionValue])

  return (
    <div ref={ref} className="space-y-2">
      <div
        className="text-[44px] md:text-[52px] text-[#faf9f5] leading-none"
        style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      >
        {reduced ? (
          staticValue
        ) : (
          <motion.span>{display}</motion.span>
        )}
      </div>
      <div className="text-sm font-medium text-[#b0aea5]">{label}</div>
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2)
  return parts[0][0] + parts[parts.length - 1][0]
}

function TeacherCard({
  teacher,
  locale,
  coursesLabel,
  studentsLabel,
}: {
  teacher: LandingTeacher
  locale: string
  coursesLabel: string
  studentsLabel: string
}) {
  const courses = formatStatNumber(teacher.coursesCount, locale)
  const students = formatStatNumber(teacher.studentsCount, locale)
  return (
    <motion.div
      variants={fadeUp}
      className="group bg-[#faf9f5] border border-[#f0eee6] rounded-2xl p-6 hover-lift transition-smooth"
    >
      <div className="flex items-center gap-4 mb-4 ltr-flex">
        <div
          className="w-12 h-12 rounded-full bg-[#e8e6dc] flex items-center justify-center text-[#4d4c48] text-[15px] ring-0 ring-[#c96442]/30 transition-all duration-300 group-hover:ring-2 group-hover:rotate-3 uppercase"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {getInitials(teacher.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-[18px] text-[#141413] truncate"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {teacher.name}
          </h3>
          {teacher.specialty ? (
            <p className="text-sm text-[#87867f] truncate">{teacher.specialty}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-5 pt-4 border-t border-[#f0eee6] text-sm text-[#5e5d59] ltr-flex">
        <div>
          <span className="text-[#141413] font-medium">{courses}</span>{" "}
          <span>{coursesLabel}</span>
        </div>
        <div className="w-px h-4 bg-[#e8e6dc]" />
        <div>
          <span className="text-[#141413] font-medium">{students}</span>{" "}
          <span>{studentsLabel}</span>
        </div>
      </div>
    </motion.div>
  )
}

function FeaturedCourseCard({
  course,
  locale,
  freeLabel,
  hoursLabel,
}: {
  course: LandingCourse
  locale: string
  freeLabel: string
  hoursLabel: string
}) {
  const isFree = course.price === 0 || course.price == null
  const priceLabel = isFree
    ? freeLabel
    : locale === "ar"
      ? `${toArabicDigits(course.price!)} ر.س`
      : `${course.price} SAR`
  const duration = course.durationHours
    ? locale === "ar"
      ? `${toArabicDigits(course.durationHours)} ${hoursLabel}`
      : `${course.durationHours} ${hoursLabel}`
    : null

  return (
    <Link href={`/courses/${course.id}`}>
      <motion.div
        variants={fadeUp}
        className="group bg-[#faf9f5] border border-[#f0eee6] rounded-2xl overflow-hidden hover-lift transition-smooth flex flex-col h-full"
      >
        <div className="relative aspect-video bg-[#30302e] overflow-hidden">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 pattern-islamic opacity-40 transition-transform duration-500 ease-out group-hover:scale-105" />
          )}
          {course.category ? (
            <div className="absolute top-3 left-3 bg-[#faf9f5]/95 text-[#4d4c48] text-xs font-medium px-2.5 py-1 rounded-md">
              {course.category}
            </div>
          ) : null}
          {duration ? (
            <div className="absolute bottom-3 left-3 bg-[#141413]/80 text-[#faf9f5] text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 ltr-flex">
              <Clock className="w-3 h-3" />
              {duration}
            </div>
          ) : null}
        </div>
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3
            className="text-[18px] leading-snug text-[#141413]"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {course.title}
          </h3>
          <p className="text-sm text-[#87867f]">{course.instructor}</p>
          <div className="flex items-center justify-between pt-2 mt-auto border-t border-[#f0eee6] ltr-flex">
            <div className="flex items-center gap-1 text-sm text-[#4d4c48] ltr-flex">
              <Star className="w-4 h-4 text-[#c96442]" fill="currentColor" />
              <span className="font-medium">{course.level ?? ""}</span>
            </div>
            <div className="text-sm">
              <span className={isFree ? "font-medium text-[#c96442]" : "font-medium text-[#141413]"}>
                {priceLabel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
