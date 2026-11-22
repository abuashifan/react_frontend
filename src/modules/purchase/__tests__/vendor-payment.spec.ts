import { test, expect, type Page } from '@playwright/test'

test.use({ timezoneId: 'Asia/Jakarta' })

const payment = {
  id: 77, payment_number: 'PAY-77', payment_date: '2026-11-19', vendor_id: 1,
  vendor: { id: 1, name: 'Vendor Alpha' }, cash_bank_account_id: 10,
  cash_bank_account: { id: 10, account_code: '1101', account_name: 'Kas Utama' },
  amount: '25000', status: 'draft', lines: [{ id: 1, vendor_bill_id: 101, vendor_bill: { bill_number: 'VB-101' }, amount: '25000', balance_due: '100000' }],
  created_at: '2026-11-19', updated_at: '2026-11-19',
}

async function setup(page: Page, multipleBills = false) {
  await page.addInitScript(() => {
    const permissions = ['purchase.payments.view', 'purchase.payments.create', 'purchase.payments.edit', 'purchase.payments.print']
    localStorage.setItem('seaside-auth', JSON.stringify({ state: {
      token: 'mock-token', user: { id: 1, name: 'Test', email: 'test@example.com', permissions },
      permissions, permissionsLoaded: true, activeCompanyId: 1, rememberMe: true,
      companies: [{ id: 1, name: 'Test Company', products: ['accounting'], settings: { currency: 'IDR', timezone: 'Asia/Jakarta', session_timeout_minutes: 120 } }],
    }, version: 0 }))
  })
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.split('/api')[1]
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 405, json: { message: 'Mutations disabled in browser tests' } })
      return
    }
    if (path === '/auth/me') {
      await route.fulfill({ json: { data: { user: { id: 1, name: 'Test', email: 'test@example.com' }, subscription: null } } })
    } else if (path === '/dashboard/summary') {
      await route.fulfill({ json: { data: { total_receivable: null, total_payable: null, cash_balance: null, current_month_profit: null } } })
    } else if (path === '/dashboard/pending') {
      await route.fulfill({ json: { data: { pending_invoices: 0, pending_bills: 0, low_stock_count: 0, fiscal_year_days_remaining: null } } })
    } else if (path === '/dashboard/chart') {
      await route.fulfill({ json: { data: { sales_purchase: [], cash_flow: [] } } })
    } else if (path === '/dashboard/activities') {
      await route.fulfill({ json: { data: [] } })
    } else if (path === '/settings/company/workflow') {
      await route.fulfill({ json: { data: { transaction_workflow_mode: 'draft_then_post', auto_post_transactions: false, approval_enabled: false, allow_void_transactions: true, transaction_edit_mode: 'lock' } } })
    } else if (path === '/settings/company/letterhead') {
      await route.fulfill({ json: { data: { name: 'Test Company' } } })
    } else if (path === '/master-data/contacts') {
      await route.fulfill({ json: { data: [{ id: 1, name: 'Vendor Alpha' }, { id: 2, name: 'Vendor Empty' }, { id: 3, name: 'Vendor Error' }] } })
    } else if (path === '/master-data/chart-of-accounts') {
      const type = url.searchParams.get('account_type')
      const data = type === 'expense' ? [{ id: 41, account_code: '5110', account_name: 'Potongan pembelian' }]
        : type === 'revenue' ? [{ id: 42, account_code: '4190', account_name: 'Rebate vendor' }]
        : [{ id: 10, account_code: '1101', account_name: 'Kas Utama' }, { id: 11, account_code: '1102', account_name: 'Bank Kedua' }]
      await route.fulfill({ json: { data, meta: { current_page: 1, last_page: 1, per_page: 25, total: data.length } } })
    } else if (path === '/purchase/payments/vendor-context') {
      const id = url.searchParams.get('vendor_id')
      if (id === '3') await route.fulfill({ status: 500, json: { message: 'Konteks vendor gagal dimuat' } })
      else await route.fulfill({ json: { data: {
        open_bills: id === '1' ? [
          { bill_id: 101, bill_number: 'VB-101', grand_total: '125000.00', balance_due: '100000.00' },
          ...(multipleBills ? [{ bill_id: 102, bill_number: 'VB-102', grand_total: '200000.00', balance_due: '200000.00' }] : []),
        ] : [],
      } } })
    } else if (path === '/purchase/payments/cash-balance') {
      const id = Number(url.searchParams.get('cash_bank_account_id'))
      await route.fulfill({ json: { data: { account_id: id, balance: id === 10 ? 200000 : 300000, normal_balance: 'debit', as_of: url.searchParams.get('payment_date'), calculated_at: '2026-11-19T00:00:00Z' } } })
    } else if (path === '/purchase/payments') {
      await route.fulfill({ json: { data: [payment], meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 } } })
    } else if (path === '/purchase/payments/77') {
      await route.fulfill({ json: { data: payment } })
    } else if (path === '/purchase/payments/adjacent') {
      await route.fulfill({ json: { data: { previous: null, next: null } } })
    } else {
      await route.fulfill({ status: 404, json: { message: 'Unmocked endpoint' } })
    }
  })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Modul' }).getByRole('button', { name: 'Pembelian' }).click()
  await page.getByRole('button', { name: 'Pembayaran', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Buat Pembayaran', exact: true })).toBeVisible()
}

async function createPayment(page: Page) {
  await page.getByRole('button', { name: 'Buat Pembayaran', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Vendor pembayaran' })).toBeVisible()
}

async function choose(page: Page, trigger: string, option: string) {
  await page.getByRole('button', { name: trigger }).click()
  await page.getByRole('option', { name: new RegExp(option) }).click()
}

test('open bills appear immediately, payment amount leaves current cash balance intact, and vendor switch clears lines', async ({ page }) => {
  await setup(page)
  await createPayment(page)
  await choose(page, 'Vendor pembayaran', 'Vendor Alpha')
  await expect(page.getByText('Tagihan vendor yang belum lunas')).toBeVisible()
  await page.getByRole('button', { name: 'Tambahkan VB-101' }).click()
  const accountRequest = page.waitForRequest((request) => request.url().includes('/master-data/chart-of-accounts'))
  await choose(page, 'Akun kas/bank pembayaran', 'Kas Utama')
  const accountUrl = new URL((await accountRequest).url())
  expect(accountUrl.searchParams.get('is_cash_bank')).toBe('true')
  expect(accountUrl.searchParams.get('is_active')).toBe('true')
  const preview = page.getByTestId('payment-cash-preview')
  await expect(preview).toContainText('Saldo kas/bank saat ini')
  await expect(preview).toContainText('200.000')
  await page.getByRole('textbox', { name: 'Dibayar VB-101' }).fill('25000')
  await expect(preview).toContainText('200.000')
  await expect(preview).not.toContainText('175.000')
  await page.emulateMedia({ media: 'print' })
  await expect(preview).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
  await choose(page, 'Vendor pembayaran', 'Vendor Empty')
  await expect(page.getByText('Belum ada tagihan dipilih')).toBeVisible()
  await expect(page.getByText('Tidak ada tagihan terbuka.', { exact: false })).toBeVisible()
})

test('vendor errors are visible and the selected account uses today instead of the payment date', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-18T18:00:00Z'))
  await setup(page)
  await createPayment(page)
  await choose(page, 'Vendor pembayaran', 'Vendor Error')
  await expect(page.getByRole('alert').filter({ hasText: 'Konteks vendor gagal dimuat' })).toBeVisible({ timeout: 15000 })
  await choose(page, 'Akun kas/bank pembayaran', 'Kas Utama')
  await expect(page.getByTestId('payment-cash-preview')).toContainText('200.000')
  await page.locator('input[type=date]').fill('2026-10-15')
  const changedAccount = page.waitForRequest((request) => request.url().includes('/cash-balance') && new URL(request.url()).searchParams.get('cash_bank_account_id') === '11')
  await choose(page, 'Akun kas/bank pembayaran', 'Bank Kedua')
  const accountParams = new URL((await changedAccount).url()).searchParams
  expect(accountParams.get('payment_date')).toBe('2026-11-19')
  expect(accountParams.has('payment_id')).toBe(false)
  await expect(page.getByTestId('payment-cash-preview')).toContainText('300.000')
})

test('saved payment print preview does not include cash balance fields', async ({ page }) => {
  await setup(page)
  await page.getByRole('button', { name: 'PAY-77' }).click()
  await page.getByRole('button', { name: 'Cetak', exact: true }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Bukti Pembayaran')
  await expect(dialog).toContainText('VB-101')
  await expect(dialog).not.toContainText('Saldo kas/bank saat ini')
})

test('discount cells open a tabular dialog and save the selected account per bill', async ({ page }) => {
  await setup(page, true)
  await createPayment(page)
  await choose(page, 'Vendor pembayaran', 'Vendor Alpha')
  await choose(page, 'Akun kas/bank pembayaran', 'Kas Utama')
  await page.getByRole('button', { name: 'Tambahkan VB-101' }).click()
  await page.getByRole('button', { name: 'Tambahkan VB-102' }).click()
  const billTable = page.getByRole('table').filter({
    has: page.getByRole('textbox', { name: 'Discount VB-101' }),
  })
  await expect(billTable.locator('thead th')).toHaveText([
    '#', 'Nomor Bill', 'Jumlah', 'Dibayar', 'Discount', 'Sisa Tagihan', '',
  ])
  const firstBill = billTable.getByRole('row').filter({ hasText: 'VB-101' })
  await expect(firstBill.getByRole('cell').nth(2)).toContainText('125.000')
  await expect(page.getByRole('button', { name: /Potongan pelunasan VB/ })).toHaveCount(0)

  for (const [bill, account, discount, type] of [
    ['VB-101', '5110 Potongan pembelian', '5000', 'Beban'],
    ['VB-102', '4190 Rebate vendor', '10000', 'Pendapatan'],
  ]) {
    const discountCell = billTable.getByRole('textbox', { name: `Discount ${bill}` })
    if (bill === 'VB-101') await discountCell.focus()
    else await discountCell.click()
    const dialog = page.getByRole('dialog', { name: 'Info Potongan' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(bill)
    await expect(dialog.getByRole('columnheader', { name: 'Nama Akun' })).toBeVisible()
    await dialog.getByLabel('Nominal potongan').fill(discount)
    await dialog.getByRole('button', { name: 'Simpan potongan' }).click()
    await expect(dialog).toContainText('Pilih akun untuk potongan pelunasan.')
    await dialog.getByRole('button', { name: 'Akun potongan' }).click()
    const accountPicker = page.getByRole('dialog', { name: 'Pilih Akun Potongan' })
    await expect(accountPicker.getByRole('columnheader', { name: 'Nama Akun' })).toBeVisible()
    await accountPicker.getByRole('button', { name: type, exact: true }).click()
    await accountPicker.getByRole('button', { name: account, exact: true }).click()
    await expect(accountPicker).toBeHidden()
    await expect(dialog.getByRole('table')).toContainText(account.slice(5))
    await dialog.getByRole('button', { name: 'Simpan potongan' }).click()
    await expect(dialog).toBeHidden()
    await expect(discountCell).toBeFocused()
  }
  await expect(firstBill.getByRole('textbox', { name: 'Discount VB-101' })).toHaveValue(/5\.000/)
  await firstBill.getByRole('textbox', { name: 'Dibayar VB-101' }).fill('80000')
  await expect(firstBill.getByRole('cell').nth(5)).toContainText('15.000')
  await expect(page.getByText(/Kas dibayar:/)).toContainText('270.000')
  await expect(page.getByText(/Total mengurangi tagihan:/)).toContainText('285.000')
  await page.route('**/api/purchase/payments', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({ status: 201, json: { data: payment } })
  })
  const request = page.waitForRequest((r) => r.method() === 'POST' && new URL(r.url()).pathname.endsWith('/purchase/payments'))
  await page.getByRole('button', { name: 'Simpan & Tutup', exact: true }).click()
  expect((await request).postDataJSON()).toMatchObject({
    amount: 270000,
    lines: [
      { vendor_bill_id: 101, amount: 80000, settlement_discount_amount: 5000, settlement_discount_account_id: 41 },
      { vendor_bill_id: 102, amount: 190000, settlement_discount_amount: 10000, settlement_discount_account_id: 42 },
    ],
  })
})
