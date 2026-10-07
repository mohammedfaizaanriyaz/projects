import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  webServer: {
    command: "node e2e/server.cjs",
    url: "http://127.0.0.1:4173/api/live",
    reuseExistingServer: false,
    env: { NODE_ENV: "test", VYRA_E2E: "1" },
  },
});
