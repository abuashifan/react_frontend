import { test, expect, seedAuth } from '../fixtures/test'

const mappings = [
  {
    id: 1,
    mapping_key: 'sales.accounts_receivable',
    module: 'sales',
    label: 'Piutang Usaha',
    description: 'Akun piutang default untuk invoice penjualan.',
    account_id: 11,
    account_types: ['asset'],
    is_required: true,
    is_active: true,
    visible_in_settings: true,
    settings_section: 'Pembelian & Penjualan',
    settings_order: 10,
    account_code: '1120',
    account_name: 'Piutang Usaha',
    account: {
      id: 11,
      account_code: '1120',
      account_name: 'Piutang Usaha',
      account_type: 'asset',
      is_active: true,
    },
  },
  {
    id: 2,
    mapping_key: 'journal.suspense',
    module: 'journal',
    label: 'Akun Suspense',
    description: null,
    account_id: null,
    account_types: ['asset'],
    is_required: false,
    is_active: true,
    visible_in_settings: false,
    settings_section: 'Internal',
    settings_order: 999,
    account_code: null,
    account_name: null,
    account: null,
  },
]

test.describe('Phase 25 account mapping canonical', () => {
  test('preload label, metadata visibility, filtered dirty save, dan endpoint canonical', async ({ page, errors }) => {
    await seedAuth(page)
    const patchRequests: Array<{ url: string; body: unknown }> = []

    await page.route('**/api/**', async (route) => {
      const request = route.request()
      const url = request.url()

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

      if (url.includes('/master-data/account-mappings') && request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mappings }),
        })
        return
      }

      if (url.includes('/master-data/chart-of-accounts') && request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [
                {
                  id: 12,
                  account_code: '1130',
                  account_name: 'Piutang Karyawan',
                  account_type: 'asset',
                  is_active: true,
                },
              ],
              current_page: 1,
              last_page: 1,
              per_page: 10,
              total: 1,
            },
          }),
        })
        return
      }

      if (url.endsWith('/master-data/account-mappings') && request.method() === 'PATCH') {
        patchRequests.push({ url, body: request.postDataJSON() })
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mappings }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      })
    })

    await page.goto('/settings/account-mapping')

    const receivableSelect = page.getByRole('button', { name: 'Piutang Usaha (wajib)' })
    await expect(receivableSelect).toContainText('Piutang Usaha')
    await expect(receivableSelect).not.toContainText('ID 11')
    await expect(page.getByText('Akun Suspense')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Simpan Perubahan' })).toBeDisabled()

    await receivableSelect.click()
    await page.getByRole('option', { name: /Piutang Karyawan/ }).click()
    await expect(page.getByText('1 perubahan belum disimpan')).toBeVisible()
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

    await expect.poll(() => patchRequests.length).toBe(1)
    expect(patchRequests[0].url).not.toContain('undefined')
    expect(patchRequests[0].body).toEqual({
      mappings: [{
        mapping_key: 'sales.accounts_receivable',
        account_id: 12,
      }],
    })
    expect(errors.console).toEqual([])
    expect(errors.page).toEqual([])
    expect(errors.failedRequests).toEqual([])
  })
})
