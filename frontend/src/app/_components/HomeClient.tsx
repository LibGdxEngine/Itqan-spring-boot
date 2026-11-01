"use client"

import Link from "next/link"
import {
  ArrowRight,
  Star,
  Clock,
  ChevronRight,
  UserRound,
  Route,
  ClipboardCheck,
  Award,
  Quote,
  type LucideIcon,
} from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { SiteFooter } from "@/components/SiteFooter"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { getYouTubeVideoId } from "@/lib/videoSource"
import { motion } from "framer-motion"
import { ArticleCard } from "@/components/articles/ArticleCard"
import type {
  LandingCourse,
  LandingPageData,
  LandingTeacher,
  LandingTestimonial,
} from "@/lib/landingPage"
import { EASE, fadeUp, staggerParent } from "@/lib/motion"
import { TEACHERS_SECTION_DEFAULTS } from "@/lib/landingDefaults"




interface HomeClientProps {
  data: LandingPageData | null
}

const FEATURES: { key: "oneTeacher" | "gradual" | "followUp" | "certificate"; Icon: LucideIcon }[] = [
  { key: "oneTeacher", Icon: UserRound },
  { key: "gradual", Icon: Route },
  { key: "followUp", Icon: ClipboardCheck },
  { key: "certificate", Icon: Award },
]

