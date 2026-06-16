import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute, CompanySelectionGuard, OnboardingGuard } from './guards'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { CompanyPickerPage } from '@/modules/auth/pages/CompanyPickerPage'
import { ForbiddenPage, NotFoundPage, ServerErrorPage } from '@/modules/errors/ErrorPage'
import { NetworkErrorPage } from '@/modules/errors/NetworkErrorPage'
import { MaintenancePage } from '@/modules/errors/MaintenancePage'
import { OnboardingPage } from '@/modules/onboarding/pages/OnboardingPage'
import DashboardPage from '@/modules/dashboard/pages/DashboardPage'
import { masterDataRoutes } from '@/modules/master-data/routes'
import { salesRoutes } from '@/modules/sales/routes'
import { purchaseRoutes } from '@/modules/purchase/routes'
import { inventoryRoutes } from '@/modules/inventory/routes'
import { accountingRoutes } from '@/modules/accounting/routes'
import { cashBankRoutes } from '@/modules/cash-bank/routes'
import { reportsRoutes } from '@/modules/reports/routes'
import { settingsRoutes } from '@/modules/settings/routes'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/select-company',
    element: (
      <CompanySelectionGuard>
        <CompanyPickerPage />
      </CompanySelectionGuard>
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
  {
    path: '/',
    element: (
      <ProtectedRoute requireCompany requireOnboarding>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  ...masterDataRoutes,
  ...salesRoutes,
  ...purchaseRoutes,
  ...inventoryRoutes,
  ...accountingRoutes,
  ...cashBankRoutes,
  ...reportsRoutes,
  ...settingsRoutes,
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '/network-error', element: <NetworkErrorPage /> },
  { path: '/maintenance', element: <MaintenancePage /> },
  { path: '*', element: <NotFoundPage /> },
])
