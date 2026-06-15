export type CashBankStatus = 'draft' | 'posted' | 'void'

export interface CashBankLine {
  id: number
  account_id: number
  account?: { id: number; code: string; name: string }
  amount: number
  description?: string | null
}

export interface CashReceipt {
  id: number
  number: string
  receipt_date: string
  cash_bank_account_id: number
  cash_bank_account?: { id: number; code: string; name: string }
  contact_id?: number | null
  contact?: { id: number; name: string } | null
  amount: number
  notes?: string | null
  status: CashBankStatus
  lines: CashBankLine[]
  created_at: string
}

export interface CashPayment {
  id: number
  number: string
  payment_date: string
  cash_bank_account_id: number
  cash_bank_account?: { id: number; code: string; name: string }
  contact_id?: number | null
  contact?: { id: number; name: string } | null
  amount: number
  notes?: string | null
  status: CashBankStatus
  lines: CashBankLine[]
  created_at: string
}

export interface BankTransfer {
  id: number
  number: string
  transfer_date: string
  from_cash_bank_account_id: number
  from_cash_bank_account?: { id: number; code: string; name: string }
  to_cash_bank_account_id: number
  to_cash_bank_account?: { id: number; code: string; name: string }
  amount: number
  notes?: string | null
  status: CashBankStatus
  created_at: string
}

export interface BankReconciliationLine {
  id: number
  transaction_date: string
  description?: string | null
  amount: number
  direction: 'in' | 'out'
  source_type?: string | null
  source_number?: string | null
  is_cleared: boolean
  cleared_date?: string | null
}

export interface BankReconciliation {
  id: number
  number: string
  cash_bank_account_id: number
  cash_bank_account?: { id: number; code: string; name: string }
  statement_start_date: string
  statement_end_date: string
  statement_opening_balance: number
  statement_ending_balance: number
  notes?: string | null
  status: 'draft' | 'finalized' | 'void'
  lines: BankReconciliationLine[]
  created_at: string
}

// List params
export interface CashBankListParams {
  page: number
  per_page: number
  status?: CashBankStatus
  date_from?: string
  date_to?: string
  cash_bank_account_id?: number
}

// Payloads
export interface CashBankLinePayload {
  account_id: number
  amount: number
  description?: string | null
}

export interface CreateCashReceiptPayload {
  receipt_date: string
  cash_bank_account_id: number
  contact_id?: number | null
  amount: number
  notes?: string | null
  lines?: CashBankLinePayload[]
}

export interface CreateCashPaymentPayload {
  payment_date: string
  cash_bank_account_id: number
  contact_id?: number | null
  amount: number
  notes?: string | null
  lines?: CashBankLinePayload[]
}

export interface CreateBankTransferPayload {
  transfer_date: string
  from_cash_bank_account_id: number
  to_cash_bank_account_id: number
  amount: number
  notes?: string | null
}

export interface CreateBankReconciliationPayload {
  cash_bank_account_id: number
  statement_start_date: string
  statement_end_date: string
  statement_opening_balance?: number
  statement_ending_balance?: number
  notes?: string | null
}
