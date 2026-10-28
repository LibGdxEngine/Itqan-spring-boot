import { expect, test } from "@playwright/test"
import { apiCall, readSeed } from "./support"

test("a student signs in, enrolls, completes the course and claims a certificate", async ({ page }) => {
  const { courseId, courseTitle } = readSeed()
  const email = `student-${Date.now()}@e2e.itqan.test`
  const password = `E2e-${Date.now()}-pass`
  await apiCall("POST", "/api/auth/register", {
    email, password, firstName: "Test", lastName: "Student",
  })

  await page.goto("/login")
  await page.locator("#email").fill(email)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/courses/)

  await page.goto(`/courses/${courseId}`)
  await page.getByRole("button", { name: "Enroll for Free" }).first().click()
  await expect(page).toHaveURL(new RegExp(`/learn/${courseId}/\\d+`))

  const complete = page.getByRole("button", { name: "Mark as Complete" })
  await complete.click()
  await expect(page.getByRole("button", { name: "Completed" })).toBeVisible()

  await page.goto("/dashboard")
  await expect(page.getByText(courseTitle).first()).toBeVisible()
  await page.getByRole("button", { name: "Get certificate" }).first().click()
  await expect(page).toHaveURL(/\/certificates\/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/)
  await expect(page.getByText(courseTitle).first()).toBeVisible()
})
