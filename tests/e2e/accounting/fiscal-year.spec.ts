import { test, expect, seedAuth } from '../fixtures/test'
import type { Page } from '@playwright/test'

async function mockPermissions(page: Page) {
  await page.route('**/api/**/auth/permissions', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { role: 'owner', permission_mode: 'all', permissions: ['*'] } }) })
  })
}

const statusBody = {
  success: true,
  data: {
    active_fiscal_year: { id: 7, year: 2026, start_date: '2026-01-01', end_date: '2026-12-31', status: 'open', is_active: true, is_closed: false, locked_until: null, closed_at: null },
    closing_required: true,
  },
}

const previewOk = {
  success: true,
  data: {
    valid: true, errors: {}, warnings: [],
    preview: { fiscal_year: { id: 7, year: 2026, start_date: '2026-01-01', end_date: '2026-12-31', status: 'open', is_closed: false }, net_profit_loss: 5000000, journal_count: 12, warning_count: 0, warnings: [], can_close: true },
  },
}

test.describe('Phase 26 Slice D — fiscal year', () => {
  test('A13-107/108 — preview GET pakai id valid, lalu close POST', async ({ page }) => {
    await seedAuth(page)
    await mockPermissions(page)
    const calls: string[] = []
    await page.route('**/api/**/accounting/fiscal-year/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statusBody) })
    })
    await page.route('**/api/**/accounting/fiscal-years/7/closing-preview', async (route) => {
      calls.push(`${route.request().method()} preview`)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(previewOk) })
    })
    await page.route('**/api/**/accounting/fiscal-years/7/close', async (route) => {
      calls.push(`${route.request().method()} close`)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { valid: true } }) })
    })

    await page.goto('/accounting/fiscal-years')
    await page.getByRole('button', { name: /Jalankan Pratinjau Penutupan/ }).click()
    await expect(page.getByText('Siap ditutup')).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /Tutup Tahun Fiskal 2026/ }).click()
    await page.getByLabel(/Catatan penutupan/).fill('AUDIT tutup 2026')
    await page.getByRole('button', { name: 'Tutup Tahun Fiskal', exact: true }).last().click()

    await expect.poll(() => calls).toEqual(['GET preview', 'POST close'])
    // tidak ada request ke /undefined
    expect(calls.join(' ')).not.toContain('undefined')
  })

  test('A13-108/113 — preview blocker (422) menahan close', async ({ page }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/accounting/fiscal-year/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statusBody) })
    })
    await page.route('**/api/**/accounting/fiscal-years/7/closing-preview', async (route) => {
      await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid', errors: { trial_balance: ['Neraca saldo belum seimbang.'] } }) })
    })

    await page.goto('/accounting/fiscal-years')
    await page.getByRole('button', { name: /Jalankan Pratinjau Penutupan/ }).click()
    await expect(page.getByText('Neraca saldo belum seimbang.')).toBeVisible({ timeout: 15_000 })
    // tombol close tetap disabled (belum ada preview valid)
    await expect(page.getByRole('button', { name: /Tutup Tahun Fiskal 2026/ })).toBeDisabled()
  })
})
