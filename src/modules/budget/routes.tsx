/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy, type ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/router/guards'
import type { RouteObject } from 'react-router-dom'

const BudgetSubmissionListPage = lazy(() => import('./pages/BudgetSubmissionListPage'))
const BudgetSubmissionCreatePage = lazy(() => import('./pages/BudgetSubmissionCreatePage'))
const BudgetPeriodListPage = lazy(() => import('./pages/BudgetPeriodListPage'))
const BudgetPeriodFormPage = lazy(() => import('./pages/BudgetPeriodFormPage'))
const BudgetPeriodDetailPage = lazy(() => import('./pages/BudgetPeriodDetailPage'))
const BudgetSubmissionPage = lazy(() => import('./pages/BudgetSubmissionPage'))
const BudgetAnalysisPage = lazy(() => import('./pages/BudgetAnalysisPage'))
const CashBudgetPage = lazy(() => import('./pages/CashBudgetPage'))
const ProjectFinancialSummaryPage = lazy(() => import('./pages/ProjectFinancialSummaryPage'))
const BudgetVersionHistoryPage = lazy(() => import('./pages/BudgetVersionHistoryPage'))
const BudgetDashboardPage = lazy(() => import('./pages/BudgetDashboardPage'))

const wrap = (element: ReactElement, permission = 'budgets.view') => (
  <ProtectedRoute permission={permission}>{element}</ProtectedRoute>
)

export const budgetRoutes: RouteObject[] = [
  // Objek utama modul ini adalah submission, bukan periode: approval dan
  // versioning hidup di submission. Periode turun jadi master data pendukung.
  // `/budget` tetap ada sebagai redirect supaya tautan lama tidak putus dan
  // `detectModuleFromPath()` tetap mengenali seluruh cabang /budget/...
  { path: '/budget', element: <Navigate to="/budget/submissions" replace /> },
  { path: '/budget/submissions', element: wrap(<BudgetSubmissionListPage />) },
  // Rute yang membuat memakai permission membuat, mengikuti pola modul lain —
  // `budgets.view` saja akan menampilkan form yang pasti ditolak backend.
  { path: '/budget/submissions/new', element: wrap(<BudgetSubmissionCreatePage />, 'budgets.submit') },
  { path: '/budget/periods', element: wrap(<BudgetPeriodListPage />) },
  { path: '/budget/periods/new', element: wrap(<BudgetPeriodFormPage />, 'budgets.manage') },
  { path: '/budget/periods/:id', element: wrap(<BudgetPeriodDetailPage />) },
  { path: '/budget/submissions/:id', element: wrap(<BudgetSubmissionPage />) },
  { path: '/budget/submissions/:id/versions', element: wrap(<BudgetVersionHistoryPage />) },
  // Satu halaman analisis melayani view #1–#9 lewat filter, bukan sembilan rute.
  { path: '/budget/analysis', element: wrap(<BudgetAnalysisPage />) },
  { path: '/budget/cash', element: wrap(<CashBudgetPage />) },
  { path: '/budget/projects', element: wrap(<ProjectFinancialSummaryPage />) },
  { path: '/budget/dashboard', element: wrap(<BudgetDashboardPage />) },
]
