import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright regression foundation — Phase 24 (Audit-13).
 *
 * Projects:
 * - `route-mock`     : deterministic, semua request `**\/api\/**` di-mock di test.
 *                      Tidak butuh backend. Dipakai untuk router/runtime regression.
 * - `live-read-only` : smoke read-only terhadap deployment live (opt-in via
 *                      PLAYWRIGHT_LIVE=1). Tidak boleh melakukan mutasi.
 *
 * webServer menjalankan Vite dev untuk project route-mock. Vite menyediakan
 * SPA fallback untuk dev; pembuktian SPA fallback PRODUCTION adalah open item
 * terpisah (lihat issue-27 §6.5) dan TIDAK diklaim terbukti oleh harness ini.
 */

const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

const liveOnly = process.env.PLAYWRIGHT_LIVE === '1'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'route-mock',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL,
      },
    },
    ...(liveOnly
      ? [
          {
            name: 'live-read-only',
            testMatch: /.*\.live\.ts/,
            use: {
              ...devices['Desktop Chrome'],
              baseURL: process.env.PLAYWRIGHT_LIVE_URL ?? 'https://app.finlite.my.id',
            },
          },
        ]
      : []),
  ],
  webServer: liveOnly
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
