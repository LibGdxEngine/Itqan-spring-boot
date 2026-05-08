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

const CATEGORY_KEYS = [
  "all",
  "tafsir",
  "hadith",
  "fiqh",
  "aqeedah",
  "seerah",
  "arabic",
  "tajweed",
  "usool",
] as const

type TeacherData = {
  initials: string
  name: string
  specialty: string
  courses: string
  students: string
}

const TEACHERS: TeacherData[] = [
  { initials: "عس", name: "الشيخ عبد الرحمن السديس", specialty: "التفسير وعلوم القرآن", courses: "١٢", students: "٢٤٠٠" },
  { initials: "مج", name: "د. محمد الجزائري", specialty: "الفقه وأصوله", courses: "٨", students: "١٦٥٠" },
  { initials: "فع", name: "د. فاطمة العتيبي", specialty: "اللغة العربية", courses: "١٥", students: "٣١٠٠" },
]

type CourseData = {
  title: string
  teacher: string
  category: string
  duration: string
  rating: string
  price: string
  badge?: "mostEnrolled" | "new"
  free?: boolean
}

const COURSES: CourseData[] = [
  { title: "أصول التفسير ومناهج المفسرين", teacher: "الشيخ عبد الرحمن السديس", category: "التفسير", duration: "٨ ساعات", rating: "٤٫٩", price: "١٤٩ ر.س", badge: "mostEnrolled" },
  { title: "فقه العبادات: الطهارة والصلاة", teacher: "د. محمد الجزائري", category: "الفقه", duration: "١٢ ساعة", rating: "٤٫٨", price: "", free: true },
  { title: "أحكام التجويد برواية حفص", teacher: "الشيخ ياسر الدوسري", category: "التجويد", duration: "٦ ساعات", rating: "٤٫٩", price: "٩٩ ر.س", badge: "new" },
  { title: "السيرة النبوية في العهد المكي", teacher: "د. راغب السرجاني", category: "السيرة", duration: "١٠ ساعات", rating: "٤٫٧", price: "١٢٩ ر.س" },
  { title: "شرح الأربعين النووية", teacher: "الشيخ صالح المغامسي", category: "الحديث", duration: "٧ ساعات", rating: "٤٫٨", price: "", free: true },
  { title: "العقيدة الواسطية", teacher: "د. عثمان الخميس", category: "العقيدة", duration: "٩ ساعات", rating: "٤٫٩", price: "١٣٩ ر.س" },
]

