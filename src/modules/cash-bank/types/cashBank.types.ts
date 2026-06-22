export type CashBankStatus = 'draft' | 'posted' | 'void'

export interface CashBankLine {
  id: number
  account_id: number
  account?: { id: number; code: string; name: string }
  amount: number
  description?: string | null
  department_id?: number | null
  department?: { id: number; code: string; name: string } | null
  project_id?: number | null
  project?: { id: number; code: string; name: string } | null
}

export interface CashReceipt {
  id: number
  number: string
  receipt_date: string
  cash_bank_account_id: number
  cash_bank_account?: { id: number; code: string; name: string }
  contact_id?: number | null
  contact?: { id: number; name: string } | null
  currency_code: string
  exchange_rate: number
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
  currency_code: string
  exchange_rate: number
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
  currency_code: string
  exchange_rate: number
  amount: number
  notes?: string | null
  status: CashBankStatus
  created_at: string
}

export interface BankReconciliationLine {
  id: number
  journal_entry_id: number
  journal_entry_line_id: number
  journal_date: string
  journal_number: string
  description?: string | null
  debit: number
  credit: number
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
  posted_at?: string | null
  reopened_at?: string | null
  reopen_reason?: string | null
  created_at: string
}

// List params
export interface CashBankListParams {
  page: number
  per_page: number
  status?: CashBankStatus
  statuses?: CashBankStatus[]
  date_from?: string
  date_to?: string
  cash_bank_account_id?: number
  search?: string
}

// Payloads
export interface CashBankLinePayload {
  account_id: number
  amount: number
  description?: string | null
  department_id?: number | null
  project_id?: number | null
}

export interface CreateCashReceiptPayload {
  receipt_date: string
  cash_bank_account_id: number
  contact_id?: number | null
  currency_code: string
  exchange_rate: number
  amount: number
  notes?: string | null
  lines: CashBankLinePayload[]
}

export interface CreateCashPaymentPayload {
  payment_date: string
  cash_bank_account_id: number
  contact_id?: number | null
  currency_code: string
  exchange_rate: number
  amount: number
  notes?: string | null
  lines: CashBankLinePayload[]
}

export interface CreateBankTransferPayload {
  transfer_date: string
  from_cash_bank_account_id: number
  to_cash_bank_account_id: number
  currency_code: string
  exchange_rate: number
  amount: number
  notes?: string | null
}

export interface CreateBankReconciliationPayload {
  cash_bank_account_id: number
  statement_start_date: string
  statement_end_date: string
  statement_opening_balance: number
  statement_ending_balance: number
  notes?: string | null
}
