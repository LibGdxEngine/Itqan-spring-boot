"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { wishlistApi } from "@/lib/learning-api"
import { cn } from "@/lib/utils"

// One shared copy of the student's saved course ids, so every card on a page agrees.
let saved: Set<number> | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function load() {
  loading ??= wishlistApi
    .ids()
    .then((ids) => {
      saved = new Set(ids)
      emit()
    })
    .catch(() => {
      saved = new Set()
      loading = null
    })
  return loading
}

/** Saved-course state for students; always empty for visitors and staff. */
export function useWishlist() {
  const { user, isAuthenticated } = useAuth()
  const isStudent = isAuthenticated && user?.role === "STUDENT"
  const [, rerender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    listeners.add(rerender)
    if (isStudent && !saved) void load()
    return () => {
      listeners.delete(rerender)
    }
  }, [isStudent])

  const toggle = React.useCallback(async (courseId: number) => {
    const set = saved ?? new Set<number>()
    const wasSaved = set.has(courseId)
    if (wasSaved) set.delete(courseId)
    else set.add(courseId)
    saved = set
    emit()
    try {
      if (wasSaved) await wishlistApi.remove(courseId)
      else await wishlistApi.add(courseId)
      return !wasSaved
    } catch (err) {
      if (wasSaved) set.add(courseId)
      else set.delete(courseId)
      emit()
      throw err
    }
  }, [])

  return {
    enabled: isStudent,
    isSaved: (courseId: number) => Boolean(isStudent && saved?.has(courseId)),
    toggle,
  }
}

export function WishlistButton({
  courseId,
  className,
  variant = "icon",
}: {
  courseId: number
  className?: string
  variant?: "icon" | "full"
}) {
  const t = useTranslations("catalog.wishlist")
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const wishlist = useWishlist()
  const active = wishlist.isSaved(courseId)

  // Staff accounts can't save courses; visitors are sent to sign in.
  if (isAuthenticated && !wishlist.enabled) return null

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    try {
      const nowSaved = await wishlist.toggle(courseId)
      toast({ title: nowSaved ? t("added") : t("removed") })
    } catch {
      toast({ variant: "destructive", title: t("failed") })
    }
  }

  const label = active ? t("remove") : t("add")
  return (
    <button
      type="button"
      onClick={(e) => void onClick(e)}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        variant === "icon"
          ? "inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 shadow-whisper backdrop-blur-sm transition hover:scale-105"
          : "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-paper px-4 text-sm font-medium text-ink transition hover:bg-subtle",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", active ? "fill-brand text-brand" : "text-ink-2")} />
      {variant === "full" ? label : null}
    </button>
  )
}
