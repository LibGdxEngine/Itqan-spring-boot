import { describe, expect, it } from "vitest"
import { jsonLdHtml, localizedAlternates, localizedUrl, SITE_URL } from "../seo"

describe("jsonLdHtml", () => {
  it("escapes < so a value cannot close the surrounding script tag", () => {
    const html = jsonLdHtml({ name: "</script><script>alert(1)</script>" })
    expect(html).not.toContain("<")
    expect(html).toContain("\\u003c/script>")
  })

  it("still parses back to the original data", () => {
    const data = { name: "a < b", nested: [1, "<x>"] }
    expect(JSON.parse(jsonLdHtml(data))).toEqual(data)
  })
})

describe("localized URLs", () => {
  it("keeps Arabic at the plain URL and adds ?lang=en for English", () => {
    expect(localizedUrl("/courses", "ar")).toBe(`${SITE_URL}/courses`)
    expect(localizedUrl("/courses", "en")).toBe(`${SITE_URL}/courses?lang=en`)
    expect(localizedUrl("/", "ar")).toBe(SITE_URL)
  })

  it("points canonical at the current language and x-default at Arabic", () => {
    const alt = localizedAlternates("/about", "en")
    expect(alt.canonical).toBe(`${SITE_URL}/about?lang=en`)
    expect(alt.languages).toMatchObject({
      ar: `${SITE_URL}/about`,
      en: `${SITE_URL}/about?lang=en`,
      "x-default": `${SITE_URL}/about`,
    })
  })
})
