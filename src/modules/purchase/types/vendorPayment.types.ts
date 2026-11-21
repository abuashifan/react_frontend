export type VendorPaymentStatus = 'draft' | 'posted' | 'void'

export interface VendorPaymentLine {
  settlement_discount_account?: { id: number; account_code: string; account_name: string } | null
  id: number
  vendor_bill_id: number
  bill_number?: string
  grand_total?: number
  amount: number
  settlement_discount_amount?: number
  settlement_discount_account_id?: number | null
  settlement_discount_note?: string | null
  balance_due?: number
}

export interface VendorPayment {
  id: number
  number: string
  date: string
  vendor_id: number
  vendor?: { id: number; code: string; name: string }
  cash_bank_account_id: number
  cash_bank_account?: { id: number; code: string; name: string }
  amount: number
  notes?: string | null
  status: VendorPaymentStatus
  lines: VendorPaymentLine[]
  created_at: string
  updated_at: string
}

export interface RawVendorPaymentLine {
  settlement_discount_account?: { id: number; account_code: string; account_name: string } | null
  id: number
  vendor_bill_id: number
  vendor_bill?: { id: number; bill_number: string; balance_due?: number | string; grand_total?: number | string } | null
  amount: number | string
  settlement_discount_amount?: number | string
  settlement_discount_account_id?: number | null
  settlement_discount_note?: string | null
  balance_due?: number | string
}

export interface RawVendorPayment {
  id: number
  payment_number: string
  payment_date: string
  vendor_id: number
  vendor?: { id: number; contact_code?: string; contact_number?: string; code?: string; name: string } | null
  cash_bank_account_id: number
  cash_bank_account?: { id: number; account_code?: string; account_name?: string; code?: string; name?: string } | null
  amount: number | string
  notes?: string | null
  status: VendorPaymentStatus
  lines: RawVendorPaymentLine[]
  created_at: string
  updated_at: string
}

export interface VendorPaymentListParams {
  page: number
  per_page: number
  search?: string
  /** Satu status, atau beberapa dipisah koma (mis. "draft,posted"). */
  status?: string
  vendor_id?: number
  date_from?: string
  date_to?: string
}

export interface VendorPaymentLinePayload {
  vendor_bill_id: number
  amount: number
  settlement_discount_amount?: number
  settlement_discount_account_id?: number | null
  settlement_discount_note?: string | null
}

export interface CreateVendorPaymentPayload {
  vendor_id: number
  payment_date: string
  cash_bank_account_id: number
  amount: number
  notes?: string | null
  lines: VendorPaymentLinePayload[]
}

export interface OpenBillItem {
  vendor_bill_id: number
  bill_number: string
  balance_due: number
  grand_total?: number
  bill_date?: string
  due_date?: string
}

export interface VendorContext {
  open_bills: OpenBillItem[]
}

export interface RawVendorContext {
  open_bills: (Omit<OpenBillItem, 'vendor_bill_id' | 'balance_due' | 'grand_total'> & {
    bill_id: number
    vendor_bill_id?: number
    balance_due: number | string
    grand_total?: number | string
  })[]
}

export interface VendorPaymentCashBalance {
  account_id: number
  balance: number
  normal_balance: 'debit' | 'credit'
  as_of: string
  calculated_at: string
}
