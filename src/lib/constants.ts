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
  sent: 'Sent',
  approved: 'Approved',
  accepted: 'Accepted',
  issued: 'Issued',
  confirmed: 'Confirmed',
  ready: 'Ready',
  shipped: 'Shipped',
  posted: 'Posted',
  partially_paid: 'Sebagian Dibayar',
  paid: 'Lunas',
  partially_allocated: 'Sebagian Dialokasi',
  fully_allocated: 'Dialokasi Penuh',
  refunded: 'Direfund',
  void: 'Void',
  cancelled: 'Dibatalkan',
  rejected: 'Ditolak',
  delivered: 'Terkirim',
  received: 'Diterima',
  converted: 'Dikonversi',
  closed: 'Ditutup',
  partially_billed: 'Sebagian Ditagih',
  counted: 'Selesai Dihitung',
  finalized: 'Difinalisasi',
} as const
