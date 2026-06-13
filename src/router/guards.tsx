import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { AppShell } from '@/components/shared/layout/AppShell'

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
  const activeCompany = useCompanyStore((s) => s.activeCompany)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireCompany && !activeCompanyId) {
    return <Navigate to="/select-company" replace />
  }

  if (requireOnboarding && activeCompany && activeCompany.settings.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/403" replace />
  }

  return <AppShell>{children}</AppShell>
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
