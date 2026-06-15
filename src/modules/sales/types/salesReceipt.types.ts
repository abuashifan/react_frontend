export type SalesReceiptStatus = 'draft' | 'posted' | 'void'

export interface SalesReceiptLine {
  id: number
  sales_invoice_id: number
  invoice?: { id: number; number: string; grand_total: number; balance_due: number }
  amount: number
}

export interface SalesReceipt {
  id: number
  number: string
  date: string
  customer_id: number
  customer?: { id: number; code: string; name: string }
  cash_bank_account_id: number
  cash_bank_account?: { id: number; name: string; code: string }
  amount: number
  status: SalesReceiptStatus
  notes?: string | null
  lines: SalesReceiptLine[]
  created_at: string
  updated_at: string
}

export interface SalesReceiptListParams {
  page: number
  per_page: number
  search?: string
  status?: SalesReceiptStatus
  customer_id?: number
  date_from?: string
  date_to?: string
}

export interface SalesReceiptLinePayload {
  sales_invoice_id: number
  amount: number
}

export interface CreateSalesReceiptPayload {
  customer_id: number
  date: string
  cash_bank_account_id: number
  amount: number
  notes?: string | null
  lines: SalesReceiptLinePayload[]
}
