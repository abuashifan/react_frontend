import React, { lazy } from 'react'
import { ProtectedRoute } from '@/router/guards'

const QuotationListPage = lazy(() => import('./pages/QuotationListPage'))
const QuotationFormPage = lazy(() => import('./pages/QuotationFormPage'))
const SalesOrderListPage = lazy(() => import('./pages/SalesOrderListPage'))
const SalesOrderFormPage = lazy(() => import('./pages/SalesOrderFormPage'))
const DeliveryOrderListPage = lazy(() => import('./pages/DeliveryOrderListPage'))
const DeliveryOrderFormPage = lazy(() => import('./pages/DeliveryOrderFormPage'))
const ProformaListPage = lazy(() => import('./pages/ProformaListPage'))
const ProformaFormPage = lazy(() => import('./pages/ProformaFormPage'))
const SalesInvoiceListPage = lazy(() => import('./pages/SalesInvoiceListPage'))
const SalesInvoiceFormPage = lazy(() => import('./pages/SalesInvoiceFormPage'))
const CustomerDepositListPage = lazy(() => import('./pages/CustomerDepositListPage'))
const CustomerDepositFormPage = lazy(() => import('./pages/CustomerDepositFormPage'))
const SalesReceiptListPage = lazy(() => import('./pages/SalesReceiptListPage'))
const SalesReceiptFormPage = lazy(() => import('./pages/SalesReceiptFormPage'))
const SalesReturnListPage = lazy(() => import('./pages/SalesReturnListPage'))
const SalesReturnFormPage = lazy(() => import('./pages/SalesReturnFormPage'))
const ArSummaryPage = lazy(() => import('./pages/ArSummaryPage'))
const ArAgingPage = lazy(() => import('./pages/ArAgingPage'))
const ArReconciliationPage = lazy(() => import('./pages/ArReconciliationPage'))
const CustomerLedgerPage = lazy(() => import('./pages/CustomerLedgerPage'))
const InvoiceLedgerPage = lazy(() => import('./pages/InvoiceLedgerPage'))

const guard = (permission: string, children: React.ReactNode) => (
  <ProtectedRoute permission={permission} requireCompany requireOnboarding>
    {children}
  </ProtectedRoute>
)

export const salesRoutes = [
  // Quotation
  { path: '/sales/quotations', element: guard('sales.quotations.view', <QuotationListPage />) },
  { path: '/sales/quotations/create', element: guard('sales.quotations.create', <QuotationFormPage />) },
  { path: '/sales/quotations/:id', element: guard('sales.quotations.view', <QuotationFormPage />) },

  // Sales Order
  { path: '/sales/orders', element: guard('sales.orders.view', <SalesOrderListPage />) },
  { path: '/sales/orders/create', element: guard('sales.orders.create', <SalesOrderFormPage />) },
  { path: '/sales/orders/:id', element: guard('sales.orders.view', <SalesOrderFormPage />) },

  // Delivery Order
  { path: '/sales/delivery-orders', element: guard('sales.delivery-orders.view', <DeliveryOrderListPage />) },
  { path: '/sales/delivery-orders/create', element: guard('sales.delivery-orders.create', <DeliveryOrderFormPage />) },
  { path: '/sales/delivery-orders/:id', element: guard('sales.delivery-orders.view', <DeliveryOrderFormPage />) },

  // Proforma Invoice
  { path: '/sales/proformas', element: guard('sales.proformas.view', <ProformaListPage />) },
  { path: '/sales/proformas/create', element: guard('sales.proformas.create', <ProformaFormPage />) },
  { path: '/sales/proformas/:id', element: guard('sales.proformas.view', <ProformaFormPage />) },

  // Sales Invoice
  { path: '/sales/invoices', element: guard('sales.invoices.view', <SalesInvoiceListPage />) },
  { path: '/sales/invoices/create', element: guard('sales.invoices.create', <SalesInvoiceFormPage />) },
  { path: '/sales/invoices/:id', element: guard('sales.invoices.view', <SalesInvoiceFormPage />) },

  // Customer Deposit
  { path: '/sales/customer-deposits', element: guard('sales.deposits.view', <CustomerDepositListPage />) },
  { path: '/sales/customer-deposits/create', element: guard('sales.deposits.create', <CustomerDepositFormPage />) },
  { path: '/sales/customer-deposits/:id', element: guard('sales.deposits.view', <CustomerDepositFormPage />) },

  // Sales Receipt
  { path: '/sales/receipts', element: guard('sales.receipts.view', <SalesReceiptListPage />) },
  { path: '/sales/receipts/create', element: guard('sales.receipts.create', <SalesReceiptFormPage />) },
  { path: '/sales/receipts/:id', element: guard('sales.receipts.view', <SalesReceiptFormPage />) },

  // Sales Return
  { path: '/sales/returns', element: guard('sales.returns.view', <SalesReturnListPage />) },
  { path: '/sales/returns/create', element: guard('sales.returns.create', <SalesReturnFormPage />) },
  { path: '/sales/returns/:id', element: guard('sales.returns.view', <SalesReturnFormPage />) },

  // AR Summary
  { path: '/sales/ar/summary', element: guard('sales.ar.view', <ArSummaryPage />) },
  { path: '/sales/ar/aging', element: guard('sales.ar.view', <ArAgingPage />) },
  { path: '/sales/ar/reconciliation', element: guard('sales.ar.view', <ArReconciliationPage />) },
  { path: '/sales/ar/customer-ledger', element: guard('sales.ar.view', <CustomerLedgerPage />) },
  { path: '/sales/ar/customer-ledger/:customerId', element: guard('sales.ar.view', <CustomerLedgerPage />) },
  { path: '/sales/ar/invoice-ledger', element: guard('sales.ar.view', <InvoiceLedgerPage />) },
  { path: '/sales/ar/invoice-ledger/:invoiceId', element: guard('sales.ar.view', <InvoiceLedgerPage />) },
]
