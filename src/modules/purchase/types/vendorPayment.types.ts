export type VendorPaymentStatus = 'draft' | 'posted' | 'void'

export interface VendorPaymentLine {
  id: number
  vendor_bill_id: number
  bill_number?: string
  amount: number
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

export interface VendorPaymentListParams {
  page: number
  per_page: number
  search?: string
  status?: VendorPaymentStatus
  vendor_id?: number
  date_from?: string
  date_to?: string
}

export interface VendorPaymentLinePayload {
  vendor_bill_id: number
  amount: number
}

export interface CreateVendorPaymentPayload {
  vendor_id: number
  date: string
  cash_bank_account_id: number
  amount: number
  notes?: string | null
  lines: VendorPaymentLinePayload[]
}

export interface OpenBillItem {
  vendor_bill_id: number
  bill_number: string
  balance_due: number
}

export interface VendorContext {
  open_bills: OpenBillItem[]
}
