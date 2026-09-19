import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a real running frontend + backend, using the seeded demo
 * accounts (python manage.py seed_demo_data on the backend). These are
 * end-to-end smoke tests, not unit tests — they need both servers up.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // tests share seeded data/stock — safer run sequentially
  retries: 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.CI
    ? {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 60_000,
      }
    : undefined, // locally, start `npm run dev` yourself so you can watch it run
});
