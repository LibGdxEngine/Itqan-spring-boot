import { mkdirSync, writeFileSync } from "node:fs"
import type { FullConfig } from "@playwright/test"
import { API_URL, STATE_DIR, type SeedState, apiCall } from "./support"

/** Seeds one free, published course with a single text lesson and stores its id. */
export default async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error("Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to the backend's super admin.")
  }

  const auth = await apiCall<{ token: string }>("POST", "/api/auth/login", { email, password })
  const token = auth.token
  const stamp = Date.now()
  const courseTitle = `E2E Tajweed basics ${stamp}`

  const course = await apiCall<{ id: number }>("POST", "/api/courses", {
    title: courseTitle,
    description: "A short course created by the end-to-end test suite.",
    instructor: "E2E Instructor",
    price: 0,
    duration: 1,
    level: "BEGINNER",
    category: "GENERAL",
    learningOutcomes: ["Pass the smoke test"],
    requirements: ["None"],
  }, token)
  const courseModule = await apiCall<{ id: number }>("POST", "/api/modules", {
    courseId: course.id, title: "Introduction", orderIndex: 1,
  }, token)
  await apiCall("POST", "/api/lessons", {
    moduleId: courseModule.id, title: "Welcome", type: "TEXT",
    content: "Welcome to the course.", orderIndex: 1, isFree: true,
  }, token)
  await apiCall("PATCH", `/api/courses/${course.id}/publish`, undefined, token)

  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:3000"
  const { hostname } = new URL(baseURL)
  mkdirSync(STATE_DIR, { recursive: true })
  writeFileSync(`${STATE_DIR}/english.json`, JSON.stringify({
    cookies: [{
      name: "NEXT_LOCALE", value: "en", domain: hostname, path: "/",
      expires: -1, httpOnly: false, secure: false, sameSite: "Lax",
    }],
    origins: [],
  }))
  const seed: SeedState = { courseId: course.id, courseTitle, apiUrl: API_URL }
  writeFileSync(`${STATE_DIR}/seed.json`, JSON.stringify(seed))
}
