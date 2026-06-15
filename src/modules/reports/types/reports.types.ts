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

// Trial Balance
export interface TrialBalanceLine {
  account_id: number
  account_code: string
  account_name: string
  account_type: string
  opening_debit: number
  opening_credit: number
  period_debit: number
  period_credit: number
  closing_debit: number
  closing_credit: number
}

export interface TrialBalanceReport {
  date_from: string
  date_to: string
  lines: TrialBalanceLine[]
  totals: {
    opening_debit: number
    opening_credit: number
    period_debit: number
    period_credit: number
    closing_debit: number
    closing_credit: number
  }
}

// Profit & Loss (P&L)
export interface ProfitLossItem {
  account_id?: number
  account_code?: string
  account_name: string
  amount: number
  is_section_header?: boolean
}

export interface ProfitLossSection {
  title: string
  items: ProfitLossItem[]
  total: number
}

export interface ProfitLossReport {
  date_from: string
  date_to: string
  revenue: ProfitLossSection
  cost_of_goods_sold: ProfitLossSection
  gross_profit: number
  operating_expenses: ProfitLossSection
  operating_income: number
  other_income: ProfitLossSection
  other_expenses: ProfitLossSection
  net_income: number
}

// Balance Sheet
export interface BalanceSheetItem {
  account_id?: number
  account_code?: string
  account_name: string
  amount: number
  level?: number
  is_section_header?: boolean
}

export interface BalanceSheetSection {
  title: string
  items: BalanceSheetItem[]
  total: number
}

export interface BalanceSheetReport {
  as_of_date: string
  assets: {
    current_assets: BalanceSheetSection
    non_current_assets: BalanceSheetSection
    total_assets: number
  }
  liabilities: {
    current_liabilities: BalanceSheetSection
    non_current_liabilities: BalanceSheetSection
    total_liabilities: number
  }
  equity: {
    items: BalanceSheetItem[]
    total_equity: number
  }
  total_liabilities_and_equity: number
}

// Cash Flow
export interface CashFlowItem {
  label: string
  amount: number
  is_section_header?: boolean
}

export interface CashFlowSection {
  title: string
  items: CashFlowItem[]
  total: number
}

export interface CashFlowReport {
  date_from: string
  date_to: string
  operating: CashFlowSection
  investing: CashFlowSection
  financing: CashFlowSection
  net_change: number
  opening_cash: number
  closing_cash: number
}

// Financial Summary
export interface FinancialSummaryReport {
  as_of_date: string
  period: { date_from: string; date_to: string }
  total_assets: number
  total_liabilities: number
  total_equity: number
  revenue: number
  cost_of_goods_sold: number
  gross_profit: number
  operating_expenses: number
  net_income: number
  cash_and_bank: number
  accounts_receivable: number
  accounts_payable: number
  inventory_value: number
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

// Transaction list
export interface TransactionListLine {
  id: number
  number: string
  date: string
  contact_name: string
  total_amount: number
  paid_amount?: number
  status: string
}

export interface TransactionListReport {
  type: 'sales' | 'purchase'
  date_from: string
  date_to: string
  lines: TransactionListLine[]
  total_amount: number
  total_paid: number
}
