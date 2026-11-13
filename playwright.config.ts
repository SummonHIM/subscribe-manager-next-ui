import process from 'node:process'

import { defineConfig } from '@playwright/test'

const DESKTOP_VIEWPORT = { width: 1280, height: 900 }
const MOBILE_VIEWPORT = { width: 390, height: 844 }

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     */
    timeout: 8000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173',
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    headless: true,
  },

  /* Three engines × desktop / mobile. */
  projects: [
    {
      name: 'chromium-desktop',
      use: { browserName: 'chromium', viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'firefox-desktop',
      use: { browserName: 'firefox', viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'webkit-desktop',
      use: { browserName: 'webkit', viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'chromium-mobile',
      use: {
        browserName: 'chromium',
        viewport: MOBILE_VIEWPORT,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      /* Firefox does not support isMobile, use a mobile viewport only. */
      name: 'firefox-mobile',
      use: { browserName: 'firefox', viewport: MOBILE_VIEWPORT, hasTouch: true },
    },
    {
      name: 'webkit-mobile',
      use: {
        browserName: 'webkit',
        viewport: MOBILE_VIEWPORT,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],

  /* Run the dev server locally, build + preview on CI. */
  webServer: {
    command: process.env.CI
      ? 'npm run build-only && npm run preview -- --host 127.0.0.1 --port 4173'
      : 'npm run dev -- --host 127.0.0.1 --port 5173',
    port: process.env.CI ? 4173 : 5173,
    reuseExistingServer: !process.env.CI,
  },
})
