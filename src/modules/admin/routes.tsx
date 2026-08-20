/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { PlatformAdminGuard } from '@/router/guards'

const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminClientsPage = lazy(() => import('./pages/AdminClientsPage'))
const AdminClientFormPage = lazy(() => import('./pages/AdminClientFormPage'))
const AdminDeletedCompaniesPage = lazy(() => import('./pages/AdminDeletedCompaniesPage'))

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
  // `/new` didaftarkan sebelum `/:id` supaya tidak tertangkap sebagai id.
  {
    path: '/admin/clients/new',
    element: (
      <PlatformAdminGuard>
        <AdminClientFormPage />
      </PlatformAdminGuard>
    ),
  },
  {
    path: '/admin/clients/:id',
    element: (
      <PlatformAdminGuard>
        <AdminClientFormPage />
      </PlatformAdminGuard>
    ),
  },
  {
    path: '/admin/companies/deleted',
    element: (
      <PlatformAdminGuard>
        <AdminDeletedCompaniesPage />
      </PlatformAdminGuard>
    ),
  },
  { path: '/admin', element: <Navigate to="/admin/clients" replace /> },
]
