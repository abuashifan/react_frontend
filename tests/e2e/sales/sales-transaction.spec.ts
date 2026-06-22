import { expect, seedAuth, test } from '../fixtures/test'
import type { Page, Route } from '@playwright/test'
import type { RuntimeErrors } from '../fixtures/test'

async function fulfill(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  })
}

async function mockPermissions(page: Page) {
  await page.route('**/api/**/auth/permissions', (route) => fulfill(route, {
    success: true,
    data: { role: 'owner', permission_mode: 'all', permissions: ['*'] },
  }))
}

function expectRuntimeClean(errors: RuntimeErrors) {
  expect(errors.page).toEqual([])
  expect(errors.failedRequests).toEqual([])
}

test.describe('Phase 28 - Sales transaction contract', () => {
  test('A13-136/138/140/145 - return payload keeps canonical source linkage', async ({ page, errors }) => {
    await seedAuth(page)
    await page.route('**/api/**', (route) => fulfill(route, { success: true, data: {} }))
    await mockPermissions(page)

    let requestPayload: Record<string, unknown> | null = null
    await page.route('**/api/**/sales/source-documents**', (route) => fulfill(route, {
      success: true,
      data: [{
        id: 91,
        source_id: 91,
        target_type: 'sales.returns',
        source_type: 'sales_invoice',
        document_number: 'INV-AUDIT-091',
        document_date: '2026-06-20',
        status: 'posted',
        partner_id: 7,
        header: { customer_id: 7 },
        lines: [{
          id: 911,
          sales_invoice_line_id: 911,
          product_id: 12,
          description: 'Audit item',
          remaining_quantity: 2,
          quantity: 2,
          unit_price: 50000,
        }],
      }],
      meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
    }))
    await page.route('**/api/**/sales/returns', async (route) => {
      requestPayload = route.request().postDataJSON() as Record<string, unknown>
      await fulfill(route, { success: true, data: { id: 300 } })
    })
    await page.route(/\/api\/sales\/returns\/300(?:\?.*)?$/, (route) => fulfill(route, {
      success: true,
      data: { id: 300, return_number: 'SR-AUDIT-300', return_date: '2026-06-22', status: 'draft', customer_id: 7, lines: [] },
    }))

    await page.goto('/sales/returns/create')
    await page.getByRole('button', { name: 'Pilih Invoice' }).click()
    await page.getByRole('button', { name: /INV-AUDIT-091/ }).click()
    await page.getByRole('button', { name: 'Pilih', exact: true }).click()
    await expect(page.getByText('INV-AUDIT-091')).toBeVisible()
    await expect(page.getByLabel('Kuantitas retur')).toHaveValue('2')
    await page.getByRole('button', { name: 'Simpan Draft' }).click()

    await expect.poll(() => requestPayload).not.toBeNull()
    expect(requestPayload).toMatchObject({
      customer_id: 7,
      return_date: expect.any(String),
      sales_invoice_id: 91,
      lines: [expect.objectContaining({ sales_invoice_line_id: 911, quantity: 2 })],
    })
    await page.waitForURL('**/sales/returns/300')
    await page.waitForTimeout(100)
    expectRuntimeClean(errors)
  })

  test('A13-137/142/144 - receipt detail adapter and post confirmation remain explicit', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/sales/receipts/44', (route) => fulfill(route, {
      success: true,
      data: {
        id: 44,
        receipt_number: 'RCPT-AUDIT-044',
        receipt_date: '2026-06-21',
        customer_id: 7,
        customer: { id: 7, contact_code: 'C-007', contact_name: 'Audit Customer' },
        cash_bank_account_id: 2,
        cash_bank_account: { id: 2, account_code: '1002', account_name: 'Bank Utama' },
        amount: 250000,
        status: 'draft',
        lines: [{
          id: 1,
          sales_invoice_id: 91,
          amount: 250000,
          sales_invoice: { id: 91, invoice_number: 'INV-AUDIT-091', balance_due: 250000 },
        }],
      },
    }))
    await page.route('**/api/**/sales/receipts/customer-context**', (route) => fulfill(route, {
      success: true,
      data: {
        customer_id: 7,
        gross_ar_outstanding: 250000,
        official_ar_balance: 250000,
        unapplied_deposit_total: 50000,
        net_customer_exposure: 200000,
        open_invoices: [],
        available_deposits: [],
      },
    }))

    await page.goto('/sales/receipts/44')
    await expect(page.getByText('RCPT-AUDIT-044').first()).toBeVisible()
    await expect(page.getByText('INV-AUDIT-091')).toBeVisible()
    await expect(page.getByText('Bank Utama')).toBeVisible()
    await page.getByRole('button', { name: 'Post', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Post Penerimaan' })).toBeVisible()
    await expect(page.getByText(/membuat jurnal kas\/bank/)).toBeVisible()
    expectRuntimeClean(errors)
  })

  test('A13-149/154 - AR API failure renders an error state, not an empty table', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/sales/ar/customer-summary**', (route) => fulfill(route, {
      success: false,
      code: 'DATABASE_ERROR',
      message: 'Database unavailable',
    }, 500))

    await page.goto('/sales/ar/summary')
    await expect(page.getByText('Ringkasan AR gagal dimuat')).toBeVisible()
    await expect(page.getByText('Tidak ada data AR')).toHaveCount(0)
    expect(errors.page).toEqual([])
  })
})
