import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { AppShell } from '@/components/shared/layout/AppShell'
import { hasPermission } from '@/hooks/usePermission'
import { useSetupGate } from '@/modules/onboarding/hooks/useSetupStatus'

interface ProtectedRouteProps {
  permission?: string
  requireCompany?: boolean
  requireOnboarding?: boolean
  children: React.ReactNode
}

export function ProtectedRoute({
  permission,
  requireCompany = false,
  requireOnboarding = false,
  children,
}: ProtectedRouteProps) {
  const { token, permissions, activeCompanyId } = useAuthStore()
  const location = useLocation()
  // Status setup dibaca dari backend (`/setup/status`), bukan dari flag di
  // company settings: flag itu tidak pernah dikirim backend sehingga gate-nya
  // tidak pernah aktif. Lihat useSetupGate untuk perilaku saat status belum
  // diketahui.
  const setupGate = useSetupGate()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireCompany && !activeCompanyId) {
    return <Navigate to="/select-company" replace />
  }

  if (requireOnboarding && setupGate.initial_setup_available) {
    return <Navigate to="/onboarding" replace />
  }

  if (permission && !hasPermission(permissions, permission)) {
    return <Navigate to="/403" replace />
  }

  return <AppShell>{children}</AppShell>
}

/** Auth-only guard for company selection — requires token but stays outside AppShell */
export function CompanySelectionGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

/** Lightweight guard for the onboarding route — requires auth but skips AppShell and onboarding check */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { token, activeCompanyId } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!activeCompanyId) {
    return <Navigate to="/select-company" replace />
  }

  return <>{children}</>
}
