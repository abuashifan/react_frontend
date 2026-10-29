/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy, type ReactElement } from 'react'
import { ProtectedRoute } from '@/router/guards'
import { REPORT_VIEW_PERMISSIONS, reportCategoryForPath } from './constants/reportPermissions'
import type { RouteObject } from 'react-router-dom'

const ReportListPage = lazy(() => import('./pages/ReportListPage'))
const TrialBalancePage = lazy(() => import('./pages/TrialBalancePage'))
const ProfitLossPage = lazy(() => import('./pages/ProfitLossPage'))
const BalanceSheetPage = lazy(() => import('./pages/BalanceSheetPage'))
const CashFlowPage = lazy(() => import('./pages/CashFlowPage'))
const CashFlowDirectReportPage = lazy(() => import('./pages/CashFlowDirectReportPage'))
const RetainedEarningsReportPage = lazy(() => import('./pages/RetainedEarningsReportPage'))
const EquityChangesReportPage = lazy(() => import('./pages/EquityChangesReportPage'))
const ProfitLossMultiPeriodPage = lazy(() => import('./pages/ProfitLossMultiPeriodPage'))
const BalanceSheetMultiPeriodPage = lazy(() => import('./pages/BalanceSheetMultiPeriodPage'))
const OutputVatReportPage = lazy(() => import('./pages/OutputVatReportPage'))
const InputVatReportPage = lazy(() => import('./pages/InputVatReportPage'))
const EfakturExportPage = lazy(() => import('./pages/EfakturExportPage'))
const SavedReportsPage = lazy(() => import('./pages/SavedReportsPage'))
const FinancialSummaryPage = lazy(() => import('./pages/FinancialSummaryPage'))
const GeneralLedgerPage = lazy(() => import('./pages/GeneralLedgerPage'))
const ArAgingReportPage = lazy(() => import('./pages/ArAgingReportPage'))
const ApAgingReportPage = lazy(() => import('./pages/ApAgingReportPage'))
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'))
const StockReportPage = lazy(() => import('./pages/StockReportPage'))
const InventoryAnalysisPage = lazy(() => import('./pages/InventoryAnalysisPage'))
const InventoryAgingReportPage = lazy(() => import('./pages/InventoryAgingReportPage'))
const OpnameWorksheetReportPage = lazy(() => import('./pages/OpnameWorksheetReportPage'))
const AccountLedgerPage = lazy(() => import('./pages/AccountLedgerPage'))
const JournalListReportPage = lazy(() => import('./pages/JournalListReportPage'))
const BudgetComparisonPage = lazy(() => import('@/modules/budget/pages/BudgetComparisonPage'))
const ReportCategoryPage = lazy(() => import('./pages/ReportCategoryPage'))
const CashBankStatementPage = lazy(() => import('./pages/CashBankStatementPage'))
const FixedAssetRegisterReportPage = lazy(() => import('./pages/FixedAssetRegisterReportPage'))
const FixedAssetDepreciationReportPage = lazy(() => import('./pages/FixedAssetDepreciationReportPage'))
const FixedAssetDisposalsReportPage = lazy(() => import('./pages/FixedAssetDisposalsReportPage'))
const FixedAssetReconciliationReportPage = lazy(() => import('./pages/FixedAssetReconciliationReportPage'))
const SalesSummaryReportPage = lazy(() => import('./pages/SalesSummaryReportPage'))
const SalesByCustomerReportPage = lazy(() => import('./pages/SalesByCustomerReportPage'))
const SalesByProductReportPage = lazy(() => import('./pages/SalesByProductReportPage'))
const PurchaseSummaryReportPage = lazy(() => import('./pages/PurchaseSummaryReportPage'))
const PurchaseByVendorReportPage = lazy(() => import('./pages/PurchaseByVendorReportPage'))
const PurchaseByProductReportPage = lazy(() => import('./pages/PurchaseByProductReportPage'))
const ProductHistoryReportPage = lazy(() => import('./pages/ProductHistoryReportPage'))
const ArOutstandingReportPage = lazy(() => import('./pages/ArOutstandingReportPage'))
const ApOutstandingReportPage = lazy(() => import('./pages/ApOutstandingReportPage'))
const ArCustomerSummaryPage = lazy(() => import('./pages/ArCustomerSummaryPage'))
const ApVendorSummaryPage = lazy(() => import('./pages/ApVendorSummaryPage'))

