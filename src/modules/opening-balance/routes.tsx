import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '@/router/guards'

const OpeningBalanceStatusPage = lazy(() => import('./pages/OpeningBalanceStatusPage'))
const OpeningBalanceBatchPage = lazy(() => import('./pages/OpeningBalanceBatchPage'))

export const openingBalanceRoutes: RouteObject[] = [
  {
    path: '/opening-balance',
    element: <ProtectedRoute permission="opening_balance.view"><OpeningBalanceStatusPage /></ProtectedRoute>,
  },
  {
    path: '/opening-balance/:batchId',
    element: <ProtectedRoute permission="opening_balance.view"><OpeningBalanceBatchPage /></ProtectedRoute>,
  },
]
