import { useAuthStore } from '@/stores/useAuthStore'

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission) || permissions.includes('*')
}

export function usePermission() {
  const { permissions, permissionsLoaded } = useAuthStore()
  return {
    permissionsLoaded,
    can: (permission: string): boolean => hasPermission(permissions, permission),
    canAny: (perms: string[]): boolean => perms.some((permission) => hasPermission(permissions, permission)),
    canAll: (perms: string[]): boolean => perms.every((permission) => hasPermission(permissions, permission)),
  }
}
