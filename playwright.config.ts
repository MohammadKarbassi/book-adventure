import { defineConfig, devices } from "@playwright/test"

const PORT = 3100

// E2E_BASE_URL runs the specs against an already running server (e.g. the
// dev server) instead of building and starting a production one. That server
// talks to the real Open Library API unless it sets OPENLIBRARY_FIXTURES.
const externalBaseURL = process.env.E2E_BASE_URL
const baseURL = externalBaseURL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "fa-IR",
    trace: "on-first-retry",
  },
  projects: [
    {
      // Desktop is the priority; mobile-only specs run in the project below.
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
      testIgnore: /.*\.mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: `npm run build && npm run start -- -p ${PORT}`,
        url: baseURL,
        // Open Library answers from recorded JSON, not the network.
        env: { OPENLIBRARY_FIXTURES: "e2e/fixtures/openlibrary" },
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
