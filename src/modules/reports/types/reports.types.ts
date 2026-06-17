// Common report params
export interface DateRangeParams {
  date_from?: string
  date_to?: string
  as_of_date?: string
}

export interface ReportParams extends DateRangeParams {
  account_id?: number
  department_id?: number
  project_id?: number
  include_zero_balance?: boolean
  page?: number
  per_page?: number
}

// General Ledger
export interface GeneralLedgerLine {
  date: string
  journal_number?: string | null
  description?: string | null
  debit: number
  credit: number
  balance: number
  account_id: number
  account_code: string
  account_name: string
}

export interface GeneralLedgerGroup {
  account_id: number
  account_code: string
  account_name: string
  opening_balance: number
  total_debit: number
  total_credit: number
  closing_balance: number
  lines: GeneralLedgerLine[]
}

export interface GeneralLedgerReport {
  date_from: string
  date_to: string
  accounts: GeneralLedgerGroup[]
}

// ---------------------------------------------------------------------------
// Financial report contracts.
//
// Shape ini adalah OUTPUT adapter frontend yang stabil (lihat reportsApi.ts).
// Bentuknya mengikuti response backend aktual (App\Services\Reports\*),
// bukan shape lama yang menyebabkan crash di Audit-12 (A12-12/A12-15).
// ---------------------------------------------------------------------------

// Trial Balance — backend: { accounts: [...], totals: {...} }
export interface TrialBalanceAccount {
  account_id: number
  account_code: string
  account_name: string
  account_type: string
  normal_balance: string
  is_active: boolean
  opening_debit: number
  opening_credit: number
  period_debit: number
  period_credit: number
  ending_debit: number
  ending_credit: number
  ending_balance: number
}

export interface TrialBalanceTotals {
  opening_debit: number
  opening_credit: number
  period_debit: number
  period_credit: number
  ending_debit: number
  ending_credit: number
  difference: number
  is_balanced: boolean
}

export interface TrialBalanceReport {
  accounts: TrialBalanceAccount[]
  totals: TrialBalanceTotals
}

// Section-based reports (Profit & Loss, Balance Sheet)
export interface ReportAccountLine {
  account_id: number | null
  account_code: string | null
  account_name: string
  account_type: string
  normal_balance: string
  debit: number
  credit: number
  amount: number
  is_active: boolean
  is_system_generated?: boolean
}

export interface ReportSection {
  key: string
  label: string
  accounts: ReportAccountLine[]
  total: number
}

// Profit & Loss — backend: { sections: [...], totals: {...} }
export interface ProfitLossTotals {
  total_revenue: number
  total_expense: number
  net_profit: number
  net_loss: number
  net_profit_or_loss: number
}

export interface ProfitLossReport {
  sections: ReportSection[]
  totals: ProfitLossTotals
}

// Balance Sheet — backend: { sections: [...], totals: {...} }
export interface BalanceSheetTotals {
  total_assets: number
  total_liabilities: number
  total_equity: number
  total_liabilities_and_equity: number
  current_year_profit_or_loss: number
  difference: number
  is_balanced: boolean
}

export interface BalanceSheetReport {
  sections: ReportSection[]
  totals: BalanceSheetTotals
}

// Cash Flow — backend: { summary: {...}, accounts: [...], notes? }
export interface CashFlowSummary {
  opening_cash_balance: number
  cash_in: number
  cash_out: number
  net_cash_flow: number
  ending_cash_balance: number
}

export interface CashFlowAccount {
  account_id: number
  account_code: string
  account_name: string
  normal_balance: string
  opening_balance: number
  cash_in: number
  cash_out: number
  net_cash_flow: number
  ending_balance: number
  is_active: boolean
}

export interface CashFlowReport {
  summary: CashFlowSummary
  accounts: CashFlowAccount[]
  no_cash_accounts: boolean
}

// Financial Summary — backend: { profit_loss, balance_sheet, cash_flow }
export interface FinancialSummaryReport {
  profit_loss: {
    net_profit_or_loss: number
  }
  balance_sheet: {
    total_assets: number
    total_liabilities: number
    total_equity: number
    is_balanced: boolean
    current_year_profit_or_loss: number
  }
  cash_flow: {
    opening_cash_balance: number
    cash_in: number
    cash_out: number
    ending_cash_balance: number
  }
}

// AR/AP Aging
export interface AgingBucket {
  current: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  days_over_90: number
  total: number
}

export interface AgingReportLine {
  contact_id: number
  contact_name: string
  buckets: AgingBucket
}

export interface AgingReport {
  as_of_date: string
  lines: AgingReportLine[]
  totals: AgingBucket
}

// Reconciliation
export interface ReconciliationLine {
  account_id: number
  account_code: string
  account_name: string
  gl_balance: number
  subledger_balance: number
  difference: number
}

export interface ReconciliationReport {
  as_of_date: string
  type: 'ar' | 'ap' | 'inventory'
  lines: ReconciliationLine[]
  total_gl: number
  total_subledger: number
  total_difference: number
}

// Stock reports
export interface StockBalanceReportLine {
  product_id: number
  product_code: string
  product_name: string
  warehouse_id: number
  warehouse_name: string
  unit: string
  qty_on_hand: number
  avg_cost: number
  total_value: number
}

export interface StockMovementReportLine {
  date: string
  movement_number: string
  movement_type: string
  product_id: number
  product_name: string
  warehouse_name: string
  qty_in: number
  qty_out: number
  qty_balance: number
}

export interface StockCardLine {
  date: string
  reference: string
  description: string
  qty_in: number
  qty_out: number
  qty_balance: number
  unit_cost: number
  total_cost: number
}

export interface StockCardReport {
  product_id: number
  product_code: string
  product_name: string
  warehouse_id?: number
  warehouse_name?: string
  date_from: string
  date_to: string
  opening_qty: number
  opening_cost: number
  lines: StockCardLine[]
}

// Inventory Analysis
export interface ValuationReportLine {
  product_id: number
  product_code: string
  product_name: string
  unit: string
  qty_on_hand: number
  avg_cost: number
  total_value: number
}

export interface LowStockReportLine {
  product_id: number
  product_code: string
  product_name: string
  warehouse_name: string
  qty_on_hand: number
  min_stock?: number | null
  unit: string
}

// NOTE: Transaction list report (/reports/transactions) dan export PDF/Excel
// (/reports/{type}/export/*) TIDAK punya route backend (Audit-12 A12-15).
// Endpoint & UI-nya sengaja dihapus, bukan dibiarkan memanggil 404.
