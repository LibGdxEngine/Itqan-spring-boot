import type { Variants } from "framer-motion"

// Shared framer-motion presets so every page animates the same way.

/** Ease-out curve used across the site. */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Fade and rise 16px. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

/** Staggers children that use `fadeUp`. */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
