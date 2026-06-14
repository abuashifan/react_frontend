import { useAuthStore } from '@/stores/useAuthStore'

export function usePermission() {
  const { permissions, permissionsLoaded } = useAuthStore()

  return {
    permissionsLoaded,
    can: (permission: string): boolean => permissions.includes(permission),
    canAny: (perms: string[]): boolean => perms.some((p) => permissions.includes(p)),
    canAll: (perms: string[]): boolean => perms.every((p) => permissions.includes(p)),
  }
}
