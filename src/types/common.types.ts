export type DocumentStatus =
  | 'draft'
  | 'submitted'
  | 'sent'
  | 'approved'
  | 'accepted'
  | 'issued'
  | 'confirmed'
  | 'ready'
  | 'shipped'
  | 'posted'
  | 'partially_paid'
  | 'paid'
  | 'partially_allocated'
  | 'fully_allocated'
  | 'refunded'
  | 'void'
  | 'cancelled'
  | 'rejected'
  | 'delivered'
  | 'received'
  | 'converted'
  | 'closed'
  | 'partially_billed'

export type SortDirection = 'asc' | 'desc'

export interface BreadcrumbItem {
  label: string
  path?: string
}

export interface SelectOption<T = string> {
  label: string
  value: T
  sublabel?: string
}

export interface DateRange {
  from?: string
  to?: string
}
