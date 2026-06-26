import axios from 'axios'
import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  ReportParams,
  GeneralLedgerReport,
  TrialBalanceReport,
  TrialBalanceAccount,
  TrialBalanceTotals,
  ProfitLossReport,
  BalanceSheetReport,
  ReportSection,
  ReportAccountLine,
  CashFlowReport,
  CashFlowAccount,
  FinancialSummaryReport,
  AgingReport,
  StockBalanceReportLine,
  StockMovementReportLine,
  StockCardReport,
  ValuationReportLine,
  LowStockReportLine,
} from '../types/reports.types'
import { adaptApiResponse, adaptApAgingResponse, adaptReconciliationReport } from '@/modules/purchase/services/apAdapters'
import { useAuthStore } from '@/stores/useAuthStore'

// ---------------------------------------------------------------------------
// Adapter boundary (Audit-12 A12-12).
//
// Backend report service mengembalikan { valid, filter, ... } dengan array yang
// kadang kosong/absen. Helper di bawah menormalkan setiap response menjadi
// shape stabil di reports.types.ts, sehingga page tidak pernah membaca
// property `undefined` dan crash.
// ---------------------------------------------------------------------------

type Raw = Record<string, unknown>

function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : {}
}

function asArray(value: unknown): Raw[] {
  return Array.isArray(value) ? (value as unknown[]).map(asRecord) : []
}

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function adaptTrialBalance(raw: Raw): TrialBalanceReport {
  const accounts: TrialBalanceAccount[] = asArray(raw.accounts).map((a) => ({
    account_id: num(a.account_id),
    account_code: str(a.account_code),
    account_name: str(a.account_name),
    account_type: str(a.account_type),
    normal_balance: str(a.normal_balance),
    is_active: Boolean(a.is_active),
    opening_debit: num(a.opening_debit),
    opening_credit: num(a.opening_credit),
    period_debit: num(a.period_debit),
    period_credit: num(a.period_credit),
    ending_debit: num(a.ending_debit),
    ending_credit: num(a.ending_credit),
    ending_balance: num(a.ending_balance),
  }))
  const t = asRecord(raw.totals)
  const totals: TrialBalanceTotals = {
    opening_debit: num(t.opening_debit),
    opening_credit: num(t.opening_credit),
    period_debit: num(t.period_debit),
    period_credit: num(t.period_credit),
    ending_debit: num(t.ending_debit),
    ending_credit: num(t.ending_credit),
    difference: num(t.difference),
    is_balanced: Boolean(t.is_balanced),
  }
  return { accounts, totals }
}

function adaptAccountLine(a: Raw): ReportAccountLine {
  return {
    account_id: a.account_id == null ? null : num(a.account_id),
    account_code: a.account_code == null ? null : str(a.account_code),
    account_name: str(a.account_name),
    account_type: str(a.account_type),
    normal_balance: str(a.normal_balance),
    debit: num(a.debit),
    credit: num(a.credit),
    amount: num(a.amount),
    is_active: Boolean(a.is_active),
    is_system_generated: Boolean(a.is_system_generated),
  }
}

function adaptSections(raw: Raw): ReportSection[] {
  return asArray(raw.sections).map((s) => ({
    key: str(s.key),
    label: str(s.label),
    accounts: asArray(s.accounts).map(adaptAccountLine),
    total: num(s.total),
  }))
}

function adaptProfitLoss(raw: Raw): ProfitLossReport {
  const t = asRecord(raw.totals)
  return {
    sections: adaptSections(raw),
    totals: {
      total_revenue: num(t.total_revenue),
      total_expense: num(t.total_expense),
      net_profit: num(t.net_profit),
      net_loss: num(t.net_loss),
      net_profit_or_loss: num(t.net_profit_or_loss),
    },
  }
}

function adaptBalanceSheet(raw: Raw): BalanceSheetReport {
  const t = asRecord(raw.totals)
  return {
    sections: adaptSections(raw),
    totals: {
      total_assets: num(t.total_assets),
      total_liabilities: num(t.total_liabilities),
      total_equity: num(t.total_equity),
      total_liabilities_and_equity: num(t.total_liabilities_and_equity),
      current_year_profit_or_loss: num(t.current_year_profit_or_loss),
      difference: num(t.difference),
      is_balanced: Boolean(t.is_balanced),
    },
  }
}

function adaptCashFlow(raw: Raw): CashFlowReport {
  const s = asRecord(raw.summary)
  const accounts: CashFlowAccount[] = asArray(raw.accounts).map((a) => ({
    account_id: num(a.account_id),
    account_code: str(a.account_code),
    account_name: str(a.account_name),
    normal_balance: str(a.normal_balance),
    opening_balance: num(a.opening_balance),
    cash_in: num(a.cash_in),
    cash_out: num(a.cash_out),
    net_cash_flow: num(a.net_cash_flow),
    ending_balance: num(a.ending_balance),
    is_active: Boolean(a.is_active),
  }))
  return {
    summary: {
      opening_cash_balance: num(s.opening_cash_balance),
      cash_in: num(s.cash_in),
      cash_out: num(s.cash_out),
      net_cash_flow: num(s.net_cash_flow),
      ending_cash_balance: num(s.ending_cash_balance),
    },
    accounts,
    no_cash_accounts: Boolean(asRecord(raw.notes).no_cash_accounts),
  }
}

