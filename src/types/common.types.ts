export type DocumentStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'confirmed'
  | 'posted'
  | 'partially_paid'
  | 'paid'
  | 'void'
  | 'cancelled'
  | 'rejected'
  | 'delivered'
  | 'received'
  | 'converted'

export type SortDirection = 'asc' | 'desc'

export interface BreadcrumbItem {
  label: string
  path?: string
}

export interface SelectOption<T = string> {
  label: string
  value: T
}

export interface DateRange {
  from?: string
  to?: string
}
