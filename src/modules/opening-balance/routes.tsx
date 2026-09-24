/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '@/router/guards'

const OpeningBalanceStatusPage = lazy(() => import('./pages/OpeningBalanceStatusPage'))

/*
 * Fase 8: rute detail batch hilang bersama modul batchnya. Yang tersisa satu
 * papan pemantau — jurnal pembuka dibaca lewat modul Jurnal seperti jurnal lain.
 */
export const openingBalanceRoutes: RouteObject[] = [
  {
    path: '/opening-balance',
    element: <ProtectedRoute permission="opening_balance.view"><OpeningBalanceStatusPage /></ProtectedRoute>,
  },
]
