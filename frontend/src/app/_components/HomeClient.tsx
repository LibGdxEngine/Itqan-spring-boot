"use client"

import Link from "next/link"
import { ArrowRight, Play, Star, Clock, ChevronRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { SiteFooter } from "@/components/SiteFooter"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { getYouTubeVideoId } from "@/lib/videoSource"
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { ArticleCard } from "@/components/articles/ArticleCard"
import type {
  LandingCourse,
  LandingPageData,
  LandingTeacher,
} from "@/lib/landingPage"
import { EASE, fadeUp, staggerParent } from "@/lib/motion"




interface HomeClientProps {
  data: LandingPageData | null
}

export default function HomeClient({ data }: HomeClientProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === "ar"

  const heroVideoUrl = data?.hero.videoUrl ?? null
  const heroYouTubeId = getYouTubeVideoId(heroVideoUrl)
  const heroTitle = (isAr ? data?.hero.titleAr : data?.hero.titleEn) ?? t("home.hero.featuredTitle")
  const heroTeacher = (isAr ? data?.hero.teacherNameAr : data?.hero.teacherNameEn) ?? t("home.hero.featuredTeacher")
  const heroDuration = (isAr ? data?.hero.durationLabelAr : data?.hero.durationLabelEn) ?? t("home.hero.featuredDuration")

  const stats = data?.stats
  const specializations = data?.specializations ?? []
  const featuredCourses = data?.featuredCourses ?? []
  const featuredInstructors = data?.featuredInstructors ?? []
  const featuredArticles = data?.featuredArticles ?? []

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Navbar />

      {/* ===== 1. HERO ===== */}
      <section id="main-content" className="relative pt-28 pb-20 overflow-hidden">
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
                className="inline-flex items-center gap-2 text-xs tracking-[0.12px] uppercase text-ink-3"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                {t("home.badge")}
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="text-display font-serif-ar text-ink"
                style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
              >
                {t("home.heroTitle1")} {t("home.heroTitle2")}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-[20px] leading-[1.6] text-ink-2 max-w-xl"
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
              <div className="bg-surface border border-line rounded-[32px] p-5 shadow-whisper">
                <div className="relative aspect-video rounded-[20px] overflow-hidden bg-night-2">
                  {heroVideoUrl ? (
                    heroYouTubeId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${heroYouTubeId}`}
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
                          aria-label={t("home.playFeatured")}
                          className="w-16 h-16 rounded-full bg-brand text-on-night flex items-center justify-center shadow-[0_0_0_6px_rgba(250,249,245,0.15)] hover:bg-brand-hover transition-colors"
                        >
                          <Play className="w-6 h-6 ms-0.5" fill="currentColor" />
                        </button>
                      </div>
                    </>
                  )}
                  {heroDuration ? (
                    <div className="absolute bottom-3 start-3 bg-night/80 text-on-night text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 ltr-flex">
                      <Clock className="w-3 h-3" />
                      {heroDuration}
                    </div>
                  ) : null}
                </div>
                <div className="pt-5 pb-1 px-1 space-y-1.5">
                  <span className="text-xs tracking-[0.12px] uppercase text-ink-3">
                    {t("home.hero.featuredCaption")}
                  </span>
                  <h3
                    className="text-[22px] leading-tight text-ink"
                    style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                  >
                    {heroTitle}
                  </h3>
                  <p className="text-sm text-ink-2">{heroTeacher}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 2. STATS BAR (dark chapter break) ===== */}
      <section className="bg-night py-16">
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
      <section aria-labelledby="categories-heading" className="py-20 bg-canvas">
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
              className="text-subhead-lg text-ink"
              style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
            >
              {t("home.categories.title")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-ink-2 text-[17px] leading-[1.6]">
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
            <motion.div variants={fadeUp}>
              <Link
                href="/courses"
                className="inline-block px-5 py-2.5 rounded-full bg-brand text-on-night text-sm font-medium shadow-[0_0_0_1px_var(--color-brand)] hover:bg-brand-hover transition-colors"
              >
                {t("home.categories.all")}
              </Link>
            </motion.div>
            {specializations.map((s) => (
              <motion.div key={s.id} variants={fadeUp}>
                <Link
                  href={`/courses?category=${encodeURIComponent(s.slug)}`}
                  className="inline-block px-5 py-2.5 rounded-full bg-sand text-ink-button text-sm font-medium shadow-[0_0_0_1px_var(--color-ring-warm)] hover:shadow-[0_0_0_1px_var(--color-ring-warm)] hover:text-ink transition-all"
                >
                  {isAr ? s.nameAr : s.nameEn}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== 4. TEACHER CARDS ===== */}
      {featuredInstructors.length > 0 ? (
        <section aria-labelledby="teachers-heading" className="py-20 bg-surface border-y border-line">
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
                  className="text-subhead-lg text-ink"
                  style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                >
                  {t("home.teachers.title")}
                </h2>
                <p className="text-ink-2 text-[17px] leading-[1.6]">
                  {t("home.teachers.subtitle")}
                </p>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Link
                  href="/instructors"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors ltr-flex"
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
        <section aria-labelledby="courses-heading" className="py-20 bg-canvas">
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
                  className="text-subhead-lg text-ink"
                  style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                >
                  {t("home.courses.title")}
                </h2>
                <p className="text-ink-2 text-[17px] leading-[1.6]">
                  {t("home.courses.subtitle")}
                </p>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors ltr-flex"
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

      {/* ===== 5b. FEATURED ARTICLES ===== */}
      {featuredArticles.length > 0 ? (
        <section aria-labelledby="articles-heading" className="py-20 bg-surface border-y border-line">
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
                  id="articles-heading"
                  className="text-subhead-lg text-ink"
                  style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                >
                  {t("articles.featuredTitle")}
                </h2>
                <p className="text-ink-2 text-[17px] leading-[1.6]">
                  {t("articles.featuredSubtitle")}
                </p>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Link
                  href="/articles"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors ltr-flex"
                >
                  {t("articles.viewAll")}
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
              {featuredArticles.map((article) => (
                <motion.div key={article.id} variants={fadeUp} className="h-full">
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* ===== 6. CTA (dark chapter) ===== */}
      <section aria-labelledby="cta-heading" className="py-24 bg-night">
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
            className="text-section text-on-night"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {t("home.cta.title")}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[18px] leading-[1.6] text-on-night-2 max-w-2xl mx-auto"
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
      <SiteFooter />
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
        className="text-[44px] md:text-[52px] text-on-night leading-none"
        style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      >
        {reduced ? (
          staticValue
        ) : (
          <motion.span>{display}</motion.span>
        )}
      </div>
      <div className="text-sm font-medium text-on-night-2">{label}</div>
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
      className="group bg-surface border border-line rounded-2xl p-6 hover-lift transition-smooth"
    >
      <div className="flex items-center gap-4 mb-4 ltr-flex">
        <div
          className="w-12 h-12 rounded-full bg-sand flex items-center justify-center text-ink-button text-[15px] ring-0 ring-brand/30 transition-all duration-300 group-hover:ring-2 group-hover:rotate-3 uppercase"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {getInitials(teacher.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-[18px] text-ink truncate"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {teacher.name}
          </h3>
          {teacher.specialty ? (
            <p className="text-sm text-ink-3 truncate">{teacher.specialty}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-5 pt-4 border-t border-line text-sm text-ink-2 ltr-flex">
        <div>
          <span className="text-ink font-medium">{courses}</span>{" "}
          <span>{coursesLabel}</span>
        </div>
        <div className="w-px h-4 bg-sand" />
        <div>
          <span className="text-ink font-medium">{students}</span>{" "}
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
        className="group bg-surface border border-line rounded-2xl overflow-hidden hover-lift transition-smooth flex flex-col h-full"
      >
        <div className="relative aspect-video bg-night-2 overflow-hidden">
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
            <div className="absolute top-3 start-3 bg-surface/95 text-ink-button text-xs font-medium px-2.5 py-1 rounded-md">
              {course.category}
            </div>
          ) : null}
          {duration ? (
            <div className="absolute bottom-3 start-3 bg-night/80 text-on-night text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 ltr-flex">
              <Clock className="w-3 h-3" />
              {duration}
            </div>
          ) : null}
        </div>
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3
            className="text-[18px] leading-snug text-ink"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {course.title}
          </h3>
          <p className="text-sm text-ink-3">{course.instructor}</p>
          <div className="flex items-center justify-between pt-2 mt-auto border-t border-line ltr-flex">
            <div className="flex items-center gap-1 text-sm text-ink-button ltr-flex">
              <Star className="w-4 h-4 text-brand" fill="currentColor" />
              <span className="font-medium">{course.level ?? ""}</span>
            </div>
            <div className="text-sm">
              <span className={isFree ? "font-medium text-brand" : "font-medium text-ink"}>
                {priceLabel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
