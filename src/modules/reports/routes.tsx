/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy, type ReactElement } from 'react'
import { ProtectedRoute } from '@/router/guards'
import type { RouteObject } from 'react-router-dom'

const ReportIndexPage = lazy(() => import('./pages/ReportIndexPage'))
const TrialBalancePage = lazy(() => import('./pages/TrialBalancePage'))
const ProfitLossPage = lazy(() => import('./pages/ProfitLossPage'))
const BalanceSheetPage = lazy(() => import('./pages/BalanceSheetPage'))
const CashFlowPage = lazy(() => import('./pages/CashFlowPage'))
const FinancialSummaryPage = lazy(() => import('./pages/FinancialSummaryPage'))
const GeneralLedgerPage = lazy(() => import('./pages/GeneralLedgerPage'))
const ArAgingReportPage = lazy(() => import('./pages/ArAgingReportPage'))
const ApAgingReportPage = lazy(() => import('./pages/ApAgingReportPage'))
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'))
const StockReportPage = lazy(() => import('./pages/StockReportPage'))
const InventoryAnalysisPage = lazy(() => import('./pages/InventoryAnalysisPage'))
const AccountLedgerPage = lazy(() => import('./pages/AccountLedgerPage'))
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
const ArOutstandingReportPage = lazy(() => import('./pages/ArOutstandingReportPage'))
const ApOutstandingReportPage = lazy(() => import('./pages/ApOutstandingReportPage'))
const ArCustomerSummaryPage = lazy(() => import('./pages/ArCustomerSummaryPage'))
const ApVendorSummaryPage = lazy(() => import('./pages/ApVendorSummaryPage'))

const wrap = (element: ReactElement) => (
  <ProtectedRoute permission="reports.view">{element}</ProtectedRoute>
)

export const reportsRoutes: RouteObject[] = [
  { path: '/reports', element: wrap(<ReportIndexPage />) },
  { path: '/reports/trial-balance', element: wrap(<TrialBalancePage />) },
  { path: '/reports/profit-loss', element: wrap(<ProfitLossPage />) },
  { path: '/reports/balance-sheet', element: wrap(<BalanceSheetPage />) },
  { path: '/reports/cash-flow', element: wrap(<CashFlowPage />) },
  { path: '/reports/financial-summary', element: wrap(<FinancialSummaryPage />) },
  { path: '/reports/general-ledger', element: wrap(<GeneralLedgerPage />) },
  { path: '/reports/ar-aging', element: wrap(<ArAgingReportPage />) },
  { path: '/reports/ap-aging', element: wrap(<ApAgingReportPage />) },
  { path: '/reports/reconciliation', element: wrap(<ReconciliationPage />) },
  { path: '/reports/stock', element: wrap(<StockReportPage />) },
  { path: '/reports/inventory-analysis', element: wrap(<InventoryAnalysisPage />) },
  { path: '/reports/account-ledger', element: wrap(<AccountLedgerPage />) },
  { path: '/reports/budget/comparison', element: wrap(<BudgetComparisonPage />) },
  { path: '/reports/account-statement', element: wrap(<CashBankStatementPage />) },
  { path: '/reports/fixed-assets/register', element: wrap(<FixedAssetRegisterReportPage />) },
  { path: '/reports/fixed-assets/depreciation', element: wrap(<FixedAssetDepreciationReportPage />) },
  { path: '/reports/fixed-assets/disposals', element: wrap(<FixedAssetDisposalsReportPage />) },
  { path: '/reports/fixed-assets/reconciliation', element: wrap(<FixedAssetReconciliationReportPage />) },
  // /reports/transactions dihapus — tidak ada route backend (Audit-12 A12-15).
  { path: '/reports/sales/summary', element: wrap(<SalesSummaryReportPage />) },
  { path: '/reports/sales/by-customer', element: wrap(<SalesByCustomerReportPage />) },
  { path: '/reports/sales/by-product', element: wrap(<SalesByProductReportPage />) },
  { path: '/reports/purchase/summary', element: wrap(<PurchaseSummaryReportPage />) },
  { path: '/reports/purchase/by-vendor', element: wrap(<PurchaseByVendorReportPage />) },
  { path: '/reports/purchase/by-product', element: wrap(<PurchaseByProductReportPage />) },
  { path: '/reports/ar-outstanding', element: wrap(<ArOutstandingReportPage />) },
  { path: '/reports/ap-outstanding', element: wrap(<ApOutstandingReportPage />) },
  { path: '/reports/ar-customer-summary', element: wrap(<ArCustomerSummaryPage />) },
  { path: '/reports/ap-vendor-summary', element: wrap(<ApVendorSummaryPage />) },
  { path: '/reports/:categoryPath', element: wrap(<ReportCategoryPage />) },
]
