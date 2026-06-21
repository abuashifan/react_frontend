import { test, expect, seedAuth, mockApi } from '../fixtures/test'
import { VIEWPORTS } from '../fixtures/viewports'

/**
 * A13-254 — Production-safe route error containment.
 *
 * Invariant:
 * - not-found tetap NotFound (dibedakan dari unexpected error);
 * - tidak pernah ada developer overlay React Router / raw stack;
 * - fallback error menyediakan recovery action.
 */
test.describe('A13-254 error containment', () => {
  test('unknown route → NotFound dengan recovery, tanpa overlay/stack', async ({ page }) => {
    await seedAuth(page)
    await mockApi(page)
    await page.goto('/totally-unknown-path')

    await expect(page.getByText('Halaman tidak ditemukan.')).toBeVisible()
    // Recovery action tersedia.
    await expect(page.getByRole('button', { name: 'Ke Dashboard' })).toBeVisible()
    // Tidak ada kebocoran developer.
    await expect(page.getByText('Unexpected Application Error')).toHaveCount(0)
    const body = (await page.textContent('body')) ?? ''
    expect(body).not.toContain('.tsx')
    expect(body).not.toMatch(/\bat\s+\w+\s*\(/) // pola stack trace "at fn ("
  })

  test('render error tidak memunculkan developer overlay/stack', async ({ page }) => {
    await seedAuth(page)
    // Kembalikan envelope rusak untuk memaksa kondisi error pada page.
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()
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
      // Body valid JSON tapi shape menyalahi kontrak list (data = string).
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: 'not-an-array' }),
      })
    })

    await page.goto('/master-data/units')

    // Throw render ditangkap RouteErrorBoundary → safe fallback + recovery.
    await expect(
      page.getByText('Terjadi kesalahan saat memuat halaman.', { exact: false }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Coba Lagi' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ke Dashboard' })).toBeVisible()

    // Developer overlay & stack TIDAK boleh bocor.
    await expect(page.getByText('Unexpected Application Error')).toHaveCount(0)
    const body = (await page.textContent('body')) ?? ''
    expect(body).not.toContain('.tsx')
    expect(body).not.toMatch(/\bat\s+\w+\s*\(/)
  })

  test('safe fallback aman pada viewport mobile', async ({ page }) => {
    await seedAuth(page)
    await mockApi(page)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/totally-unknown-path')
    await expect(page.getByText('Halaman tidak ditemukan.')).toBeVisible()
  })
})
