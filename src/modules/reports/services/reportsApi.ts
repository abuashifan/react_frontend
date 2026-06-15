import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  ReportParams,
  GeneralLedgerReport,
  TrialBalanceReport,
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  FinancialSummaryReport,
  AgingReport,
  ReconciliationReport,
  StockBalanceReportLine,
  StockMovementReportLine,
  StockCardReport,
  ValuationReportLine,
  LowStockReportLine,
  TransactionListReport,
} from '../types/reports.types'

export const reportsApi = {
  generalLedger: (params: ReportParams) =>
    http.get<unknown, ApiResponse<GeneralLedgerReport>>('/reports/general-ledger', { params }),

  trialBalance: (params: ReportParams) =>
    http.get<unknown, ApiResponse<TrialBalanceReport>>('/reports/trial-balance', { params }),

  profitLoss: (params: ReportParams) =>
    http.get<unknown, ApiResponse<ProfitLossReport>>('/reports/profit-loss', { params }),

  balanceSheet: (params: ReportParams) =>
    http.get<unknown, ApiResponse<BalanceSheetReport>>('/reports/balance-sheet', { params }),

  cashFlow: (params: ReportParams) =>
    http.get<unknown, ApiResponse<CashFlowReport>>('/reports/cash-flow', { params }),

  financialSummary: (params: ReportParams) =>
    http.get<unknown, ApiResponse<FinancialSummaryReport>>('/reports/financial-summary', { params }),

  arAging: (params: ReportParams) =>
    http.get<unknown, ApiResponse<AgingReport>>('/sales/ar/aging', { params }),

  apAging: (params: ReportParams) =>
    http.get<unknown, ApiResponse<AgingReport>>('/purchase/ap/aging', { params }),

  reconciliationAr: (params: ReportParams) =>
    http.get<unknown, ApiResponse<ReconciliationReport>>('/reports/reconciliation/ar', { params }),

  reconciliationAp: (params: ReportParams) =>
    http.get<unknown, ApiResponse<ReconciliationReport>>('/reports/reconciliation/ap', { params }),

  reconciliationInventory: (params: ReportParams) =>
    http.get<unknown, ApiResponse<ReconciliationReport>>('/reports/reconciliation/inventory', { params }),

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

  transactionList: (params: ReportParams & { type: 'sales' | 'purchase' }) =>
    http.get<unknown, ApiResponse<TransactionListReport>>('/reports/transactions', { params }),
}

export const reportExportApi = {
  exportPdf: (reportType: string, params: ReportParams) =>
    http.get<unknown, Blob>(`/reports/${reportType}/export/pdf`, { params, responseType: 'blob' }),

  exportExcel: (reportType: string, params: ReportParams) =>
    http.get<unknown, Blob>(`/reports/${reportType}/export/excel`, { params, responseType: 'blob' }),
}
