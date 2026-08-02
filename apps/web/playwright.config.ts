import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Single worker: Next dev compiles routes lazily on first request, and
  // concurrent first-hits to different routes that share a module-level
  // singleton (the in-memory test-email store) can otherwise race.
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Always build + start (not `next dev`): a production build compiles
    // every route into one shared module graph up front, avoiding the lazy
    // per-route compilation that makes `next dev` non-deterministic for
    // this suite. ENABLE_TEST_ENDPOINTS turns on the /api/test/* routes
    // the suite depends on (see src/app/api/test/last-email).
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 180_000,
    env: { ENABLE_TEST_ENDPOINTS: "true" },
  },
});
