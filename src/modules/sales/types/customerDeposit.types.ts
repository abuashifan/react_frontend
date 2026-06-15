export type CustomerDepositStatus = 'draft' | 'posted' | 'partially_allocated' | 'fully_allocated' | 'refunded' | 'void'

export interface CustomerDeposit {
  id: number
  number: string
  date: string
  customer_id: number
  customer?: { id: number; code: string; name: string }
  cash_bank_account_id: number
  cash_bank_account?: { id: number; name: string; code: string }
  amount: number
  allocated_amount: number
  remaining_amount: number
  status: CustomerDepositStatus
  notes?: string | null
  sales_order_id?: number | null
  created_at: string
  updated_at: string
}

export interface CustomerDepositListParams {
  page: number
  per_page: number
  search?: string
  status?: CustomerDepositStatus
  customer_id?: number
  date_from?: string
  date_to?: string
}

export interface CreateCustomerDepositPayload {
  customer_id: number
  date: string
  cash_bank_account_id: number
  amount: number
  sales_order_id?: number | null
  notes?: string | null
}

export interface AllocateDepositPayload {
  amount: number
}
