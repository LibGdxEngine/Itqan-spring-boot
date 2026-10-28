import { cache } from "react"

import type { CatalogCourse, Review } from "@/lib/learning-api"
import { fetchPublic } from "@/lib/seo"
import type { StudioCourse } from "@/lib/studio-api"

type Page<T> = { content: T[] }

/**
 * Public data for a course page, shared by its metadata, JSON-LD and body within one request.
 * Uses the anonymous (redacted) view: no paid lesson content ever reaches the HTML.
 */
export const getCourseData = cache(async (id: string) => {
  if (!/^\d+$/.test(id)) return { course: null, stats: null, related: [], reviews: [] }
  const [course, stats, reviews] = await Promise.all([
    fetchPublic<StudioCourse>(`/api/courses/${id}`),
    fetchPublic<CatalogCourse>(`/api/catalog/courses/${id}`),
    fetchPublic<Page<Review>>(`/api/courses/${id}/reviews?size=5`),
  ])
  const related = course
    ? ((await fetchPublic<Page<CatalogCourse>>(
        `/api/catalog?category=${encodeURIComponent(course.category)}&sort=popular&size=5`,
      ))?.content ?? []).filter((c) => c.id !== course.id).slice(0, 4)
    : []
  return { course, stats, related, reviews: reviews?.content ?? [] }
})
