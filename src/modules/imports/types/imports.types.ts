// Rencana impor data, Fase 1 — profil master data (kontak, produk, COA).
// Mengikuti payload backend aktual (app/Modules/Imports/*).

export type ImportBatchStatus =
  | 'draft'
  | 'validating'
  | 'previewed'
  | 'committing'
  | 'completed'
  | 'failed'

export type ImportRowStatus = 'pending' | 'valid' | 'invalid' | 'committed' | 'failed'

export interface ImportProfile {
  key: string
  label: string
  /** Sejajar 1:1 dengan `headers` — dipakai membangun column_map otomatis. */
  fields: string[]
  headers: string[]
  required_fields: string[]
}

export interface ImportBatch {
  id: number
  uuid: string
  profile: string
  original_filename: string
  stored_path: string
  file_hash: string
  column_map: Record<string, string> | null
  status: ImportBatchStatus
  total_rows: number
  valid_rows: number
  failed_rows: number
  committed_rows: number
  error_message: string | null
  created_by: number | null
  created_at: string | null
  updated_at: string | null
}

export interface ImportRow {
  id: number
  import_batch_id: number
  profile: string
  row_number: number
  raw: Record<string, string>
  normalized: Record<string, string> | null
  status: ImportRowStatus
  errors: Record<string, string[]> | null
  document_id: number | null
  document_type: string | null
  external_ref: string | null
}

export interface UploadImportResponse {
  batch: ImportBatch
  headers: string[]
  duplicate_file: { uuid: string; status: string; uploaded_at: string } | null
}

export interface DuplicateFileWarningMeta {
  duplicate: { uuid: string; status: string; uploaded_at: string }
}

export interface ActiveBatchExistsMeta {
  batch_uuid: string
  status: string
}
