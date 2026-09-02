// Opening Balance — mengikuti backend aktual (OpeningBalanceController + OpeningBalanceBatchService).
// Phase 11 — spec-29.

// `reopened` sempat hilang di sini padahal backend memakainya: reopen()
// menyetel status ke 'reopened', dan `editable()` menerima draft ATAU
// reopened. Tanpa anggota ini, kode frontend yang mengecek batch bisa
// diubah selalu meleset untuk batch yang baru dibuka kembali.
export type OBBatchStatus = 'draft' | 'reopened' | 'validated' | 'posted' | 'locked' | 'voided'

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

// Backend mengirim objek, bukan string: `OpeningBalanceBatchService::error()`
// mengembalikan {code, message, metadata?}. Sebelumnya di-tipe `string[]`,
// sehingga <li>{e}</li> merender objek dan React melempar "Objects are not
// valid as a React child" — dialog Preview mati persis saat ia paling
// dibutuhkan, yaitu ketika ada blocking error yang harus dibaca user.
export interface OBBlockingError {
  code: string
  message: string
  metadata?: Record<string, unknown> | null
}

export interface OBValidation {
  valid: boolean
  errors: OBBlockingError[]
  // `warnings` tetap string[]: ia datang dari OpeningBalanceValidator yang
  // memformat 'LINE_<idx>:<pesan>', bukan lewat error().
  warnings: string[]
}

// GET /opening-balance/batches/{batch}/preview
export interface OBPreview {
  batch: OBBatch
  total_debit: number
  total_credit: number
  difference: number
  validation: OBValidation
  blocking_errors: OBBlockingError[]
  warnings: string[]
}

// POST /opening-balance/batches/{batch}/validate — backend mengembalikan
// {valid, batch, preview}, bukan OBBatch telanjang. `valid: false` tetap
// datang sebagai HTTP 200, jadi pemanggil WAJIB membaca field ini; kalau
// hanya mengandalkan throw, validasi gagal akan tampak seperti sukses.
export interface OBValidateResult {
  valid: boolean
  batch: OBBatch
  preview: OBPreview
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
