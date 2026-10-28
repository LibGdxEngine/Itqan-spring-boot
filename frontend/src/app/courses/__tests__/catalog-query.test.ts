import { describe, expect, it } from "vitest"
import { catalogApiPath, catalogQueryKey, PAGE_SIZE, parseCatalogParams } from "../catalog-query"

const from = (query: string) => {
  const params = new URLSearchParams(query)
  return parseCatalogParams((key) => params.get(key))
}

describe("parseCatalogParams", () => {
  it("defaults to the newest first page", () => {
    expect(from("")).toEqual({ q: "", category: "", level: "", price: "", sort: "newest", page: 0 })
  })

  it("turns the one-based URL page into a zero-based index", () => {
    expect(from("page=3").page).toBe(2)
  })

  it("ignores unknown or invalid values", () => {
    const p = from("sort=hacked&price=cheap&page=-4")
    expect(p.sort).toBe("newest")
    expect(p.price).toBe("")
    expect(p.page).toBe(0)
    expect(from("page=abc").page).toBe(0)
  })
})

describe("catalogApiPath", () => {
  it("sends only the filters that are set", () => {
    const path = catalogApiPath(from("q=tajweed&price=free&sort=rating&page=2"))
    const url = new URL(path, "http://x")
    expect(url.pathname).toBe("/api/catalog")
    expect(Object.fromEntries(url.searchParams)).toEqual({
      q: "tajweed", price: "free", sort: "rating", page: "1", size: String(PAGE_SIZE),
    })
  })

  it("gives different params different cache keys", () => {
    expect(catalogQueryKey(from("q=a"))).not.toBe(catalogQueryKey(from("q=b")))
    expect(catalogQueryKey(from("q=a"))).toBe(catalogQueryKey(from("q=a")))
  })
})
