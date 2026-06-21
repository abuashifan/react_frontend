import { test, expect, type Page } from '@playwright/test'

/**
 * Phase 25 live verification (Audit-13).
 *
 * Project: `live-read-only` (testMatch *.live.ts), baseURL app.finlite.my.id.
 * Live-mutating diizinkan oleh otorisasi user 2026-06-21 (guardrails §10).
 * Mutasi dibatasi pada record berprefix `AUDIT` dan difilter via search agar
 * dampak terkendali (data live adalah sample).
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

test.describe('Phase 25 live — master data', () => {
  test('login dan master data pages render tanpa crash / undefined / Invalid Date', async ({ page }) => {
    const undefinedRequests: string[] = []
    const pageErrors: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/undefined')) undefinedRequests.push(req.url())
    })
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await login(page)

    const pages: Array<{ path: string; heading: RegExp }> = [
      { path: '/master-data/units', heading: /Satuan/ },
      { path: '/master-data/payment-terms', heading: /Syarat Pembayaran/ },
      { path: '/master-data/coa', heading: /Chart of Accounts/ },
      { path: '/master-data/contacts', heading: /Kontak|Contact/ },
      { path: '/master-data/products', heading: /Produk/ },
      { path: '/master-data/account-mappings', heading: /Pemetaan Akun|Account Mapping/ },
    ]

    for (const target of pages) {
      await page.goto(target.path)
      await expect(page.getByRole('heading', { name: target.heading }).first()).toBeVisible({ timeout: 20_000 })
      // tidak ada teks renderer rusak
      await expect(page.getByText('Invalid Date')).toHaveCount(0)
      await expect(page.getByText('NaN', { exact: true })).toHaveCount(0)
      await expect(page.getByText('undefined', { exact: true })).toHaveCount(0)
    }

    expect(undefinedRequests, 'tidak boleh ada request ke /undefined').toEqual([])
    expect(pageErrors, 'tidak boleh ada uncaught error').toEqual([])
  })

  test('bulk deactivate live: buat 2 unit AUDIT lalu nonaktifkan via bulk', async ({ page }) => {
    page.on('dialog', (dialog) => void dialog.accept())
    await login(page)
    await page.goto('/master-data/units')

    const stamp = Date.now().toString().slice(-6)
    const names = [`AUDIT Unit ${stamp}A`, `AUDIT Unit ${stamp}B`]

    for (const [i, name] of names.entries()) {
      await page.getByRole('button', { name: /Tambah Satuan/ }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByPlaceholder('Kilogram').fill(name)
      await dialog.getByPlaceholder('kg').fill(`AU${stamp}${i}`)
      await dialog.getByRole('button', { name: 'Simpan' }).click()
      await expect(dialog).toBeHidden({ timeout: 15_000 })
    }

    // filter ke record AUDIT saja agar select-all aman
    await page.getByRole('searchbox').fill(`AUDIT Unit ${stamp}`)
    await expect(page.getByText(names[0])).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(names[1])).toBeVisible()

    // select-all (hanya baris AUDIT yang tampil) lalu bulk nonaktifkan
    await page.getByRole('checkbox').first().click()
    await page.getByRole('button', { name: 'Nonaktifkan', exact: true }).click()

    // verifikasi kedua baris menjadi Nonaktif
    await expect(page.getByRole('row', { name: new RegExp(names[0]) }).getByText('Nonaktif')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('row', { name: new RegExp(names[1]) }).getByText('Nonaktif')).toBeVisible()
  })
})