const EASE = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export default function HomeClient() {
  const t = useTranslations()
  const locale = useLocale()

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
                  <div className="absolute inset-0 pattern-islamic opacity-40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      aria-label="Play featured lecture"
                      className="w-16 h-16 rounded-full bg-[#c96442] text-[#faf9f5] flex items-center justify-center shadow-[0_0_0_6px_rgba(250,249,245,0.15)] hover:bg-[#b55836] transition-colors"
                    >
                      <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#141413]/80 text-[#faf9f5] text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 ltr-flex">
                    <Clock className="w-3 h-3" />
                    {t("home.hero.featuredDuration")}
                  </div>
                </div>
                <div className="pt-5 pb-1 px-1 space-y-1.5">
                  <span className="text-xs tracking-[0.12px] uppercase text-[#87867f]">
                    {t("home.hero.featuredCaption")}
                  </span>
                  <h3
                    className="text-[22px] leading-tight text-[#141413]"
                    style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                  >
                    {t("home.hero.featuredTitle")}
                  </h3>
                  <p className="text-sm text-[#5e5d59]">{t("home.hero.featuredTeacher")}</p>
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
            <StatItem rawValue={t("home.stats.coursesCount")} label={t("home.stats.courses")} locale={locale} />
            <StatItem rawValue={t("home.stats.teachersCount")} label={t("home.stats.teachers")} locale={locale} />
            <StatItem rawValue={t("home.stats.studentsCount")} label={t("home.stats.activeStudents")} locale={locale} />
            <StatItem rawValue={t("home.stats.specializationsCount")} label={t("home.stats.specializations")} locale={locale} />
          </div>
        </div>
      </section>

      {/* ===== 3. CATEGORY PILLS ===== */}
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
            {CATEGORY_KEYS.map((key, idx) => (
              <motion.button
                key={key}
                variants={fadeUp}
                className={
                  idx === 0
                    ? "px-5 py-2.5 rounded-full bg-[#c96442] text-[#faf9f5] text-sm font-medium shadow-[0_0_0_1px_#c96442] hover:bg-[#b55836] transition-colors"
                    : "px-5 py-2.5 rounded-full bg-[#e8e6dc] text-[#4d4c48] text-sm font-medium shadow-[0_0_0_1px_#d1cfc5] hover:shadow-[0_0_0_1px_#c2c0b6] hover:text-[#141413] transition-all"
                }
              >
                {t(`home.categories.${key}`)}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== 4. TEACHER CARDS ===== */}
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
            {TEACHERS.map((teacher) => (
              <TeacherCard
                key={teacher.name}
                teacher={teacher}
                coursesLabel={t("home.teachers.coursesLabel")}
                studentsLabel={t("home.teachers.studentsLabel")}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== 5. COURSE GRID ===== */}
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
            {COURSES.map((course) => (
              <CourseCard
                key={course.title}
                course={course}
                mostEnrolledLabel={t("home.courses.mostEnrolled")}
                newLabel={t("home.courses.new")}
                freeLabel={t("home.courses.free")}
              />
            ))}
          </motion.div>
        </div>
      </section>

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

function parseStatValue(raw: string): { number: number; prefix: string; suffix: string } {
  // Strip thousands separators and arabic digits, find leading numeric run.
  const normalized = raw
    .replace(/[٠-٩]/g, (c) => String(ARABIC_DIGITS.indexOf(c)))
    .replace(/[,٬،]/g, "")

  const match = normalized.match(/^(\D*)(\d+)(.*)$/)
  if (!match) return { number: 0, prefix: "", suffix: raw }
  const [, prefix, digits, suffix] = match
  return { number: parseInt(digits, 10), prefix, suffix }
}

function formatStatNumber(n: number, locale: string): string {
  const rounded = Math.round(n)
  if (locale === "ar") return toArabicDigits(rounded)
  return rounded.toLocaleString("en-US")
}

function StatItem({
  rawValue,
  label,
  locale,
}: {
  rawValue: string
  label: string
  locale: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const { number: target, prefix, suffix } = parseStatValue(rawValue)
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => `${prefix}${formatStatNumber(v, locale)}${suffix}`)
  const [staticValue] = useState(rawValue)

  useEffect(() => {
    if (reduced || !inView) return
    const controls = animate(motionValue, target, { duration: 1.4, ease: EASE })
    return controls.stop
  }, [inView, reduced, target, motionValue])

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

function TeacherCard({
  teacher,
  coursesLabel,
  studentsLabel,
}: {
  teacher: TeacherData
  coursesLabel: string
  studentsLabel: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group bg-[#faf9f5] border border-[#f0eee6] rounded-2xl p-6 hover-lift transition-smooth"
    >
      <div className="flex items-center gap-4 mb-4 ltr-flex">
        <div
          className="w-12 h-12 rounded-full bg-[#e8e6dc] flex items-center justify-center text-[#4d4c48] text-[15px] ring-0 ring-[#c96442]/30 transition-all duration-300 group-hover:ring-2 group-hover:rotate-3"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {teacher.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-[18px] text-[#141413] truncate"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {teacher.name}
          </h3>
          <p className="text-sm text-[#87867f] truncate">{teacher.specialty}</p>
        </div>
      </div>
      <div className="flex items-center gap-5 pt-4 border-t border-[#f0eee6] text-sm text-[#5e5d59] ltr-flex">
        <div>
          <span className="text-[#141413] font-medium">{teacher.courses}</span>{" "}
          <span>{coursesLabel}</span>
        </div>
        <div className="w-px h-4 bg-[#e8e6dc]" />
        <div>
          <span className="text-[#141413] font-medium">{teacher.students}</span>{" "}
          <span>{studentsLabel}</span>
        </div>
      </div>
    </motion.div>
  )
}

function CourseCard({
  course,
  mostEnrolledLabel,
  newLabel,
  freeLabel,
}: {
  course: CourseData
  mostEnrolledLabel: string
  newLabel: string
  freeLabel: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group bg-[#faf9f5] border border-[#f0eee6] rounded-2xl overflow-hidden hover-lift transition-smooth flex flex-col"
    >
      <div className="relative aspect-video bg-[#30302e] overflow-hidden">
        <div className="absolute inset-0 pattern-islamic opacity-40 transition-transform duration-500 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative flex">
            <span className="absolute inset-0 rounded-full bg-[#c96442] opacity-0 group-hover:opacity-60 group-hover:animate-ping" />
            <button
              aria-label={`Play ${course.title}`}
              className="relative w-12 h-12 rounded-full bg-[#c96442] text-[#faf9f5] flex items-center justify-center shadow-[0_0_0_5px_rgba(250,249,245,0.15)] hover:bg-[#b55836] transition-colors"
            >
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            </button>
          </span>
        </div>
        <div className="absolute top-3 left-3 bg-[#faf9f5]/95 text-[#4d4c48] text-xs font-medium px-2.5 py-1 rounded-md">
          {course.category}
        </div>
        <div className="absolute bottom-3 left-3 bg-[#141413]/80 text-[#faf9f5] text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 ltr-flex">
          <Clock className="w-3 h-3" />
          {course.duration}
        </div>
        {course.badge && (
          <div className="absolute top-3 right-3 bg-[#c96442] text-[#faf9f5] text-xs font-medium px-2.5 py-1 rounded-md">
            {course.badge === "mostEnrolled" ? mostEnrolledLabel : newLabel}
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col gap-3">
        <h3
          className="text-[18px] leading-snug text-[#141413]"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {course.title}
        </h3>
        <p className="text-sm text-[#87867f]">{course.teacher}</p>
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-[#f0eee6] ltr-flex">
          <div className="flex items-center gap-1 text-sm text-[#4d4c48] ltr-flex">
            <Star className="w-4 h-4 text-[#c96442]" fill="currentColor" />
            <span className="font-medium">{course.rating}</span>
          </div>
          <div className="text-sm">
            {course.free ? (
              <span className="font-medium text-[#c96442]">{freeLabel}</span>
            ) : (
              <span className="font-medium text-[#141413]">{course.price}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
