import { test, expect, seedAuth } from '../fixtures/test'
import type { Page } from '@playwright/test'

async function mockPermissions(page: Page) {
  await page.route('**/api/**/auth/permissions', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { role: 'owner', permission_mode: 'all', permissions: ['*'] } }) })
  })
}

const statusBody = (lockedUntil: string | null) => ({
  success: true,
  data: {
    active_fiscal_year: {
      id: 1, year: 2026, start_date: '2026-01-01', end_date: '2026-12-31',
      status: 'open', is_active: true, is_closed: false, locked_until: lockedUntil,
    },
  },
})

test.describe('Phase 26 Slice C — period lock', () => {
  test('A13-101 — locked_until canonical terbaca sebagai lock aktif', async ({ page }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/accounting/period-locks/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statusBody('2026-05-31')) })
    })

    await page.goto('/accounting/period-locks')
    await expect(page.getByText('Tahun Fiskal Aktif').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Tidak ada lock aktif')).toHaveCount(0)
    // periode awal terkunci
    await expect(page.getByText('Terkunci').first()).toBeVisible()
  })

  test('A13-103 — status 500 menampilkan error/retry, bukan periode terbuka', async ({ page }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/accounting/period-locks/status', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'DATABASE_ERROR', message: 'Server error' }) })
    })

    await page.goto('/accounting/period-locks')
    await expect(page.getByText('Status periode gagal dimuat')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Tidak ada lock aktif')).toHaveCount(0)
  })

  test('A13-102 — buka lock wajib alasan + konfirmasi (PATCH lock_until null + override_reason)', async ({ page }) => {
    await seedAuth(page)
    await mockPermissions(page)
    let patchBody: Record<string, unknown> | null = null
    await page.route('**/api/**/accounting/period-locks/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statusBody('2026-05-31')) })
    })
    await page.route('**/api/**/accounting/period-locks', async (route) => {
      if (route.request().method() === 'PATCH') {
        patchBody = route.request().postDataJSON() as Record<string, unknown>
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { fiscal_year_id: 1, locked_until: null } }) })
        return
      }
      await route.fallback()
    })

    await page.goto('/accounting/period-locks')
    await page.getByRole('button', { name: 'Buka Lock' }).click()

    // Konfirmasi wajib alasan: tombol konfirmasi disabled sampai alasan diisi.
    const confirmBtn = page.getByRole('button', { name: 'Buka Lock', exact: true }).last()
    await expect(confirmBtn).toBeDisabled()
    await page.getByLabel(/Alasan buka lock/).fill('AUDIT koreksi periode')
    await confirmBtn.click()

    await expect.poll(() => patchBody).not.toBeNull()
    expect(patchBody).toMatchObject({ lock_until: null, override_reason: 'AUDIT koreksi periode' })
  })
})
