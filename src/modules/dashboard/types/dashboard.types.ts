export interface DashboardSummary {
  total_receivable: number
  receivable_trend?: number | null
  total_payable: number
  payable_trend?: number | null
  cash_balance: number
  current_month_profit: number
  profit_trend?: number | null
}

export interface DashboardPending {
  pending_invoices: number
  pending_bills: number
  low_stock_count: number
  fiscal_year_days_remaining?: number | null
}

export interface ChartMonthData {
  month: string
  penjualan: number
  pembelian: number
}

export interface CashFlowMonthData {
  month: string
  masuk: number
  keluar: number
}

export interface DashboardChartData {
  sales_purchase: ChartMonthData[]
  cash_flow: CashFlowMonthData[]
}

export interface DashboardActivity {
  id: number
  title: string
  subtitle: string
  amount: number
  status: string
  source_type: string
  source_id: number
  href: string
  created_at: string
}
