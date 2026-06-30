// Common report params
//
// Canonical filter names match the backend report requests
// (App\Http\Requests\Concerns\HasReportDateFilters): start_date/end_date for
// ranged reports, as_of_date for point-in-time reports (A13-233/A13-234).
export interface DateRangeParams {
  start_date?: string
  end_date?: string
  as_of_date?: string
}

export interface ReportParams extends DateRangeParams {
  account_id?: number
  department_id?: number
  project_id?: number
  warehouse_id?: number
  include_zero_balance?: boolean
  only_difference?: boolean
  page?: number
  per_page?: number
}

// General Ledger
//
// Backend (App\Services\Reports\GeneralLedgerQueryService::getLedger) mengembalikan
// ringkasan per akun: { accounts: [{ account, opening_balance, period_totals,
// ending_balance }] } TANPA `lines`. Rincian transaksi per akun (drill-down)
// memakai endpoint terpisah /reports/account-ledger/{account} (A13-244, fase
// berikutnya). Shape lama dengan `group.lines` adalah penyebab crash A13-232.
export interface GeneralLedgerAccountSummary {
  account_id: number
  account_code: string
  account_name: string
  account_type: string
  normal_balance: string
  opening_balance: number
  period_debit: number
  period_credit: number
  ending_balance: number
}

export interface GeneralLedgerReport {
  accounts: GeneralLedgerAccountSummary[]
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

export interface CashFlowSection {
  cash_in: number
  cash_out: number
  net: number
}

export interface CashFlowReport {
  summary: CashFlowSummary
  accounts: CashFlowAccount[]
  no_cash_accounts: boolean
  sections?: {
    operating?: CashFlowSection
    investing?: CashFlowSection
    financing?: CashFlowSection
    unclassified?: CashFlowSection
  }
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

// Backend stock-movements report tidak membawa running balance per baris
// (itu tugas kartu stok / A13-245); yang tersedia unit_cost & total_cost.
export interface StockMovementReportLine {
  date: string
  movement_number: string
  movement_type: string
  product_id: number
  product_name: string
  warehouse_name: string
  qty_in: number
  qty_out: number
  unit_cost: number
  total_cost: number
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

// GRNI Reconciliation — /reports/reconciliation/grni
// Per-GRN line: outstanding qty barang yang diterima tapi belum di-invoice
export interface GrniReconciliationLine {
  goods_receipt_id: number
  receipt_number: string
  receipt_date: string
  vendor_id: number | null
  vendor_name: string | null
  product_id: number | null
  product_name: string | null
  received_quantity: number
  billed_quantity: number
  outstanding_quantity: number
  estimated_outstanding_amount: number
  grni_gl_balance_related: number
  difference: number
  status: 'matched' | 'mismatch'
}

export interface GrniReconciliationReport {
  summary: {
    total_outstanding_quantity: number
    total_estimated_outstanding_amount: number
    total_grni_gl_balance_related: number
    mismatch_count: number
  }
  data: GrniReconciliationLine[]
}

// Deposit Reconciliation — /reports/reconciliation/customer-deposits & vendor-deposits
// Unapplied deposit yang belum dialokasikan ke invoice
export interface DepositReconciliationLine {
  contact_id: number
  contact_number: string
  contact_name: string | null
  deposit_id: number
  deposit_number: string
  deposit_date: string | null
  amount: number
  allocated_amount: number
  remaining_amount: number
  status: string
}

export interface DepositReconciliationReport {
  summary: {
    total_deposit: number
    total_allocated: number
    total_unapplied: number
  }
  data: DepositReconciliationLine[]
}

// Account Ledger — /reports/account-ledger/{account}
// Rincian transaksi per akun dengan running balance (A13-244)
export interface AccountLedgerAccount {
  id: number
  account_code: string
  account_name: string
  account_type: string
  normal_balance: string
  is_active: boolean
}

export interface AccountLedgerLine {
  journal_entry_id: number
  journal_entry_line_id: number
  journal_number: string
  journal_date: string
  description: string | null
  debit: number
  credit: number
  running_balance: number
  source_type: string | null
  source_number: string | null
}

export interface AccountLedgerReport {
  account: AccountLedgerAccount
  opening_balance: { debit: number; credit: number; balance: number }
  period_totals: { debit: number; credit: number; movement_balance: number }
  ending_balance: number
  lines: AccountLedgerLine[]
  total_lines: number
  truncated: boolean
}

// Cash Bank Statement — /cash-bank/reports/account-statement
export interface CashBankAccount {
  id: number
  account_code: string
  account_name: string
  account_type: string
  normal_balance: string
  is_active: boolean
}

export interface AccountStatementLine {
  journal_entry_id: number
  journal_entry_line_id: number
  journal_number: string
  journal_date: string
  description: string | null
  debit: number
  credit: number
  running_balance: number
  source_type: string | null
  source_number: string | null
  source_module: string | null
}

export interface AccountStatementReport {
  account: CashBankAccount
  filter: { cash_bank_account_id: number; start_date: string | null; end_date: string | null }
  opening_balance: number
  period_totals: { debit: number; credit: number }
  ending_balance: number
  lines: AccountStatementLine[]
}

// Fixed Asset Reports — /fixed-assets/reports/*

export interface FaRegisterLine {
  asset_number: string
  asset_name: string
  category: string | null
  asset_class: string | null
  acquisition_date: string | null
  service_start_date: string | null
  useful_life_years: number | null
  acquisition_cost: number
  depreciation_period_total: number
  depreciation_current_year: number
  accumulated_depreciation_until_period: number
  net_book_value_as_of_period: number
  quantity: number
  remaining_quantity: number
  status: string
  department: string | null
  project: string | null
  period_cutoff: string
}

export type FaRegisterReport = FaRegisterLine[]

export interface FaDepreciationDetailLine {
  period: string
  asset_number: string | null
  asset_name: string | null
  category: string | null
  depreciation_amount: number
  accumulated_depreciation_after: number
  net_book_value_after: number
  journal_entry_id: number | null
  status: string
}

export interface FaDepreciationYearlySummaryLine {
  year: string
  asset_number: string | null
  asset_name: string | null
  depreciation_year_total: number
  accumulated_depreciation_end_of_year: number
  net_book_value_end_of_year: number
}

export type FaDepreciationReport =
  | { mode: 'detail'; lines: FaDepreciationDetailLine[] }
  | { mode: 'yearly_summary'; lines: FaDepreciationYearlySummaryLine[] }

export interface FaDisposalLine {
  id: number
  disposal_date: string
  disposal_type: string
  disposal_reason: string | null
  sale_price: number | null
  book_value_at_disposal: number | null
  gain_loss: number | null
  status: string
  asset: {
    asset_number: string
    name: string
    acquisition_cost: number | null
  } | null
}

export type FaDisposalsReport = FaDisposalLine[]

export interface FaReconciliationReport {
  period: string
  asset_register_cost_total: number
  asset_register_accumulated_depreciation: number
  asset_register_net_book_value: number
  gl_fixed_asset_cost_balance: number
  gl_accumulated_depreciation_balance: number
  gl_net_book_value: number
  difference_cost: number
  difference_accumulated_depreciation: number
}

// NOTE: Transaction list report (/reports/transactions) dan export PDF/Excel
// (/reports/{type}/export/*) TIDAK punya route backend (Audit-12 A12-15).
// Endpoint & UI-nya sengaja dihapus, bukan dibiarkan memanggil 404.
