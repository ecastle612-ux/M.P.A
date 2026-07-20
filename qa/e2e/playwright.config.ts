import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://127.0.0.1:3000";
const isCI = Boolean(process.env["CI"]);
const skipWebServer = Boolean(process.env["PLAYWRIGHT_SKIP_WEBSERVER"]);

/**
 * QA-001 Playwright configuration.
 * Product apps must never import this package.
 */
const config: PlaywrightTestConfig = {
  testDir: "./tests",
  globalSetup: "./tests/global.setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  ...(isCI ? { workers: 2 } : {}),
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: "disabled"
    }
  },
  snapshotPathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "reports/results.json" }],
    ["junit", { outputFile: "reports/junit.xml" }]
  ],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  },
  projects: [
    {
      name: "chromium-smoke",
      testIgnore: [/global\.setup\.ts/],
      use: { ...devices["Desktop Chrome"] },
      grep: /@smoke/
    },
    {
      name: "chromium-workflows",
      testIgnore: [/global\.setup\.ts/],
      use: { ...devices["Desktop Chrome"] },
      grep: /@p1|@p2|@nightly/
    },
    {
      name: "chromium-visual",
      testIgnore: [/global\.setup\.ts/],
      use: { ...devices["Desktop Chrome"] },
      grep: /@visual/
    },
    {
      name: "chromium-a11y",
      testIgnore: [/global\.setup\.ts/],
      use: { ...devices["Desktop Chrome"] },
      grep: /@a11y/
    },
    {
      name: "chromium-perf",
      testIgnore: [/global\.setup\.ts/],
      use: { ...devices["Desktop Chrome"] },
      grep: /@perf/
    }
  ]
};

if (!skipWebServer) {
  config.webServer = {
    command:
      process.env["PLAYWRIGHT_WEB_SERVER_COMMAND"] ??
      "pnpm --filter @mpa/web exec next start --hostname 127.0.0.1 --port 3000",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    cwd: path.join(rootDir, "../..")
  };
}

export default defineConfig(config);
