/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy, type ReactElement } from 'react'
import { ProtectedRoute } from '@/router/guards'
import type { RouteObject } from 'react-router-dom'

const BudgetPeriodListPage = lazy(() => import('./pages/BudgetPeriodListPage'))
const BudgetPeriodFormPage = lazy(() => import('./pages/BudgetPeriodFormPage'))
const BudgetPeriodDetailPage = lazy(() => import('./pages/BudgetPeriodDetailPage'))
const BudgetSubmissionPage = lazy(() => import('./pages/BudgetSubmissionPage'))

const wrap = (element: ReactElement) => (
  <ProtectedRoute permission="budgets.view">{element}</ProtectedRoute>
)

export const budgetRoutes: RouteObject[] = [
  { path: '/budget', element: wrap(<BudgetPeriodListPage />) },
  { path: '/budget/periods/new', element: wrap(<BudgetPeriodFormPage />) },
  { path: '/budget/periods/:id', element: wrap(<BudgetPeriodDetailPage />) },
  { path: '/budget/submissions/:id', element: wrap(<BudgetSubmissionPage />) },
]
