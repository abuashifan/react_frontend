import { test, expect } from '@playwright/test'

test.use({ timezoneId: 'Asia/Jakarta' })

test('receipt form shows invoice numbers from the backend and only offers cash/bank accounts', async ({ page }) => {
  await page.addInitScript(() => {
    const permissions = ['sales.receipts.view', 'sales.receipts.create', 'sales.receipts.edit']
    localStorage.setItem('seaside-auth', JSON.stringify({ state: {
      token: 'mock-token', user: { id: 1, name: 'Test', email: 'test@example.com', permissions },
      permissions, permissionsLoaded: true, activeCompanyId: 1, rememberMe: true,
      companies: [{ id: 1, name: 'Test Company', products: ['accounting'], settings: { currency: 'IDR', timezone: 'Asia/Jakarta', session_timeout_minutes: 120 } }],
    }, version: 0 }))
  })
  const accountQueries: URLSearchParams[] = []
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.split('/api')[1]
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 405, json: { message: 'Mutations disabled in browser tests' } })
    } else if (path === '/auth/me') {
      await route.fulfill({ json: { data: { user: { id: 1, name: 'Test', email: 'test@example.com' }, subscription: null } } })
    } else if (path === '/sales/receipts') {
      await route.fulfill({ json: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } })
    } else if (path === '/settings/company/workflow') {
      await route.fulfill({ json: { data: { transaction_workflow_mode: 'draft_then_post', auto_post_transactions: false, approval_enabled: false, allow_void_transactions: true, transaction_edit_mode: 'lock' } } })
    } else if (path === '/master-data/contacts') {
      await route.fulfill({ json: { data: [{ id: 1, name: 'Customer Alpha' }] } })
    } else if (path === '/master-data/chart-of-accounts') {
      accountQueries.push(url.searchParams)
      await route.fulfill({ json: { data: [{ id: 10, account_code: '1101', account_name: 'Kas Utama' }], meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 } } })
    } else if (path === '/sales/receipts/customer-context') {
      // Bentuk asli backend: `invoice_id` dan `invoice_number`.
      await route.fulfill({ json: { data: { open_invoices: [
        { invoice_id: 301, invoice_number: 'INV-301', grand_total: '150000.00', balance_due: '100000.00' },
      ] } } })
    } else {
      await route.fulfill({ status: 404, json: { message: 'Unmocked endpoint' } })
    }
  })

  await page.goto('/')
  await page.getByRole('navigation', { name: 'Modul' }).getByRole('button', { name: 'Penjualan' }).click()
  await page.getByRole('button', { name: 'Penerimaan Penjualan', exact: true }).click()
  await page.getByRole('button', { name: /Catat Penerimaan/ }).click()
  await page.getByRole('button', { name: /Pilih pelanggan/ }).click()
  await page.getByRole('option', { name: /Customer Alpha/ }).click()
  const chip = page.getByRole('button', { name: /INV-301/ })
  await expect(chip).toBeVisible()
  await chip.click()

  const table = page.getByRole('table').filter({ has: page.getByRole('textbox', { name: 'Discount INV-301' }) })
  await expect(table.getByRole('row').filter({ hasText: 'INV-301' }).first()).toContainText('150.000')
  await expect(page.getByText('undefined')).toHaveCount(0)

  await page.getByRole('button', { name: /Pilih akun/ }).click()
  await expect.poll(() => accountQueries.some((q) => q.get('is_cash_bank') === 'true' && q.get('is_active') === 'true')).toBe(true)
})
