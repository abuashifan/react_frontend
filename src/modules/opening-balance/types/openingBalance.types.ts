// Opening Balance — mengikuti backend aktual (OpeningBalanceController + OpeningBalanceBatchService).
// Phase 11 — spec-29.

export type OBBatchStatus = 'draft' | 'validated' | 'posted' | 'locked' | 'voided'

export interface OBLine {
  id?: number
  account_id: number
  account_code?: string | null
  account_name?: string | null
  account?: { id: number; account_code: string; account_name: string } | null
  debit?: number | null
  credit?: number | null
  description?: string | null
  is_system_generated?: boolean
}

export interface OBBatch {
  id: number
  batch_number: string
  opening_date: string
  status: OBBatchStatus
  description?: string | null
  total_debit: number
  total_credit: number
  difference: number
  journal_entry_id?: number | null
  validated_at?: string | null
  posted_at?: string | null
  locked_at?: string | null
  reopened_at?: string | null
  lines?: OBLine[]
  created_at: string
  updated_at?: string
}

// GET /opening-balance/status
export interface OBStatus {
  status: 'not_started' | OBBatchStatus
  batch: OBBatch | null
  has_posted_or_locked_batch: boolean
}

export interface OBValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// GET /opening-balance/batches/{batch}/preview
export interface OBPreview {
  batch: OBBatch
  total_debit: number
  total_credit: number
  difference: number
  validation: OBValidation
  blocking_errors: string[]
  warnings: string[]
}

export interface CreateOBBatchPayload {
  opening_date: string
  fiscal_year?: number | null
  type?: string
  description?: string | null
}

export interface OBLinePayload {
  account_id: number
  debit?: number | null
  credit?: number | null
  description?: string | null
}
