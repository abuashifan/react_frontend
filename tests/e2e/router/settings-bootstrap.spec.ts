import { test, expect, seedAuth, clearAuth, mockApi } from '../fixtures/test'

/**
 * A13-271 — Settings deep-link/refresh & auth/session bootstrap.
 *
 * Setelah opsi rememberMe dihapus, auth ter-persist di localStorage:
 * deep-link & refresh authenticated tidak boleh memantulkan ke login,
 * dan deep-link unauthenticated harus ke /login tanpa redirect loop.
 */
test.describe('A13-271 settings bootstrap', () => {
  test('direct /settings/users authenticated terbuka', async ({ page }) => {
    await seedAuth(page)
    await mockApi(page)
    await page.goto('/settings/users')
    await expect(page).toHaveURL(/\/settings\/users$/)
    await expect(page.getByText('Unexpected Application Error')).toHaveCount(0)
  })

  test('refresh /settings/users mempertahankan route', async ({ page }) => {
    await seedAuth(page)
    await mockApi(page)
    await page.goto('/settings/users')
    await expect(page).toHaveURL(/\/settings\/users$/)
    await page.reload()
    await expect(page).toHaveURL(/\/settings\/users$/)
  })

  test('deep-link protected unauthenticated → /login', async ({ page }) => {
    await clearAuth(page)
    await mockApi(page)
    await page.goto('/settings/users')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('tidak ada redirect loop saat unauthenticated', async ({ page }) => {
    await clearAuth(page)
    await mockApi(page)
    await page.goto('/settings/users')
    await expect(page).toHaveURL(/\/login$/)
    // URL stabil (tidak terus berpindah) — login form tetap terlihat.
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('Selamat datang kembali')).toBeVisible()
  })
})
