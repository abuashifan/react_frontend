import { test, expect, type Page } from '@playwright/test'

/**
 * Phase 26 Slice B live verification (Audit-13).
 * Project: live-read-only (PLAYWRIGHT_LIVE=1), baseURL app.finlite.my.id.
 * Read-only: render status & batch saldo awal tanpa crash. Mutasi OB (post/lock)
 * punya side-effect single-batch + jurnal pembuka, jadi tidak dieksekusi di sini.
 */

const EMAIL = 'admin@example.com'
const PASSWORD = 'password'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('nama@perusahaan.com').fill(EMAIL)
  await page.getByPlaceholder('••••••••').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
  if (page.url().includes('/select-company')) {
    await page.getByText(/Terakhir diakses|Belum pernah diakses/).first().click()
    await page.waitForURL((url) => !url.pathname.includes('/select-company'), { timeout: 30_000 })
  }
}

test('saldo awal status & batch render tanpa crash/undefined', async ({ page }) => {
  const undefinedRequests: string[] = []
  const pageErrors: string[] = []
  page.on('request', (req) => { if (req.url().includes('/undefined')) undefinedRequests.push(req.url()) })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await login(page)
  await page.goto('/opening-balance')
  await expect(page.getByRole('heading', { name: /Saldo Awal/ }).first()).toBeVisible({ timeout: 20_000 })

  // Buka detail batch bila tersedia.
  const detail = page.getByRole('button', { name: /Lihat Detail|Lanjutkan Input/ })
  if (await detail.count() > 0) {
    await detail.first().click()
    await expect(page.getByText('Total Debit').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Invalid Date')).toHaveCount(0)
  }

  expect(undefinedRequests, 'tidak boleh request /undefined').toEqual([])
  expect(pageErrors, 'tidak boleh uncaught error').toEqual([])
})
