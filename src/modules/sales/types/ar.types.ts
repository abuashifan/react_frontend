export interface ArCustomerSummary {
  customer_id: number
  customer_name: string
  customer_code: string
  total_receivable: number
  overdue_amount: number
  deposit_balance: number
  open_invoice_count: number
}

export interface ArAgingRow {
  customer_id: number
  customer_name: string
  customer_code: string
  current: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  days_over_90: number
  total: number
}

export interface ArReconciliationRow {
  account_code: string
  account_name: string
  gl_balance: number
  ar_balance: number
  difference: number
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

export interface InvoiceLedgerEntry {
  id: number
  date: string
  type: 'post' | 'payment' | 'return' | 'void' | 'deposit_allocation'
  number: string
  description: string
  amount: number
  running_balance: number
}

export interface ArSummaryParams {
  customer_id?: number
  as_of?: string
}

export interface ArAgingParams {
  as_of?: string
  customer_id?: number
}

export interface CustomerLedgerParams {
  date_from?: string
  date_to?: string
}

export interface InvoiceLedgerParams {
  date_from?: string
  date_to?: string
}
