import type { CatalogSort } from "@/lib/learning-api"

// Shared by the server page (first render) and the client catalog (later navigation).

export const PAGE_SIZE = 12
export const SORTS: CatalogSort[] = ["newest", "popular", "rating", "price_asc", "price_desc"]

export interface CatalogParams {
  q: string
  category: string
  level: string
  price: "" | "free" | "paid"
  sort: CatalogSort
  /** Zero-based; the URL holds the one-based page number. */
  page: number
}

export function parseCatalogParams(get: (key: string) => string | null | undefined): CatalogParams {
  const price = get("price") ?? ""
  const sort = get("sort") as CatalogSort
  return {
    q: get("q") ?? "",
    category: get("category") ?? "",
    level: get("level") ?? "",
    price: price === "free" || price === "paid" ? price : "",
    sort: SORTS.includes(sort) ? sort : "newest",
    page: Math.max(0, Number(get("page") ?? 1) - 1 || 0),
  }
}

export function catalogQueryKey(p: CatalogParams) {
  return JSON.stringify([p.q, p.category, p.level, p.price, p.sort, p.page])
}

export function catalogApiPath(p: CatalogParams) {
  const params = new URLSearchParams({ sort: p.sort, page: String(p.page), size: String(PAGE_SIZE) })
  for (const key of ["q", "category", "level", "price"] as const) if (p[key]) params.set(key, p[key])
  return `/api/catalog?${params.toString()}`
}
