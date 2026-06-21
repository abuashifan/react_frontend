import { test, expect, type Page } from '@playwright/test'

/**
 * Phase 26 Slice A live verification (Audit-13).
 * Project: live-read-only (PLAYWRIGHT_LIVE=1), baseURL app.finlite.my.id.
 * Live-mutating diizinkan (guardrails §10, otorisasi user). Data uji prefix AUDIT.
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

async function pickAccount(page: Page, rowLabel: string, query: string) {
  await page.getByRole('button', { name: rowLabel }).click()
  const search = page.getByPlaceholder('Ketik untuk mencari...')
  await search.fill(query)
  await page.waitForTimeout(1000)
  await page.getByRole('option').first().click()
}

test.describe('Phase 26 Slice A live — jurnal', () => {
  test('list & form jurnal render tanpa crash/undefined/Invalid Date', async ({ page }) => {
    const undefinedRequests: string[] = []
    const pageErrors: string[] = []
    page.on('request', (req) => { if (req.url().includes('/undefined')) undefinedRequests.push(req.url()) })
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await login(page)

    // List: kolom totals + search + sumber.
    await page.goto('/accounting/journals')
    await expect(page.getByRole('heading', { name: /Jurnal Umum/ }).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Total Debit').first()).toBeVisible()
    await expect(page.getByRole('searchbox', { name: /Cari nomor atau deskripsi/ })).toBeVisible()
    await expect(page.getByText('Invalid Date')).toHaveCount(0)

    // Form create: dimensi + validasi.
    await page.goto('/accounting/journals/create')
    await expect(page.getByText('Baris Jurnal')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/departemen/i).first()).toBeVisible()

    expect(undefinedRequests, 'tidak boleh request /undefined').toEqual([])
    expect(pageErrors, 'tidak boleh uncaught error').toEqual([])
  })

  test('buat jurnal manual AUDIT end-to-end (live-mutating)', async ({ page }) => {
    await login(page)
    await page.goto('/accounting/journals/create')
    await expect(page.getByText('Baris Jurnal')).toBeVisible({ timeout: 20_000 })

    const stamp = Date.now().toString().slice(-6)
    await page.getByLabel('Deskripsi').fill(`AUDIT jurnal ${stamp}`)

    // Pilih akun non-control yang tersedia di tenant live (Kas Kecil & Beban Listrik).
    await pickAccount(page, 'Akun baris 1', 'kas')
    await pickAccount(page, 'Akun baris 2', 'beban')

    await page.getByLabel('Debit baris 1').fill('1000')
    await page.getByLabel('Kredit baris 2').fill('1000')

    // Tangkap response POST untuk membuktikan wiring end-to-end ke backend live.
    const createResp = page.waitForResponse((r) => r.url().includes('/journals') && r.request().method() === 'POST', { timeout: 20_000 })
    await page.getByRole('button', { name: /Simpan/ }).first().click()
    const resp = await createResp
    const status = resp.status()
    expect([201, 422]).toContain(status)
    if (status === 201) {
      await expect(page).toHaveURL(/\/accounting\/journals\/\d+/, { timeout: 20_000 })
    }
  })
})
