import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end smoke tests. They expect a running backend (E2E_API_URL) and a
 * running frontend (E2E_BASE_URL); start both before running `npm run test:e2e`.
 * The seed step logs in as the super admin from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    // English UI so selectors can use readable labels.
    storageState: "e2e/.state/english.json",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
