import { test, expect, type Page } from '@playwright/test'

/**
 * Phase 26 Slice C live verification (Audit-13).
 * Read-only: render status period lock (locked_until canonical + konteks fiscal year).
 * Mutasi lock tidak dieksekusi (mengubah locked_until fiscal year live).
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

test('period lock status render tanpa crash/undefined', async ({ page }) => {
  const undefinedRequests: string[] = []
  const pageErrors: string[] = []
  page.on('request', (req) => { if (req.url().includes('/undefined')) undefinedRequests.push(req.url()) })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await login(page)
  await page.goto('/accounting/period-locks')
  await expect(page.getByText('Tahun Fiskal Aktif').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Invalid Date')).toHaveCount(0)

  expect(undefinedRequests, 'tidak boleh request /undefined').toEqual([])
  expect(pageErrors, 'tidak boleh uncaught error').toEqual([])
})
