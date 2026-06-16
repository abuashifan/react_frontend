import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '@/router/guards'

const CompanySettingsPage = lazy(() => import('./pages/CompanySettingsPage'))
const TransactionSettingsPage = lazy(() => import('./pages/TransactionSettingsPage'))
const AccountMappingSettingsPage = lazy(() => import('./pages/AccountMappingSettingsPage'))
const AccountingPeriodPage = lazy(() => import('./pages/AccountingPeriodPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const RolesPage = lazy(() => import('./pages/RolesPage'))
const MyPreferencesPage = lazy(() => import('./pages/MyPreferencesPage'))

export const settingsRoutes: RouteObject[] = [
  {
    path: '/settings/company',
    element: <ProtectedRoute permission="settings.view"><CompanySettingsPage /></ProtectedRoute>,
  },
  {
    path: '/settings/transactions',
    element: <ProtectedRoute permission="settings.view"><TransactionSettingsPage /></ProtectedRoute>,
  },
  {
    path: '/settings/account-mapping',
    element: <ProtectedRoute permission="settings.view"><AccountMappingSettingsPage /></ProtectedRoute>,
  },
  {
    path: '/settings/accounting-period',
    element: <ProtectedRoute permission="settings.view"><AccountingPeriodPage /></ProtectedRoute>,
  },
  {
    path: '/settings/users',
    element: <ProtectedRoute permission="settings.users.manage"><UsersPage /></ProtectedRoute>,
  },
  {
    path: '/settings/roles',
    element: <ProtectedRoute permission="settings.roles.manage"><RolesPage /></ProtectedRoute>,
  },
  {
    path: '/settings/preferences',
    element: <ProtectedRoute><MyPreferencesPage /></ProtectedRoute>,
  },
]
