"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { motion, useReducedMotion } from "framer-motion"
import { fadeUp, staggerParent } from "@/lib/motion"




const stats = [
  { value: "10K+", labelKey: "home.stats.activeStudents" },
  { value: "500+", labelKey: "home.stats.courses" },
  { value: "98%", labelKey: "home.stats.successRate" },
] as const

export function AuthBrandPanel() {
  const t = useTranslations()
  const prefersReduced = useReducedMotion()

  const containerVariants = prefersReduced ? undefined : staggerParent
  const itemVariants = prefersReduced ? undefined : fadeUp

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-night">
      {/* Soft radial terracotta glow — landing-hero idiom */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-24 opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #d97757 0%, transparent 60%)",
        }}
      />
      {/* Secondary deep glow toward the bottom for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -end-32 w-[28rem] h-[28rem] opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #c96442 0%, transparent 65%)",
        }}
      />

      {/* Branded 8-point star texture overlay (white-stroked, very low opacity) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M40 8 L48 24 L64 16 L56 32 L72 40 L56 48 L64 64 L48 56 L40 72 L32 56 L16 64 L24 48 L8 40 L24 32 L16 16 L32 24 Z'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col justify-between p-12 text-on-night w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Logo — real Itqan mark inside a light chip so the dark artwork reads */}
        <motion.div variants={itemVariants}>
          <Link
            href="/"
            className="inline-flex items-center gap-3 group ltr-flex"
          >
            <span className="bg-surface rounded-2xl p-2 shadow-whisper transition-transform group-hover:scale-[1.03]">
              <Image
                src="/itqan_logo.png"
                alt={t("nav.brand")}
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                priority
              />
            </span>
            <span className="text-2xl font-bold tracking-tight">
              {t("nav.brand")}
            </span>
          </Link>
        </motion.div>

        {/* Main content */}
        <div className="space-y-6">
          <motion.h1
            variants={itemVariants}
            className="text-4xl xl:text-5xl leading-tight"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {t("auth.branding.tagline")}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-lg text-on-night-2 max-w-md leading-relaxed"
          >
            {t("auth.branding.description")}
          </motion.p>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="flex gap-8 pt-4 ltr-flex"
          >
            {stats.map((stat) => (
              <div key={stat.value}>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-on-night-2">
                  {t(stat.labelKey)}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-sm text-on-night-2">
          © {new Date().getFullYear()} {t("nav.brand")}.{" "}
          {t("common.allRightsReserved")}
        </motion.div>
      </motion.div>
    </div>
  )
}
