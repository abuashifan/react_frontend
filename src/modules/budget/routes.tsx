/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy, type ReactElement } from 'react'
import { ProtectedRoute } from '@/router/guards'
import type { RouteObject } from 'react-router-dom'

const BudgetPeriodListPage = lazy(() => import('./pages/BudgetPeriodListPage'))
const BudgetPeriodFormPage = lazy(() => import('./pages/BudgetPeriodFormPage'))
const BudgetPeriodDetailPage = lazy(() => import('./pages/BudgetPeriodDetailPage'))
const BudgetSubmissionPage = lazy(() => import('./pages/BudgetSubmissionPage'))

const wrap = (element: ReactElement, permission = 'budgets.view') => (
  <ProtectedRoute permission={permission}>{element}</ProtectedRoute>
)

export const budgetRoutes: RouteObject[] = [
  { path: '/budget', element: wrap(<BudgetPeriodListPage />) },
  // Rute yang membuat memakai permission membuat, mengikuti pola modul lain —
  // `budgets.view` saja akan menampilkan form yang pasti ditolak backend.
  { path: '/budget/periods/new', element: wrap(<BudgetPeriodFormPage />, 'budgets.manage') },
  { path: '/budget/periods/:id', element: wrap(<BudgetPeriodDetailPage />) },
  { path: '/budget/submissions/:id', element: wrap(<BudgetSubmissionPage />) },
]
