export const REPORT_CATEGORIES: Record<string, string> = {
  financial: 'financial', gl: 'general_ledger', sales: 'sales', purchase: 'purchase', ar: 'ar', ap: 'ap',
  reconciliation: 'reconciliation', inventory: 'inventory', 'fixed-assets': 'fixed_assets', 'cash-bank': 'cash_bank',
  tax: 'tax', budget: 'budget', project: 'project',
}

export const REPORT_VIEW_PERMISSIONS = Object.values(REPORT_CATEGORIES).map((category) => `reports.${category}.view`)

export function reportCategoryForPath(path: string): string {
  if (path.startsWith('/fixed-assets/reports')) return 'fixed_assets'
  if (path.startsWith('/budget/projects')) return 'project'
  if (path.startsWith('/budget') || path.startsWith('/reports/budget')) return 'budget'
  const name = path.replace(/^\/reports\//, '')
  if (name.startsWith('fixed-assets')) return 'fixed_assets'
  if (name.startsWith('tax/')) return 'tax'
  if (name.startsWith('sales/')) return 'sales'
  if (name.startsWith('purchase/')) return 'purchase'
  if (name.startsWith('ar-')) return 'ar'
  if (name.startsWith('ap-')) return 'ap'
  if (name.startsWith('reconciliation')) return 'reconciliation'
  if (name.startsWith('account-statement')) return 'cash_bank'
  if (name.startsWith('stock') || name.startsWith('inventory') || name.startsWith('product-history')) return 'inventory'
  if (name.startsWith('general-ledger') || name.startsWith('account-ledger') || name.startsWith('journals') || name.startsWith('trial-balance')) return 'general_ledger'
  return REPORT_CATEGORIES[name] ?? 'financial'
}
