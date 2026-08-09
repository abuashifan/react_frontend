import type { SortDirection } from '@/types/common.types'

export type JournalEntryStatus = 'draft' | 'approved' | 'posted' | 'void'

export interface JournalEntryLine {
  id: number
  account_id: number
  account?: { id: number; account_code: string; account_name: string }
  department_id?: number | null
  department?: { id: number; name: string } | null
  project_id?: number | null
  project?: { id: number; name: string } | null
  description?: string | null
  debit: number
  credit: number
  line_order: number
}

export interface JournalEntry {
  id: number
  journal_number: string
  journal_date: string
  description?: string | null
  status: JournalEntryStatus
  is_system_generated: boolean
  source_type?: string | null
  source_number?: string | null
  lines: JournalEntryLine[]
  total_debit?: number
  total_credit?: number
  /**
   * Nama pembuat jurnal, dilampirkan backend dari database pusat (`users`).
   * `null` bila jurnal dibuat proses sistem atau user-nya sudah dihapus.
   */
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface BudgetWarning {
  account_id: number
  budget_amount: number
  actual_amount: number
  new_total: number
  overage: number
}

export interface JournalEntryListParams {
  page: number
  per_page: number
  search?: string
  /** Satu status, atau beberapa dipisah koma (mis. "draft,posted"). */
  status?: string
  date_from?: string
  date_to?: string
  is_system_generated?: boolean
  /**
   * Kolom pengurutan server-side. Nilai yang didukung backend:
   * `journal_number`, `journal_date`, `status`, `created_at`, `total_debit`,
   * `total_credit`. Nilai di luar daftar itu diabaikan backend.
   */
  sort_by?: string
  sort_direction?: SortDirection
}

export interface JournalEntryLinePayload {
  account_id: number
  department_id?: number | null
  project_id?: number | null
  description?: string | null
  debit?: number
  credit?: number
  line_order?: number
}

export interface CreateJournalEntryPayload {
  journal_date: string
  description?: string | null
  lines: JournalEntryLinePayload[]
}

export type UpdateJournalEntryPayload = Partial<CreateJournalEntryPayload>
