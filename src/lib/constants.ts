export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Seaside Escape ERP'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const PAGINATION_OPTIONS = [25, 50, 100] as const

export const DEFAULT_PER_PAGE = 25

export const QUERY_STALE_TIME = 30_000

export const QUERY_GC_TIME = 5 * 60 * 1000

export const MODULES = {
  SALES: 'sales',
  PURCHASE: 'purchase',
  INVENTORY: 'inventory',
  ACCOUNTING: 'accounting',
  CASH_BANK: 'cash-bank',
  REPORTS: 'reports',
  MASTER_DATA: 'master-data',
} as const

export type ModuleKey = (typeof MODULES)[keyof typeof MODULES]

export const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  confirmed: 'Confirmed',
  posted: 'Posted',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  void: 'Void',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  delivered: 'Delivered',
  received: 'Received',
  converted: 'Converted',
} as const
