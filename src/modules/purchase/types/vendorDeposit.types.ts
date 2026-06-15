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
  date: string
  cash_bank_account_id: number
  amount: number
  notes?: string | null
}