const wrap = (element: ReactElement, permission: string | string[]) => (
  <ProtectedRoute permission={permission}>{element}</ProtectedRoute>
)

export const reportsRoutes: RouteObject[] = [
  { path: '/reports', element: wrap(<ReportListPage />, REPORT_VIEW_PERMISSIONS) },
  { path: '/reports/trial-balance', element: wrap(<TrialBalancePage />, `reports.${reportCategoryForPath('/reports/trial-balance')}.view`) },
  { path: '/reports/profit-loss', element: wrap(<ProfitLossPage />, `reports.${reportCategoryForPath('/reports/profit-loss')}.view`) },
  { path: '/reports/balance-sheet', element: wrap(<BalanceSheetPage />, `reports.${reportCategoryForPath('/reports/balance-sheet')}.view`) },
  { path: '/reports/cash-flow', element: wrap(<CashFlowPage />, `reports.${reportCategoryForPath('/reports/cash-flow')}.view`) },
  { path: '/reports/cash-flow-direct', element: wrap(<CashFlowDirectReportPage />, `reports.${reportCategoryForPath('/reports/cash-flow-direct')}.view`) },
  { path: '/reports/retained-earnings', element: wrap(<RetainedEarningsReportPage />, `reports.${reportCategoryForPath('/reports/retained-earnings')}.view`) },
  { path: '/reports/equity-changes', element: wrap(<EquityChangesReportPage />, `reports.${reportCategoryForPath('/reports/equity-changes')}.view`) },
  { path: '/reports/profit-loss-multi', element: wrap(<ProfitLossMultiPeriodPage />, `reports.${reportCategoryForPath('/reports/profit-loss-multi')}.view`) },
  { path: '/reports/balance-sheet-multi', element: wrap(<BalanceSheetMultiPeriodPage />, `reports.${reportCategoryForPath('/reports/balance-sheet-multi')}.view`) },
  { path: '/reports/tax/output-vat', element: wrap(<OutputVatReportPage />, `reports.${reportCategoryForPath('/reports/tax/output-vat')}.view`) },
  { path: '/reports/tax/input-vat', element: wrap(<InputVatReportPage />, `reports.${reportCategoryForPath('/reports/tax/input-vat')}.view`) },
  { path: '/reports/tax/efaktur', element: wrap(<EfakturExportPage />, `reports.${reportCategoryForPath('/reports/tax/efaktur')}.view`) },
  { path: '/reports/saved', element: wrap(<SavedReportsPage />, 'reports.saved.manage') },
  { path: '/reports/financial-summary', element: wrap(<FinancialSummaryPage />, `reports.${reportCategoryForPath('/reports/financial-summary')}.view`) },
  { path: '/reports/general-ledger', element: wrap(<GeneralLedgerPage />, `reports.${reportCategoryForPath('/reports/general-ledger')}.view`) },
  { path: '/reports/ar-aging', element: wrap(<ArAgingReportPage />, `reports.${reportCategoryForPath('/reports/ar-aging')}.view`) },
  { path: '/reports/ap-aging', element: wrap(<ApAgingReportPage />, `reports.${reportCategoryForPath('/reports/ap-aging')}.view`) },
  { path: '/reports/reconciliation', element: wrap(<ReconciliationPage />, `reports.${reportCategoryForPath('/reports/reconciliation')}.view`) },
  { path: '/reports/stock', element: wrap(<StockReportPage />, `reports.${reportCategoryForPath('/reports/stock')}.view`) },
  { path: '/reports/inventory-analysis', element: wrap(<InventoryAnalysisPage />, `reports.${reportCategoryForPath('/reports/inventory-analysis')}.view`) },
  { path: '/reports/inventory-aging', element: wrap(<InventoryAgingReportPage />, `reports.${reportCategoryForPath('/reports/inventory-aging')}.view`) },
  { path: '/reports/inventory-opname', element: wrap(<OpnameWorksheetReportPage />, `reports.${reportCategoryForPath('/reports/inventory-opname')}.view`) },
  { path: '/reports/account-ledger', element: wrap(<AccountLedgerPage />, `reports.${reportCategoryForPath('/reports/account-ledger')}.view`) },
  { path: '/reports/journals', element: wrap(<JournalListReportPage />, `reports.${reportCategoryForPath('/reports/journals')}.view`) },
  { path: '/reports/budget/comparison', element: wrap(<BudgetComparisonPage />, `reports.${reportCategoryForPath('/reports/budget/comparison')}.view`) },
  { path: '/reports/account-statement', element: wrap(<CashBankStatementPage />, `reports.${reportCategoryForPath('/reports/account-statement')}.view`) },
  { path: '/reports/fixed-assets/register', element: wrap(<FixedAssetRegisterReportPage />, `reports.${reportCategoryForPath('/reports/fixed-assets/register')}.view`) },
  { path: '/reports/fixed-assets/depreciation', element: wrap(<FixedAssetDepreciationReportPage />, `reports.${reportCategoryForPath('/reports/fixed-assets/depreciation')}.view`) },
  { path: '/reports/fixed-assets/disposals', element: wrap(<FixedAssetDisposalsReportPage />, `reports.${reportCategoryForPath('/reports/fixed-assets/disposals')}.view`) },
  { path: '/reports/fixed-assets/reconciliation', element: wrap(<FixedAssetReconciliationReportPage />, `reports.${reportCategoryForPath('/reports/fixed-assets/reconciliation')}.view`) },
  // /reports/transactions dihapus — tidak ada route backend (Audit-12 A12-15).
  { path: '/reports/sales/summary', element: wrap(<SalesSummaryReportPage />, `reports.${reportCategoryForPath('/reports/sales/summary')}.view`) },
  { path: '/reports/sales/by-customer', element: wrap(<SalesByCustomerReportPage />, `reports.${reportCategoryForPath('/reports/sales/by-customer')}.view`) },
  { path: '/reports/sales/by-product', element: wrap(<SalesByProductReportPage />, `reports.${reportCategoryForPath('/reports/sales/by-product')}.view`) },
  { path: '/reports/purchase/summary', element: wrap(<PurchaseSummaryReportPage />, `reports.${reportCategoryForPath('/reports/purchase/summary')}.view`) },
  { path: '/reports/purchase/by-vendor', element: wrap(<PurchaseByVendorReportPage />, `reports.${reportCategoryForPath('/reports/purchase/by-vendor')}.view`) },
  { path: '/reports/purchase/by-product', element: wrap(<PurchaseByProductReportPage />, `reports.${reportCategoryForPath('/reports/purchase/by-product')}.view`) },
  { path: '/reports/product-history', element: wrap(<ProductHistoryReportPage />, `reports.${reportCategoryForPath('/reports/product-history')}.view`) },
  { path: '/reports/ar-outstanding', element: wrap(<ArOutstandingReportPage />, `reports.${reportCategoryForPath('/reports/ar-outstanding')}.view`) },
  { path: '/reports/ap-outstanding', element: wrap(<ApOutstandingReportPage />, `reports.${reportCategoryForPath('/reports/ap-outstanding')}.view`) },
  { path: '/reports/ar-customer-summary', element: wrap(<ArCustomerSummaryPage />, `reports.${reportCategoryForPath('/reports/ar-customer-summary')}.view`) },
  { path: '/reports/ap-vendor-summary', element: wrap(<ApVendorSummaryPage />, `reports.${reportCategoryForPath('/reports/ap-vendor-summary')}.view`) },
  { path: '/reports/:categoryPath', element: wrap(<ReportCategoryPage />, REPORT_VIEW_PERMISSIONS) },
]
