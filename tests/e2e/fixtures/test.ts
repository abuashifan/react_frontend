import { test as base, expect, type Page } from '@playwright/test'

/**
 * Phase 24 test fixtures (Audit-13).
 *
 * Menyediakan:
 * - `errors`   : kolektor console error, page error (uncaught), dan failed request;
 * - `seedAuth` : seed auth store ter-persist (localStorage) agar deep-link
 *                authenticated bisa diuji tanpa flow login penuh;
 * - `mockApi`  : intercept semua `**\/api\/**` dengan default aman supaya test
 *                router deterministik dan tidak menyentuh backend.
 */

export interface RuntimeErrors {
  console: string[]
  page: string[]
  failedRequests: string[]
}

const AUTH_STORAGE_KEY = 'seaside-auth'

/** Bentuk persisted state zustand (persist v0) untuk store auth. */
function buildAuthStorage() {
  return JSON.stringify({
    state: {
      token: 'test-token',
      user: { id: 1, name: 'Audit Tester', email: 'admin@example.com', permissions: ['*'] },
      permissions: ['*'],
      permissionsLoaded: true,
      companies: [
        { id: 1, name: 'AUDIT Co', last_accessed_at: null, settings: { onboarding_completed: true } },
      ],
      activeCompanyId: 1,
    },
    version: 0,
  })
}

/** Seed auth ter-persist sebelum app boot. */
export async function seedAuth(page: Page) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    [AUTH_STORAGE_KEY, buildAuthStorage()] as const,
  )
}

/** Pastikan tidak ada auth ter-persist (skenario unauthenticated). */
export async function clearAuth(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.removeItem(key)
  }, AUTH_STORAGE_KEY)
}

/**
 * Mock default semua endpoint API. Mengembalikan envelope sukses generik
 * sehingga page list/detail tidak crash karena ketiadaan backend.
 */
export async function mockApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()

    // Permissions endpoint punya shape khusus.
    if (url.includes('/auth/permissions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { role: 'owner', permission_mode: 'all', permissions: ['*'] },
        }),
      })
      return
    }

    // Default: list-style envelope kosong + meta pagination.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
      }),
    })
  })
}

export const test = base.extend<{ errors: RuntimeErrors }>({
  errors: async ({ page }, use) => {
    const errors: RuntimeErrors = { console: [], page: [], failedRequests: [] }

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.console.push(msg.text())
    })
    page.on('pageerror', (err) => {
      errors.page.push(err.message)
    })
    page.on('requestfailed', (req) => {
      errors.failedRequests.push(`${req.method()} ${req.url()}`)
    })

    await use(errors)
  },
})

export { expect }
