export type SalesReceiptStatus = 'draft' | 'posted' | 'void'

export interface SalesReceiptLine {
  settlement_discount_account?: { id: number; account_code: string; account_name: string } | null
  id: number
  sales_invoice_id: number
  invoice?: { id: number; number: string; grand_total: number; balance_due: number }
  sales_invoice?: { id: number; number?: string; invoice_number?: string; grand_total: number | string; balance_due: number | string }
  amount: number
  settlement_discount_amount?: number
  settlement_discount_account_id?: number | null
  settlement_discount_note?: string | null
}

export interface SalesReceipt {
  /** Nama kolom backend; `date` dipakai form. */
  receipt_date?: string
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
  /** Satu status, atau beberapa dipisah koma (mis. "draft,posted"). */
  status?: string
  customer_id?: number
  date_from?: string
  date_to?: string
}

export interface SalesReceiptLinePayload {
  sales_invoice_id: number
  amount: number
  settlement_discount_amount?: number
  settlement_discount_account_id?: number | null
  settlement_discount_note?: string | null
}

export interface CreateSalesReceiptPayload {
  customer_id: number
  date: string
  cash_bank_account_id: number
  amount: number
  notes?: string | null
  lines: SalesReceiptLinePayload[]
}
