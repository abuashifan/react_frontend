/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import React, { lazy } from 'react'
import { ProtectedRoute } from '@/router/guards'

const PurchaseRequestListPage = lazy(() => import('./pages/PurchaseRequestListPage'))
const PurchaseRequestFormPage = lazy(() => import('./pages/PurchaseRequestFormPage'))
const PurchaseOrderListPage = lazy(() => import('./pages/PurchaseOrderListPage'))
const PurchaseOrderFormPage = lazy(() => import('./pages/PurchaseOrderFormPage'))
const GoodsReceiptListPage = lazy(() => import('./pages/GoodsReceiptListPage'))
const GoodsReceiptFormPage = lazy(() => import('./pages/GoodsReceiptFormPage'))
const VendorBillListPage = lazy(() => import('./pages/VendorBillListPage'))
const VendorBillFormPage = lazy(() => import('./pages/VendorBillFormPage'))
const VendorDepositListPage = lazy(() => import('./pages/VendorDepositListPage'))
const VendorDepositFormPage = lazy(() => import('./pages/VendorDepositFormPage'))
const VendorPaymentListPage = lazy(() => import('./pages/VendorPaymentListPage'))
const VendorPaymentFormPage = lazy(() => import('./pages/VendorPaymentFormPage'))
const PurchaseReturnListPage = lazy(() => import('./pages/PurchaseReturnListPage'))
const PurchaseReturnFormPage = lazy(() => import('./pages/PurchaseReturnFormPage'))
const ApSummaryPage = lazy(() => import('./pages/ApSummaryPage'))
const ApAgingPage = lazy(() => import('./pages/ApAgingPage'))
const ApReconciliationPage = lazy(() => import('./pages/ApReconciliationPage'))
const VendorLedgerPage = lazy(() => import('./pages/VendorLedgerPage'))
const BillLedgerPage = lazy(() => import('./pages/BillLedgerPage'))

const guard = (permission: string, children: React.ReactNode) => (
  <ProtectedRoute permission={permission} requireCompany requireOnboarding>
    {children}
  </ProtectedRoute>
)

export const purchaseRoutes = [
  // Purchase Request
  { path: '/purchase/requests', element: guard('purchase.requests.view', <PurchaseRequestListPage />) },
  { path: '/purchase/requests/create', element: guard('purchase.requests.create', <PurchaseRequestFormPage />) },
  { path: '/purchase/requests/:id', element: guard('purchase.requests.view', <PurchaseRequestFormPage />) },

  // Purchase Order
  { path: '/purchase/orders', element: guard('purchase.orders.view', <PurchaseOrderListPage />) },
  { path: '/purchase/orders/create', element: guard('purchase.orders.create', <PurchaseOrderFormPage />) },
  { path: '/purchase/orders/:id', element: guard('purchase.orders.view', <PurchaseOrderFormPage />) },

  // Goods Receipt
  { path: '/purchase/goods-receipts', element: guard('purchase.goods-receipts.view', <GoodsReceiptListPage />) },
  { path: '/purchase/goods-receipts/create', element: guard('purchase.goods-receipts.create', <GoodsReceiptFormPage />) },
  { path: '/purchase/goods-receipts/:id', element: guard('purchase.goods-receipts.view', <GoodsReceiptFormPage />) },

  // Vendor Bill
  { path: '/purchase/bills', element: guard('purchase.bills.view', <VendorBillListPage />) },
  { path: '/purchase/bills/create', element: guard('purchase.bills.create', <VendorBillFormPage />) },
  { path: '/purchase/bills/:id', element: guard('purchase.bills.view', <VendorBillFormPage />) },

  // Vendor Deposit
  { path: '/purchase/vendor-deposits', element: guard('purchase.deposits.view', <VendorDepositListPage />) },
  { path: '/purchase/vendor-deposits/create', element: guard('purchase.deposits.create', <VendorDepositFormPage />) },
  { path: '/purchase/vendor-deposits/:id', element: guard('purchase.deposits.view', <VendorDepositFormPage />) },

  // Vendor Payment
  { path: '/purchase/payments', element: guard('purchase.payments.view', <VendorPaymentListPage />) },
  { path: '/purchase/payments/create', element: guard('purchase.payments.create', <VendorPaymentFormPage />) },
  { path: '/purchase/payments/:id', element: guard('purchase.payments.view', <VendorPaymentFormPage />) },

  // Purchase Return
  { path: '/purchase/returns', element: guard('purchase.returns.view', <PurchaseReturnListPage />) },
  { path: '/purchase/returns/create', element: guard('purchase.returns.create', <PurchaseReturnFormPage />) },
  { path: '/purchase/returns/:id', element: guard('purchase.returns.view', <PurchaseReturnFormPage />) },

  // AP
  { path: '/purchase/ap/summary', element: guard('purchase.ap.view', <ApSummaryPage />) },
  { path: '/purchase/ap/aging', element: guard('purchase.ap.view', <ApAgingPage />) },
  { path: '/purchase/ap/reconciliation', element: guard('purchase.ap.view', <ApReconciliationPage />) },
  { path: '/purchase/ap/vendor-ledger', element: guard('purchase.ap.view', <VendorLedgerPage />) },
  { path: '/purchase/ap/vendor-ledger/:vendorId', element: guard('purchase.ap.view', <VendorLedgerPage />) },
  { path: '/purchase/ap/bill-ledger', element: guard('purchase.ap.view', <BillLedgerPage />) },
  { path: '/purchase/ap/bill-ledger/:billId', element: guard('purchase.ap.view', <BillLedgerPage />) },
]
