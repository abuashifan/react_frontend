import type { ApiResponse } from '@/types/api.types'
import type {
  ArAgingRow,
  ArAgingTotals,
  ArAgingView,
  ArReconciliationView,
  ArSummaryAccount,
  ArSummaryRow,
  ArSummaryTotals,
  ArSummaryView,
  CustomerLedgerEntry,
  CustomerLedgerView,
  InvoiceLedgerEntry,
  InvoiceLedgerView,
} from '../types/ar.types'

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as RawRecord) : {}
}

function asArray(value: unknown): RawRecord[] {
  return Array.isArray(value) ? (value as unknown[]).map(asRecord) : []
}

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function mapSummaryAccounts(value: unknown): ArSummaryAccount[] {
  return asArray(value).map((account) => ({
    account_id: num(account.account_id),
    account_code: str(account.account_code),
    account_name: str(account.account_name),
  }))
}

function adaptSummaryRows(value: unknown): ArSummaryRow[] {
  return asArray(value).map((row) => {
    const accounts = mapSummaryAccounts(row.ar_accounts)
    const balance = num(row.official_ar_balance ?? row.gross_ar_outstanding ?? row.balance)

    return {
      customer_id: num(row.customer_id),
      customer_name: str(row.customer_name),
      gross_ar_outstanding: num(row.gross_ar_outstanding ?? balance),
      official_ar_balance: balance,
      unapplied_deposit_total: num(row.unapplied_deposit_total),
      net_customer_exposure: num(row.net_customer_exposure ?? balance - num(row.unapplied_deposit_total)),
      ar_account_count: accounts.length,
      ar_accounts: accounts,
    }
  })
}

function adaptSummaryTotals(rows: ArSummaryRow[]): ArSummaryTotals {
  return rows.reduce<ArSummaryTotals>(
    (acc, row) => ({
      gross_ar_outstanding: acc.gross_ar_outstanding + row.gross_ar_outstanding,
      official_ar_balance: acc.official_ar_balance + row.official_ar_balance,
      unapplied_deposit_total: acc.unapplied_deposit_total + row.unapplied_deposit_total,
      net_customer_exposure: acc.net_customer_exposure + row.net_customer_exposure,
      ar_account_count: acc.ar_account_count + row.ar_account_count,
    }),
    {
      gross_ar_outstanding: 0,
      official_ar_balance: 0,
      unapplied_deposit_total: 0,
      net_customer_exposure: 0,
      ar_account_count: 0,
    },
  )
}

export function adaptArSummaryResponse(res: ApiResponse<unknown>): ApiResponse<ArSummaryView> {
  const rows = adaptSummaryRows(res.data)
  const raw = asRecord(res.meta)

  return {
    ...res,
    data: {
      as_of_date: str(raw.as_of_date),
      rows,
      totals: adaptSummaryTotals(rows),
    },
  }
}

function adaptAgingRows(value: unknown): ArAgingRow[] {
  return asArray(value).map((row) => {
    const buckets = asRecord(row.buckets)
    return {
      customer_id: num(row.customer_id),
      customer_name: str(row.customer_name),
      current: num(buckets.current),
      days_1_30: num(buckets['1_30']),
      days_31_60: num(buckets['31_60']),
      days_61_90: num(buckets['61_90']),
      days_over_90: num(buckets.over_90),
      total: num(row.total),
    }
  })
}

function adaptAgingTotals(value: unknown): ArAgingTotals {
  const buckets = asRecord(value)
  return {
    current: num(buckets.current),
    days_1_30: num(buckets['1_30']),
    days_31_60: num(buckets['31_60']),
    days_61_90: num(buckets['61_90']),
    days_over_90: num(buckets.over_90),
    total: num(buckets.current) + num(buckets['1_30']) + num(buckets['31_60']) + num(buckets['61_90']) + num(buckets.over_90),
  }
}

export function adaptArAgingResponse(res: ApiResponse<unknown>): ApiResponse<ArAgingView> {
  const raw = asRecord(res.data)
  const rows = adaptAgingRows(raw.customers)

  return {
    ...res,
    data: {
      as_of_date: str(raw.as_of_date),
      rows,
      totals: adaptAgingTotals(raw.buckets),
    },
  }
}

export function adaptArReconciliationResponse(res: ApiResponse<unknown>): ApiResponse<ArReconciliationView> {
  const raw = asRecord(res.data)
  return {
    ...res,
    data: {
      subsidiary_balance: num(raw.subsidiary_balance),
      gl_ar_balance: num(raw.gl_ar_balance),
      difference: num(raw.difference),
      is_reconciled: Boolean(raw.is_reconciled),
    },
  }
}

function mapCustomerLedgerType(value: unknown): CustomerLedgerEntry['type'] {
  switch (str(value)) {
    case 'sales_invoice':
      return 'invoice'
    case 'sales_receipt':
      return 'receipt'
    case 'customer_deposit':
      return 'deposit'
    case 'customer_deposit_allocation':
      return 'deposit_allocation'
    case 'sales_return':
      return 'return'
    default:
      return 'invoice'
  }
}

function mapInvoiceLedgerType(value: unknown): InvoiceLedgerEntry['type'] {
  switch (str(value)) {
    case 'sales_invoice':
      return 'post'
    case 'sales_receipt':
      return 'payment'
    case 'customer_deposit_allocation':
      return 'deposit_allocation'
    case 'sales_return':
      return 'return'
    case 'void':
      return 'void'
    default:
      return 'post'
  }
}

function adaptCustomerLedgerEntries(value: unknown): CustomerLedgerEntry[] {
  return asArray(value).map((row) => ({
    id: num(row.document_id ?? row.id),
    date: str(row.date),
    type: mapCustomerLedgerType(row.document_type),
    number: str(row.document_number),
    description: str(row.description),
    debit: num(row.debit),
    credit: num(row.credit),
    running_balance: num(row.balance ?? row.running_balance),
  }))
}

function adaptInvoiceLedgerEntries(value: unknown): InvoiceLedgerEntry[] {
  return asArray(value).map((row) => {
    const amount = num(row.debit) - num(row.credit)
    return {
      id: num(row.document_id ?? row.id),
      date: str(row.date),
      type: mapInvoiceLedgerType(row.document_type),
      number: str(row.document_number),
      description: str(row.description),
      amount,
      running_balance: num(row.balance ?? row.running_balance),
    }
  })
}

export function adaptCustomerLedgerResponse(res: ApiResponse<unknown>): ApiResponse<CustomerLedgerView> {
  const raw = asRecord(res.data)
  const entries = adaptCustomerLedgerEntries(raw.movements)
  return {
    ...res,
    data: {
      customer_id: num(raw.customer_id),
      entries,
      ending_balance: entries.at(-1)?.running_balance ?? 0,
    },
  }
}

export function adaptInvoiceLedgerResponse(res: ApiResponse<unknown>): ApiResponse<InvoiceLedgerView> {
  const raw = asRecord(res.data)
  const entries = adaptInvoiceLedgerEntries(raw.movements)
  return {
    ...res,
    data: {
      invoice_id: num(raw.invoice_id),
      entries,
      ending_balance: entries.at(-1)?.running_balance ?? 0,
    },
  }
}
