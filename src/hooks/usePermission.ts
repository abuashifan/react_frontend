import { useAuthStore } from '@/stores/useAuthStore'

const PERMISSION_ALIASES: Record<string, string[]> = {
  'master-data.view': ['master_data.view'],
  'master-data.coa.view': ['coa.view', 'master_data.view'],
  'master-data.coa.create': ['coa.create'],
  'master-data.coa.edit': ['coa.edit'],
  'master-data.contacts.view': ['contacts.view', 'master_data.view'],
  'master-data.contacts.create': ['contacts.create'],
  'master-data.contacts.edit': ['contacts.edit'],
  'master-data.products.view': ['products.view', 'master_data.view'],
  'master-data.products.create': ['products.create'],
  'master-data.products.edit': ['products.edit'],
  'master-data.product-categories.view': ['products.view', 'master_data.view'],
  'master-data.product-categories.create': ['products.create'],
  'master-data.product-categories.edit': ['products.edit'],
  'master-data.units.view': ['units.view', 'master_data.view'],
  'master-data.units.create': ['units.create'],
  'master-data.units.edit': ['units.edit'],
  'master-data.warehouses.view': ['warehouses.view', 'master_data.view'],
  'master-data.warehouses.create': ['warehouses.create'],
  'master-data.warehouses.edit': ['warehouses.edit'],
  'master-data.payment-terms.view': ['payment_terms.view', 'master_data.view'],
  'master-data.payment-terms.create': ['payment_terms.create'],
  'master-data.payment-terms.edit': ['payment_terms.edit'],
  'master-data.departments.view': ['departments.view', 'master_data.view'],
  'master-data.departments.create': ['departments.create'],
  'master-data.departments.edit': ['departments.edit'],
  'master-data.projects.view': ['projects.view', 'master_data.view'],
  'master-data.projects.create': ['projects.create'],
  'master-data.projects.edit': ['projects.edit'],
  'master-data.account-mappings.view': ['settings.company.view', 'master_data.view'],
  'master-data.account-mappings.edit': ['settings.company.edit'],
  'sales.delivery-orders.view': ['sales.delivery_orders.view'],
  'sales.delivery-orders.create': ['sales.delivery_orders.create'],
  'sales.delivery-orders.update': ['sales.delivery_orders.edit'],
  'sales.delivery-orders.void': ['sales.delivery_orders.void'],
  'purchase.goods-receipts.view': ['purchase.goods_receipts.view'],
  'purchase.goods-receipts.create': ['purchase.goods_receipts.create'],
  'purchase.goods-receipts.update': ['purchase.goods_receipts.edit'],
  'purchase.goods-receipts.void': ['purchase.goods_receipts.void'],
  'inventory.opnames.view': ['inventory.opname.view'],
  'inventory.opnames.create': ['inventory.opname.create'],
  'inventory.opnames.edit': ['inventory.opname.edit'],
  'accounting.period-locks.manage': ['fiscal_year.lock_manage', 'fiscal_year.view'],
  'accounting.fiscal-years.manage': ['fiscal_year.view'],
}

function getPermissionCandidates(permission: string): string[] {
  return [permission, permission.replaceAll('-', '_'), ...(PERMISSION_ALIASES[permission] ?? [])]
}

export function hasPermission(permissions: string[], permission: string): boolean {
  return (
    permissions.includes('*') ||
    getPermissionCandidates(permission).some((candidate) => permissions.includes(candidate))
  )
}

export function usePermission() {
  const { permissions, permissionsLoaded } = useAuthStore()

  return {
    permissionsLoaded,
    can: (permission: string): boolean => hasPermission(permissions, permission),
    canAny: (perms: string[]): boolean => permissions.includes('*') || perms.some((p) => hasPermission(permissions, p)),
    canAll: (perms: string[]): boolean => permissions.includes('*') || perms.every((p) => hasPermission(permissions, p)),
  }
}
