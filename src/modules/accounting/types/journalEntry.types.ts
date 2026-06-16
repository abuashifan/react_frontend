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
  created_at: string
  updated_at: string
}

export interface JournalEntryListParams {
  page: number
  per_page: number
  search?: string
  status?: JournalEntryStatus
  date_from?: string
  date_to?: string
  is_system_generated?: boolean
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
