import { lazy } from 'react'
import { ProtectedRoute } from '@/router/guards'
import type { RouteObject } from 'react-router-dom'

const CashReceiptListPage = lazy(() => import('./pages/CashReceiptListPage'))
const CashReceiptFormPage = lazy(() => import('./pages/CashReceiptFormPage'))
const CashPaymentListPage = lazy(() => import('./pages/CashPaymentListPage'))
const CashPaymentFormPage = lazy(() => import('./pages/CashPaymentFormPage'))
const BankTransferListPage = lazy(() => import('./pages/BankTransferListPage'))
const BankTransferFormPage = lazy(() => import('./pages/BankTransferFormPage'))
const BankReconciliationListPage = lazy(() => import('./pages/BankReconciliationListPage'))
const BankReconciliationFormPage = lazy(() => import('./pages/BankReconciliationFormPage'))

export const cashBankRoutes: RouteObject[] = [
  { path: '/cash-bank/cash-receipts', element: <ProtectedRoute permission="cash_bank.view"><CashReceiptListPage /></ProtectedRoute> },
  { path: '/cash-bank/cash-receipts/create', element: <ProtectedRoute permission="cash_bank.create"><CashReceiptFormPage /></ProtectedRoute> },
  { path: '/cash-bank/cash-receipts/:id', element: <ProtectedRoute permission="cash_bank.view"><CashReceiptFormPage /></ProtectedRoute> },
  { path: '/cash-bank/cash-payments', element: <ProtectedRoute permission="cash_bank.view"><CashPaymentListPage /></ProtectedRoute> },
  { path: '/cash-bank/cash-payments/create', element: <ProtectedRoute permission="cash_bank.create"><CashPaymentFormPage /></ProtectedRoute> },
  { path: '/cash-bank/cash-payments/:id', element: <ProtectedRoute permission="cash_bank.view"><CashPaymentFormPage /></ProtectedRoute> },
  { path: '/cash-bank/bank-transfers', element: <ProtectedRoute permission="cash_bank.view"><BankTransferListPage /></ProtectedRoute> },
  { path: '/cash-bank/bank-transfers/create', element: <ProtectedRoute permission="cash_bank.create"><BankTransferFormPage /></ProtectedRoute> },
  { path: '/cash-bank/bank-transfers/:id', element: <ProtectedRoute permission="cash_bank.view"><BankTransferFormPage /></ProtectedRoute> },
  { path: '/cash-bank/bank-reconciliations', element: <ProtectedRoute permission="cash_bank.view"><BankReconciliationListPage /></ProtectedRoute> },
  { path: '/cash-bank/bank-reconciliations/create', element: <ProtectedRoute permission="cash_bank.create"><BankReconciliationFormPage /></ProtectedRoute> },
  { path: '/cash-bank/bank-reconciliations/:id', element: <ProtectedRoute permission="cash_bank.view"><BankReconciliationFormPage /></ProtectedRoute> },
]
