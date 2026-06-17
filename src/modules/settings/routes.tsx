/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '@/router/guards'

const CompanySettingsPage = lazy(() => import('./pages/CompanySettingsPage'))
const TransactionSettingsPage = lazy(() => import('./pages/TransactionSettingsPage'))
const AccountMappingSettingsPage = lazy(() => import('./pages/AccountMappingSettingsPage'))
const AccountingPeriodPage = lazy(() => import('./pages/AccountingPeriodPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const RolesPage = lazy(() => import('./pages/RolesPage'))
const InvitationsPage = lazy(() => import('./pages/InvitationsPage'))
const AccessAuditPage = lazy(() => import('./pages/AccessAuditPage'))
const MyPreferencesPage = lazy(() => import('./pages/MyPreferencesPage'))

export const settingsRoutes: RouteObject[] = [
  {
    path: '/settings/company',
    element: <ProtectedRoute permission="settings.company.view"><CompanySettingsPage /></ProtectedRoute>,
  },
  {
    path: '/settings/transactions',
    element: <ProtectedRoute permission="settings.company.view"><TransactionSettingsPage /></ProtectedRoute>,
  },
  {
    path: '/settings/account-mapping',
    element: <ProtectedRoute permission="settings.company.view"><AccountMappingSettingsPage /></ProtectedRoute>,
  },
  {
    path: '/settings/accounting-period',
    element: <ProtectedRoute permission="settings.company.view"><AccountingPeriodPage /></ProtectedRoute>,
  },
  {
    path: '/settings/users',
    element: <ProtectedRoute permission="access.users.view"><UsersPage /></ProtectedRoute>,
  },
  {
    path: '/settings/roles',
    element: <ProtectedRoute permission="access.roles.view"><RolesPage /></ProtectedRoute>,
  },
  {
    path: '/settings/invitations',
    element: <ProtectedRoute permission="access.invitations.view"><InvitationsPage /></ProtectedRoute>,
  },
  {
    path: '/settings/audit',
    element: <ProtectedRoute permission="access.audit.view"><AccessAuditPage /></ProtectedRoute>,
  },
  {
    path: '/settings/preferences',
    element: <ProtectedRoute><MyPreferencesPage /></ProtectedRoute>,
  },
]
