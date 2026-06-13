import { usePermission } from '@/hooks/usePermission'

interface PermissionGuardProps {
  permission: string | string[]
  mode?: 'any' | 'all'
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  mode = 'any',
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, canAny, canAll } = usePermission()

  const hasPermission = Array.isArray(permission)
    ? mode === 'all'
      ? canAll(permission)
      : canAny(permission)
    : can(permission)

  if (!hasPermission) return <>{fallback}</>
  return <>{children}</>
}
