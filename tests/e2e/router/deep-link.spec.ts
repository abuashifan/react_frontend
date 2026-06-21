import { test, expect, seedAuth, mockApi } from '../fixtures/test'
import { VIEWPORTS } from '../fixtures/viewports'

/**
 * A13-059 — Browser routing canonical.
 *
 * Membuktikan migrasi createMemoryRouter → createBrowserRouter:
 * URL merepresentasikan route aktif, deep-link & refresh bekerja,
 * browser history valid, dan URL tidak pernah di-reset ke '/'.
 */
test.describe('A13-059 browser routing canonical', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
    await mockApi(page)
  })

  test('direct deep-link mempertahankan URL (tidak reset ke /)', async ({ page, errors }) => {
    await page.goto('/master-data/units')
    await expect(page).toHaveURL(/\/master-data\/units$/)
    // Tidak ada developer overlay React Router.
    await expect(page.getByText('Unexpected Application Error')).toHaveCount(0)
    expect(errors.page).toEqual([])
  })

  test('refresh mempertahankan route', async ({ page }) => {
    await page.goto('/master-data/products')
    await expect(page).toHaveURL(/\/master-data\/products$/)
    await page.reload()
    await expect(page).toHaveURL(/\/master-data\/products$/)
  })

  test('browser back/forward mengikuti history', async ({ page }) => {
    await page.goto('/master-data/units')
    await page.goto('/master-data/products')
    await expect(page).toHaveURL(/\/master-data\/products$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/master-data\/units$/)
    await page.goForward()
    await expect(page).toHaveURL(/\/master-data\/products$/)
  })

  test('unknown path → NotFound (URL tetap, bukan reset ke /)', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(page).toHaveURL(/\/this-route-does-not-exist$/)
    await expect(page.getByText('Halaman tidak ditemukan.')).toBeVisible()
  })

  test('deep-link aman pada viewport mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/master-data/units')
    await expect(page).toHaveURL(/\/master-data\/units$/)
    await expect(page.getByText('Unexpected Application Error')).toHaveCount(0)
  })
})
