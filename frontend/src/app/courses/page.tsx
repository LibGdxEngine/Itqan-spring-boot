import type { CatalogCourse } from "@/lib/learning-api"
import { fetchPublic } from "@/lib/seo"

import { CatalogPage } from "./CatalogClient"
import { catalogApiPath, catalogQueryKey, parseCatalogParams } from "./catalog-query"

type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number }

/** Renders the first page of results on the server so the course list is in the HTML. */
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const params = parseCatalogParams((key) => {
    const value = raw[key]
    return Array.isArray(value) ? value[0] : value
  })
  // No caching: a course an instructor just published must show up for students right away.
  const result = await fetchPublic<Page<CatalogCourse>>(catalogApiPath(params), 0)
  return <CatalogPage initial={{ key: catalogQueryKey(params), result }} />
}
