import { test, expect, type Page } from '@playwright/test'

/**
 * Phase 26 Slice D live verification (Audit-13).
 * Read + preview (GET, read-only). Close/reopen TIDAK dieksekusi (side-effect besar
 * pada tahun fiskal live). Preview membuktikan endpoint id+method canonical (A13-107/108).
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

test('fiscal year status + preview (GET id valid) tanpa crash/undefined', async ({ page }) => {
  const undefinedRequests: string[] = []
  const pageErrors: string[] = []
  let previewReq = ''
  page.on('request', (req) => {
    if (req.url().includes('/undefined')) undefinedRequests.push(req.url())
    if (req.url().includes('closing-preview')) previewReq = `${req.method()} ${new URL(req.url()).pathname}`
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await login(page)
  await page.goto('/accounting/fiscal-years')
  await expect(page.getByText('Tahun Fiskal Aktif').first()).toBeVisible({ timeout: 20_000 })

  // Jalankan pratinjau jika tahun fiskal masih terbuka.
  const previewBtn = page.getByRole('button', { name: /Jalankan Pratinjau Penutupan/ })
  if (await previewBtn.count() > 0) {
    await previewBtn.click()
    // muncul ringkasan ATAU blocker — keduanya bukti end-to-end tanpa crash.
    await expect(page.getByText(/Siap ditutup|Belum dapat ditutup|Penutupan diblokir/)).toBeVisible({ timeout: 20_000 })
    expect(previewReq).toMatch(/^GET .*\/fiscal-years\/\d+\/closing-preview$/)
  }

  expect(undefinedRequests, 'tidak boleh request /undefined').toEqual([])
  expect(pageErrors, 'tidak boleh uncaught error').toEqual([])
})
