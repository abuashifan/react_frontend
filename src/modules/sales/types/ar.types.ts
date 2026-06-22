export interface ArSummaryAccount {
  account_id: number
  account_code: string
  account_name: string
}

export interface ArSummaryRow {
  customer_id: number
  customer_name: string
  gross_ar_outstanding: number
  official_ar_balance: number
  unapplied_deposit_total: number
  net_customer_exposure: number
  ar_account_count: number
  ar_accounts: ArSummaryAccount[]
}

export interface ArSummaryTotals {
  gross_ar_outstanding: number
  official_ar_balance: number
  unapplied_deposit_total: number
  net_customer_exposure: number
  ar_account_count: number
}

export interface ArSummaryView {
  as_of_date: string
  rows: ArSummaryRow[]
  totals: ArSummaryTotals
}

export interface ArAgingRow {
  customer_id: number
  customer_name: string
  current: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  days_over_90: number
  total: number
}

export interface ArAgingTotals {
  current: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  days_over_90: number
  total: number
}

export interface ArAgingView {
  as_of_date: string
  rows: ArAgingRow[]
  totals: ArAgingTotals
}

export interface ArReconciliationView {
  subsidiary_balance: number
  gl_ar_balance: number
  difference: number
  is_reconciled: boolean
}

export interface CustomerLedgerEntry {
  id: number
  date: string
  type: 'invoice' | 'receipt' | 'return' | 'deposit' | 'deposit_allocation'
  number: string
  description: string
  debit: number
  credit: number
  running_balance: number
}

export interface CustomerLedgerView {
  customer_id: number
  entries: CustomerLedgerEntry[]
  ending_balance: number
}

export interface InvoiceLedgerEntry {
  id: number
  date: string
  type: 'post' | 'payment' | 'return' | 'void' | 'deposit_allocation'
  number: string
  description: string
  amount: number
  running_balance: number
}

export interface InvoiceLedgerView {
  invoice_id: number
  entries: InvoiceLedgerEntry[]
  ending_balance: number
}

export interface ArSummaryParams {
  customer_id?: number
  as_of_date?: string
}

export interface ArAgingParams {
  customer_id?: number
  as_of_date?: string
}

export interface CustomerLedgerParams {
  start_date?: string
  end_date?: string
}

export interface InvoiceLedgerParams {
  start_date?: string
  end_date?: string
}

export interface ArReconciliationParams {
  as_of_date?: string
  start_date?: string
  end_date?: string
}
