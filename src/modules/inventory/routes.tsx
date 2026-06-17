/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '@/router/guards'

const StockBalanceListPage = lazy(() => import('./pages/StockBalanceListPage'))
const StockBalanceDetailPage = lazy(() => import('./pages/StockBalanceDetailPage'))
const StockMovementListPage = lazy(() => import('./pages/StockMovementListPage'))
const StockMovementFormPage = lazy(() => import('./pages/StockMovementFormPage'))
const StockAdjustmentListPage = lazy(() => import('./pages/StockAdjustmentListPage'))
const StockAdjustmentFormPage = lazy(() => import('./pages/StockAdjustmentFormPage'))
const StockOpnameListPage = lazy(() => import('./pages/StockOpnameListPage'))
const StockOpnameFormPage = lazy(() => import('./pages/StockOpnameFormPage'))

export const inventoryRoutes: RouteObject[] = [
  { path: '/inventory/stock-balances', element: <ProtectedRoute permission="inventory.stock.view"><StockBalanceListPage /></ProtectedRoute> },
  { path: '/inventory/stock-balances/:productId/:warehouseId', element: <ProtectedRoute permission="inventory.stock.view"><StockBalanceDetailPage /></ProtectedRoute> },
  { path: '/inventory/movements', element: <ProtectedRoute permission="inventory.movements.view"><StockMovementListPage /></ProtectedRoute> },
  { path: '/inventory/movements/create', element: <ProtectedRoute permission="inventory.movements.create"><StockMovementFormPage /></ProtectedRoute> },
  { path: '/inventory/movements/:id', element: <ProtectedRoute permission="inventory.movements.view"><StockMovementFormPage /></ProtectedRoute> },
  { path: '/inventory/adjustments', element: <ProtectedRoute permission="inventory.adjustments.view"><StockAdjustmentListPage /></ProtectedRoute> },
  { path: '/inventory/adjustments/create', element: <ProtectedRoute permission="inventory.adjustments.create"><StockAdjustmentFormPage /></ProtectedRoute> },
  { path: '/inventory/adjustments/:id', element: <ProtectedRoute permission="inventory.adjustments.view"><StockAdjustmentFormPage /></ProtectedRoute> },
  { path: '/inventory/opnames', element: <ProtectedRoute permission="inventory.opnames.view"><StockOpnameListPage /></ProtectedRoute> },
  { path: '/inventory/opnames/create', element: <ProtectedRoute permission="inventory.opnames.create"><StockOpnameFormPage /></ProtectedRoute> },
  { path: '/inventory/opnames/:id', element: <ProtectedRoute permission="inventory.opnames.view"><StockOpnameFormPage /></ProtectedRoute> },
]
