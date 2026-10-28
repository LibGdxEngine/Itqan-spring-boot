import { expect, test } from "@playwright/test"
import { readSeed } from "./support"

test.describe("public pages", () => {
  test("home page renders in Arabic by default and English with ?lang=en", async ({ browser, baseURL }) => {
    const arabic = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
    const page = await arabic.newPage()
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "ar")
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    await page.goto("/?lang=en")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await arabic.close()
  })

  test("catalog lists the seeded course and links to its page", async ({ page }) => {
    const { courseId, courseTitle } = readSeed()
    await page.goto("/courses")
    const link = page.getByRole("link", { name: new RegExp(courseTitle) }).first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(new RegExp(`/courses/${courseId}`))
    await expect(page.getByRole("heading", { level: 1, name: courseTitle })).toBeVisible()
  })

  test("course page is server-rendered with Course structured data", async ({ request }) => {
    const { courseId, courseTitle } = readSeed()
    const html = await (await request.get(`/courses/${courseId}`)).text()
    expect(html).toContain(courseTitle)
    expect(html).toContain('"@type":"Course"')
  })

  test("sitemap lists the seeded course", async ({ request }) => {
    const { courseId } = readSeed()
    const res = await request.get("/sitemap.xml")
    expect(res.ok()).toBeTruthy()
    expect(await res.text()).toContain(`/courses/${courseId}`)
  })

  test("unknown routes show the branded 404 page", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist")
    expect(res?.status()).toBe(404)
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible()
  })
})
