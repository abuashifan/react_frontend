import { test, expect, seedAuth } from '../fixtures/test'
import type { Page, Route } from '@playwright/test'
import type { RuntimeErrors } from '../fixtures/test'

async function mockPermissions(page: Page) {
  await page.route('**/api/**/auth/permissions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { role: 'owner', permission_mode: 'all', permissions: ['*'] } }),
    })
  })
}

async function fulfill(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  })
}

function expectRuntimeClean(errors: RuntimeErrors) {
  expect(errors.page).toEqual([])
  expect(errors.failedRequests).toEqual([])
}

const cashAccounts = {
  success: true,
  data: {
    include_inactive: false,
    accounts: [
      { id: 1, account_code: '1001', account_name: 'Kas Kecil', account_type: 'asset', normal_balance: 'debit', is_cash_bank: true, is_active: true },
      { id: 2, account_code: '1002', account_name: 'Bank Utama', account_type: 'asset', normal_balance: 'debit', is_cash_bank: true, is_active: true },
    ],
  },
}

const offsetAccounts = {
  success: true,
  data: [
    { id: 9, account_code: '4001', account_name: 'Pendapatan Lain', account_type: 'revenue', is_active: true },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
}

const reconciliation = {
  id: 10,
  reconciliation_number: 'BR-AUDIT-010',
  cash_bank_account_id: 2,
  cash_bank_account: { id: 2, account_code: '1002', account_name: 'Bank Utama' },
  statement_start_date: '2026-01-01',
  statement_end_date: '2026-01-31',
  statement_opening_balance: 500,
  statement_ending_balance: 1500,
  status: 'draft',
  notes: 'AUDIT',
  lines: [
    {
      id: 101,
      journal_entry_id: 20,
      journal_entry_line_id: 201,
      journal_date: '2026-01-15',
      journal_number: 'JV-AUDIT-001',
      description: 'Penerimaan',
      debit: 1000,
      credit: 0,
      is_cleared: true,
      cleared_date: '2026-01-31',
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
}

test.describe('Phase 27 — Cash & Bank', () => {
  test('A13-116/117 — receipt requires valid allocation and matching total before request', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)
    let postCount = 0
    await page.route('**/api/**/cash-bank/accounts', (route) => fulfill(route, cashAccounts))
    await page.route('**/api/**/master-data/chart-of-accounts**', (route) => fulfill(route, offsetAccounts))
    await page.route('**/api/**/cash-bank/cash-receipts', async (route) => {
      if (route.request().method() === 'POST') postCount += 1
      await fulfill(route, { success: true, data: {} })
    })

    await page.goto('/cash-bank/cash-receipts/create')
    await page.getByRole('button', { name: 'Akun kas atau bank penerimaan' }).click()
    await page.getByRole('option', { name: /Kas Kecil/ }).click()
    await page.getByRole('spinbutton', { name: /^Jumlah/ }).first().fill('100')
    await page.getByRole('button', { name: 'Simpan', exact: true }).click()
    await expect(page.getByText('Akun lawan wajib dipilih')).toBeVisible()
    expect(postCount).toBe(0)

    await page.getByRole('button', { name: 'Akun lawan baris 1' }).click()
    await page.getByRole('option', { name: /Pendapatan Lain/ }).click()
    await page.getByLabel('Jumlah alokasi baris 1').fill('90')
    await page.getByRole('button', { name: 'Simpan', exact: true }).click()
    await expect(page.getByText('Total alokasi harus sama dengan jumlah header')).toBeVisible()
    expect(postCount).toBe(0)
    expectRuntimeClean(errors)
  })

  test('A13-118/120/123/124/126 — transfer draft is editable, same account blocked, post confirmed', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)
    let patchCount = 0
    await page.route('**/api/**/cash-bank/accounts', (route) => fulfill(route, cashAccounts))
    await page.route('**/api/**/cash-bank/bank-transfers/7', async (route) => {
      if (route.request().method() === 'PATCH') patchCount += 1
      await fulfill(route, {
        success: true,
        data: {
          id: 7,
          transfer_number: 'BT-AUDIT-007',
          transfer_date: '2026-01-20',
          from_cash_bank_account_id: 1,
          from_cash_bank_account: { id: 1, account_code: '1001', account_name: 'Kas Kecil' },
          to_cash_bank_account_id: 2,
          to_cash_bank_account: { id: 2, account_code: '1002', account_name: 'Bank Utama' },
          currency_code: 'IDR',
          exchange_rate: 1,
          amount: 100,
          status: 'draft',
          created_at: '2026-01-20T00:00:00Z',
        },
      })
    })
    await page.route('**/api/**/cash-bank/bank-transfers/7/post', (route) => fulfill(route, { success: true, data: { status: 'posted' } }))

    await page.goto('/cash-bank/bank-transfers/7')
    await expect(page.getByLabel('Jumlah')).toBeEnabled()
    await expect(page.getByLabel('Mata Uang')).toHaveValue('IDR')
    await page.getByRole('button', { name: 'Akun tujuan transfer' }).click()
    await page.getByRole('option', { name: /Kas Kecil/ }).click()
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
    await expect(page.getByText('Akun tujuan harus berbeda dari akun asal')).toBeVisible()
    expect(patchCount).toBe(0)

    await page.getByRole('button', { name: 'Post', exact: true }).click()
    await expect(page.getByText('Post transfer bank?')).toBeVisible()
    expectRuntimeClean(errors)
  })

  test('A13-127/130/132/135 — reconciliation adapter and balance formula render correctly', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)
    await page.route('**/api/**/cash-bank/bank-reconciliations/10', (route) => fulfill(route, { success: true, data: reconciliation }))

    await page.goto('/cash-bank/bank-reconciliations/10')
    await expect(page.getByText('JV-AUDIT-001')).toBeVisible()
    await expect(page.getByText('Rp 1.000').first()).toBeVisible()
    await expect(page.getByText('Rp 0').last()).toBeVisible()
    const clearedDate = page.getByLabel('Tanggal cleared')
    await expect(clearedDate).toHaveAttribute('min', '2026-01-01')
    await expect(clearedDate).toHaveAttribute('max', '2026-01-31')
    const difference = page.getByText('Selisih').locator('..')
    await expect(difference).toBeVisible()
    const box = await difference.boundingBox()
    expect(box?.y).toBeLessThan(844)
    expectRuntimeClean(errors)
  })

  test('A13-128/129/131 — immutable period, safe refresh confirmation, finalize lifecycle', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)
    const calls: string[] = []
    await page.route('**/api/**/cash-bank/bank-reconciliations/10', (route) => fulfill(route, { success: true, data: reconciliation }))
    await page.route('**/api/**/cash-bank/bank-reconciliations/10/refresh-lines', async (route) => {
      calls.push(`${route.request().method()} refresh ${route.request().postData()}`)
      await fulfill(route, { success: true, data: reconciliation })
    })
    await page.route('**/api/**/cash-bank/bank-reconciliations/10/finalize', async (route) => {
      calls.push(`${route.request().method()} finalize`)
      await fulfill(route, { success: true, data: { ...reconciliation, status: 'finalized' } })
    })

    await page.goto('/cash-bank/bank-reconciliations/10')
    await expect(page.getByLabel('Tanggal Mulai')).toBeDisabled()
    await expect(page.getByLabel('Tanggal Akhir')).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Akun bank rekonsiliasi' })).toBeDisabled()

    await page.getByRole('button', { name: /Muat Ulang/ }).click()
    await expect(page.getByText('Status cleared untuk journal line yang sama tetap dipertahankan.')).toBeVisible()
    await page.getByRole('button', { name: 'Muat Ulang', exact: true }).last().click()
    await expect.poll(() => calls.some((call) => call.includes('POST refresh') && call.includes('"reset_cleared":false'))).toBe(true)

    await page.getByRole('button', { name: 'Finalisasi' }).click()
    await expect(page.getByText('Finalisasi rekonsiliasi?')).toBeVisible()
    await page.getByRole('button', { name: 'Finalisasi', exact: true }).last().click()
    await expect.poll(() => calls).toContain('POST finalize')
    expectRuntimeClean(errors)
  })

  test('A13-121/122/134 — list sends server filters and shows API error separately', async ({ page, errors }) => {
    await seedAuth(page)
    await mockPermissions(page)
    const urls: string[] = []
    await page.route('**/api/**/cash-bank/bank-reconciliations**', async (route) => {
      urls.push(route.request().url())
      await fulfill(route, { success: false, code: 'DATABASE_ERROR', message: 'Database unavailable' }, 500)
    })
    await page.route('**/api/**/cash-bank/accounts', (route) => fulfill(route, cashAccounts))

    await page.goto('/cash-bank/bank-reconciliations')
    await expect(page.getByText('Rekonsiliasi bank gagal dimuat')).toBeVisible()
    await expect(page.getByText('Belum ada rekonsiliasi bank')).toHaveCount(0)
    await page.getByLabel('Cari rekonsiliasi bank').fill('AUDIT')
    await expect.poll(() => urls.some((url) => url.includes('search=AUDIT'))).toBe(true)
    expectRuntimeClean(errors)
  })
})
