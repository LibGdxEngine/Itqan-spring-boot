"use client"

import { useRef, type MouseEvent } from "react"
import Link from "next/link"
import {
  ScrollText,
  BookOpenCheck,
  SpellCheck,
  BookOpen,
  Languages,
  Check,
  MessageCircle,
  Mail,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
  type Variants,
} from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { useSiteSettings, whatsappLink } from "@/lib/use-site-currency"
import { SiteFooter } from "@/components/SiteFooter"
import { Button } from "@/components/ui/button"
import {
  CONTACT,
  SERVICES,
  SERVICE_GROUPS,
  PROCESS_STEPS,
  type Service,
  type ServiceIcon,
} from "./servicesContent"
import { EASE, fadeUp, staggerParent } from "@/lib/motion"

/* ===== Animation variants ===== */



const cardReveal: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE } },
}

const wordContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const wordReveal: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
}

const checkItem: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
}

const popIn: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 14 } },
}

/* ===== Helpers ===== */
const ICONS: Record<ServiceIcon, LucideIcon> = {
  ScrollText,
  BookOpenCheck,
  SpellCheck,
  BookOpen,
  Languages,
}

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
function toArabicDigits(n: number): string {
  return n
    .toString()
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? ARABIC_DIGITS[Number(c)] : c))
    .join("")
}

/** Contact details from the admin site settings, falling back to the built-in defaults. */
function useContact() {
  const settings = useSiteSettings()
  const email = settings.contactEmail || CONTACT.email
  return {
    email,
    // Without a WhatsApp number configured, requests go by email instead.
    whatsappHref: (message: string) =>
      whatsappLink(settings.whatsappNumber, message) ??
      `mailto:${email}?body=${encodeURIComponent(message)}`,
  }
}

function serviceRequestMessage(title: string): string {
  return `السلام عليكم، أرغب في الاستفسار عن خدمة: ${title}.`
}

const GENERAL_MESSAGE = "السلام عليكم، أرغب في الاستفسار عن خدمات الأكاديمية."