export default function HomeClient({ data }: HomeClientProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === "ar"

  const heroVideoUrl = data?.hero.videoUrl ?? null
  const heroYouTubeId = getYouTubeVideoId(heroVideoUrl)
  const heroTitle = (isAr ? data?.hero.titleAr : data?.hero.titleEn) ?? null
  const heroTeacher = (isAr ? data?.hero.teacherNameAr : data?.hero.teacherNameEn) ?? t("home.hero.featuredTeacher")
  const heroDuration = (isAr ? data?.hero.durationLabelAr : data?.hero.durationLabelEn) ?? null
  // Without a configured video the hero collapses to a single centered column (no placeholder card).
  const heroHasVideo = Boolean(heroVideoUrl)

  const featuredCourses = data?.featuredCourses ?? []
  const featuredInstructors = data?.featuredInstructors ?? []
  const featuredArticles = data?.featuredArticles ?? []
  const testimonials = data?.featuredTestimonials ?? []

  const teachersSection = data?.teachersSection ?? null
  const teachersDefaults = TEACHERS_SECTION_DEFAULTS[isAr ? "ar" : "en"]
  const teachersTitle =
    (isAr ? teachersSection?.titleAr : teachersSection?.titleEn) ||
    teachersSection?.titleAr ||
    teachersSection?.titleEn ||
    teachersDefaults.title
  const teachersSubtitle =
    (isAr ? teachersSection?.subtitleAr : teachersSection?.subtitleEn) ||
    teachersSection?.subtitleAr ||
    teachersSection?.subtitleEn ||
    teachersDefaults.subtitle

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Navbar />

      {/* ===== 1. HERO ===== */}
      <section id="main-content" className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 pattern-islamic -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={
              heroHasVideo
                ? "grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center"
                : "max-w-3xl mx-auto text-center"
            }
          >
            {/* Text column */}
            <motion.div
              className={heroHasVideo ? "space-y-8" : "space-y-8 flex flex-col items-center"}
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
                className={`text-[20px] leading-[1.6] text-ink-2 max-w-xl${heroHasVideo ? "" : " mx-auto"}`}
              >
                {t("home.heroSubtitle")}
              </motion.p>

              <motion.div
                variants={fadeUp}
                className={`flex flex-col sm:flex-row gap-3 ltr-flex ${heroHasVideo ? "items-start" : "items-center justify-center"}`}
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

            {/* Featured video card (only when an admin configured a video) */}
            {heroVideoUrl ? (
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
                    {heroYouTubeId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${heroYouTubeId}`}
                        title={heroTitle ?? t("home.hero.featuredCaption")}
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
                    )}
                    {heroDuration ? (
                      <div className="absolute bottom-3 start-3 bg-night/80 text-on-night text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 ltr-flex">
                        <Clock className="w-3 h-3" />
                        {heroDuration}
                      </div>
                    ) : null}
                  </div>
                  {heroTitle || heroTeacher ? (
                    <div className="pt-5 pb-1 px-1 space-y-1.5">
                      <span className="text-xs tracking-[0.12px] uppercase text-ink-3">
                        {t("home.hero.featuredCaption")}
                      </span>
                      {heroTitle ? (
                        <h3
                          className="text-[22px] leading-tight text-ink"
                          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                        >
                          {heroTitle}
                        </h3>
                      ) : null}
                      {heroTeacher ? <p className="text-sm text-ink-2">{heroTeacher}</p> : null}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ===== 2. SHEIKHS & SCHOLARS (dark chapter break; admin-curated) ===== */}
      {featuredInstructors.length > 0 ? (
        <section aria-labelledby="teachers-heading" className="relative bg-night py-20 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent"
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12 space-y-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={staggerParent}
            >
              <motion.p variants={fadeUp} className="text-xs font-medium tracking-[0.2em] uppercase text-brand">
                {t("home.teachers.eyebrow")}
              </motion.p>
              <motion.h2
                variants={fadeUp}
                id="teachers-heading"
                className="text-section text-on-night"
                style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
              >
                {teachersTitle}
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-[17px] leading-[1.7] text-on-night-2 max-w-2xl mx-auto"
              >
                {teachersSubtitle}
              </motion.p>
            </motion.div>

            <motion.div
              className={
                featuredInstructors.length === 1
                  ? "max-w-4xl mx-auto"
                  : featuredInstructors.length === 2
                    ? "grid md:grid-cols-2 gap-6 max-w-5xl mx-auto"
                    : "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              }
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
                  wide={featuredInstructors.length === 1}
                />
              ))}
            </motion.div>

            {featuredInstructors.length > 3 ? (
              <motion.div
                className="mt-10 text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={staggerParent}
              >
                <motion.div variants={fadeUp}>
                  <Link
                    href="/instructors"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-on-night-soft hover:text-on-night transition-colors ltr-flex"
                  >
                    {t("home.teachers.viewAll")}
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </motion.div>
              </motion.div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ===== 3. WHY LEARN HERE (single-teacher method) ===== */}
      <section aria-labelledby="features-heading" className="py-20 bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={staggerParent}
          >
            <motion.h2
              variants={fadeUp}
              id="features-heading"
              className="text-subhead-lg text-ink"
              style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
            >
              {t("home.features.title")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-ink-2 text-[17px] leading-[1.6] max-w-2xl mx-auto">
              {t("home.features.description")}
            </motion.p>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerParent}
          >
            {FEATURES.map(({ key, Icon }) => (
              <FeatureCard
                key={key}
                Icon={Icon}
                title={t(`home.features.${key}.title`)}
                description={t(`home.features.${key}.description`)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== 4. COURSE GRID ===== */}
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

      {/* ===== 5a. TESTIMONIALS (real course reviews) ===== */}
      {testimonials.length > 0 ? (
        <section aria-labelledby="testimonials-heading" className="py-20 bg-surface border-y border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12 space-y-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={staggerParent}
            >
              <motion.h2
                variants={fadeUp}
                id="testimonials-heading"
                className="text-subhead-lg text-ink"
                style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
              >
                {t("home.testimonials.title")}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-ink-2 text-[17px] leading-[1.6]">
                {t("home.testimonials.subtitle")}
              </motion.p>
            </motion.div>
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerParent}
            >
              {testimonials.map((item) => (
                <TestimonialCard
                  key={item.id}
                  item={item}
                  courseLabel={t("home.testimonials.courseLabel")}
                  ratingLabel={t("reviews.stars", { count: item.rating })}
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2)
  return parts[0][0] + parts[parts.length - 1][0]
}

function FeatureCard({
  Icon,
  title,
  description,
}: {
  Icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group bg-surface border border-line rounded-2xl p-6 hover-lift transition-smooth h-full"
    >
      <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center text-ink-button mb-5 ring-0 ring-brand/30 transition-all duration-300 group-hover:ring-2 group-hover:rotate-3">
        <Icon className="w-5 h-5" aria-hidden />
      </div>
      <h3
        className="text-[18px] text-ink mb-2"
        style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      >
        {title}
      </h3>
      <p className="text-sm leading-[1.7] text-ink-2">{description}</p>
    </motion.div>
  )
}

function TeacherCard({
  teacher,
  locale,
  wide,
}: {
  teacher: LandingTeacher
  locale: string
  wide: boolean
}) {
  const isAr = locale === "ar"
  const title = (isAr ? teacher.titleAr : teacher.titleEn) || teacher.titleAr || teacher.titleEn || teacher.specialty
  const bio = (isAr ? teacher.bioAr : teacher.bioEn) || teacher.bioAr || teacher.bioEn
  const photoSize = wide ? "w-40 h-40 sm:w-48 sm:h-48" : "w-24 h-24"

  return (
    <motion.div
      variants={fadeUp}
      className={`group bg-surface border border-line rounded-2xl hover-lift transition-smooth h-full shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] ${
        wide ? "p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-start ltr-flex" : "p-6 flex flex-col"
      }`}
    >
      <div className={`shrink-0 ${wide ? "" : "mb-5"}`}>
        {teacher.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={teacher.photoUrl}
            alt={teacher.name}
            loading="lazy"
            className={`${photoSize} rounded-2xl object-cover ring-1 ring-line transition-transform duration-300 group-hover:scale-[1.02]`}
          />
        ) : (
          <div
            className={`${photoSize} rounded-2xl bg-sand flex items-center justify-center text-ink-button ${
              wide ? "text-4xl" : "text-2xl"
            } uppercase`}
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
            aria-hidden
          >
            {getInitials(teacher.name)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <h3
          className={`${wide ? "text-[28px]" : "text-[20px]"} leading-tight text-ink`}
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {teacher.name}
        </h3>
        {title ? <p className="mt-1.5 text-sm font-medium text-brand">{title}</p> : null}
        {bio ? (
          <p className={`mt-4 text-[15px] leading-[1.75] text-ink-2 whitespace-pre-line ${wide ? "" : "line-clamp-6"}`}>
            {bio}
          </p>
        ) : null}
      </div>
    </motion.div>
  )
}

function TestimonialCard({
  item,
  courseLabel,
  ratingLabel,
}: {
  item: LandingTestimonial
  courseLabel: string
  ratingLabel: string
}) {
  return (
    <motion.figure
      variants={fadeUp}
      className="bg-canvas border border-line rounded-2xl p-6 flex flex-col h-full hover-lift transition-smooth"
    >
      <div className="flex items-center justify-between mb-4 ltr-flex">
        <div className="flex items-center gap-0.5" role="img" aria-label={ratingLabel}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < item.rating ? "text-brand" : "text-line"}`}
              fill="currentColor"
              aria-hidden
            />
          ))}
        </div>
        <Quote className="w-5 h-5 text-ink-3 opacity-60" aria-hidden />
      </div>
      <blockquote className="text-[15px] leading-[1.75] text-ink-2 flex-1 line-clamp-6">{item.comment}</blockquote>
      <figcaption className="mt-5 pt-4 border-t border-line text-sm">
        <div className="text-ink font-medium">{item.authorName}</div>
        <Link
          href={`/courses/${item.courseId}`}
          className="text-ink-3 hover:text-brand transition-colors line-clamp-1"
        >
          {courseLabel} {item.courseTitle}
        </Link>
      </figcaption>
    </motion.figure>
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
