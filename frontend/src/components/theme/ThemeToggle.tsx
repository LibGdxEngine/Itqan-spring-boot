"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Monitor, Moon, Sun } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type ThemeChoice = "light" | "dark" | "system"
const STORAGE_KEY = "itqan-theme"

function readChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

function apply(choice: ThemeChoice) {
  const dark =
    choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}

/** Light / dark / system switcher. The initial class is set by the script in the root layout. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("theme")
  const [choice, setChoice] = React.useState<ThemeChoice>("system")
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    setChoice(readChoice())
    setIsDark(document.documentElement.classList.contains("dark"))
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      if (readChoice() === "system") {
        apply("system")
        setIsDark(media.matches)
      }
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  const choose = (value: string) => {
    const next = value as ThemeChoice
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the choice still applies for this page view.
    }
    apply(next)
    setChoice(next)
    setIsDark(document.documentElement.classList.contains("dark"))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
          className,
        )}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={choice} onValueChange={choose}>
          <DropdownMenuRadioItem value="light">
            <Sun className="me-2 h-4 w-4" /> {t("light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="me-2 h-4 w-4" /> {t("dark")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="me-2 h-4 w-4" /> {t("system")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
