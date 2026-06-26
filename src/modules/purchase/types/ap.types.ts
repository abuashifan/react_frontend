export interface ApVendorSummary {
  vendor_id: number
  vendor_name: string
  debit: number
  credit: number
  balance: number
  gross_ap_outstanding: number
  official_ap_balance: number
  unapplied_deposit_total: number
  net_vendor_exposure: number
  ap_accounts: {
    account_id: number
    account_code: string
    account_name: string
  }[]
}

export interface ApAgingRow {
  vendor_id: number
  vendor_name: string
  current: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  days_over_90: number
  total: number
}

export interface ApReconciliationRow {
  account_id: number
  account_code: string
  account_name: string
  gl_balance: number
  ap_balance: number
  difference: number
}

export interface ApReconciliationSummary {
  subsidiary_balance: number
  gl_ap_balance: number
  difference: number
  is_reconciled: boolean
}

export interface ApLedgerEntry {
  date: string
  type: string
  number: string
  description: string
  debit: number
  credit: number
  running_balance: number
}

export interface ApLedgerResponse {
  vendor_id: number
  vendor_name: string
  entries: ApLedgerEntry[]
  ending_balance: number
}

export interface BillLedgerEntry {
  date: string
  type: string
  number: string
  description: string
  amount: number
  running_balance: number
}

export interface BillLedgerResponse {
  bill_id: number
  bill_number: string
  entries: BillLedgerEntry[]
  ending_balance: number
}
