// Rencana impor data, Fase 1 — profil master data (kontak, produk, COA).
// Mengikuti payload backend aktual (app/Modules/Imports/*).

export type ImportBatchStatus =
  | 'draft'
  | 'validating'
  | 'previewed'
  | 'committing'
  | 'completed'
  | 'failed'
  /** Fase 8 — commit-nya sudah ditarik kembali; batchnya disimpan sebagai riwayat. */
  | 'reverted'

export type ImportRowStatus = 'pending' | 'valid' | 'invalid' | 'committed' | 'failed' | 'reverted'

export interface ImportProfile {
  key: string
  label: string
  /** Sejajar 1:1 dengan `headers` — dipakai membangun column_map otomatis. */
  fields: string[]
  headers: string[]
  required_fields: string[]
  /**
   * Field yang isinya nilai uang — pratinjau impor memformat selnya sebagai
   * mata uang. Ditentukan backend (`config/imports.php`), bukan ditebak dari
   * isi sel: kode akun '1100' juga angka, tapi ia bukan seribu seratus rupiah.
   */
  money_fields: string[]
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
  /** Baris valid yang membawa peringatan — tetap ikut ter-commit. */
  warning_rows: number
  committed_rows: number
  error_message: string | null
  created_by: number | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Satu batch beserta header berkasnya — jawaban `GET /imports/{uuid}`.
 *
 * `headers` tidak ada di riwayat (daftar batch) karena ia dibaca dari berkas,
 * bukan dari tabel. Ia ada di sini supaya batch yang ditinggalkan sebelum
 * di-commit masih bisa dibuka kembali setelah halaman di-reload — layar
 * pemetaan butuh daftar header untuk bisa digambar sama sekali.
 */
export interface ImportBatchDetail extends ImportBatch {
  headers: string[]
  suggested_column_map: Record<string, string>
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
  /**
   * Hal yang mungkin salah tapi tetap boleh di-commit — mis. umur manfaat yang
   * beda dari default kategori, atau akumulasi penyusutan yang jauh dari garis
   * lurus. Tidak pernah mengubah `status`.
   */
  warnings: Record<string, string[]> | null
  document_id: number | null
  document_type: string | null
  external_ref: string | null
}

export interface UploadImportResponse {
  batch: ImportBatch
  headers: string[]
  duplicate_file: { uuid: string; status: string; uploaded_at: string } | null
  /**
   * Pemetaan kolom yang sudah disimpulkan backend dari header berkas
   * (`ImportBatchService::guessColumnMap()`). Field → nama header di berkas.
   */
  suggested_column_map: Record<string, string>
  /** Field wajib yang headernya tidak terbaca — sisa pekerjaan manual. */
  unmapped_required_fields: string[]
  /** true saat seluruh field wajib terpetakan: layar pemetaan bisa dilewati. */
  auto_mapped: boolean
}

export interface DuplicateFileWarningMeta {
  duplicate: { uuid: string; status: string; uploaded_at: string }
}

export interface ActiveBatchExistsMeta {
  batch_uuid: string
  status: string
}
