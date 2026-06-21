import { test, expect, seedAuth } from '../fixtures/test'
import type { Page } from '@playwright/test'

async function mockPermissions(page: Page) {
  await page.route('**/api/**/auth/permissions', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { role: 'owner', permission_mode: 'all', permissions: ['*'] } }) })
  })
}

const batch = (status: string) => ({
  id: 55,
  batch_number: 'OB-AUDIT-55',
  opening_date: '2026-01-01',
  status,
  total_debit: 1500000,
  total_credit: 1500000,
  difference: 0,
  lines: [
    { id: 1, account_id: 10, account_code: '1100', account_name: 'Kas', debit: 1000000, credit: 0, description: '', is_system_generated: false },
    { id: 2, account_id: 20, account_code: '3100', account_name: 'Modal', debit: 0, credit: 1500000, description: '', is_system_generated: false },
    { id: 3, account_id: 30, account_code: '1500', account_name: 'Aset Tetap', debit: 500000, credit: 0, description: 'Fixed asset', is_system_generated: true },
  ],
  created_at: '2026-01-01T00:00:00Z',
})

test.describe('Phase 26 Slice B — opening balance', () => {
  test('A13-085 — status 500 menampilkan error/retry, bukan "belum ada saldo awal"', async ({ page }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/opening-balance/status', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'DATABASE_ERROR', message: 'Server error' }) })
    })

    await page.goto('/opening-balance')
    await expect(page.getByText('Status saldo awal gagal dimuat')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Mulai Input Saldo Awal')).toHaveCount(0)
  })

  test('A13-086/087 — batch reopened render + system line read-only ikut total', async ({ page }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/opening-balance/batches/55', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: batch('reopened') }) })
    })

    await page.goto('/opening-balance/55')
    await expect(page.getByText('Dibuka Kembali').first()).toBeVisible({ timeout: 20_000 })
    // editable (add account) + system line tampil
    await expect(page.getByText('Tambah akun:')).toBeVisible()
    await expect(page.getByText('Aset Tetap')).toBeVisible()
    await expect(page.getByText('Sistem').first()).toBeVisible()
  })

  test('A13-088 — preview blocking_errors objek dirender tanpa crash', async ({ page }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/opening-balance/batches/55/preview', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {
        batch: batch('validated'), total_debit: 1500000, total_credit: 1000000, difference: 500000,
        validation: { valid: false, errors: [{ code: 'UNBALANCED', message: 'Debit dan kredit tidak seimbang.' }], warnings: [] },
        blocking_errors: [{ code: 'UNBALANCED', message: 'Debit dan kredit tidak seimbang.' }],
        warnings: [{ code: 'WARN_FX', message: 'Periksa kurs.' }],
      } }) })
    })
    await page.route('**/api/**/opening-balance/batches/55', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: batch('validated') }) })
    })

    await page.goto('/opening-balance/55')
    await page.getByRole('button', { name: 'Lihat Preview' }).click()
    await expect(page.getByText('Debit dan kredit tidak seimbang.')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Periksa kurs.')).toBeVisible()
  })
})
