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

async function mockPermissions(page: Page, permissions: string[] = ['*']) {
  await page.route('**/api/**/auth/permissions', (route) => fulfill(route, {
    success: true,
    data: { role: 'owner', permission_mode: 'all', permissions },
  }))
}

function expectRuntimeClean(errors: RuntimeErrors) {
  expect(errors.page).toEqual([])
  expect(errors.failedRequests).toEqual([])
}

test.describe('Phase 29 - AR subledger and reports', () => {
  test('A13-155/158/159 - summary and aging use canonical adapters and as-of cutoff', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)

    const summaryRequests: string[] = []
    const agingRequests: string[] = []

    await page.route('**/api/**/sales/ar/customer-summary**', async (route) => {
      summaryRequests.push(route.request().url())
      await fulfill(route, {
        success: true,
        data: [
          {
            customer_id: 7,
            customer_name: 'AUDIT Customer A',
            balance: 250000,
            gross_ar_outstanding: 250000,
            official_ar_balance: 250000,
            unapplied_deposit_total: 50000,
            net_customer_exposure: 200000,
            ar_accounts: [{ account_id: 11, account_code: '1100', account_name: 'AR' }],
          },
          {
            customer_id: 8,
            customer_name: 'AUDIT Customer B',
            balance: 125000,
            gross_ar_outstanding: 125000,
            official_ar_balance: 125000,
            unapplied_deposit_total: 0,
            net_customer_exposure: 125000,
            ar_accounts: [{ account_id: 12, account_code: '1110', account_name: 'AR B' }],
          },
        ],
      })
    })

    await page.route('**/api/**/sales/ar/aging**', async (route) => {
      agingRequests.push(route.request().url())
      await fulfill(route, {
        success: true,
        data: {
          as_of_date: '2026-06-21',
          buckets: { current: 100000, '1_30': 50000, '31_60': 75000, '61_90': 25000, over_90: 0 },
          total: 250000,
          customers: [
            {
              customer_id: 7,
              customer_name: 'AUDIT Customer A',
              buckets: { current: 100000, '1_30': 50000, '31_60': 75000, '61_90': 25000, over_90: 0 },
              total: 250000,
            },
          ],
        },
      })
    })

    await page.goto('/sales/ar/summary')
    await page.getByLabel('Per Tanggal').fill('2026-06-21')
    await expect.poll(() => summaryRequests.some((url) => new URL(url).searchParams.get('as_of_date') === '2026-06-21')).toBe(true)
    await expect(page.getByText('AUDIT Customer A')).toBeVisible()
    await expect(page.locator('tbody').getByText('Rp250.000')).toBeVisible()
    await expect(page.locator('tbody').getByText('Rp50.000')).toBeVisible()
    await expect(page.locator('tfoot').getByText('Rp375.000')).toBeVisible()
    await expect(page.locator('tfoot').getByText('2')).toBeVisible()

    await page.goto('/sales/ar/aging')
    await page.getByLabel('Per Tanggal').fill('2026-06-21')
    await expect.poll(() => agingRequests.some((url) => new URL(url).searchParams.get('as_of_date') === '2026-06-21')).toBe(true)
    await expect(page.getByText('AUDIT Customer A')).toBeVisible()
    await expect(page.locator('tbody').getByText('Rp100.000')).toBeVisible()
    await expect(page.locator('tfoot').getByText('Rp250.000')).toBeVisible()

    expectRuntimeClean(errors)
  })

  test('A13-156/157 - reconciliation and ledgers render aggregate and running balance canonically', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)

    const reconciliationRequests: string[] = []
    const customerLedgerRequests: string[] = []
    const invoiceLedgerRequests: string[] = []

    await page.route('**/api/**/sales/ar/reconciliation**', async (route) => {
      reconciliationRequests.push(route.request().url())
      await fulfill(route, {
        success: true,
        data: {
          subsidiary_balance: 150000,
          gl_ar_balance: 175000,
          difference: -25000,
          is_reconciled: false,
        },
      })
    })

    await page.route('**/api/**/sales/ar/customers/7/ledger**', async (route) => {
      customerLedgerRequests.push(route.request().url())
      const url = new URL(route.request().url())
      if (url.searchParams.get('end_date') === '2026-05-21') {
        await fulfill(route, {
          success: true,
          data: {
            customer_id: 7,
            movements: [
              {
                document_id: 1,
                date: '2026-05-20',
                document_type: 'sales_invoice',
                document_number: 'INV-AUDIT-001',
                description: 'Sales invoice INV-AUDIT-001',
                debit: 200000,
                credit: 0,
                balance: 200000,
              },
              {
                document_id: 2,
                date: '2026-05-21',
                document_type: 'sales_receipt',
                document_number: 'RCPT-AUDIT-002',
                description: 'Sales receipt RCPT-AUDIT-002',
                debit: 0,
                credit: 50000,
                balance: 150000,
              },
            ],
          },
        })
        return
      }

      await fulfill(route, {
        success: true,
        data: {
          customer_id: 7,
          movements: [
            {
              document_id: 1,
              date: '2026-05-20',
              document_type: 'sales_invoice',
              document_number: 'INV-AUDIT-001',
              description: 'Sales invoice INV-AUDIT-001',
              debit: 200000,
              credit: 0,
              balance: 200000,
            },
            {
              document_id: 2,
              date: '2026-05-21',
              document_type: 'sales_receipt',
              document_number: 'RCPT-AUDIT-002',
              description: 'Sales receipt RCPT-AUDIT-002',
              debit: 0,
              credit: 50000,
              balance: 150000,
            },
            {
              document_id: 3,
              date: '2026-05-22',
              document_type: 'sales_return',
              document_number: 'SR-AUDIT-003',
              description: 'Sales return SR-AUDIT-003',
              debit: 0,
              credit: 25000,
              balance: 125000,
            },
          ],
        },
      })
    })

    await page.route('**/api/**/sales/ar/invoices/44/ledger**', async (route) => {
      invoiceLedgerRequests.push(route.request().url())
      const url = new URL(route.request().url())
      if (url.searchParams.get('end_date') === '2026-05-21') {
        await fulfill(route, {
          success: true,
          data: {
            invoice_id: 44,
            movements: [
              {
                document_id: 10,
                date: '2026-05-20',
                document_type: 'sales_invoice',
                document_number: 'INV-AUDIT-044',
                description: 'Sales invoice INV-AUDIT-044',
                debit: 200000,
                credit: 0,
                balance: 200000,
              },
              {
                document_id: 11,
                date: '2026-05-21',
                document_type: 'sales_receipt',
                document_number: 'RCPT-AUDIT-011',
                description: 'Sales receipt RCPT-AUDIT-011',
                debit: 0,
                credit: 50000,
                balance: 150000,
              },
            ],
          },
        })
        return
      }

      await fulfill(route, {
        success: true,
        data: {
          invoice_id: 44,
          movements: [
            {
              document_id: 10,
              date: '2026-05-20',
              document_type: 'sales_invoice',
              document_number: 'INV-AUDIT-044',
              description: 'Sales invoice INV-AUDIT-044',
              debit: 200000,
              credit: 0,
              balance: 200000,
            },
            {
              document_id: 11,
              date: '2026-05-21',
              document_type: 'sales_receipt',
              document_number: 'RCPT-AUDIT-011',
              description: 'Sales receipt RCPT-AUDIT-011',
              debit: 0,
              credit: 50000,
              balance: 150000,
            },
            {
              document_id: 12,
              date: '2026-05-22',
              document_type: 'sales_return',
              document_number: 'SR-AUDIT-012',
              description: 'Sales return SR-AUDIT-012',
              debit: 0,
              credit: 25000,
              balance: 125000,
            },
          ],
        },
      })
    })

    await page.goto('/sales/ar/reconciliation')
    await page.getByLabel('Per Tanggal').fill('2026-06-21')
    await expect.poll(() => reconciliationRequests.some((url) => new URL(url).searchParams.get('as_of_date') === '2026-06-21')).toBe(true)
    await expect(page.getByText('Saldo Subledger')).toBeVisible()
    await expect(page.getByText('Rp150.000').first()).toBeVisible()
    await expect(page.getByText('Ada selisih antara AR subledger dan GL pada cutoff ini.')).toBeVisible()

    await page.goto('/sales/ar/customer-ledger/7')
    await page.getByLabel('Dari').fill('2026-05-20')
    await page.getByLabel('Sampai').fill('2026-05-21')
    await expect.poll(() => customerLedgerRequests.some((url) => new URL(url).searchParams.get('end_date') === '2026-05-21')).toBe(true)
    await expect(page.getByText('INV-AUDIT-001')).toBeVisible()
    await expect(page.getByText('RCPT-AUDIT-002')).toBeVisible()
    await expect(page.getByText('Saldo Akhir:')).toBeVisible()
    await expect(page.getByText('Rp150.000').first()).toBeVisible()

    await page.goto('/sales/ar/invoice-ledger/44')
    await page.getByLabel('Dari').fill('2026-05-20')
    await page.getByLabel('Sampai').fill('2026-05-21')
    await expect.poll(() => invoiceLedgerRequests.some((url) => new URL(url).searchParams.get('end_date') === '2026-05-21')).toBe(true)
    await expect(page.getByText('INV-AUDIT-044')).toBeVisible()
    await expect(page.getByText('RCPT-AUDIT-011')).toBeVisible()
    await expect(page.getByText('Saldo Akhir:')).toBeVisible()
    await expect(page.getByText('Rp150.000').first()).toBeVisible()

    expectRuntimeClean(errors)
  })

  test('A13-160 - reconciliation route requires sales.ar.reconcile permission', async ({ page, errors }) => {
    await page.addInitScript(
      ([key, value]) => {
        window.localStorage.setItem(key, value)
      },
      ['seaside-auth', JSON.stringify({
        state: {
          token: 'test-token',
          user: { id: 1, name: 'Audit Tester', email: 'admin@example.com', permissions: ['sales.ar.view'] },
          permissions: ['sales.ar.view'],
          permissionsLoaded: true,
          companies: [
            { id: 1, name: 'AUDIT Co', last_accessed_at: null, settings: { onboarding_completed: true } },
          ],
          activeCompanyId: 1,
        },
        version: 0,
      })] as const,
    )

    await mockPermissions(page, ['sales.ar.view'])
    await page.goto('/sales/ar/reconciliation')
    await expect(page).toHaveURL(/\/403$/)
    expectRuntimeClean(errors)
  })
})
