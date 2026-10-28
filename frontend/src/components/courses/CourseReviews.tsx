"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, MessageSquareText, Star, Trash2 } from "lucide-react"

import { StarRating } from "@/components/courses/StarRating"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { Review, ReviewSummary, reviewsApi } from "@/lib/learning-api"
import { cn } from "@/lib/utils"

const PAGE = 5

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium" })
}

function StarPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const t = useTranslations("reviews")
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-ink">{label}</legend>
      <div className="flex gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40">
            <input
              type="radio"
              name="review-rating"
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
              aria-label={t("stars", { count: star })}
            />
            <Star className={cn("h-7 w-7", star <= value ? "fill-star text-star" : "text-ring-warm")} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ReviewForm({
  courseId,
  existing,
  onSaved,
  onDeleted,
}: {
  courseId: number
  existing: Review | null
  onSaved: (review: Review) => void
  onDeleted: () => void
}) {
  const t = useTranslations("reviews")
  const { toast } = useToast()
  const [rating, setRating] = React.useState(existing?.rating ?? 0)
  const [comment, setComment] = React.useState(existing?.comment ?? "")
  const [busy, setBusy] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (rating < 1) {
      toast({ variant: "destructive", title: t("pickRating") })
      return
    }
    setBusy(true)
    try {
      onSaved(await reviewsApi.save(courseId, rating, comment))
      toast({ title: existing ? t("updated") : t("thanks") })
    } catch (err) {
      toast({ variant: "destructive", title: t("failed"), description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await reviewsApi.remove(courseId)
      onDeleted()
      toast({ title: t("deleted") })
    } catch (err) {
      toast({ variant: "destructive", title: t("failed"), description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-xl border border-line-strong bg-paper p-4">
      <StarPicker value={rating} onChange={setRating} label={existing ? t("yourRating") : t("rateCourse")} />
      <Textarea
        value={comment}
        maxLength={2000}
        rows={3}
        placeholder={t("commentPlaceholder")}
        aria-label={t("commentPlaceholder")}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex flex-wrap justify-end gap-2">
        {existing ? (
          <Button type="button" variant="ghost" className="text-danger" disabled={busy} onClick={() => void remove()}>
            <Trash2 /> {t("delete")}
          </Button>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          {existing ? t("update") : t("submit")}
        </Button>
      </div>
    </form>
  )
}

/** Rating summary, star distribution, the student's own review form and the review list. */
export function CourseReviews({ courseId, canReview }: { courseId: number; canReview: boolean }) {
  const t = useTranslations("reviews")
  const locale = useLocale()
  const [summary, setSummary] = React.useState<ReviewSummary | null>(null)
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [hasMore, setHasMore] = React.useState(false)
  const [page, setPage] = React.useState(0)
  const [mine, setMine] = React.useState<Review | null | undefined>(undefined)
  const [editing, setEditing] = React.useState(false)

  const reload = React.useCallback(async () => {
    const [s, list] = await Promise.all([reviewsApi.summary(courseId), reviewsApi.list(courseId, 0, PAGE)])
    setSummary(s)
    setReviews(list.content)
    setHasMore(list.totalPages > 1)
    setPage(0)
  }, [courseId])

  React.useEffect(() => {
    void reload().catch(() => undefined)
  }, [reload])

  React.useEffect(() => {
    if (!canReview) return
    reviewsApi
      .mine(courseId)
      .then(setMine)
      .catch(() => setMine(null))
  }, [canReview, courseId])

  const loadMore = async () => {
    const next = await reviewsApi.list(courseId, page + 1, PAGE)
    setReviews((list) => [...list, ...next.content])
    setPage(page + 1)
    setHasMore(page + 2 < next.totalPages)
  }

  const count = summary?.count ?? 0

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <h2 id="reviews-heading" className="text-2xl font-bold text-ink">
        {t("title")}
      </h2>

      {count > 0 && summary ? (
        <div className="grid gap-6 rounded-xl border border-line-strong bg-surface p-5 sm:grid-cols-[auto_1fr]">
          <div className="text-center sm:pe-6">
            <p className="text-5xl font-bold text-ink" dir="ltr">{summary.average.toFixed(1)}</p>
            <StarRating value={summary.average} size="md" label={t("average", { rating: summary.average.toFixed(1) })} className="mt-2" />
            <p className="mt-1 text-sm text-ink-3">{t("count", { count })}</p>
          </div>
          <ul className="space-y-1.5" aria-label={t("distribution")}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const n = summary.distribution[String(stars)] ?? 0
              const pct = count > 0 ? Math.round((n / count) * 100) : 0
              return (
                <li key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-14 shrink-0 text-ink-2">{t("stars", { count: stars })}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-grid">
                    <div className="h-full rounded-full bg-star" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-end text-xs text-ink-3" dir="ltr">{pct}%</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-3">
          <MessageSquareText className="mx-auto mb-2 h-6 w-6" />
          {canReview ? t("beFirst") : t("none")}
        </p>
      )}

      {canReview && mine !== undefined ? (
        mine && !editing ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-strong bg-paper p-4 text-sm">
            <span className="flex items-center gap-2 text-ink-2">
              {t("youRated")} <StarRating value={mine.rating} label={t("stars", { count: mine.rating })} />
            </span>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {t("edit")}
            </Button>
          </div>
        ) : (
          <ReviewForm
            key={mine?.id ?? "new"}
            courseId={courseId}
            existing={mine}
            onSaved={(review) => {
              setMine(review)
              setEditing(false)
              void reload()
            }}
            onDeleted={() => {
              setMine(null)
              setEditing(false)
              void reload()
            }}
          />
        )
      ) : null}

      {reviews.length > 0 ? (
        <ul className="divide-y divide-line">
          {reviews.map((review) => (
            <li key={review.id} className="py-4">
              <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand text-sm font-semibold text-ink-2">
                  {(review.authorName || "?").charAt(0)}
                </span>
                <span className="font-medium text-ink">{review.authorName || t("anonymous")}</span>
                <StarRating value={review.rating} label={t("stars", { count: review.rating })} />
                <span className="text-xs text-ink-3">{formatDate(review.updatedAt, locale)}</span>
              </div>
              {review.comment ? <p className="whitespace-pre-line ps-11 text-sm leading-relaxed text-ink-button">{review.comment}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {hasMore ? (
        <Button variant="outline" onClick={() => void loadMore()}>
          {t("more")}
        </Button>
      ) : null}
    </section>
  )
}
