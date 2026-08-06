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
  | 'counted'
  | 'finalized'

export type SortDirection = 'asc' | 'desc'

/**
 * Record tetangga dari endpoint `/{resource}/adjacent`, untuk navigasi Prev/Next
 * di form. Hanya id dan label yang dikirim — itu saja yang dibutuhkan navigasi,
 * dan itulah alasan endpoint ini ada alih-alih menarik seluruh record modul.
 */
export interface AdjacentRecord {
  id: number
  label: string
}

/** `null` berarti tidak ada tetangga di arah itu — tombolnya dinonaktifkan. */
export interface AdjacentRecords {
  prev: AdjacentRecord | null
  next: AdjacentRecord | null
}

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
