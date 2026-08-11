/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { PlatformAdminGuard } from '@/router/guards'

const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminClientsPage = lazy(() => import('./pages/AdminClientsPage'))

export const adminRoutes: RouteObject[] = [
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin/clients',
    element: (
      <PlatformAdminGuard>
        <AdminClientsPage />
      </PlatformAdminGuard>
    ),
  },
  { path: '/admin', element: <Navigate to="/admin/clients" replace /> },
]