export default function ServicesClient() {
  const { email, whatsappHref } = useContact()
  const reduced = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const patternY = useTransform(heroProgress, [0, 1], [0, 80])

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <ScrollProgress />
      <Navbar />

      {/* ===== 1. HERO ===== */}
      <section ref={heroRef} className="relative pt-28 pb-24 overflow-hidden">
        {/* parallax islamic pattern */}
        <motion.div
          aria-hidden
          style={{ y: reduced ? 0 : patternY }}
          className="absolute inset-0 -z-10 pattern-islamic"
        />
        {/* drifting warm aura */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[38%] -z-[5] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(217,119,87,0.30) 0%, transparent 65%)" }}
          animate={reduced ? undefined : { scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={reduced ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* floating star accents */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-28 end-[10%] hidden text-brand/25 sm:block"
          animate={reduced ? undefined : { y: [0, -12, 0], rotate: [0, 12, 0] }}
          transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-8 w-8" />
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-28 start-[12%] hidden text-coral/25 sm:block"
          animate={reduced ? undefined : { y: [0, 10, 0], rotate: [0, -10, 0] }}
          transition={reduced ? undefined : { duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-3xl mx-auto text-center space-y-7"
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
              خدمات إتقان
            </motion.span>

            <motion.h1
              variants={wordContainer}
              className="text-display text-ink"
              style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
            >
              {"خدمات الأكاديمية".split(" ").map((word, i, arr) => (
                <motion.span key={i} variants={wordReveal} className="inline-block">
                  {word}
                  {i < arr.length - 1 ? " " : ""}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-[20px] leading-[1.6] text-ink-2 max-w-2xl mx-auto"
            >
              خدمات علمية وتحريرية وتعليمية يقدّمها فريق إتقان بإتقان وأمانة: من تحقيق المخطوطات
              ومراجعة الكتب والرسائل والتدقيق اللغوي، إلى تعليم القرآن الكريم والعربية لغير الناطقين بها.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 ltr-flex"
            >
              <Button size="lg" asChild className="relative overflow-hidden btn-shimmer text-base px-7">
                <a href={whatsappHref(GENERAL_MESSAGE)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                  تواصل معنا
                </a>
              </Button>
              <Button size="lg" variant="secondary" asChild className="text-base px-7">
                <Link href="/courses">تصفح الدورات</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* scroll cue */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-ink-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <span className="text-[11px] tracking-wide">اكتشف خدماتنا</span>
          <motion.span
            animate={reduced ? undefined : { y: [0, 6, 0] }}
            transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </motion.div>
      </section>

      {/* ===== 2. GROUPED OVERVIEW GRID ===== */}
      <section className="py-20 bg-surface border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {SERVICE_GROUPS.map((group) => {
            const items = SERVICES.filter((s) => s.group === group.key)
            return (
              <div key={group.key} className="space-y-8">
                <motion.h2
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.6 }}
                  variants={fadeUp}
                  className="text-subhead-lg text-ink"
                  style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
                >
                  {group.label}
                </motion.h2>
                <motion.div
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={staggerParent}
                >
                  {items.map((service) => (
                    <TiltSpotlightCard key={service.slug} service={service} />
                  ))}
                </motion.div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ===== 3. DETAIL ROWS ===== */}
      {SERVICES.map((service, index) => (
        <ServiceDetailRow key={service.slug} service={service} index={index} />
      ))}

      {/* ===== 4. HOW WE WORK ===== */}
      <section className="py-20 bg-surface border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-14 space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={staggerParent}
          >
            <motion.h2
              variants={fadeUp}
              className="text-subhead-lg text-ink"
              style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
            >
              كيف نعمل
            </motion.h2>
            <motion.p variants={fadeUp} className="text-ink-2 text-[17px] leading-[1.6]">
              خطوات واضحة من أول تواصل حتى تسليم العمل.
            </motion.p>
          </motion.div>

          <div className="relative">
            {/* connector track (lg only) */}
            <div
              aria-hidden
              className="hidden lg:block absolute top-6 start-[12.5%] end-[12.5%] h-[2px] bg-sand"
            />
            <motion.div
              aria-hidden
              className="hidden lg:block absolute top-6 start-[12.5%] end-[12.5%] h-[2px] origin-right bg-gradient-to-l from-brand to-coral"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1, ease: EASE }}
            />
            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerParent}
            >
              {PROCESS_STEPS.map((step, i) => (
                <StepItem key={i} number={i + 1} text={step} />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 5. CTA (dark chapter) ===== */}
      <section className="relative overflow-hidden py-24 bg-night">
        {/* aurora */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-1/3 end-[15%] h-[480px] w-[480px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(201,100,66,0.35), transparent 60%)" }}
          animate={reduced ? undefined : { x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={reduced ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-1/3 start-[15%] h-[440px] w-[440px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(217,119,87,0.28), transparent 60%)" }}
          animate={reduced ? undefined : { x: [0, -30, 0], y: [0, -20, 0], scale: [1.1, 1, 1.1] }}
          transition={reduced ? undefined : { duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerParent}
        >
          <motion.h2
            variants={fadeUp}
            className="text-section text-on-night"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            هل تحتاج إلى إحدى خدماتنا؟
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[18px] leading-[1.6] text-on-night-2 max-w-2xl mx-auto"
          >
            تواصل معنا اليوم وسيسعد فريقنا بمناقشة طلبك وتقديم العرض المناسب لك.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-2 ltr-flex"
          >
            <Button size="lg" asChild className="relative overflow-hidden btn-shimmer text-base px-7">
              <a href={whatsappHref(GENERAL_MESSAGE)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                تواصل عبر واتساب
              </a>
            </Button>
            <Button size="lg" variant="white" asChild className="text-base px-7">
              <a href={`mailto:${email}?subject=${encodeURIComponent("استفسار عن خدمات الأكاديمية")}`}>
                <Mail className="w-4 h-4" />
                راسلنا بالبريد
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== 6. FOOTER ===== */}
      <SiteFooter />
    </div>
  )
}

/* ===== Sub-components ===== */

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-right bg-gradient-to-l from-brand to-coral"
    />
  )
}

function TiltSpotlightCard({ service }: { service: Service }) {
  const Icon = ICONS[service.icon]
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateY = useSpring(useTransform(mx, [0, 1], [10, -10]), { stiffness: 150, damping: 18 })
  const rotateX = useSpring(useTransform(my, [0, 1], [-10, 10]), { stiffness: 150, damping: 18 })
  const spotX = useTransform(mx, (v) => `${v * 100}%`)
  const spotY = useTransform(my, (v) => `${v * 100}%`)
  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${spotX} ${spotY}, rgba(201,100,66,0.16), transparent 65%)`

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  function handleLeave() {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <motion.div variants={cardReveal} className="h-full [perspective:800px]">
      <motion.div
        ref={ref}
        onMouseMove={reduced ? undefined : handleMove}
        onMouseLeave={reduced ? undefined : handleLeave}
        style={reduced ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-[0_0_0_1px_var(--color-ring-warm)] transition-shadow duration-300 hover:border-brand hover:shadow-whisper"
      >
        {/* cursor spotlight */}
        <motion.div
          aria-hidden
          style={{ background: spotlight }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="relative z-10 flex h-full flex-col">
          <motion.div
            className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-5"
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
          <h3
            className="text-[20px] leading-snug text-ink mb-2"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {service.title}
          </h3>
          <p className="text-sm leading-[1.7] text-ink-2 flex-1">{service.summary}</p>
          <a
            href={`#${service.slug}`}
            className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors mt-5 ltr-flex"
          >
            اعرف المزيد
            <ChevronLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-200 group-hover/link:-translate-x-1 rtl:group-hover/link:translate-x-1" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ServiceDetailRow({ service, index }: { service: Service; index: number }) {
  const { whatsappHref } = useContact()
  const Icon = ICONS[service.icon]
  const reduced = useReducedMotion()
  const reverse = index % 2 === 1
  const darkBg = index % 2 === 1
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const patternY = useTransform(scrollYProgress, [0, 1], [-30, 30])
  const iconY = useTransform(scrollYProgress, [0, 1], [30, -30])

  return (
    <section
      id={service.slug}
      className={`scroll-mt-24 py-20 ${
        darkBg ? "bg-surface border-y border-line" : "bg-canvas"
      }`}
    >
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerParent}
        >
          {/* Visual panel */}
          <motion.div
            variants={fadeUp}
            className={`relative aspect-[4/3] rounded-3xl overflow-hidden border border-line shadow-whisper bg-gradient-to-br from-brand/12 via-coral/8 to-transparent flex items-center justify-center ${
              reverse ? "lg:order-2" : ""
            }`}
          >
            <motion.div
              aria-hidden
              style={{ y: reduced ? 0 : patternY }}
              className="absolute inset-0 pattern-islamic opacity-30 scale-125"
            />
            <motion.div style={{ y: reduced ? 0 : iconY }} className="relative">
              <motion.div
                className="w-24 h-24 rounded-2xl bg-surface text-brand flex items-center justify-center shadow-[0_0_0_1px_var(--color-line)]"
                animate={reduced ? undefined : { y: [0, -8, 0] }}
                transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className="w-12 h-12" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Text + bullets */}
          <motion.div variants={fadeUp} className="space-y-5">
            <div className="space-y-3">
              <h2
                className="text-subhead text-ink"
                style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
              >
                {service.title}
              </h2>
              <motion.span
                className="block h-[3px] w-16 rounded-full bg-gradient-to-l from-brand to-coral origin-right"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
              />
            </div>
            <p className="text-[17px] leading-[1.8] text-ink-2">{service.description}</p>

            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-ink-3">ماذا تشمل الخدمة</p>
              <motion.ul
                className="space-y-2.5"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={staggerParent}
              >
                {service.includes.map((item, i) => (
                  <motion.li key={i} variants={checkItem} className="flex items-start gap-2.5 ltr-flex">
                    <motion.span
                      variants={popIn}
                      className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center"
                    >
                      <Check className="w-3 h-3" />
                    </motion.span>
                    <span className="text-[15px] leading-[1.6] text-ink-button">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <div className="pt-3">
              <Button asChild>
                <a
                  href={whatsappHref(serviceRequestMessage(service.title))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4" />
                  اطلب هذه الخدمة
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </a>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function StepItem({ number, text }: { number: number; text: string }) {
  return (
    <motion.div variants={fadeUp} className="relative flex flex-col items-center text-center gap-4">
      <motion.div
        variants={popIn}
        className="relative z-10 w-12 h-12 rounded-full bg-brand text-on-night flex items-center justify-center text-[18px] shadow-[0_0_0_6px_var(--color-surface)]"
        style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
      >
        {toArabicDigits(number)}
      </motion.div>
      <p className="text-[15px] leading-[1.6] text-ink-button max-w-[14rem]">{text}</p>
    </motion.div>
  )
}
