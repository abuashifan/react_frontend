export type VendorDepositStatus = 'draft' | 'posted' | 'partially_allocated' | 'fully_allocated' | 'refunded' | 'void'

export interface VendorDeposit {
  id: number
  number: string
  date: string
  vendor_id: number
  vendor?: { id: number; code: string; name: string }
  cash_bank_account_id: number
  cash_bank_account?: { id: number; code: string; name: string }
  amount: number
  allocated_amount: number
  remaining_amount: number
  notes?: string | null
  status: VendorDepositStatus
  created_at: string
  updated_at: string
}

export interface RawVendorDeposit {
  id: number
  deposit_number: string
  deposit_date: string
  vendor_id: number
  vendor?: { id: number; contact_code?: string; contact_number?: string; code?: string; name: string } | null
  cash_bank_account_id: number
  cash_bank_account?: { id: number; account_code?: string; account_name?: string; code?: string; name?: string } | null
  amount: number | string
  allocated_amount: number | string
  remaining_amount: number | string
  notes?: string | null
  status: VendorDepositStatus
  created_at: string
  updated_at: string
}

export interface VendorDepositListParams {
  page: number
  per_page: number
  search?: string
  status?: VendorDepositStatus
  vendor_id?: number
  date_from?: string
  date_to?: string
}

export interface CreateVendorDepositPayload {
  vendor_id: number
  deposit_date: string
  cash_bank_account_id: number
  amount: number
  notes?: string | null
}

export interface VendorDepositAvailableItem {
  id: number
  deposit_number: string
  amount: number
  allocated_amount: number
  remaining_amount: number
  deposit_date: string
  purchase_order_id?: number | null
  vendor_bill_id?: number | null
}

export interface VendorDepositAvailableSummary {
  vendor_id: number
  unapplied_total: number
  deposits: VendorDepositAvailableItem[]
}

export interface VendorDepositAvailableParams {
  vendor_id: number
  purchase_order_id?: number | null
  vendor_bill_id?: number | null
}
