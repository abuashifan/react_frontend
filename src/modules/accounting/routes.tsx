/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '@/router/guards'

const JournalListPage = lazy(() => import('./pages/JournalListPage'))
const JournalFormPage = lazy(() => import('./pages/JournalFormPage'))
const FiscalYearPage = lazy(() => import('./pages/FiscalYearPage'))
const PeriodLockPage = lazy(() => import('./pages/PeriodLockPage'))
const PeriodEndPage = lazy(() => import('./pages/PeriodEndPage'))

export const accountingRoutes: RouteObject[] = [
  { path: '/accounting/journals', element: <ProtectedRoute permission="journal.view"><JournalListPage /></ProtectedRoute> },
  { path: '/accounting/journals/create', element: <ProtectedRoute permission="journal.create"><JournalFormPage /></ProtectedRoute> },
  { path: '/accounting/journals/:id', element: <ProtectedRoute permission="journal.view"><JournalFormPage /></ProtectedRoute> },
  { path: '/accounting/fiscal-years', element: <ProtectedRoute permission="accounting.fiscal-years.manage"><FiscalYearPage /></ProtectedRoute> },
  { path: '/accounting/period-locks', element: <ProtectedRoute permission="accounting.period-locks.manage"><PeriodLockPage /></ProtectedRoute> },
  { path: '/accounting/period-end', element: <ProtectedRoute permission="period_end.view"><PeriodEndPage /></ProtectedRoute> },
]
