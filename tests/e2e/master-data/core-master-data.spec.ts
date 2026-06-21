import { test, expect, seedAuth, mockApi } from '../fixtures/test'

test.describe('Phase 25 core master data', () => {
  test('draft COA, contact, dan product terisolasi per resource', async ({ page, errors }) => {
    await seedAuth(page)
    await mockApi(page)

    await page.goto('/master-data/coa/create')
    await page.getByPlaceholder('1-1100').fill('AUDIT-1100')
    await page.waitForTimeout(700)

    await page.goto('/master-data/contacts/create')
    await page.getByPlaceholder('PT Maju Jaya').fill('AUDIT Contact Draft')
    await page.waitForTimeout(700)

    await page.goto('/master-data/products/create')
    await page.getByPlaceholder('Nama produk').fill('AUDIT Product Draft')
    await page.waitForTimeout(700)

    await page.goto('/master-data/coa/create')
    await expect(page.getByPlaceholder('1-1100')).toHaveValue('AUDIT-1100')

    await page.goto('/master-data/contacts/create')
    await expect(page.getByPlaceholder('PT Maju Jaya')).toHaveValue('AUDIT Contact Draft')

    await page.goto('/master-data/products/create')
    await expect(page.getByPlaceholder('Nama produk')).toHaveValue('AUDIT Product Draft')

    expect(errors.console).toEqual([])
    expect(errors.page).toEqual([])
    expect(errors.failedRequests.filter((request) => request.includes('/api/'))).toEqual([])
  })

  test('search contact dikirim server-side bersama pagination', async ({ page }) => {
    await seedAuth(page)
    const requests: URL[] = []

    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/auth/permissions')) {
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

      if (url.pathname.endsWith('/master-data/contacts')) requests.push(url)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { data: [], current_page: 1, last_page: 1, per_page: 25, total: 0 },
        }),
      })
    })

    await page.goto('/master-data/contacts')
    await page.getByRole('searchbox', { name: /Cari kode, nama/ }).fill('AUDIT')

    await expect.poll(() =>
      requests.some((url) =>
        url.searchParams.get('search') === 'AUDIT'
        && url.searchParams.get('page') === '1'
        && url.searchParams.get('per_page') === '25',
      ),
    ).toBe(true)
  })

  test('payment term aktif dapat dijadikan default dan indikator diperbarui', async ({ page }) => {
    await seedAuth(page)
    let defaultPaymentTermId: number | null = null

    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url())

      if (url.pathname.endsWith('/auth/permissions')) {
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

      if (url.pathname.endsWith('/settings/company/transaction-defaults')) {
        const payload = route.request().postDataJSON() as { default_payment_term_id: number }
        defaultPaymentTermId = payload.default_payment_term_id
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { transaction_defaults: { default_payment_term_id: defaultPaymentTermId } },
          }),
        })
        return
      }

      if (url.pathname.endsWith('/settings/company')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accounting: {},
              modules: {},
              transaction_defaults: { default_payment_term_id: defaultPaymentTermId },
            },
          }),
        })
        return
      }

      if (url.pathname.endsWith('/master-data/payment-terms')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              id: 30,
              code: 'NET30',
              name: 'Net 30',
              days: 30,
              is_custom: false,
              is_active: true,
              created_at: '2026-06-21T00:00:00Z',
              updated_at: '2026-06-21T00:00:00Z',
            }],
            meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      })
    })

    await page.goto('/master-data/payment-terms')
    await page.getByRole('button', { name: 'Jadikan Net 30 syarat pembayaran default' }).click()

    await expect.poll(() => defaultPaymentTermId).toBe(30)
    await expect(page.locator('tbody').getByText('Default', { exact: true })).toBeVisible()
  })

  test('bulk nonaktifkan unit memanggil deactivate untuk tiap baris terpilih', async ({ page }) => {
    await seedAuth(page)
    const deactivated: number[] = []

    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url())

      if (url.pathname.endsWith('/auth/permissions')) {
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

      const deactivateMatch = url.pathname.match(/\/master-data\/units\/(\d+)\/deactivate$/)
      if (deactivateMatch) {
        deactivated.push(Number(deactivateMatch[1]))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: null }),
        })
        return
      }

      if (url.pathname.endsWith('/master-data/units')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 11, code: 'PCS', name: 'Pieces', precision: 0, is_active: true, created_at: '2026-06-21T00:00:00Z', updated_at: '2026-06-21T00:00:00Z' },
              { id: 12, code: 'KG', name: 'Kilogram', precision: 2, is_active: true, created_at: '2026-06-21T00:00:00Z', updated_at: '2026-06-21T00:00:00Z' },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 25, total: 2 },
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      })
    })

    page.on('dialog', (dialog) => void dialog.accept())

    await page.goto('/master-data/units')
    await expect(page.getByText('Kilogram')).toBeVisible()

    // pilih semua baris via checkbox header, lalu jalankan bulk nonaktifkan
    await page.getByRole('checkbox').first().click()
    await page.getByRole('button', { name: 'Nonaktifkan', exact: true }).click()

    await expect.poll(() => [...deactivated].sort((a, b) => a - b)).toEqual([11, 12])
  })
})