function adaptFinancialSummary(raw: Raw): FinancialSummaryReport {
  const pl = asRecord(raw.profit_loss)
  const bs = asRecord(raw.balance_sheet)
  const cf = asRecord(raw.cash_flow)
  return {
    profit_loss: { net_profit_or_loss: num(pl.net_profit_or_loss) },
    balance_sheet: {
      total_assets: num(bs.total_assets),
      total_liabilities: num(bs.total_liabilities),
      total_equity: num(bs.total_equity),
      is_balanced: Boolean(bs.is_balanced),
      current_year_profit_or_loss: num(bs.current_year_profit_or_loss),
    },
    cash_flow: {
      opening_cash_balance: num(cf.opening_cash_balance),
      cash_in: num(cf.cash_in),
      cash_out: num(cf.cash_out),
      ending_cash_balance: num(cf.ending_cash_balance),
    },
  }
}

function adaptResponse<T>(res: ApiResponse<unknown>, adapt: (raw: Raw) => T): ApiResponse<T> {
  return { ...res, data: adapt(asRecord(res.data)) }
}

async function getRawApiResponse<T>(path: string, params: ReportParams): Promise<ApiResponse<T>> {
  const { token, activeCompanyId } = useAuthStore.getState()
  const response = await axios.get<ApiResponse<T>>(`${import.meta.env.VITE_API_BASE_URL}/api${path}`, {
    params,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeCompanyId ? { 'X-Company-ID': String(activeCompanyId) } : {}),
    },
  })

  return response.data
}

export const reportsApi = {
  generalLedger: (params: ReportParams) =>
    http.get<unknown, ApiResponse<GeneralLedgerReport>>('/reports/general-ledger', { params }),

  trialBalance: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/trial-balance', { params })
      .then((res) => adaptResponse(res, adaptTrialBalance)),

  profitLoss: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/profit-loss', { params })
      .then((res) => adaptResponse(res, adaptProfitLoss)),

  balanceSheet: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/balance-sheet', { params })
      .then((res) => adaptResponse(res, adaptBalanceSheet)),

  cashFlow: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/cash-flow', { params })
      .then((res) => adaptResponse(res, adaptCashFlow)),

  financialSummary: (params: ReportParams) =>
    http
      .get<unknown, ApiResponse<unknown>>('/reports/financial-summary', { params })
      .then((res) => adaptResponse(res, adaptFinancialSummary)),

  arAging: (params: ReportParams) =>
    http.get<unknown, ApiResponse<AgingReport>>('/sales/ar/aging', { params }),

  apAging: (params: ReportParams) =>
    http.get<unknown, ApiResponse<unknown>>('/purchase/ap/aging', { params }).then((response) => adaptApiResponse(response, adaptApAgingResponse)),

  reconciliationAr: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/ar', params).then((response) => adaptResponse(response, (raw) => adaptReconciliationReport(asRecord(raw), 'ar'))),

  reconciliationAp: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/ap', params).then((response) => adaptResponse(response, (raw) => adaptReconciliationReport(asRecord(raw), 'ap'))),

  reconciliationInventory: (params: ReportParams) =>
    getRawApiResponse('/reports/reconciliation/inventory', params).then((response) => adaptResponse(response, (raw) => adaptReconciliationReport(asRecord(raw), 'inventory'))),

  stockBalances: (params: ReportParams) =>
    http.get<unknown, ApiResponse<StockBalanceReportLine[]>>('/inventory/reports/stock-balances', { params }),

  stockMovements: (params: ReportParams) =>
    http.get<unknown, ApiResponse<StockMovementReportLine[]>>('/inventory/reports/stock-movements', { params }),

  stockCard: (params: ReportParams & { product_id?: number; warehouse_id?: number }) =>
    http.get<unknown, ApiResponse<StockCardReport>>('/inventory/reports/stock-card', { params }),

  valuation: (params: ReportParams) =>
    http.get<unknown, ApiResponse<ValuationReportLine[]>>('/inventory/reports/valuation', { params }),

  lowStock: (params: ReportParams) =>
    http.get<unknown, ApiResponse<LowStockReportLine[]>>('/inventory/reports/low-stock', { params }),

  negativeStock: (params: ReportParams) =>
    http.get<unknown, ApiResponse<LowStockReportLine[]>>('/inventory/reports/negative-stock', { params }),
}
