import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute, OnboardingGuard } from './guards'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { CompanyPickerPage } from '@/modules/auth/pages/CompanyPickerPage'
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from '@/modules/errors/ErrorPage'
import { NetworkErrorPage } from '@/modules/errors/NetworkErrorPage'
import { MaintenancePage } from '@/modules/errors/MaintenancePage'
import { OnboardingPage } from '@/modules/onboarding/pages/OnboardingPage'
import { DashboardPlaceholder } from './placeholders'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/select-company',
    element: (
      <ProtectedRoute>
        <CompanyPickerPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <OnboardingGuard>
        <OnboardingPage />
      </OnboardingGuard>
    ),
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute requireCompany requireOnboarding>
        <DashboardPlaceholder />
      </ProtectedRoute>
    ),
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '/network-error', element: <NetworkErrorPage /> },
  { path: '/maintenance', element: <MaintenancePage /> },
  { path: '*', element: <NotFoundPage /> },
])
